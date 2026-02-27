import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../lib/jwt.ts";
import LoginForm from "../islands/LoginForm.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (token) {
      const user = await verifyToken(token);
      if (user) {
        if (user.role === "admin") {
          return new Response("", {
            status: 303,
            headers: { Location: "/admin" },
          });
        }
        if (user.role === "teacher") {
          return new Response("", {
            status: 303,
            headers: { Location: "/teacher" },
          });
        }
        return new Response("", {
          status: 303,
          headers: { Location: "/student" },
        });
      }
    }

    return ctx.render();
  },
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-accent p-4">
      <LoginForm />
    </div>
  );
}
