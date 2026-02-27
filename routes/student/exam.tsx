import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import {
  assignments,
  classes,
  enrollments,
  submissions,
} from "../../db/schema.ts";
import { and, eq, inArray, or } from "npm:drizzle-orm@0.35.3";
import { Button } from "../../components/Button.tsx";
import { Card } from "../../components/Card.tsx";
import { BookOpen, CheckCircle, Clock, Play, Plus } from "lucide-preact";
import { State } from "../_middleware.ts";
import { cn } from "../../lib/utils.ts";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) return ctx.next();

    const db = await getDb();

    // 1. Get assignments from enrolled classes
    const enrolled = await db.select().from(enrollments).where(
      eq(enrollments.studentId, user.id),
    );
    const classIds = enrolled.map((e) => e.classId);

    let classAssignments: any[] = [];
    if (classIds.length > 0) {
      const assignmentsData = await db.select().from(assignments).where(
        inArray(assignments.classId, classIds),
      );
      const classesData = await db.select().from(classes).where(
        inArray(classes.id, classIds),
      );
      const classMap = new Map(classesData.map((c) => [c.id, c.name]));

      classAssignments = assignmentsData.map((a) => ({
        ...a,
        className: classMap.get(a.classId || "") || "Lớp học",
        isSelfStudy: false,
      }));
    }

    // 2. Get self-study assignments (created by student for themselves)
    const selfAssignmentsData = await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.teacherId, user.id),
          eq(assignments.type, "practice"),
        ),
      );

    const selfAssignments = selfAssignmentsData.map((a) => ({
      ...a,
      className: "TỰ HỌC",
      isSelfStudy: true,
    }));

    // 3. Get submission status and attempt counts
    const allAssignmentIds = [...classAssignments, ...selfAssignments].map(
      (a) => a.id,
    );
    let submissionsByAssignment = new Map<string, any[]>();
    if (allAssignmentIds.length > 0) {
      const userSubmissions = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.studentId, user.id),
            inArray(submissions.assignmentId, allAssignmentIds),
          ),
        );

      userSubmissions.forEach((s) => {
        const existing = submissionsByAssignment.get(s.assignmentId!) || [];
        submissionsByAssignment.set(s.assignmentId!, [...existing, s]);
      });
    }

    const assignmentsWithStatus = [...classAssignments, ...selfAssignments].map(
      (a) => {
        const assignmentSubmissions = submissionsByAssignment.get(a.id) || [];
        
        // Sort by score descending to get highest score
        const sortedByScore = [...assignmentSubmissions].sort((x, y) => y.score! - x.score!);
        const highestSubmission = sortedByScore[0] || null;

        // Sort by time descending to get latest for status
        const sortedByTime = [...assignmentSubmissions].sort((x, y) =>
          y.submittedAt!.getTime() - x.submittedAt!.getTime()
        );
        const latestSubmission = sortedByTime[0] || null;

        return {
          ...a,
          status: latestSubmission ? "COMPLETED" : "PENDING",
          submission: highestSubmission, // Use highest score submission
          attemptsCount: assignmentSubmissions.length,
          canAttempt: assignmentSubmissions.length < (a.maxAttempts || 1),
        };
      },
    );

    return ctx.render({ assignments: assignmentsWithStatus });
  },
};

export default function StudentExamPage({ data }: PageProps) {
  const { assignments: assignmentList } = data;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black">
            Danh sách bài tập
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
            Quản lý bài tập và luyện tập của bạn
          </p>
        </div>
        <a href="/student/exam/practice">
          <Button className="h-10 md:h-12 px-4 md:px-6 text-xs md:text-sm font-black uppercase italic border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all bg-primary text-black">
            <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />{" "}
            TẠO BÀI LUYỆN TẬP MỚI
          </Button>
        </a>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {assignmentList.length === 0
          ? (
            <Card className="col-span-full border-4 border-dashed border-black bg-accent/10 py-8 md:py-12 text-center">
              <div className="space-y-3 md:space-y-4">
                <BookOpen className="h-8 w-8 md:h-12 md:w-12 mx-auto opacity-30 text-black" />
                <p className="font-black uppercase italic text-lg md:text-xl opacity-50 text-black">
                  Chưa có bài tập nào được giao
                </p>
                <p className="text-[10px] md:text-sm font-bold uppercase tracking-tight opacity-70 text-black">
                  Hãy tham gia lớp học để nhận bài tập từ giáo viên
                </p>
              </div>
            </Card>
          )
          : (
            assignmentList.map((assignment: any) => (
              <Card
                key={assignment.id}
                className="border-4 border-black shadow-neo hover:-translate-y-1 transition-transform group bg-white"
              >
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors text-black">
                          {assignment.title}
                        </h3>
                        {assignment.status === "COMPLETED" && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-[8px] md:text-[10px] font-black uppercase italic px-1.5 py-0.5 border-2 border-black inline-block",
                          assignment.isSelfStudy
                            ? "bg-primary"
                            : "bg-secondary",
                        )}
                      >
                        {assignment.className}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase italic opacity-70 text-black">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        {assignment.isSelfStudy
                          ? "TỰ LUYỆN TẬP"
                          : `HẠN NỘP: ${
                            assignment.endTime
                              ? new Date(assignment.endTime)
                                .toLocaleDateString()
                              : "KHÔNG GIỚI HẠN"
                          }`}
                      </div>
                      <div className="text-[10px] md:text-xs font-black uppercase italic text-black opacity-70">
                        Số lần làm bài: {assignment.attemptsCount} /{" "}
                        {assignment.maxAttempts || 1}
                      </div>
                    </div>

                    {assignment.status === "COMPLETED"
                      ? (
                        <div className="space-y-2">
                          <div className="p-2 bg-black text-white text-center font-black uppercase italic text-[10px] border-2 border-black">
                            ĐÃ HOÀN THÀNH - {assignment.submission?.score} ĐIỂM
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={(assignment.isSelfStudy
                                ? `/exam/practice/${assignment.id}`
                                : `/class/${assignment.classId}/e/${assignment.id}`) + "?review=true"}
                              className="block"
                            >
                              <Button className="w-full h-10 text-[10px] font-black uppercase italic border-2 border-black shadow-neo-sm hover:shadow-none transition-all bg-white text-black">
                                XEM LẠI
                              </Button>
                            </a>
                            {assignment.canAttempt && (
                              <a
                                href={assignment.isSelfStudy
                                  ? `/exam/practice/${assignment.id}`
                                  : `/class/${assignment.classId}/e/${assignment.id}`}
                                className="block"
                              >
                                <Button className="w-full h-10 text-[10px] font-black uppercase italic border-2 border-black shadow-neo-sm hover:shadow-none transition-all bg-black text-white">
                                  LÀM LẠI
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                      : (
                        <a
                          href={assignment.isSelfStudy
                            ? `/exam/practice/${assignment.id}`
                            : `/class/${assignment.classId}/e/${assignment.id}`}
                          className="block"
                        >
                          <Button className="w-full h-10 md:h-12 text-xs md:text-sm font-black uppercase italic border-2 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] transition-all bg-black text-white">
                            <Play className="mr-2 h-3 w-3 md:h-4 md:w-4" />{" "}
                            LÀM BÀI NGAY
                          </Button>
                        </a>
                      )}
                  </div>
                </div>
              </Card>
            ))
          )}
      </div>

      {/* Section for practice */}
      <div className="pt-6 md:pt-8 border-t-4 border-black">
        <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic mb-4 md:mb-6 text-black">
          Tự luyện tập thông minh
        </h2>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-4 border-black shadow-neo bg-white hover:-translate-y-1 transition-transform p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 md:p-2 bg-primary border-2 border-black">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-black" />
              </div>
              <h3 className="text-lg md:text-xl font-black uppercase italic text-black">
                Ôn tập theo chủ đề
              </h3>
            </div>
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Tự tạo bộ câu hỏi ngẫu nhiên từ ngân hàng đề thi
            </p>
            <a href="/exam/exercise" className="block pt-1 md:pt-2">
              <Button
                variant="outline"
                className="w-full h-10 border-2 border-black font-black uppercase italic hover:bg-black hover:text-white transition-colors text-xs md:text-sm text-black"
              >
                BẮT ĐẦU ÔN TẬP
              </Button>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
