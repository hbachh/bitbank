import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { assignments, questions, submissions } from "../../../db/schema.ts";
import { and, count, eq, inArray } from "npm:drizzle-orm@0.35.3";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import config from "@/lib/config.ts";
import { GoogleGenAI } from "@google/genai";

// Google AI Studio API configuration for AI Grading
const AI_API_KEY = config.get("GEMINI_API_KEY") || config.get("GEMMA_API_KEY") || "";
const AI_MODEL = "gemma-3-27b-it";
const ai = new GoogleGenAI({ apiKey: AI_API_KEY });

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
      let assignmentType = "exam";

      // Check attempt limit and type if it's an assignment
      if (assignmentId && user) {
        const assignmentData = await db.select().from(assignments).where(
          eq(assignments.id, assignmentId),
        ).limit(1);
        if (assignmentData.length > 0) {
          const asn = assignmentData[0];
          assignmentType = asn.type || "exam";
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

      const results = await Promise.all(questionList.map(async (q) => {
        const userAnswer = answers[q.id];
        let isCorrect = false;
        let pendingGrading = false;
        let explanation = "Sử dụng AI để giải thích chi tiết câu này.";

        if (q.type === "TN") {
          isCorrect = userAnswer === q.answer;
          if (isCorrect) score += 1;
        } else if (q.type === "TF") {
          try {
            const parsed = JSON.parse(q.data || "{}");
            const subQuestions = parsed.subQuestions || [];
            isCorrect = true;
            for (let i = 0; i < subQuestions.length; i++) {
              const correctVal = subQuestions[i].answer === "true";
              if (userAnswer?.[i] !== correctVal) {
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
          } else if (assignmentType === "practice" && AI_API_KEY) {
            // AI Grading for practice self-study
            try {
              const prompt = `
                Bạn là một giám khảo chấm thi Tin học. Hãy chấm điểm câu trả lời của học sinh cho câu hỏi sau:
                Câu hỏi: "${q.content}"
                Gợi ý đáp án đúng: "${q.answer}"
                Câu trả lời của học sinh: "${userAnswer}"
                
                Hãy trả về kết quả dưới định dạng JSON:
                {
                  "isCorrect": boolean (true nếu câu trả lời đúng ít nhất 80% ý nghĩa),
                  "explanation": string (giải thích ngắn gọn tại sao đúng hoặc sai)
                }
              `;
              
              const aiResponse = await ai.models.generateContent({
                model: AI_MODEL,
                contents: prompt,
              });
              
              const aiText = aiResponse.text;
              const jsonMatch = aiText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const aiResult = JSON.parse(jsonMatch[0]);
                isCorrect = aiResult.isCorrect;
                explanation = aiResult.explanation;
                if (isCorrect) score += 1;
              } else {
                // Fallback if AI fails to return JSON
                isCorrect = cleanUser === cleanCorrect;
                if (isCorrect) score += 1;
              }
              pendingGrading = false;
            } catch (err) {
              console.error("AI Grading error:", err);
              hasPendingSA = true;
              pendingGrading = true;
            }
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
          explanation: explanation,
        };
      }));

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
