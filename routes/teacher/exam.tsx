import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import { questions } from "../../db/schema.ts";
import { eq, or } from "npm:drizzle-orm@0.35.3";
import { State } from "../_middleware.ts";
import QuestionBankManager from "../../islands/QuestionBankManager.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) return ctx.next();

    const db = await getDb();

    // If admin, show all questions. If teacher, show their own + public.
    const questionsData = user.role === "admin"
      ? await db.select().from(questions)
      : await db
        .select()
        .from(questions)
        .where(
          or(
            eq(questions.createdBy, user.id),
            eq(questions.isPublic, true),
          ),
        );

    return ctx.render({ questionList: questionsData, user });
  },
};

export default function TeacherExamPage({ data }: PageProps) {
  const { questionList, user } = data;

  return (
    <QuestionBankManager
      initialQuestions={questionList}
      user={user}
      deleteOnly={false}
    />
  );
}
