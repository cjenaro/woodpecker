import { Idea, Vote, User, Comment } from "@prisma/client";
import { LinksFunction, MetaFunction } from "@remix-run/react/routeModules";
import {
  LoaderFunction,
  useRouteData,
  ActionFunction,
  redirect,
  Form,
  json,
} from "remix";
import { prisma } from "../../db";
import { commitSessionHeaders, getSession, withSession } from "../../sessions";
import stylesUrl from "../../styles/ideas/$id.css";

type IdeaWithVotesAndComments =
  | (Idea & {
      Vote: Vote[];
      Comment: (Comment & {
        user: User;
      })[];
      user: {
        alias: string;
      };
    })
  | null;

interface IdeaSession {
  idea: IdeaWithVotesAndComments;
  vote?: Vote;
}

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export let meta: MetaFunction = ({ data }) => {
  return {
    title: `${data?.title} | Woodpecker`,
    description: data?.description,
  };
};

export let loader: LoaderFunction = async ({ request, params }) => {
  const idea = await prisma.idea.findUnique({
    where: {
      id: Number(params.id),
    },
    include: {
      Vote: true,
      Comment: {
        include: {
          user: true,
        },
      },
      user: {
        select: {
          alias: true,
        },
      },
    },
  });

  return withSession(request, async (session) => {
    const user = session.get("user");
    let sesh: IdeaSession = { idea };
    if (!idea?.id) {
      return json(sesh, await commitSessionHeaders(session));
    }

    const votes = await prisma.vote.findMany({
      where: {
        AND: {
          userId: user.id,
          ideaId: idea.id,
        },
      },
    });

    const [vote] = votes;
    sesh.vote = vote;

    return json(sesh, await commitSessionHeaders(session));
  });
};

export let action: ActionFunction = async ({ request, params }) => {
  const body = Object.fromEntries(new URLSearchParams(await request.text()));
  const session = await getSession(request);
  const user = await session.get("user");

  if (!user) {
    session.flash("error", "You need to login to be able to comment and vote!");
    return redirect("/login", await commitSessionHeaders(session));
  }

  if (!body._method || body._method === "put") {
    const vote = body.vote;

    if (!vote) {
      session.flash("error", "There was an error processing your vote");
      return redirect(
        `/ideas/${params.id}`,
        await commitSessionHeaders(session)
      );
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
      session.flash("error", "There shouldn't be more than one vote from you!");
      return redirect(
        `/ideas/${params.id}`,
        await commitSessionHeaders(session)
      );
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
  }

  return redirect(`/ideas/${params.id}`, await commitSessionHeaders(session));
};

export default function Idea() {
  const { idea, vote } = useRouteData<IdeaSession>();

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
        <p>{idea.description}</p>
        <p>{idea.user.alias}</p>
        <Form method="post">
          <input type="hidden" name="_method" value="put" />
          <label htmlFor="up">
            :thumbsup: {idea.Vote.filter((vote) => vote.type === "up").length}
            <input
              disabled={!!vote && vote?.type === "up"}
              type="submit"
              name="vote"
              id="up"
              value="up"
            />
          </label>
          <label htmlFor="down">
            :thumbsdown:{" "}
            {idea.Vote.filter((vote) => vote.type === "down").length}
            <input
              disabled={!!vote && vote?.type === "down"}
              type="submit"
              name="vote"
              value="down"
            />
          </label>
        </Form>
        {idea.Comment.length > 0 ? (
          <ul className="comments">
            {idea.Comment.map((comm) => (
              <li key={comm.id}>
                <p className="user">{comm.user.alias}</p>
                <p className="description">{comm.description}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
