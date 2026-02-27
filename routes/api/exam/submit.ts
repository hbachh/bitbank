import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { assignments, questions, submissions } from "../../../db/schema.ts";
import { and, count, eq, inArray } from "npm:drizzle-orm@0.35.3";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const body = await req.json();
      const { answers, assignmentId } = body as {
        answers: Record<string, any>;
        assignmentId?: string;
      };

      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      const user = token ? await verifyToken(token) : null;

      const db = await getDb();

      // Check attempt limit if it's an assignment
      if (assignmentId && user) {
        const assignmentData = await db.select().from(assignments).where(
          eq(assignments.id, assignmentId),
        ).limit(1);
        if (assignmentData.length > 0) {
          const asn = assignmentData[0];
          const submissionCount = await db.select({ value: count() }).from(
            submissions,
          ).where(
            and(
              eq(submissions.assignmentId, assignmentId),
              eq(submissions.studentId, user.id),
            ),
          );

          if (submissionCount[0].value >= (asn.maxAttempts || 1)) {
            return new Response(
              JSON.stringify({ error: "Bạn đã hết lượt làm bài này." }),
              { status: 403 },
            );
          }
        }
      }

      if (!answers || Object.keys(answers).length === 0) {
        return new Response(
          JSON.stringify({ score: 0, results: [], total: 0 }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const ids = Object.keys(answers);

      // Fetch questions to check answers
      const questionList = await db.select().from(questions).where(
        inArray(questions.id, ids),
      );

      let score = 0;
      let hasPendingSA = false;

      const results = questionList.map((q) => {
        const userAnswer = answers[q.id];
        let isCorrect = false;
        let pendingGrading = false;

        if (q.type === "TN") {
          isCorrect = userAnswer === q.answer;
          if (isCorrect) score += 1;
        } else if (q.type === "TF") {
          try {
            const correctData = JSON.parse(q.data || "[]");
            isCorrect = true;
            for (let i = 0; i < correctData.length; i++) {
              if (userAnswer?.[i] !== correctData[i].correct) {
                isCorrect = false;
                break;
              }
            }
          } catch (e) {
            isCorrect = false;
          }
          if (isCorrect) score += 1;
        } else if (q.type === "SA") {
          const cleanUser = userAnswer?.trim().toLowerCase().replace(",", ".");
          const cleanCorrect = q.answer?.trim().toLowerCase().replace(",", ".");

          // Check if correct answer is a number
          const isNumeric = !isNaN(parseFloat(cleanCorrect)) &&
            isFinite(Number(cleanCorrect));

          if (isNumeric) {
            // Numeric comparison
            isCorrect = parseFloat(cleanUser) === parseFloat(cleanCorrect);
            if (isCorrect) score += 1;
            pendingGrading = false;
          } else {
            // Textual SA - let teacher grade
            hasPendingSA = true;
            pendingGrading = true;
            isCorrect = cleanUser === cleanCorrect; // Initial check
          }
        }

        return {
          questionId: q.id,
          type: q.type,
          userAnswer,
          isCorrect,
          pendingGrading,
          correctAnswer: q.answer,
          explanation: "Sử dụng AI để giải thích chi tiết câu này.",
        };
      });

      // Save to database if it's an assignment
      if (assignmentId && user) {
        const submissionId = uuidv4();
        await db.insert(submissions).values({
          id: submissionId,
          assignmentId,
          studentId: user.id,
          score: score,
          answers: JSON.stringify(results),
          isGraded: !hasPendingSA,
        });
      }

      return new Response(
        JSON.stringify({
          score,
          total: questionList.length,
          results,
          hasPendingSA,
          message: hasPendingSA
            ? "Bài làm có câu hỏi tự luận dài, giáo viên sẽ chấm điểm sau."
            : "Đã chấm điểm tự động hoàn toàn.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      console.error("Grading error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
