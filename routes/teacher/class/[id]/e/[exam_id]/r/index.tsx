import { PageProps } from "$fresh/server.ts";

export default async function ExamResultsPage({ params, state }: PageProps) {
  const { id: classId, exam_id: examId } = params;
  const user = state?.user;

  if (!user || user.role !== "teacher") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl font-black uppercase italic">
          Chỉ giáo viên mới có thể xem kết quả bài thi
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kết quả bài thi</h1>
      <p>Class ID: {classId}</p>
      <p>Exam ID: {examId}</p>
      <p>User: {user.name}</p>
    </div>
  );
}
