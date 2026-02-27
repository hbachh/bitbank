import { FreshContext, PageProps } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { getDb } from "../../../lib/db.ts";
import { textbookTopics } from "../../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import PracticeForm from "../../../islands/PracticeForm.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) return ctx.next();

    const db = await getDb();
    const topics = await db.select().from(textbookTopics).where(
      user.grade ? eq(textbookTopics.grade, user.grade) : undefined,
    );

    return ctx.render({ topics });
  },
};

export default function StudentPracticePage({ data }: PageProps) {
  const { topics } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-black">
          Tự luyện tập thông minh
        </h1>
        <p className="text-sm font-bold uppercase tracking-tight opacity-70 text-black">
          Tùy chỉnh bài luyện tập theo nhu cầu của bạn
        </p>
      </div>

      <PracticeForm topics={topics} />
    </div>
  );
}
