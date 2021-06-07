import { Idea } from "@prisma/client";
import type { MetaFunction, LinksFunction, LoaderFunction } from "remix";
import { useRouteData } from "remix";
import { prisma } from "../db";
import Woman from "../components/woman";

import stylesUrl from "../styles/index.css";

export let meta: MetaFunction = () => {
  return {
    title: "Woodpecker",
    description: "App ideas by people who need them!",
  };
};

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export let loader: LoaderFunction = async () => {
  const ideas = await prisma.idea.findMany({
    include: {
      Vote: true,
    },
  });
  return ideas;
};

export default function Index() {
  let data = useRouteData<Idea[]>();

  return (
    <div>
      <section className="hero">
        <Woman />
        <div className="container">
          <p>This is</p>
          <h1>Woodpecker!</h1>
          <p>App ideas by people need them,</p>
          <p>To developers that can build them!</p>
        </div>
      </section>
      <section>
        <div className="container">
          <h2>Trending ideas</h2>
          {data?.length > 0
            ? data.map((idea) => (
                <div key={idea.id}>
                  <h5>{idea.title}</h5>
                </div>
              ))
            : null}
        </div>
      </section>
      <section className="why">
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
