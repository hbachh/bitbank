import { FreshContext, PageProps } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import StudentAskAI from "../../islands/StudentAskAI.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user || user.role !== "student") {
      return ctx.redirect("/student");
    }

    return ctx.render({ user });
  },
};

export default function StudentAskAIPage({ data, state }: PageProps) {
  const { user } = data;

  return <StudentAskAI user={user} />;
}
