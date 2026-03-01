import { FreshContext, PageProps } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { getDb } from "../../../lib/db.ts";
import {
  assignments,
  classes,
  submissions,
  users,
} from "../../../db/schema.ts";
import { and, desc, eq, inArray } from "npm:drizzle-orm@0.35.3";
import { Button } from "../../../components/Button.tsx";
import { Card } from "../../../components/Card.tsx";
import { BookOpen, ClipboardCheck, User } from "lucide-preact";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user || user.role !== "teacher") return ctx.next();

    const db = await getDb();

    // Get all assignments by this teacher (excluding self-study/practice)
    const teacherAssignments = await db.select().from(assignments).where(
      and(
        eq(assignments.teacherId, user.id),
        eq(assignments.type, "exam") // Only show real exams/assignments to teachers
      )
    );
    const assignmentIds = teacherAssignments.map((a) => a.id);

    if (assignmentIds.length === 0) return ctx.render({ submissions: [] });

    // Get submissions for these assignments
    const allSubmissions = await db
      .select({
        id: submissions.id,
        score: submissions.score,
        submittedAt: submissions.submittedAt,
        isGraded: submissions.isGraded,
        studentName: users.name,
        assignmentTitle: assignments.title,
        assignmentId: assignments.id,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(inArray(submissions.assignmentId, assignmentIds))
      .orderBy(desc(submissions.submittedAt));

    return ctx.render({ submissions: allSubmissions });
  },
};

export default function TeacherGradingPage({ data }: PageProps) {
  const { submissions: submissionList } = data;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase italic text-black">
          Chấm điểm bài làm
        </h1>
        <p className="text-sm font-bold uppercase tracking-tight opacity-70 text-black">
          Quản lý và chấm điểm các bài tự luận của học sinh
        </p>
      </div>

      <Card className="border-4 border-black shadow-neo bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black text-white font-black uppercase italic text-xs md:text-sm">
              <tr>
                <th className="p-4 border-r-2 border-white/20">Học sinh</th>
                <th className="p-4 border-r-2 border-white/20">Bài tập</th>
                <th className="p-4 border-r-2 border-white/20">Ngày nộp</th>
                <th className="p-4 border-r-2 border-white/20">Trạng thái</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="font-bold uppercase italic text-[10px] md:text-sm divide-y-4 divide-black bg-white text-black">
              {submissionList.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center opacity-50">
                      Chưa có bài nộp nào
                    </td>
                  </tr>
                )
                : (
                  submissionList.map((s: any) => (
                    <tr key={s.id} className="hover:bg-accent/10">
                      <td className="p-4 border-r-4 border-black">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{s.studentName}</span>
                        </div>
                      </td>
                      <td className="p-4 border-r-4 border-black">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{s.assignmentTitle}</span>
                        </div>
                      </td>
                      <td className="p-4 border-r-4 border-black">
                        {new Date(s.submittedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="p-4 border-r-4 border-black">
                        {s.isGraded
                          ? (
                            <span className="bg-green-500 text-white px-2 py-1 border-2 border-black text-[10px]">
                              ĐÃ CHẤM ({s.score})
                            </span>
                          )
                          : (
                            <span className="bg-yellow-400 text-black px-2 py-1 border-2 border-black text-[10px]">
                              CHỜ CHẤM
                            </span>
                          )}
                      </td>
                      <td className="p-4">
                        <a href={`/teacher/grading/${s.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-2 border-black bg-primary text-black font-black uppercase italic"
                          >
                            <ClipboardCheck className="h-4 w-4 mr-1" /> CHI TIẾT
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
