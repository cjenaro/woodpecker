import { ActionFunction, redirect } from "remix";
import { commitSessionHeaders, getSession } from "../sessions";

export let action: ActionFunction = async ({ request }) => {
  const session = await getSession(request);
  const info = session.get("info");
  const redirectBack = request.headers.get("Referer");

  return redirect(redirectBack || "", await commitSessionHeaders(session));
};

export default function ClearInfo() {
  return null;
}
