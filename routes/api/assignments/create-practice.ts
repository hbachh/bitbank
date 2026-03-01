import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { assignments, questions } from "../../../db/schema.ts";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";
import { and, eq } from "npm:drizzle-orm@0.35.3";

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
        eq(questions.isPublic, true),
      ].filter(Boolean);

      let allAvailableQuestions = await db
        .select()
        .from(questions)
        .where(and(...baseConditions as any));

      // Fallback: If no questions found for specific lesson, try getting all questions for the topic
      if (allAvailableQuestions.length === 0 && lessonId) {
        allAvailableQuestions = await db
          .select()
          .from(questions)
          .where(and(
            eq(questions.topicId, topicId),
            eq(questions.isPublic, true),
          ));
      }

      const tnQuestions = allAvailableQuestions.filter((q) => q.type === "TN");
      const tfQuestions = allAvailableQuestions.filter((q) => q.type === "TF");
      const saQuestions = allAvailableQuestions.filter((q) => q.type === "SA");

      const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

      // Gracefully handle fewer questions than requested by taking all available
      const selectedTN = shuffle(tnQuestions).slice(0, Math.min(tnQuestions.length, config.tnCount));
      const selectedTF = shuffle(tfQuestions).slice(0, Math.min(tfQuestions.length, config.tfCount));
      const selectedSA = shuffle(saQuestions).slice(0, Math.min(saQuestions.length, config.saCount));

      const finalQuestionIds = [
        ...selectedTN.map((q) => q.id),
        ...selectedTF.map((q) => q.id),
        ...selectedSA.map((q) => q.id),
      ];

      if (finalQuestionIds.length === 0) {
        return new Response(
          JSON.stringify({ error: "Không tìm thấy câu hỏi nào cho bài học này. Vui lòng liên hệ giáo viên để thêm câu hỏi." }),
          { status: 400 },
        );
      }

      const id = uuidv4();
      await db.insert(assignments).values({
        id,
        title,
        teacherId: user.id,
        type: "practice",
        config: JSON.stringify(config),
        questionIds: JSON.stringify(finalQuestionIds),
      });

      return new Response(JSON.stringify({ success: true, id }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Practice creation error:", error);
      return new Response(error.message, { status: 500 });
    }
  },
};
