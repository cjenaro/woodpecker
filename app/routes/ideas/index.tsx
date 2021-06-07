import { Idea, Vote } from "@prisma/client";
import { NavLink } from "react-router-dom";
import { json, LoaderFunction, useRouteData } from "remix";
import { prisma } from "../../db";

type Ideas = (Idea & {
  Vote: Vote[];
})[];

interface IdeasSession {
  ideas: Ideas;
  query?: string;
}

export let loader: LoaderFunction = async ({ request }) => {
  const indexOfQ = request.url.indexOf("?");
  const params = new URLSearchParams(request.url.slice(indexOfQ));
  const query = params.get("query") || "";

  const ideas = await prisma.idea.findMany({
    where: {
      title: {
        contains: indexOfQ ? query : "",
      },
    },
    include: {
      Vote: true,
    },
  });

  return json({ ideas, query });
};

export default function Ideas() {
  const { ideas, query } = useRouteData<IdeasSession>();
  return (
    <div>
      <div className="container">
        <h1>Ideas</h1>
        <p>
          {query
            ? `Ideas that contain ${query}`
            : "These are the latests ideas"}
        </p>
        {ideas?.length ? (
          <ul>
            {ideas.map((idea) => (
              <li key={idea.id}>
                <h6>{idea.title}</h6>
                <p>{idea.description}</p>
                <NavLink to={`/ideas/${idea.id}`}>Read more</NavLink>
              </li>
            ))}
          </ul>
        ) : (
          <h6>
            It seems there are no ideas yet! Why not add yout own?{" "}
            <NavLink to="/ideas/new">Add idea</NavLink>
          </h6>
        )}
      </div>
    </div>
  );
}
