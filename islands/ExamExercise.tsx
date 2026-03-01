import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  HelpCircle,
  Loader2,
  Trophy,
} from "lucide-preact";
import { cn } from "../lib/utils.ts";

interface Question {
  id: string;
  content: string;
  type: string;
  data: string;
}

interface ExamResult {
  score: number;
  total: number;
  hasSA?: boolean;
  message?: string;
  results: {
    questionId: string;
    type: string;
    userAnswer: any;
    isCorrect: boolean;
    pendingGrading?: boolean;
    correctAnswer: string;
    explanation: string;
  }[];
}

interface ExamExerciseProps {
  user: any;
  assignmentId?: string;
  initialQuestions?: Question[];
  isReview?: boolean;
  reviewResult?: ExamResult;
  duration?: number; // in minutes
}

export default function ExamExercise(
  {
    user,
    assignmentId,
    initialQuestions,
    isReview,
    reviewResult,
    duration = 15,
  }: ExamExerciseProps,
) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions || [],
  );
  const [currentQ, setCurrentQ] = useState(0);

  // Reconstruct answers from reviewResult if available
  const initialAnswers: Record<string, any> = {};
  if (isReview && reviewResult) {
    reviewResult.results.forEach((r) => {
      initialAnswers[r.questionId] = r.userAnswer;
    });
  }

  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [submitted, setSubmitted] = useState(isReview || false);
  const [examResult, setExamResult] = useState<ExamResult | null>(
    reviewResult || null,
  );

  // Timer state
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (questions.length > 0 && !submitted && !isReview) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions.length, submitted, isReview]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startExam = async () => {
    setLoading(true);
    try {
      const grade = user?.grade || 12;
      const res = await fetch("/api/exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: grade, total: 5 }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data: Question[];
        error?: string;
      };
      if (data.success) {
        setQuestions(data.data);
      } else {
        alert("Failed to load exam: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error loading exam");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (value: any) => {
    if (isReview) return;
    setAnswers({ ...answers, [questions[currentQ].id]: value });
  };

  const next = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const prev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const submitExam = async () => {
    if (!assignmentId) return;
    setLoading(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, assignmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Lỗi khi nộp bài");
        return;
      }
      setExamResult(data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting exam:", error);
      alert("Có lỗi xảy ra khi nộp bài");
    } finally {
      setLoading(false);
    }
  };

  const getOptionText = (q: Question, value: any) => {
    if (!value) return "Trống";
    if (q.type === "TN") {
      try {
        const parsed = JSON.parse(q.data || "{}");
        const options = Array.isArray(parsed) ? parsed : (parsed.options || []);
        const idx = value.charCodeAt(0) - 65; // A=0, B=1...
        return options[idx] || value;
      } catch {
        return value;
      }
    }
    if (q.type === "TF") {
      try {
        const parsed = JSON.parse(q.data || "{}");
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

  if (loading && !questions.length) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
          <p className="font-black uppercase italic animate-pulse text-xl">
            Đang tải dữ liệu bài thi...
          </p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-4 border-black shadow-neo bg-white p-8 text-center space-y-6">
          <div className="bg-primary p-4 border-2 border-black inline-block shadow-neo-sm">
            <HelpCircle className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
            SẴN SÀNG CHINH PHỤC BÀI THI?
          </h1>
          <p className="text-lg font-bold uppercase tracking-tight opacity-70 leading-relaxed">
            Hệ thống sẽ tạo 5 câu hỏi ngẫu nhiên từ ngân hàng đề thi dựa trên
            trình độ của bạn.
          </p>
          <Button
            onClick={startExam}
            className="w-full h-14 text-xl font-black uppercase italic border-4 border-black shadow-neo hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all"
          >
            BẮT ĐẦU NGAY
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted && examResult) {
    const isFullyGraded = !examResult.results.some(r => r.pendingGrading);
    const scoreDisplay = isFullyGraded ? `${examResult.score} / ${examResult.total}` : `? / ${examResult.total}`;

    return (
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-4 border-black shadow-neo bg-black text-white p-6 text-center space-y-4">
            <div className="flex justify-center items-center gap-6">
              <div className="bg-primary text-black p-3 border-2 border-black shadow-neo-sm rotate-3">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                  {scoreDisplay}
                </h2>
                <p className="text-sm font-black uppercase italic text-primary mt-1">
                  KẾT QUẢ BÀI LÀM
                </p>
              </div>
            </div>
            {examResult.hasSA && (
              <p className="text-[10px] font-bold uppercase italic bg-yellow-400 text-black p-1.5 border-2 border-white">
                {examResult.message}
              </p>
            )}
          </Card>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const res = examResult.results.find((r) => r.questionId === q.id);
              const isCorrect = res?.isCorrect;
              const isPending = res?.pendingGrading;

              return (
                <Card
                  key={q.id}
                  id={`q-${idx}`}
                  className={`border-2 border-black shadow-neo-sm overflow-hidden ${
                    isPending
                      ? "bg-yellow-50"
                      : isCorrect
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="p-4 space-y-3 text-black">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-2">
                        <span className="h-6 w-6 shrink-0 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                        <p className="font-black uppercase italic text-sm leading-tight pt-0.5">
                          {q.content}
                        </p>
                      </div>
                      {isPending
                        ? (
                          <span className="bg-yellow-400 border border-black px-1.5 py-0.5 text-[8px] font-black uppercase italic whitespace-nowrap">
                            ĐANG CHỜ CHẤM
                          </span>
                        )
                        : isCorrect
                        ? (
                          <span className="bg-primary border border-black px-1.5 py-0.5 text-[8px] font-black uppercase italic whitespace-nowrap">
                            CHÍNH XÁC
                          </span>
                        )
                        : (
                          <span className="bg-red-500 text-white border border-black px-1.5 py-0.5 text-[8px] font-black uppercase italic whitespace-nowrap">
                            CHƯA ĐÚNG
                          </span>
                        )}
                    </div>

                    <div className="pl-8 space-y-2">
                      <div className="p-2 border-2 border-black bg-white/50 text-xs">
                        <p className="text-[8px] font-black opacity-50 uppercase mb-1 tracking-wider">
                          Câu trả lời của bạn:
                        </p>
                        <p className="font-bold uppercase italic">
                          {getOptionText(q, res?.userAnswer)}
                        </p>
                      </div>

                      {!isPending && (
                        <div className="p-2 border-2 border-black bg-white text-xs">
                          <p className="text-[8px] font-black opacity-50 uppercase mb-1 tracking-wider">
                            Đáp án đúng:
                          </p>
                          <p className="font-bold uppercase italic">
                            {getOptionText(q, res?.correctAnswer)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Review Sidebar */}
        <div className="lg:col-span-4 space-y-4 sticky top-4 h-fit">
          <Card className="border-4 border-black shadow-neo bg-white p-4">
            <h3 className="font-black uppercase italic text-sm mb-4 border-b-2 border-black pb-2">
              Danh sách câu hỏi
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const res = examResult.results.find((r) =>
                  r.questionId === q.id
                );
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      document.getElementById(`q-${idx}`)?.scrollIntoView({
                        behavior: "smooth",
                      })}
                    className={cn(
                      "h-8 w-8 border-2 border-black font-black text-xs flex items-center justify-center transition-all shadow-neo-sm hover:shadow-none",
                      res?.pendingGrading
                        ? "bg-yellow-400"
                        : res?.isCorrect
                        ? "bg-primary"
                        : "bg-red-500 text-white",
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 space-y-2">
              <Button
                onClick={() => window.location.href = "/student/exam"}
                className="w-full h-10 text-xs font-black uppercase italic border-2 border-black bg-secondary shadow-neo-sm hover:shadow-none"
              >
                QUAY LẠI DANH SÁCH
              </Button>
            </div>
          </Card>
        </div>

      </div>
    );
  }

  const q = questions[currentQ];
  let options: any[] = [];
  try {
    const parsed = JSON.parse(q.data || "[]");
    if (q.type === "TN") {
      options = Array.isArray(parsed) ? parsed : (parsed.options || []);
    } else if (q.type === "TF") {
      options = parsed.subQuestions || [];
    }
  } catch (_e) {
    options = [];
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Main Exam Area */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex justify-between items-center bg-white border-4 border-black p-3 shadow-neo-sm">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">
            CÂU {currentQ + 1} / {questions.length}
          </h2>
          <div className="flex items-center gap-2 font-black uppercase italic text-red-600 bg-red-50 px-3 py-1 border-2 border-black">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <Card className="border-4 border-black shadow-neo bg-white p-6 space-y-6">
          <div className="space-y-3">
            <div className="bg-accent px-3 py-0.5 border-2 border-black inline-block text-[10px] font-black uppercase italic">
              LOẠI: {q.type === "TN"
                ? "TRẮC NGHIỆM"
                : q.type === "TF"
                ? "ĐÚNG/SAI"
                : "TRẢ LỜI NGẮN"}
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase italic leading-tight tracking-tight">
              {q.content}
            </h3>
          </div>

          <div className="space-y-3">
            {q.type === "TN" && options.map((opt, idx) => {
              const char = String.fromCharCode(65 + idx);
              return (                <div
                  key={idx}
                  className={cn(
                    "p-4 border-2 border-black font-black uppercase italic text-sm transition-all shadow-neo-sm cursor-pointer flex items-center gap-4",
                    answers[q.id] === char
                      ? "bg-primary translate-x-0.5 translate-y-0.5 shadow-none"
                      : "bg-white hover:bg-accent/20 hover:translate-x-0.5 hover:translate-y-0.5",
                  )}
                  onClick={() => handleSelect(char)}
                >
                  <span className="h-8 w-8 shrink-0 bg-black text-white flex items-center justify-center border-2 border-black">
                    {char}
                  </span>
                  <span className="flex-1">{opt}</span>
                </div>
              );
            })}

            {q.type === "TF" &&
              options.map((opt: any, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 border-black bg-accent/5 gap-4"
                >
                  <span className="font-black uppercase italic text-sm">
                    {opt.text}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant={answers[q.id]?.[idx] === true
                        ? "default"
                        : "outline"}
                      className={cn(
                        "w-20 h-9 border-2 border-black font-black uppercase italic text-[10px]",
                        answers[q.id]?.[idx] === true && "bg-green-500",
                      )}
                      onClick={() => {
                        if (isReview) return;
                        const current = answers[q.id] || {};
                        handleSelect({ ...current, [idx]: true });
                      }}
                    >
                      ĐÚNG
                    </Button>
                    <Button
                      variant={answers[q.id]?.[idx] === false
                        ? "default"
                        : "outline"}
                      className={cn(
                        "w-20 h-9 border-2 border-black font-black uppercase italic text-[10px]",
                        answers[q.id]?.[idx] === false && "bg-red-500 text-white",
                      )}
                      onClick={() => {
                        if (isReview) return;
                        const current = answers[q.id] || {};
                        handleSelect({ ...current, [idx]: false });
                      }}
                    >
                      SAI
                    </Button>
                  </div>
                </div>
              ))}

            {q.type === "SA" && (
              <textarea
                className="w-full p-4 border-2 border-black font-black uppercase italic text-sm bg-accent/5 focus:outline-none placeholder:opacity-30 min-h-[120px]"
                placeholder="NHẬP CÂU TRẢ LỜI CỦA BẠN TẠI ĐÂY..."
                value={answers[q.id] || ""}
                readOnly={isReview}
                onInput={(e) =>
                  handleSelect((e.target as HTMLTextAreaElement).value)}
              />
            )}
          </div>

          <div className="flex justify-between gap-3 pt-6 border-t-2 border-black border-dashed mt-4">
            <Button
              onClick={prev}
              disabled={currentQ === 0}
              className="flex-1 h-10 border-2 border-black font-black uppercase italic bg-white shadow-neo-sm disabled:opacity-30 text-xs"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> CÂU TRƯỚC
            </Button>

            {currentQ === questions.length - 1
              ? (
                !isReview && (
                  <Button
                    onClick={submitExam}
                    disabled={loading}
                    className="flex-[2] h-10 border-2 border-black font-black uppercase italic bg-primary shadow-neo-sm hover:shadow-none transition-all text-xs"
                  >
                    {loading ? "ĐANG NỘP..." : "NỘP BÀI NGAY"}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                )
              )
              : (
                <Button
                  onClick={next}
                  className="flex-[2] h-10 border-2 border-black font-black uppercase italic bg-black text-white shadow-neo-sm hover:shadow-none transition-all text-xs"
                >
                  TIẾP THEO <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
          </div>
        </Card>
      </div>

      {/* Right Navigation Sidebar */}
      <div className="lg:col-span-4 space-y-4 sticky top-4 h-fit">
        <Card className="border-4 border-black shadow-neo bg-white p-4">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <h3 className="font-black uppercase italic text-sm">Điều hướng</h3>
            <span className="text-[10px] font-black opacity-50 uppercase">
              {Object.keys(answers).length} / {questions.length} ĐÃ XONG
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const qId = q.id;
              const isAnswered = answers[qId] !== undefined &&
                answers[qId] !== "";
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQ(idx)}
                  className={cn(
                    "h-10 w-full border-2 border-black font-black text-xs flex flex-col items-center justify-center transition-all shadow-neo-sm hover:shadow-none",
                    currentQ === idx
                      ? "bg-black text-white -translate-y-0.5"
                      : isAnswered
                      ? "bg-primary"
                      : "bg-white",
                  )}
                >
                  <span className="text-[10px]">{idx + 1}</span>
                  {isAnswered && (
                    <span className="text-[8px] leading-none opacity-80 truncate w-full px-1 text-center">
                      {q.type === "TN"
                        ? answers[qId]
                        : q.type === "TF"
                        ? "V"
                        : "..."}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-6 p-3 bg-accent/10 border-2 border-black space-y-2">
            <p className="text-[9px] font-black uppercase italic tracking-wider opacity-60">
              Trạng thái bài làm
            </p>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase italic">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 bg-primary border border-black" />
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 bg-white border border-black" />
                <span>Chưa làm</span>
              </div>
            </div>
          </div>
          {!isReview && (
            <div className="mt-4">
              <Button
                onClick={submitExam}
                disabled={loading || Object.keys(answers).length === 0}
                className="w-full h-10 border-2 border-black font-black uppercase italic bg-primary shadow-neo-sm text-xs"
              >
                NỘP BÀI TẬP
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
