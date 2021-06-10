import { LinksFunction } from "@remix-run/react/routeModules";
import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  redirect,
  useRouteData,
} from "remix";
import { prisma } from "../db";
import {
  commitSessionHeaders,
  flashAndRedirect,
  getLoginRedirect,
  getSession,
  withSession,
} from "../sessions";
import formStyles from "../styles/forms.css";
import loginStyles from "../styles/login.css";
import { handleLogin, handleRegister } from "../utils.server";

export let links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: formStyles },
    { rel: "stylesheet", href: loginStyles },
  ];
};

export let loader: LoaderFunction = ({ request }) => {
  return withSession(request, async (session) => {
    const sesh: ErrorsSession = {
      errors: session.get("errors"),
      error: session.get("error"),
      defaultTab: session.get("defaultTab"),
    };
    return json(sesh, await commitSessionHeaders(session));
  });
};

export let action: ActionFunction = async ({ request }) => {
  const session = await getSession(request);
  const fromUrl = getLoginRedirect(session);
  const body = Object.fromEntries(new URLSearchParams(await request.text()));
  const errors = [];

  session.flash("defaultTab", body.tab);

  if (body.tab === "login") {
    if (!body.email) {
      errors.push("Email must be provided!");
    }

    if (!body.password) {
      errors.push("Password must be provided!");
    }

    if (errors.length > 0) {
      return flashAndRedirect(session, "/login", errors);
    }

    try {
      const user = await handleLogin({
        email: body.email,
        password: body.password,
      });

      if (!user) {
        return flashAndRedirect(session, "/login", errors);
      }

      session.set("user", user);
    } catch (err) {
      errors.push((err as Error).message);
      return flashAndRedirect(session, "/login", errors);
    }
  } else {
    if (!body.registerEmail) {
      errors.push("Email must be provided!");
    }

    if (!body.registerPassword) {
      errors.push("Password must be provided!");
    }

    if (!body.alias) {
      errors.push("Alias must be provided!");
    }

    if (
      !body.confirmPassword ||
      body.confirmPassword !== body.registerPassword
    ) {
      errors.push("Passwords do not match!");
    }

    if (errors.length > 0) {
      return flashAndRedirect(session, "/login", errors);
    }
    try {
      const user = await handleRegister({
        alias: body.alias,
        email: body.registerEmail,
        password: body.registerPassword,
      });

      if (!user) {
        return flashAndRedirect(session, "/login", errors);
      }

      session.set("user", user);
    } catch (err) {
      errors.push((err as Error).message);
      return flashAndRedirect(session, "/login", errors);
    }
  }

  return redirect(
    typeof fromUrl === "string" ? fromUrl : "/ideas",
    await commitSessionHeaders(session)
  );
};

interface ErrorsSession {
  errors?: string[];
  error?: string;
  defaultTab?: string;
}

export default function Login() {
  const data = useRouteData<ErrorsSession>();
  let errors = data.errors;
  errors = errors?.concat(data.error ? data.error : []);

  return (
    <div>
      <section>
        <Form method="post">
          <input
            defaultChecked={!data.defaultTab || data.defaultTab === "login"}
            type="radio"
            name="tab"
            id="login"
            value="login"
          />
          <input
            defaultChecked={
              Boolean(data.defaultTab) && data.defaultTab === "register"
            }
            type="radio"
            name="tab"
            id="register"
            value="register"
          />
          <div className="tabs-headers">
            <label htmlFor="login">Login</label>
            <label htmlFor="register">Register</label>
          </div>
          <div className="tabs-content">
            <div data-tab="login">
              <label htmlFor="email">
                Email:
                <input type="email" name="email" id="email" />
              </label>
              <label htmlFor="password">
                Password:
                <input type="password" name="password" id="password" />
              </label>
              <button type="submit">Login</button>
            </div>
            <div data-tab="register">
              <label htmlFor="alias">
                Alias:
                <input type="text" name="alias" id="alias" />
                <p>This will be the name displayed on the ideas and comments</p>
              </label>
              <label htmlFor="email">
                Email:
                <input type="email" name="registerEmail" id="email" />
              </label>
              <label htmlFor="password">
                Password:
                <input type="password" name="registerPassword" id="password" />
              </label>
              <label htmlFor="confirmPassword">
                Confirm Password:
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                />
              </label>
              <button type="submit">Register</button>
            </div>
            {errors?.map((error) => (
              <p className="error" key={error}>
                {error}
              </p>
            ))}
          </div>
        </Form>
      </section>
    </div>
  );
}
