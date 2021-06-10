import { Idea } from "@prisma/client";
import type { LinksFunction, LoaderFunction } from "remix";
import { useRouteData } from "remix";
import { prisma } from "../db";

import stylesUrl from "../styles/index.css";
import { NavLink } from "react-router-dom";

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export let loader: LoaderFunction = async () => {
  const ideas = await prisma.idea.findMany({
    include: {
      Vote: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });
  return ideas;
};

export default function Index() {
  let data = useRouteData<Idea[]>();

  return (
    <div>
      <section className="hero">
        <svg
          width="502"
          height="355"
          viewBox="0 0 502 355"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M291.844 142.046C273.508 139.869 229.38 141.885 199.552 167.358C169.725 192.831 110.924 208.36 85.2522 212.94C107.217 281.779 165.751 313.165 215.5 303.614C255.3 295.973 312.009 239.628 335.389 212.41C320.669 201.02 324.981 170.849 327.8 158.49L291.844 142.046Z"
            fill="var(--face)"
          />
          <path
            d="M327.8 158.49C324.98 170.849 320.669 201.02 335.389 212.41C337.366 213.94 451.714 193.895 501.853 176.215L327.8 158.49Z"
            fill="var(--beack)"
          />
          <path
            d="M199.552 167.358C229.38 141.884 273.508 139.869 291.844 142.046C274.811 120.267 266.796 100.402 196.361 100.402C125.927 100.402 0.926549 154.12 0.926549 154.12C41.3513 158.09 75.7384 196.095 85.2522 212.94C110.924 208.36 169.725 192.831 199.552 167.358Z"
            fill="var(--crest)"
          />
          <circle cx="257.927" cy="167.62" r="14" fill="black" />
        </svg>

        <div className="container">
          <p>This is</p>
          <h1>Woodpecker!</h1>
          <p>A bridge between ideas and developers</p>
          <NavLink to="/ideas/new">I have an idea</NavLink>
          <NavLink to="/ideas">find ideas</NavLink>
        </div>
      </section>
      <section className="trending">
        <div className="container">
          <h2>Trending ideas</h2>
          {data?.length > 0 ? (
            <ul>
              {data.map((idea) => (
                <li key={idea.id}>
                  <h5>{idea.title}</h5>
                  <NavLink to={`/ideas/${idea.id}`}>Read more &rarr;</NavLink>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
      <section id="why" className="why">
        <div className="container">
          <h2>Why?</h2>
          <ul>
            <li className="question">
              <h5>What is Woodpecker?</h5>
              <p>
                I've recently been reading{" "}
                <a
                  href="https://makebook.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the indie maker handbook
                </a>{" "}
                by{" "}
                <a
                  href="https://twitter.com/levelsio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @levelsio
                </a>{" "}
                and in there he talks about how you should always build software
                to solve your own problems, which you know and have an insiders
                approach, instead of trying to solve some other niches problems
                just because you want to build an app. The intention (kind of
                sarcastically) of Woodpecker, is to allow people who don't know
                how to build apps a way to pitch them to developers that can,
                and that are trying to build something.
              </p>
            </li>
            <li className="question">
              <h5>Why Woodpecker?</h5>
              <p>I had the domain and went with it :)</p>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
