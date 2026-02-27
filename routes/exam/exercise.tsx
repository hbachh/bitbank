import { FreshContext, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../lib/jwt.ts";
import ExamExercise from "../../islands/ExamExercise.tsx";
import DashboardLayout from "../../islands/DashboardLayout.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;
    const url = new URL(req.url);

    if (!token) {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    return ctx.render({ user, pathname: url.pathname });
  },
};

export default function ExercisePage({ data }: PageProps) {
  const { user, pathname } = data;

  return (
    <DashboardLayout user={user} pathname={pathname}>
      <ExamExercise user={user} />
    </DashboardLayout>
  );
}
