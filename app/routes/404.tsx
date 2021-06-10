import { NavLink } from "react-router-dom";
import type { MetaFunction, LinksFunction } from "remix";
import stylesUrl from "../styles/404.css";

export let meta: MetaFunction = () => {
  return {
    title: "Oops, no ideas here | Woodpecker",
    description: "There are no ideas here!",
  };
};

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }]
}

export default function FourOhFour() {
  return (
    <div className="notfound">
      <h1>404</h1>
      <nav>
        <NavLink to="/">&larr; Back home</NavLink>
        <NavLink to="/ideas">Check some ideas out</NavLink>
        <NavLink to="/ideas/new">I have an idea!</NavLink>
      </nav>
      <img src="/assets/stop.png" alt="Stop sign." />
    </div>
  );
}
