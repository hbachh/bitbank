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
  answer: string;
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
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);

  // Helper to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Effect to process initial questions (shuffle them and their options)
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      const processed = initialQuestions.map(q => {
        if (q.type === "TN") {
          try {
            const parsed = JSON.parse(q.data || "{}");
            const options = parsed.options || [];
            // We need to keep track of the correct answer letter (A, B, C, D)
            const correctLetter = q.answer || "A";
            const correctIdx = correctLetter.charCodeAt(0) - 65;
            
            // Create options with original index to track correctness after shuffle
            const optionsWithMeta = options.map((text: string, idx: number) => ({
              text,
              isCorrect: idx === correctIdx
            }));

            const shuffledMeta = shuffleArray(optionsWithMeta);
            const newCorrectIdx = shuffledMeta.findIndex(m => m.isCorrect);
            const newCorrectLetter = String.fromCharCode(65 + newCorrectIdx);

            return {
              ...q,
              data: JSON.stringify({ ...parsed, options: shuffledMeta.map(m => m.text) }),
              answer: newCorrectLetter // Update the expected answer for this shuffled instance
            };
          } catch (e) {
            return q;
          }
        }
        return q;
      });
      
      const shuffled = isReview ? processed : shuffleArray(processed);
      setShuffledQuestions(shuffled);
    }
  }, [initialQuestions, isReview]);

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
    if (shuffledQuestions.length > 0 && !submitted && !isReview) {
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
  }, [shuffledQuestions.length, submitted, isReview]);

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
        // Shuffling logic for generated exam
        const processed = data.data.map(q => {
          if (q.type === "TN") {
            try {
              const parsed = JSON.parse(q.data || "{}");
              const options = parsed.options || [];
              const correctLetter = q.answer || "A";
              const correctIdx = correctLetter.charCodeAt(0) - 65;
              const optionsWithMeta = options.map((text: string, idx: number) => ({
                text,
                isCorrect: idx === correctIdx
              }));
              const shuffledMeta = shuffleArray(optionsWithMeta);
              const newCorrectIdx = shuffledMeta.findIndex(m => m.isCorrect);
              return {
                ...q,
                data: JSON.stringify({ ...parsed, options: shuffledMeta.map(m => m.text) }),
                answer: String.fromCharCode(65 + newCorrectIdx)
              };
            } catch (e) { return q; }
          }
          return q;
        });
        const shuffled = shuffleArray(processed);
        setShuffledQuestions(shuffled);
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
    setAnswers({ ...answers, [shuffledQuestions[currentQ].id]: value });
  };

  const next = () => {
    if (currentQ < shuffledQuestions.length - 1) setCurrentQ(currentQ + 1);
  };

  const prev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const submitExam = async () => {
    if (!assignmentId) return;
    setLoading(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Use the updated answer mapping from processed questions
      const finalAnswers: Record<string, any> = {};
      shuffledQuestions.forEach(q => {
        finalAnswers[q.id] = answers[q.id];
      });

      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, assignmentId }),
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
        
        // If value is a string (comma-separated answers like "true,false,true,false")
        if (typeof value === "string") {
          const vals = value.split(",");
          return subQuestions.map((sq: any, i: number) => {
            const val = vals[i] === "true" || vals[i] === "Đúng";
            return `${i + 1}. ${sq.text}: ${val ? "Đúng" : "Sai"}`;
          }).join(" | ");
        }

        // If value is an object (user selection mapping index to boolean)
        if (typeof value === "object") {
          return subQuestions.map((sq: any, i: number) => {
            const val = value[i];
            const valStr = val === true ? "Đúng" : val === false ? "Sai" : "Chưa trả lời";
            return `${i + 1}. ${sq.text}: ${valStr}`;
          }).join(" | ");
        }
        
        return String(value);
      } catch {
        return String(value);
      }
    }
    return value;
  };

  if (loading && !shuffledQuestions.length) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
          <p className="font-black italic animate-pulse text-xl">
            Đang tải dữ liệu bài thi...
          </p>
        </div>
      </div>
    );
  }

  if (!shuffledQuestions || shuffledQuestions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-4 border-black shadow-neo bg-white p-8 text-center space-y-6">
          <div className="bg-primary p-4 border-2 border-black inline-block shadow-neo-sm">
            <HelpCircle className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter leading-none">
            Sẵn sàng chinh phục bài thi?
          </h1>
          <p className="text-lg font-bold tracking-tight opacity-70 leading-relaxed">
            Hệ thống sẽ tạo 5 câu hỏi ngẫu nhiên từ ngân hàng đề thi dựa trên
            trình độ của bạn.
          </p>
          <Button
            onClick={startExam}
            className="w-full h-14 text-xl font-black italic border-4 border-black shadow-neo hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all"
          >
            Bắt đầu ngay
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
                <h2 className="text-4xl font-black italic tracking-tighter leading-none">
                  {scoreDisplay}
                </h2>
                <p className="text-sm font-black italic text-primary mt-1">
                  Kết quả bài làm
                </p>
              </div>
            </div>
            {examResult.hasSA && (
              <p className="text-[10px] font-bold italic bg-yellow-400 text-black p-1.5 border-2 border-white">
                {examResult.message}
              </p>
            )}
          </Card>

          <div className="space-y-4">
            {shuffledQuestions.map((q, idx) => {
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
                        <p className="font-black italic text-sm leading-tight pt-0.5">
                          {q.content}
                        </p>
                      </div>
                      {isPending
                        ? (
                          <span className="bg-yellow-400 border border-black px-1.5 py-0.5 text-[8px] font-black italic whitespace-nowrap">
                            Đang chờ chấm
                          </span>
                        )
                        : isCorrect
                        ? (
                          <span className="bg-primary border border-black px-1.5 py-0.5 text-[8px] font-black italic whitespace-nowrap">
                            Chính xác
                          </span>
                        )
                        : (
                          <span className="bg-red-500 text-white border border-black px-1.5 py-0.5 text-[8px] font-black italic whitespace-nowrap">
                            Chưa đúng
                          </span>
                        )}
                    </div>

                    <div className="pl-8 space-y-2">
                      <div className="p-2 border-2 border-black bg-white/50 text-xs">
                        <p className="text-[8px] font-black opacity-50 mb-1 tracking-wider">
                          Câu trả lời của bạn:
                        </p>
                        <p className="font-bold italic">
                          {getOptionText(q, res?.userAnswer)}
                        </p>
                      </div>

                      {!isPending && (
                        <div className="p-2 border-2 border-black bg-white text-xs">
                          <p className="text-[8px] font-black opacity-50 mb-1 tracking-wider">
                            Đáp án đúng:
                          </p>
                          <p className="font-bold italic text-green-700">
                            {getOptionText(q, res?.correctAnswer || (q.type === "TF" ? JSON.parse(q.data).subQuestions.map((sq: any) => sq.answer).join(",") : q.answer))}
                          </p>
                        </div>
                      )}
                      
                      {res?.explanation && (
                        <div className="p-2 border-2 border-black bg-accent/10 text-[10px] font-bold italic">
                          💡 Giải thích: {res.explanation}
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
            <h3 className="font-black italic text-sm mb-4 border-b-2 border-black pb-2">
              Danh sách câu hỏi
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {shuffledQuestions.map((q, idx) => {
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
                className="w-full h-10 text-xs font-black italic border-2 border-black bg-secondary shadow-neo-sm hover:shadow-none"
              >
                Quay lại danh sách
              </Button>
            </div>
          </Card>
        </div>

      </div>
    );
  }

  const q = shuffledQuestions[currentQ];
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
          <h2 className="text-xl font-black italic tracking-tighter">
            Câu {currentQ + 1} / {shuffledQuestions.length}
          </h2>
          <div className="flex items-center gap-2 font-black italic text-red-600 bg-red-50 px-3 py-1 border-2 border-black">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <Card className="border-4 border-black shadow-neo bg-white p-6 space-y-6">
          <div className="space-y-3">
            <div className="bg-accent px-3 py-0.5 border-2 border-black inline-block text-[10px] font-black italic">
              Loại: {q.type === "TN"
                ? "Trắc nghiệm"
                : q.type === "TF"
                ? "Đúng/Sai"
                : "Trả lời ngắn"}
            </div>
            <h3 className="text-xl md:text-2xl font-black italic leading-tight tracking-tight">
              {q.content}
            </h3>
          </div>

          <div className="space-y-3">
            {q.type === "TN" && options.map((opt, idx) => {
              const char = String.fromCharCode(65 + idx);
              return (                <div
                  key={idx}
                  className={cn(
                    "p-4 border-2 border-black font-black italic text-sm transition-all shadow-neo-sm cursor-pointer flex items-center gap-4",
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
                  <span className="font-black italic text-sm">
                    {idx + 1}. {opt.text}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant={answers[q.id]?.[idx] === true
                        ? "default"
                        : "outline"}
                      className={cn(
                        "w-20 h-9 border-2 border-black font-black italic text-[10px]",
                        answers[q.id]?.[idx] === true && "bg-green-500",
                      )}
                      onClick={() => {
                        if (isReview) return;
                        const current = answers[q.id] || {};
                        handleSelect({ ...current, [idx]: true });
                      }}
                    >
                      Đúng
                    </Button>
                    <Button
                      variant={answers[q.id]?.[idx] === false
                        ? "default"
                        : "outline"}
                      className={cn(
                        "w-20 h-9 border-2 border-black font-black italic text-[10px]",
                        answers[q.id]?.[idx] === false && "bg-red-500 text-white",
                      )}
                      onClick={() => {
                        if (isReview) return;
                        const current = answers[q.id] || {};
                        handleSelect({ ...current, [idx]: false });
                      }}
                    >
                      Sai
                    </Button>
                  </div>
                </div>
              ))}

            {q.type === "SA" && (
              <textarea
                className="w-full p-4 border-2 border-black font-black italic text-sm bg-accent/5 focus:outline-none placeholder:opacity-30 min-h-[120px]"
                placeholder="Nhập câu trả lời của bạn tại đây..."
                value={answers[q.id] || ""}
                readOnly={isReview}
                onInput={(e) =>
                  handleSelect((e.target as HTMLTextAreaElement).value)}
              />
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={prev}
            disabled={currentQ === 0}
            variant="outline"
            className="h-12 px-6 border-4 border-black font-black italic shadow-neo-sm hover:shadow-none disabled:opacity-30"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Câu trước
          </Button>

          {currentQ === shuffledQuestions.length - 1
            ? (
              <Button
                onClick={submitExam}
                disabled={loading}
                className="h-12 px-8 border-4 border-black bg-primary font-black italic shadow-neo hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    Nộp bài <CheckCircle className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )
            : (
              <Button
                onClick={next}
                className="h-12 px-8 border-4 border-black bg-black text-white font-black italic shadow-neo hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all"
              >
                Câu tiếp <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
        </div>
      </div>

      {/* Navigation Sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border-4 border-black shadow-neo bg-white p-4">
          <h3 className="font-black italic text-sm mb-4 border-b-2 border-black pb-2">
            Bản đồ câu hỏi
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {shuffledQuestions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQ(idx)}
                className={cn(
                  "h-10 border-2 border-black font-black text-sm flex items-center justify-center transition-all",
                  currentQ === idx
                    ? "bg-black text-white shadow-none"
                    : answers[shuffledQuestions[idx].id]
                    ? "bg-primary shadow-neo-sm hover:shadow-none"
                    : "bg-white shadow-neo-sm hover:shadow-none",
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t-2 border-black space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-black bg-primary"></div>
              <span className="text-[10px] font-black italic">Đã trả lời</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-black bg-white"></div>
              <span className="text-[10px] font-black italic">Chưa trả lời</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
