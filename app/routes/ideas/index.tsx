import { Idea, Vote } from "@prisma/client";
import { LinksFunction } from "@remix-run/react/routeModules";
import { NavLink } from "react-router-dom";
import { json, LoaderFunction, MetaFunction, useRouteData } from "remix";
import { prisma } from "../../db";
import stylesUrl from "../../styles/ideas/index.css";

type Ideas = (Idea & {
  Vote: Vote[];
})[];

interface IdeasSession {
  ideas: Ideas;
  query?: string;
}

export let meta: MetaFunction = () => ({
  title: "Ideas | Woodpecker",
});

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export let loader: LoaderFunction = async ({ request }) => {
  const indexOfQ = request.url.indexOf("?");
  const params = new URLSearchParams(request.url.slice(indexOfQ));
  const query = params.get("query") || "";
  const include = {
    Vote: true,
    tags: true,
  };
  let ideas = [];
  console.log(indexOfQ, query);
  if (indexOfQ === -1 || !query) {
    ideas = await prisma.idea.findMany({
      include,
    });
  } else {
    console.log("FETCHING WITH FILTER");
    ideas = await prisma.idea.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
            },
          },
          {
            tags: {
              some: {
                slug: query,
              },
            },
          },
        ],
      },
      include,
    });
  }

  return json({ ideas, query });
};

export default function Ideas() {
  const { ideas, query } = useRouteData<IdeasSession>();
  return (
    <section>
      <div className="container">
        <h1>Ideas</h1>
        <NavLink to="new">Add a new idea</NavLink>
        <p>
          {query ? (
            <span>
              Ideas that contain <span className="query">{query}</span>
            </span>
          ) : (
            "Or check the latests ideas"
          )}
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
    </section>
  );
}
