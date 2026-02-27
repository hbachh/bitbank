import { FreshContext } from "$fresh/server.ts";
import config from "@/lib/config.ts";
import { GoogleGenAI } from "@google/genai";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const body = await req.json();
      const { question, userAnswer, correctAnswer } = body as {
        question: string;
        userAnswer: string;
        correctAnswer: string;
      };

      const apiKey = config.get("GEMINI_API_KEY") || config.get("GEMMA_API_KEY");

      if (!apiKey) {
        console.warn("AI API key (GEMINI_API_KEY or GEMMA_API_KEY) is not set. Using mock response.");
        return new Response(
          JSON.stringify({
            explanation:
              `[AI TUTOR MOCK] (Vui lòng cấu hình GEMINI_API_KEY để có giải thích thực tế)\n\nGiải thích cho câu hỏi: "${question}"\nĐáp án đúng là "${correctAnswer}" vì... (Đây là nội dung mẫu)`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const prompt = `
        Bạn là một gia sư tin học giỏi. Hãy giải thích ngắn gọn tại sao đáp án "${userAnswer}" là sai (nếu sai) và tại sao "${correctAnswer}" là đúng cho câu hỏi sau:
        "${question}"
        Giải thích dễ hiểu cho học sinh THPT.
      `;

      const ai = new GoogleGenAI({ apiKey });
      const AI_MODEL = "gemma-3-27b-it";

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
      });

      const explanation = response.text || "Không thể tạo giải thích.";

      return new Response(JSON.stringify({ explanation }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("AI error:", error);
      return new Response(
        JSON.stringify({
          explanation:
            "Hiện tại AI đang bận. Vui lòng thử lại sau. (Lỗi kết nối hoặc cấu hình)",
        }),
        {
          status: 200, // Return 200 to show fallback in UI
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
