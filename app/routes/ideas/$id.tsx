import { Idea, Vote, User, Comment, CommentVote, Tag } from "@prisma/client";
import type {
  LinksFunction,
  MetaFunction,
  LoaderFunction,
  ActionFunction,
} from "remix";
import { useRouteData, redirect, Form, json } from "remix";
import ReactMarkdown from "react-markdown";
import { prisma } from "../../db";
import { commitSessionHeaders, getSession, withSession } from "../../sessions";
import stylesUrl from "../../styles/ideas/$id.css";

type IdeaWithVotesAndComments =
  | (Idea & {
      Vote: Vote[];
      Comment: (Comment & {
        user: User;
        CommentVote: CommentVote[];
      })[];
      tags: Tag[];
      user: {
        alias: string;
        id: number;
      };
    })
  | null;

interface IdeaSession {
  idea: IdeaWithVotesAndComments;
  vote?: Vote;
  commentVotes?: CommentVote[];
  userId?: number;
}

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export let meta: MetaFunction = ({ data }) => {
  return {
    title: `${data?.idea?.title} | Woodpecker`,
    description: data?.idea?.description,
  };
};

export let loader: LoaderFunction = async ({ request, params }) => {
  const idea = await prisma.idea.findUnique({
    where: {
      id: Number(params.id),
    },
    include: {
      Vote: true,
      tags: true,
      Comment: {
        include: {
          user: true,
          CommentVote: true,
        },
        orderBy: [
          {
            createdAt: "asc",
          },
        ],
      },
      user: {
        select: {
          alias: true,
          id: true,
        },
      },
    },
  });

  return withSession(request, async (session) => {
    const user = session.get("user") as User;
    let sesh: IdeaSession = { idea, userId: user?.id };
    if (!idea?.id) {
      return json(sesh, await commitSessionHeaders(session));
    }

    const votes = await prisma.vote.findMany({
      where: {
        AND: {
          userId: user?.id,
          ideaId: idea.id,
        },
      },
    });

    const commentVotes = await prisma.commentVote.findMany({
      where: {
        userId: user?.id,
        comment: {
          idea: {
            id: idea.id,
          },
        },
      },
    });

    const [vote] = votes;
    sesh.vote = vote;
    sesh.commentVotes = commentVotes;

    return json(sesh, await commitSessionHeaders(session));
  });
};

export let action: ActionFunction = async ({ request, params }) => {
  const body = Object.fromEntries(new URLSearchParams(await request.text()));
  const session = await getSession(request);
  const user = await session.get("user");

  try {
    if (!user) {
      session.flash(
        "info",
        "You need to login to be able to comment and vote!"
      );
      return redirect("/login", await commitSessionHeaders(session));
    }

    if (body._method === "remove_tag") {
      try {
        if (!body.tagId) {
          throw new Error("There is no tag id!");
        }

        await prisma.tag.delete({
          where: {
            id: Number(body.tagId),
          },
        });
        return redirect(`/ideas/${params.id}`);
      } catch (err) {
        session.flash("error", (err as Error).message);
        return redirect(
          `/ideas/${params.id}`,
          await commitSessionHeaders(session)
        );
      }
    }

    if (!body._method || body._method === "put") {
      const vote = body.vote;

      if (!vote) {
        throw new Error("There was an error processing your vote");
      }

      const dbVote = await prisma.vote.findMany({
        where: {
          AND: {
            ideaId: Number(params.id),
            userId: user.id,
          },
        },
      });

      if (dbVote.length > 1) {
        throw new Error("There shouldn't be more than one vote from you!");
      }

      if (!dbVote || dbVote.length === 0) {
        await prisma.idea.update({
          where: {
            id: Number(params.id),
          },
          data: {
            Vote: {
              create: {
                type: vote,
                userId: user.id,
              },
            },
          },
        });
      } else {
        const [thisVote] = dbVote;
        await prisma.idea.update({
          where: {
            id: Number(params.id),
          },
          data: {
            Vote: {
              update: {
                where: {
                  id: thisVote.id,
                },
                data: {
                  type: vote,
                },
              },
            },
          },
        });
      }
    } else {
      const comment = body?.comment;

      if (!comment) {
        throw new Error("There is no comment!");
      }

      await prisma.idea.update({
        where: {
          id: Number(params.id),
        },
        data: {
          Comment: {
            create: {
              description: comment,
              userId: user.id,
            },
          },
        },
      });
    }
  } catch (err) {
    session.flash("error", (err as Error).message);
    return redirect(`/ideas/${params.id}`, await commitSessionHeaders(session));
  }

  return redirect(`/ideas/${params.id}`, await commitSessionHeaders(session));
};

export default function Idea() {
  const { idea, vote, commentVotes, userId } = useRouteData<IdeaSession>();

  if (!idea)
    return (
      <div>
        <h1>Oops, there's been an error!</h1>
      </div>
    );

  return (
    <section className="hero">
      <div className="container">
        <h1>{idea.title}</h1>
        <p className="username">{idea.user.alias}</p>
        <div className="idea-description">
          <ReactMarkdown children={idea.description} />
        </div>
        <Form method="post" className="vote">
          <input type="hidden" name="_method" value="put" />
          <input
            disabled={!!vote && vote?.type === "up"}
            type="submit"
            name="vote"
            id="up"
            value="up"
          />
          <label htmlFor="up" className={vote?.type === "up" ? "active" : ""}>
            <img height="32" width="32" src="/assets/arrow_up.svg" alt="Up" />
            {idea.Vote.filter((vote) => vote.type === "up").length}
          </label>
          <input
            disabled={!!vote && vote?.type === "down"}
            type="submit"
            name="vote"
            id="down"
            value="down"
          />
          <label
            htmlFor="down"
            className={vote?.type === "down" ? "active" : ""}
          >
            <img
              height="32"
              width="32"
              src="/assets/arrow_down.svg"
              alt="Down"
            />
            {idea.Vote.filter((vote) => vote.type === "down").length}
          </label>
        </Form>
        <ul className="tags">
          {idea.tags.map((tag) => (
            <li key={tag.id}>
              {tag.slug}{" "}
              {userId && idea.userId === userId ? (
                <Form method="post">
                  <input value="remove_tag" type="hidden" name="_method" />
                  <input value={tag.id} type="hidden" name="tagId" />
                  <button type="submit">&times;</button>
                </Form>
              ) : null}
            </li>
          ))}
        </ul>
        <Form method="post" className="comment">
          <input type="hidden" value="post" name="_method" />
          <label htmlFor="comment">
            Leave a comment:
            <textarea
              name="comment"
              id="comment"
              placeholder="Cool idea! Would be nice to add X or Y feature!"
            ></textarea>
          </label>
          <button type="submit">Send</button>
        </Form>
        {idea.Comment.length > 0 ? (
          <ul className="comments">
            {idea.Comment.map((comm) => {
              const thisCommentVote = commentVotes?.find(
                (c) => c.commentId === comm.id
              );
              return (
                <li key={comm.id}>
                  <p className="user">{comm.user.alias}</p>
                  <p className="description">{comm.description}</p>
                  <Form method="post" action={`/vote-comment/${comm.id}`}>
                    <input
                      disabled={
                        !!thisCommentVote && thisCommentVote.type === "up"
                      }
                      type="submit"
                      name="vote"
                      id={comm.id + "-up"}
                      value="up"
                    />
                    <label
                      htmlFor={comm.id + "-up"}
                      className={thisCommentVote?.type === "up" ? "active" : ""}
                    >
                      <img
                        height="20"
                        width="20"
                        src="/assets/arrow_up.svg"
                        alt="Up"
                      />
                      {
                        comm.CommentVote.filter((vote) => vote.type === "up")
                          .length
                      }
                    </label>
                    <input
                      disabled={
                        !!thisCommentVote && thisCommentVote.type === "down"
                      }
                      type="submit"
                      name="vote"
                      id={comm.id + "-down"}
                      value="down"
                    />
                    <label
                      htmlFor={comm.id + "-down"}
                      className={
                        thisCommentVote?.type === "down" ? "active" : ""
                      }
                    >
                      <img
                        height="20"
                        width="20"
                        src="/assets/arrow_down.svg"
                        alt="Down"
                      />
                      {
                        comm.CommentVote.filter((vote) => vote.type === "down")
                          .length
                      }
                    </label>
                  </Form>
                </li>
              );
            })}
          </ul>
        ) : (
          <h5 className="no-comments">
            There are no comments yet! Be the first one!
          </h5>
        )}
      </div>
    </section>
  );
}
