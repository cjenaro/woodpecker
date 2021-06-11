import { LinksFunction } from "@remix-run/react/routeModules";
import { ActionFunction, Form, json, LoaderFunction, redirect } from "remix";
import { prisma } from "../../db";
import { commitSessionHeaders, getSession, requireUser } from "../../sessions";
import stylesUrl from "../../styles/ideas/new.css";
import formStyles from "../../styles/forms.css";

export let loader: LoaderFunction = async ({ request }) => {
  return requireUser(request, async (session, user) => {
    return json(user, await commitSessionHeaders(session));
  });
};

export let links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: stylesUrl },
    { rel: "stylesheet", href: formStyles },
  ];
};

export let action: ActionFunction = async ({ request }) => {
  const body = Object.fromEntries(new URLSearchParams(await request.text()));
  const session = await getSession(request);
  const user = session.get("user");

  try {
    const newIdea = await prisma.idea.create({
      data: {
        title: body.title,
        description: body.description,
        userId: user.id,
      },
    });

    const tags = body?.tags?.split(" ") || [];
    for (let t = 0; t < tags.length; t++) {
      await prisma.tag.create({
        data: {
          slug: tags[t],
          ideaId: newIdea.id,
        },
      });
    }

    return redirect(`/ideas/${newIdea.id}`);
  } catch (err) {
    session.flash("error", (err as Error).message);
    return redirect("/ideas/new", await commitSessionHeaders(session));
  }
};

export default function NewIdea() {
  return (
    <div className="new">
      <div className="container">
        <Form method="post">
          <label>
            Title:
            <input type="text" name="title" placeholder="Woodpecker" />
          </label>
          <label>
            Tags:
            <input
              type="text"
              name="tags"
              placeholder="programming health travel..."
            />
            <p>Space separated values, this is useful for searches</p>
          </label>
          <label>
            Description:
            <textarea
              name="description"
              placeholder="Woodpecker would be an app where users..."
            />
            <p>
              You can use{" "}
              <a
                href="https://commonmark.org/help/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Markdown
              </a>{" "}
              if you want to.
            </p>
          </label>
          <button type="submit">Add</button>
        </Form>
      </div>
    </div>
  );
}
