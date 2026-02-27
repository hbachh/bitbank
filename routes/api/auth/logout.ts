import { FreshContext } from "$fresh/server.ts";
import { deleteCookie } from "$std/http/cookie.ts";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    const response = new Response("", {
      status: 303,
      headers: { Location: "/" },
    });
    deleteCookie(response.headers, "auth_token", { path: "/" });
    return response;
  },
  async POST(req: Request, _ctx: FreshContext) {
    const response = new Response(
      JSON.stringify({ success: true, message: "Logged out" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    deleteCookie(response.headers, "auth_token", { path: "/" });
    return response;
  },
};
