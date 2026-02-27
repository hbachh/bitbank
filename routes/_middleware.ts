import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../lib/jwt.ts";

export interface State {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    grade?: number | null;
    school?: string | null;
  } | null;
  pathname: string;
}

export async function handler(req: Request, ctx: FreshContext<State>) {
  const url = new URL(req.url);
  const cookies = getCookies(req.headers);
  const token = cookies.auth_token;

  ctx.state.pathname = url.pathname;
  ctx.state.user = null;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      ctx.state.user = payload as any;
    }
  }

  // Basic auth check for protected routes
  const isProtectedRoute = url.pathname.startsWith("/student") ||
    url.pathname.startsWith("/teacher") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/class") ||
    url.pathname.startsWith("/exam");

  if (isProtectedRoute && !ctx.state.user) {
    return new Response("", {
      status: 303,
      headers: { Location: "/login" },
    });
  }

  return await ctx.next();
}
