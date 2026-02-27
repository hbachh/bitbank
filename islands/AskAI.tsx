import { useState, useEffect } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { Card } from "../components/Card.tsx";
import { marked } from "marked";

interface AskAIProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    grade?: number | null;
  };
}

export default function AskAI({ user }: AskAIProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const renderMarkdown = (text: string) => {
    try {
      return { __html: marked.parse(text) };
    } catch (e) {
      return { __html: text };
    }
  };

  const handleAskAI = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question,
          userGrade: user.grade,
          userRole: user.role 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAnswer(result.answer);
      } else {
        setAnswer("Xin lỗi, có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.");
      }
    } catch (error) {
      setAnswer("Xin lỗi, có lỗi kết nối mạng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="mb-4">
        <Button
          variant="outline"
          className="w-full h-12 border-4 border-black font-black uppercase italic shadow-neo-sm hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          onClick={() => setIsOpen(true)}
        >
          🤖 Hỏi AI
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-4 border-black shadow-neo mb-4">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black uppercase italic">
            🤖 Hỏi AI
          </h3>
          <Button
            variant="outline"
            className="h-8 w-8 border-2 border-black font-black text-sm hover:bg-black hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            ×
          </Button>
        </div>

        <div className="space-y-3">
          <div className="grid gap-2">
            <Label
              htmlFor="ai-question"
              className="text-xs font-black uppercase italic"
            >
              Câu hỏi của bạn
            </Label>
            <textarea
              id="ai-question"
              value={question}
              onInput={(e) => setQuestion((e.target as HTMLTextAreaElement).value)}
              placeholder="Nhập câu hỏi của bạn về bài học..."
              className="w-full h-24 p-3 border-4 border-black font-black uppercase italic text-sm resize-none"
              rows={4}
            />
          </div>

          <Button
            onClick={handleAskAI}
            disabled={loading || !question.trim()}
            className="w-full h-12 border-4 border-black font-black uppercase italic shadow-neo-sm hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "🤔 Đang suy nghĩ..." : "🚀 Gửi câu hỏi"}
          </Button>

          {answer && (
            <div className="grid gap-2 mt-4">
              <Label className="text-xs font-black uppercase italic">
                🤖 AI Trả lời
              </Label>
              <div 
                className="p-4 border-4 border-black bg-white font-bold text-sm prose max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(answer)}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
