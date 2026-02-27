import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { questions } from "../../../db/schema.ts";
import { ExamMatrix, generateExam } from "../../../lib/exam-engine.ts";
import { and, eq, inArray } from "npm:drizzle-orm@0.35.3";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const body = await req.json();
      const { grade, topics, total = 10 } = body;

      // Default distribution: 40-30-20-10
      const matrix: ExamMatrix = {
        totalQuestions: total,
        levelDistribution: {
          level1: 40,
          level2: 30,
          level3: 20,
          level4: 10,
        },
        topics: topics || [],
      };

      const db = await getDb();

      // Build query conditions
      const conditions: any[] = [eq(questions.grade, grade)];

      if (topics && topics.length > 0) {
        conditions.push(inArray(questions.topic, topics));
      }

      const allQuestions = await db.select().from(questions).where(
        and(...conditions),
      );

      // Generate exam using our engine
      const examQuestions = generateExam(allQuestions as any, matrix);

      // Sanitize questions to remove answers
      const sanitized = examQuestions.map((q) => {
        const { answer, correctAnswer, ...rest } = q as any;

        let safeData = q.data;
        if (q.type === "TF" && q.data) {
          try {
            const items = JSON.parse(q.data);
            const safeItems = items.map((item: any) => ({ text: item.text })); // Remove correct
            safeData = JSON.stringify(safeItems);
          } catch (e) {}
        }

        return { ...rest, data: safeData };
      });

      return new Response(JSON.stringify({ success: true, data: sanitized }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Exam generation error:", error);
      return new Response(
        JSON.stringify({ success: false, error: String(error) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
