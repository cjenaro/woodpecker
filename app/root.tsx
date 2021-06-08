import {
  json,
  LinksFunction,
  LoaderFunction,
  useRouteData,
  Form,
  ActionFunction,
  redirect,
  MetaFunction,
} from "remix";
import { Meta, Links, LiveReload } from "remix";
import { Outlet } from "react-router-dom";

import stylesUrl from "./styles/global.css";
import Header from "./components/header";
import Footer from "./components/footer";
import { commitSessionHeaders, withSession } from "./sessions";

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export let meta: MetaFunction = () => {
  return {
    title: "Woodpecker",
    description: "App ideas by people who need them!",
  };
};

export let loader: LoaderFunction = ({ request }) => {
  return withSession(request, async (session) => {
    const info = session.get("info");
    return json({ info }, await commitSessionHeaders(session));
  });
};

interface GenericSession {
  info?: string;
}

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          type="image/png"
          href="favicon-32x32.png"
          sizes="32x32"
        />
        <link
          rel="icon"
          type="image/png"
          href="favicon-16x16.png"
          sizes="16x16"
        />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Roboto&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}

        {/* <Scripts /> */}
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteData<GenericSession>();
  return (
    <Document>
      {data?.info ? (
        <div className="flash-message">
          <p>{data.info}</p>
          <Form method="post" action="/clear-info">
            <button type="submit">&times;</button>
          </Form>
        </div>
      ) : null}
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Document>
      <h1>App Error</h1>
      <pre>{error.message}</pre>
    </Document>
  );
}
