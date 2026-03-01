import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { AlertCircle, Check, Save, X } from "lucide-preact";

interface GradingFormProps {
  submission: any;
  results: any[];
}

export default function GradingForm({ submission, results }: GradingFormProps) {
  const [loading, setLoading] = useState(false);
  const [gradingResults, setGradingResults] = useState(results);
  const [feedback, setFeedback] = useState(submission.feedback || "");

  const handleGradeChange = (questionId: string, isCorrect: boolean) => {
    setGradingResults((prev) =>
      prev.map((r) =>
        r.questionId === questionId
          ? { ...r, isCorrect, pendingGrading: false }
          : r
      )
    );
  };

  const calculateFinalScore = () => {
    return gradingResults.filter((r) => r.isCorrect).length;
  };

  const saveGrading = async () => {
    setLoading(true);
    try {
      const finalScore = calculateFinalScore();
      const res = await fetch("/api/exam/grade-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          score: finalScore,
          answers: JSON.stringify(gradingResults),
          feedback,
          isGraded: true,
        }),
      });

      if (res.ok) {
        alert("Đã lưu điểm thành công!");
        window.location.href = "/teacher/grading";
      } else {
        alert("Lỗi khi lưu điểm");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const getOptionText = (q: any, value: any) => {
    if (!value) return "(Trống)";
    if (q.type === "TN") return value;
    if (q.type === "TF") {
      try {
        const parsed = typeof q.data === "string" ? JSON.parse(q.data || "{}") : q.data;
        const subQuestions = parsed.subQuestions || [];
        return Object.entries(value).map(([idx, val]) => {
          const opt = subQuestions[parseInt(idx)];
          return `${opt?.text || (parseInt(idx) + 1)}: ${val ? "ĐÚNG" : "SAI"}`;
        }).join(", ");
      } catch {
        return JSON.stringify(value);
      }
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {gradingResults.map((res, idx) => (
        <Card
          key={res.questionId}
          className={`border-4 border-black shadow-neo overflow-hidden ${
            res.pendingGrading
              ? "bg-yellow-50"
              : res.isCorrect
              ? "bg-green-50"
              : "bg-red-50"
          }`}
        >
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <span className="h-8 w-8 rounded-full border-4 border-black bg-white flex items-center justify-center font-black">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-black uppercase italic text-lg leading-tight text-black">
                    {res.question?.content}
                  </p>
                  <span className="text-[10px] font-bold opacity-50 uppercase italic">
                    Loại: {res.type}
                  </span>
                </div>
              </div>
              {res.pendingGrading && (
                <span className="bg-yellow-400 border-2 border-black px-2 py-1 text-[10px] font-black uppercase italic">
                  CẦN CHẤM ĐIỂM
                </span>
              )}
            </div>

            <div className="pl-11 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border-2 border-black bg-white">
                  <p className="text-[10px] font-black opacity-50 uppercase mb-1">
                    Học sinh trả lời:
                  </p>
                  <p className="font-bold text-black text-sm">
                    {getOptionText(res.question || { type: res.type, data: res.question?.data }, res.userAnswer)}
                  </p>
                </div>
                <div className="p-3 border-2 border-black bg-accent/30">
                  <p className="text-[10px] font-black opacity-50 uppercase mb-1">
                    Đáp án đúng/Gợi ý:
                  </p>
                  <p className="font-bold text-black text-sm">
                    {res.type === "TF" ? getOptionText(res.question || { type: res.type, data: res.question?.data }, 
                      res.question?.data ? (typeof res.question.data === "string" ? JSON.parse(res.question.data) : res.question.data).subQuestions?.map((sq: any) => sq.answer === "true") : null) 
                      : (res.correctAnswer || "(Không có)")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={() => handleGradeChange(res.questionId, true)}
                  className={`h-10 px-4 border-2 border-black font-black uppercase italic flex items-center gap-2 ${
                    res.isCorrect && !res.pendingGrading
                      ? "bg-green-500 text-white"
                      : "bg-white text-black"
                  }`}
                >
                  <Check className="h-4 w-4" /> ĐÚNG
                </Button>
                <Button
                  onClick={() => handleGradeChange(res.questionId, false)}
                  className={`h-10 px-4 border-2 border-black font-black uppercase italic flex items-center gap-2 ${
                    !res.isCorrect && !res.pendingGrading
                      ? "bg-red-500 text-white"
                      : "bg-white text-black"
                  }`}
                >
                  <X className="h-4 w-4" /> SAI
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Card className="border-4 border-black shadow-neo bg-black text-white p-6 space-y-6">
        <div className="flex justify-between items-center border-b-2 border-white/20 pb-4">
          <h3 className="text-xl font-black uppercase italic">Tổng kết điểm</h3>
          <div className="text-4xl font-black italic tracking-tighter text-primary">
            {calculateFinalScore()} / {gradingResults.length}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-black uppercase italic">
            Nhận xét của giáo viên
          </Label>
          <textarea
            value={feedback}
            onInput={(e) =>
              setFeedback((e.target as HTMLTextAreaElement).value)}
            className="w-full min-h-[100px] border-2 border-white bg-white/10 p-3 font-bold text-sm focus:outline-none"
            placeholder="Nhập nhận xét cho học sinh..."
          />
        </div>

        <Button
          onClick={saveGrading}
          disabled={loading}
          className="w-full h-12 bg-primary text-black font-black uppercase italic border-2 border-white shadow-neo-sm hover:shadow-none transition-all"
        >
          <Save className="mr-2 h-5 w-5" />{" "}
          {loading ? "ĐANG LƯU..." : "HOÀN TẤT CHẤM ĐIỂM"}
        </Button>
      </Card>
    </div>
  );
}
