import { FreshContext } from "$fresh/server.ts";
import { verifyToken } from "../../../lib/auth.ts";
import { getCookies } from "$std/http/cookie.ts";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return new Response(JSON.stringify({ user: null }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: payload }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
