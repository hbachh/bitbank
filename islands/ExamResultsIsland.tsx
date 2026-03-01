import { useState } from "preact/hooks";

interface User {
  id: string;
  name: string;
  role: string;
  grade?: number;
}

interface Class {
  id: string;
  name: string;
  teacherId: string;
  schoolId: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  lessonId?: string;
  classId: string;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  grade?: number;
  hasSubmitted: boolean;
  submission?: any;
  score?: number;
  submittedAt?: string;
}

interface Question {
  id: string;
  assignmentId: string;
  question: string;
  type: "TN" | "TF" | "SA";
  options?: string[];
  correctAnswer?: string;
  order: number;
}

interface Answer {
  id: string;
  questionId: string;
  studentId: string;
  answer: string;
  isCorrect?: boolean;
  score?: number;
}

interface School {
  id: string;
  name: string;
}

interface ExamResultsIslandProps {
  user: User;
  classData: Class;
  assignment: Assignment;
  students: Student[];
  questions: Question[];
  answers: Answer[];
  school: School;
}

export default function ExamResultsIsland({
  user,
  classData,
  assignment,
  students,
  questions,
  answers,
  school,
}: ExamResultsIslandProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Group answers by student
  const answersByStudent = new Map<string, Answer[]>();
  answers.forEach(answer => {
    if (!answersByStudent.has(answer.studentId)) {
      answersByStudent.set(answer.studentId, []);
    }
    answersByStudent.get(answer.studentId)!.push(answer);
  });

  const completedCount = students.filter(s => s.hasSubmitted).length;
  const notCompletedCount = students.filter(s => !s.hasSubmitted).length;

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/exam/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classData.id,
          examId: assignment.id,
          schoolName: school.name,
          topicName: assignment.title,
          students: students.filter(s => s.hasSubmitted),
          questions,
          answers: answersByStudent,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ket-qua-bai-thi-${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Không thể kết nối với máy chủ. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black">
                Kết quả bài thi
              </h1>
              <p className="text-sm md:text-base text-black font-bold uppercase tracking-tight opacity-70">
                {assignment.title}
              </p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Lớp: {classData.name}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.history.back()}
                className="h-10 px-4 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="h-10 px-4 border-2 border-black font-black uppercase italic text-xs bg-black text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {isExporting ? "Đang xuất..." : "Xuất PDF"}
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border-2 border-black p-4 bg-white shadow-neo">
              <div className="text-3xl font-black text-green-600">{completedCount}</div>
              <div className="text-sm font-bold uppercase">Đã nộp bài</div>
            </div>
            <div className="border-2 border-black p-4 bg-white shadow-neo">
              <div className="text-3xl font-black text-red-600">{notCompletedCount}</div>
              <div className="text-sm font-bold uppercase">Chưa nộp bài</div>
            </div>
            <div className="border-2 border-black p-4 bg-white shadow-neo">
              <div className="text-3xl font-black text-blue-600">{students.length}</div>
              <div className="text-sm font-bold uppercase">Tổng học sinh</div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="border-2 border-black bg-white shadow-neo">
          <div className="p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase italic">Danh sách học sinh</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {students.map((student) => (
              <div key={student.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-black">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.email}</div>
                    {student.grade && (
                      <div className="text-xs text-gray-500">Lớp {student.grade}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {student.hasSubmitted ? (
                      <>
                        <span className="px-3 py-1 bg-green-100 text-green-800 border-2 border-green-300 font-bold uppercase text-xs">
                          Đã nộp
                        </span>
                        {student.hasSubmitted && (
                          <span className="font-bold text-lg text-black">
                            {student.submission?.isGraded 
                              ? `${student.score}/${questions.length}`
                              : `?/${questions.length}`}
                          </span>
                        )}
                        {student.submittedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(student.submittedAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 border-2 border-red-300 font-bold uppercase text-xs">
                        Chưa nộp
                      </span>
                    )}
                  </div>
                </div>

                {/* Show answers if submitted */}
                {student.hasSubmitted && (
                  <div className="mt-4 space-y-3">
                    {questions.map((question, index) => {
                      const studentAnswers = answersByStudent.get(student.id) || [];
                      const answer = studentAnswers.find(a => a.questionId === question.id);

                      return (
                        <div key={question.id} className="border border-gray-300 p-3 bg-gray-50">
                          <div className="font-bold text-sm mb-2">
                            Câu {index + 1}: {question.question}
                          </div>
                          {answer ? (
                            <div className="text-sm">
                              <span className="font-semibold">Đáp án:</span> {answer.answer}
                              {answer.isCorrect !== undefined && (
                                <span className={`ml-2 px-2 py-1 text-xs font-bold uppercase ${
                                  answer.isCorrect
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {answer.isCorrect ? 'Đúng' : 'Sai'}
                                </span>
                              )}
                              {answer.score !== undefined && (
                                <span className="ml-2 font-bold text-blue-600">
                                  +{answer.score}đ
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              Chưa trả lời
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
