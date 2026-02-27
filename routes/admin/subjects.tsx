import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import { textbookTopics } from "../../db/schema.ts";
import { State } from "../_middleware.ts";
import DashboardLayout from "../../islands/DashboardLayout.tsx";
import AdminSubjectManager from "../../islands/AdminSubjectManager.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user || user.role !== "admin") {
      return new Response("", { status: 303, headers: { Location: "/" } });
    }

    const db = await getDb();
    const topics = await db.select().from(textbookTopics);

    return ctx.render({ user, topics, pathname: new URL(req.url).pathname });
  },
};

export default function AdminSubjectsPage({ data }: PageProps) {
  const { topics } = data;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase italic text-black">
          Danh sách môn học & chủ đề
        </h1>
        <p className="text-sm font-bold uppercase tracking-tight opacity-70 text-black">
          Quản lý các môn học, chủ đề và bài học trong hệ thống
        </p>
      </div>

      <AdminSubjectManager initialTopics={topics} />
    </div>
  );
}
