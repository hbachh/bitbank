import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { assignments, questions } from "../../../db/schema.ts";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";
import { and, eq, or, sql } from "npm:drizzle-orm@0.35.3";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user || user.role !== "teacher") {
        return new Response("Forbidden: Teachers only", { status: 403 });
      }

      const body = await req.json();
      const {
        title,
        description,
        classId,
        duration,
        endTime,
        topicId,
        lessonId,
        maxAttempts,
        config,
      } = body;

      if (!title || !classId || !topicId) {
        return new Response("Title, Class and Topic are required", {
          status: 400,
        });
      }

      const db = await getDb();

      // Smart Question Selection Logic
      // 1. Get questions from teacher's own bank AND system bank for the selected topic/lesson
      const baseConditions = [
        eq(questions.topicId, topicId),
        lessonId ? eq(questions.lessonId, lessonId) : undefined,
      ].filter(Boolean);

      const allAvailableQuestions = await db
        .select()
        .from(questions)
        .where(
          and(
            ...baseConditions as any,
            or(
              eq(questions.createdBy, user.id),
              eq(questions.isPublic, true),
            ),
          ),
        );

      // Separate by type
      const tnQuestions = allAvailableQuestions.filter((q) => q.type === "TN");
      const tfQuestions = allAvailableQuestions.filter((q) => q.type === "TF");
      const saQuestions = allAvailableQuestions.filter((q) => q.type === "SA");

      // Shuffle and pick based on config
      const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

      const selectedTN = shuffle(tnQuestions).slice(0, config.tnCount || 10);
      const selectedTF = shuffle(tfQuestions).slice(0, config.tfCount || 5);
      const selectedSA = shuffle(saQuestions).slice(0, config.saCount || 2);

      const finalQuestionIds = [
        ...selectedTN.map((q) => q.id),
        ...selectedTF.map((q) => q.id),
        ...selectedSA.map((q) => q.id),
      ];

      if (finalQuestionIds.length === 0) {
        return new Response(
          JSON.stringify({
            error: "Không tìm thấy câu hỏi nào phù hợp trong ngân hàng.",
          }),
          { status: 400 },
        );
      }

      const id = uuidv4();
      await db.insert(assignments).values({
        id,
        title,
        description,
        classId,
        teacherId: user.id,
        duration: parseInt(duration),
        endTime: endTime ? new Date(endTime) : null,
        maxAttempts: parseInt(maxAttempts || "1"),
        config: JSON.stringify(config),
        questionIds: JSON.stringify(finalQuestionIds),
      });

      return new Response(JSON.stringify({ success: true, id }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Create assignment error:", error);
      return new Response(error.message, { status: 500 });
    }
  },
};
