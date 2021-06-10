import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <footer>
      <p>
        Developed with{" "}
        <a href="https://remix.run" rel="noopener noreferrer" target="_blank">
          Remix 💿
        </a>{" "}
        by{" "}
        <a
          href="https://twitter.com/jenaroc"
          target="_blank"
          rel="noopener noreferrer"
        >
          @jenaroc
        </a>
      </p>
      <p className="body2">
        got feedback? reach me at my twitter above or leave a comment at{" "}
        <NavLink to="/ideas/1">Woodpecker</NavLink>
      </p>
    </footer>
  );
}
