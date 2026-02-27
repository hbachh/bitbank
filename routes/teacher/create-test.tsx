import { FreshContext, PageProps } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import CreateTestForm from "../../islands/CreateTestForm.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return new Response("", { status: 307, headers: { Location: "/unauthorized" } });
    }

    return ctx.render({ user });
  },
};

export default function CreateTestPage({ data }: PageProps) {
  const { user } = data;

  return (
    <div className="min-h-screen bg-pattern">
      <div className="container mx-auto px-4 py-8">
        <CreateTestForm user={user} />
      </div>
    </div>
  );
}
