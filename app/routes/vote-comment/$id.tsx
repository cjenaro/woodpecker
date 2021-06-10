import { ActionFunction, redirect } from "remix";
import { prisma } from "../../db";
import { commitSessionHeaders, getSession } from "../../sessions";

export let action: ActionFunction = async ({ request, params }) => {
  const body = Object.fromEntries(new URLSearchParams(await request.text()));
  const session = await getSession(request);
  const user = await session.get("user");
  const redirectBack = request.headers.get("Referer") || "";

  try {
    if (!user) {
      session.flash(
        "info",
        "You need to login to be able to comment and vote!"
      );
      return redirect("/login", await commitSessionHeaders(session));
    }

    const vote = body.vote;

    if (!vote) {
      throw new Error("There was an error processing your vote");
    }

    const dbVote = await prisma.commentVote.findMany({
      where: {
        AND: {
          commentId: Number(params.id),
          userId: user.id,
        },
      },
    });

    if (dbVote.length > 1) {
      throw new Error("There shouldn't be more than one vote from you!");
    }

    if (!dbVote || dbVote.length === 0) {
      await prisma.comment.update({
        where: {
          id: Number(params.id),
        },
        data: {
          CommentVote: {
            create: {
              type: vote,
              userId: user.id,
            },
          },
        },
      });
    } else {
      const [thisVote] = dbVote;
      await prisma.comment.update({
        where: {
          id: Number(params.id),
        },
        data: {
          CommentVote: {
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
  } catch (err) {
    session.flash("error", (err as Error).message);
    return redirect(redirectBack, await commitSessionHeaders(session));
  }

  return redirect(redirectBack, await commitSessionHeaders(session));
};

export default function VoteComment() {
  return null;
}
