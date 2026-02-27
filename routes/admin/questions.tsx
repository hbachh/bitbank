import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import { questions } from "../../db/schema.ts";
import { State } from "../_middleware.ts";
import QuestionBankManager from "../../islands/QuestionBankManager.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user || user.role !== "admin") return ctx.next();

    const db = await getDb();
    const questionList = await db.select().from(questions);

    return ctx.render({ questionList, user });
  },
};

export default function AdminQuestionBankPage({ data }: PageProps) {
  const { questionList, user } = data;

  return (
    <QuestionBankManager
      initialQuestions={questionList}
      user={user}
      deleteOnly={true}
    />
  );
}

