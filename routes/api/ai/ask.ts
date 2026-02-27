import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";

// Google AI Studio API configuration
const GEMMA_API_KEY = Deno.env.get("GEMMA_API_KEY") || "";
const GEMMA_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent";

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
      const { question, userGrade, userRole } = body;

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

      // Call Google AI Studio API
      const response = await fetch(`${GEMMA_API_URL}?key=${GEMMA_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        console.error("Gemma API error:", response.status, response.statusText);
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          {
            status: 503,
          },
        );
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        const answer = result.candidates[0].content.parts[0].text;
        
        return new Response(
          JSON.stringify({ 
            answer: answer.trim(),
            model: "gemma-3-27b-it"
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
