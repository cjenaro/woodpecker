import { Form } from "remix";
import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <nav>
        <NavLink to="/">Home</NavLink>

        <Form action="/ideas">
          <input name="query" placeholder="Search..." />
        </Form>
        <NavLink to="/ideas">all</NavLink>
      </nav>
    </header>
  );
}
