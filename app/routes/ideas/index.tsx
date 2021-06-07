import { Idea, Vote } from "@prisma/client";
import { NavLink } from "react-router-dom";
import { LoaderFunction, useRouteData } from "remix";
import { prisma } from "../../db";

type Ideas = (Idea & {
  Vote: Vote[];
})[];

export let loader: LoaderFunction = async ({ request }) => {
  const params = new URLSearchParams(await request.text());
  const ideas = await prisma.idea.findMany({
    where: {
      title: {
        contains: params.get("search") || "",
      },
    },
    include: {
      Vote: true,
    },
  });

  return ideas;
};

export default function Ideas() {
  const data = useRouteData<Ideas>();
  return (
    <div>
      <div className="container">
        <h1>Ideas</h1>
        <p>These are the latests ideas</p>
        {data?.length ? (
          <ul>
            {data.map((idea) => (
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
