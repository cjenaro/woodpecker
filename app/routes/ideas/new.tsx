import { LinksFunction } from "@remix-run/react/routeModules";
import { ActionFunction, Form, json, LoaderFunction, redirect } from "remix";
import { prisma } from "../../db";
import {
  commitSessionHeaders,
  requireUser,
} from "../../sessions";
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
  const newIdea = await prisma.idea.create({
    data: {
      title: body.title,
      description: body.description,
      userId: 1,
    },
  });

  return redirect(`/ideas/${newIdea.id}`);
};

export default function NewIdea() {
  return (
    <div className="new">
      <div className="container">
        <Form method="post">
          <label>
            Title:
            <input type="text" name="title" />
          </label>
          <label>
            Description:
            <textarea name="description" />
          </label>
          <button type="submit">Add</button>
        </Form>
      </div>
    </div>
  );
}
