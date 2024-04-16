import { http } from "msw";
import { USERNAME } from "./consts.ts";

export const atcoderUserPageMock = http.get("https://atcoder.jp/users/:username/", ({ params }) => {
  const { username } = params;
  if (Array.isArray(username)) {
    return new Response(JSON.stringify({}), { status: 400 });
  }
  if (username === USERNAME) {
    return new Response(JSON.stringify({}), { status: 200 });
  }
  return new Response(JSON.stringify({}), { status: 404 });
});
