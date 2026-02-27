import { FreshContext } from "$fresh/server.ts";
import DashboardLayout from "../../islands/DashboardLayout.tsx";
import { State } from "../_middleware.ts";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;

    if (user?.role !== "admin") {
      return new Response("", {
        status: 303,
        headers: { Location: "/unauthorized" },
      });
    }

    return ctx.render();
  },
};

export default function AdminLayout({ Component, state }: any) {
  return (
    <DashboardLayout user={state.user} pathname={state.pathname}>
      <div className="max-w-6xl mx-auto">
        <Component />
      </div>
    </DashboardLayout>
  );
}
