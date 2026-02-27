import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import { subjects, textbookTopics } from "../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import { State } from "../_middleware.ts";
import CreateQuestionForm from "../../islands/CreateQuestionForm.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user || user.role !== "admin") {
      return new Response("Unauthorized", { status: 401 });
    }

    const db = await getDb();
    
    // Fetch subjects and topics for the form
    const subjectList = await db.select().from(subjects);
    const topicList = await db.select().from(textbookTopics);

    return ctx.render({
      subjects: subjectList,
      topics: topicList,
    });
  },
};

export default function AdminCreateQuestion({ data }: PageProps) {
  const { subjects, topics } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-black">
          Tạo câu hỏi mới
        </h1>
        <p className="text-black font-bold uppercase tracking-tight opacity-70">
          Quản trị viên tạo câu hỏi cho ngân hàng hệ thống
        </p>
      </div>

      <CreateQuestionForm 
        subjects={subjects}
        topics={topics}
        isAdmin={true}
      />
    </div>
  );
}
