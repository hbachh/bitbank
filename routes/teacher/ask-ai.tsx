import { FreshContext, PageProps } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import TeacherAskAI from "../../islands/TeacherAskAI.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user || user.role !== "teacher") {
      return ctx.redirect("/teacher");
    }

    return ctx.render({ user });
  },
};

export default function TeacherAskAIPage({ data, state }: PageProps) {
  const { user } = data;

  return <TeacherAskAI user={user} />;
}
