import { User } from "@prisma/client";
import {
  createCookieSessionStorage,
  Request,
  Session,
  HeadersInit,
  CookieSerializeOptions,
  Response,
  redirect,
  json,
} from "remix";

let isProd = process.env.NODE_ENV === "production";
const {
  commitSession,
  destroySession,
  getSession: remixGetSession,
} = createCookieSessionStorage({
  cookie: {
    name: "__session",
    sameSite: "lax",
    httpOnly: true,
    secure: isProd,
    secrets: ["secr3t"],
    maxAge: 60 * 60 * 24,
    path: "/",
    expires: new Date(Date.now() + 60 * 60 * 24),
  },
});

export async function getSession(request: Request) {
  return await remixGetSession(request.headers.get("Cookie"));
}

export async function commitSessionHeaders(
  session: Session,
  headers: HeadersInit = {},
  options?: CookieSerializeOptions
): Promise<{ headers: HeadersInit }> {
  return {
    headers: {
      ...headers,
      "Set-Cookie": await commitSession(session, options),
    },
  };
}

export async function destroySessionHeaders(
  session: Session,
  headers: HeadersInit = {},
  options?: CookieSerializeOptions
): Promise<{ headers: HeadersInit }> {
  return {
    headers: {
      ...headers,
      "Set-Cookie": await destroySession(session, options),
    },
  };
}

type NextType = (session: Session) => Promise<Response>;
type UserNextType = (session: Session, user: User) => Promise<Response>;

export async function requireUser(request: Request, next: UserNextType) {
  return withSession(request, async (session) => {
    const user: User = session.get("user");

    if (!user) {
      const [, , , ...pathname] = request.url.split("/");
      session.flash("backTo", pathname.join("/"));
      return redirect("/login", await commitSessionHeaders(session));
    }

    return next(session, user);
  });
}

export async function withSession(request: Request, next: NextType) {
  const session = await getSession(request);
  let response = await next(session);

  if (!(response instanceof Response)) {
    response = json(response, await commitSessionHeaders(session));
  }
  return response;
}

export function getLoginRedirect(session: Session) {
  return session.get("backTo");
}

export async function flashAndRedirect(
  session: Session,
  url: string,
  errors: object
) {
  session.flash("errors", errors);
  return redirect(url, await commitSessionHeaders(session));
}

export { destroySession, commitSession, remixGetSession };
