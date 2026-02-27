import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { assignments, questions } from "../../../db/schema.ts";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";
import { and, eq, or } from "npm:drizzle-orm@0.35.3";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user) return new Response("Unauthorized", { status: 401 });

      const body = await req.json();
      const { title, topicId, lessonId, config } = body;

      const db = await getDb();

      const baseConditions = [
        eq(questions.topicId, topicId),
        lessonId ? eq(questions.lessonId, lessonId) : undefined,
        eq(questions.isPublic, true), // Students only get public questions for practice
      ].filter(Boolean);

      const allAvailableQuestions = await db
        .select()
        .from(questions)
        .where(and(...baseConditions as any));

      const tnQuestions = allAvailableQuestions.filter((q) => q.type === "TN");
      const tfQuestions = allAvailableQuestions.filter((q) => q.type === "TF");
      const saQuestions = allAvailableQuestions.filter((q) => q.type === "SA");

      const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

      const selectedTN = shuffle(tnQuestions).slice(0, config.tnCount);
      const selectedTF = shuffle(tfQuestions).slice(0, config.tfCount);
      const selectedSA = shuffle(saQuestions).slice(0, config.saCount);

      const finalQuestionIds = [
        ...selectedTN.map((q) => q.id),
        ...selectedTF.map((q) => q.id),
        ...selectedSA.map((q) => q.id),
      ];

      if (finalQuestionIds.length === 0) {
        return new Response(
          JSON.stringify({ error: "Không tìm thấy câu hỏi phù hợp." }),
          { status: 400 },
        );
      }

      const id = uuidv4();
      await db.insert(assignments).values({
        id,
        title,
        teacherId: user.id, // For practice, the user is the 'teacher' (owner)
        type: "practice",
        config: JSON.stringify(config),
        questionIds: JSON.stringify(finalQuestionIds),
      });

      return new Response(JSON.stringify({ success: true, id }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(error.message, { status: 500 });
    }
  },
};
