import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import config from "@/lib/config.ts";
import { GoogleGenAI } from "@google/genai";

// Google AI Studio API configuration
const AI_API_KEY = config.get("GEMINI_API_KEY") || config.get("GEMMA_API_KEY") || "";
const AI_MODEL = "gemma-3-27b-it";
const ai = new GoogleGenAI({ apiKey: AI_API_KEY });

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      // Verify user is authenticated
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;

      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
        });
      }

      const body = await req.json();
      const { question, grade, role } = body;
      const userGrade = grade;
      const userRole = role;

      if (!question || !question.trim()) {
        return new Response(JSON.stringify({ error: "Question is required" }), {
          status: 400,
        });
      }

      // Prepare context based on user role and grade
      let contextPrompt = "";
      if (userRole === "student" && userGrade) {
        contextPrompt = `Bạn là một trợ lý AI giảng dạy cho học sinh lớp ${userGrade} tại Việt Nam. Hãy trả lời câu hỏi của học sinh một cách đơn giản, dễ hiểu và phù hợp với trình độ. Sử dụng ngôn ngữ Việt Nam thân thiện, gần gũi. `;
      } else if (userRole === "teacher") {
        contextPrompt = `Bạn là một trợ lý AI cho giáo viên tại Việt Nam. Hãy cung cấp câu trả lời chi tiết, chuyên sâu và có tính ứng dụng cao cho giáo viên. Bạn có thể truy cập tài liệu từ mọi khối lớp. Sử dụng ngôn ngữ Việt Nam chuyên nghiệp nhưng vẫn dễ hiểu. `;
      } else {
        contextPrompt = `Bạn là một trợ lý AI giáo dục tại Việt Nam. Hãy trả lời câu hỏi một cách hữu ích và chính xác. Sử dụng ngôn ngữ Việt Nam. `;
      }

      // Add textbook context constraint
      const textbookConstraint = `Hãy dựa vào kiến thức trong sách giáo khoa Việt Nam để trả lời. Nếu không chắc chắn, hãy nói rõ rằng đây là thông tin tham khảo và khuyên người dùng kiểm tra lại sách giáo khoa.`;

      const fullPrompt = `${contextPrompt}${textbookConstraint}

Câu hỏi: ${question}

Trả lời:`;

      // Call Google AI Studio using the new pattern
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: fullPrompt,
      });

      const answer = response.text;
      
      if (answer) {
        return new Response(
          JSON.stringify({ 
            answer: answer.trim(),
            model: AI_MODEL
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } else {
        return new Response(
          JSON.stringify({ error: "No response from AI" }),
          {
            status: 500,
          },
        );
      }

    } catch (error: any) {
      console.error("AI API error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
