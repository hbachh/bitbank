import { FreshContext, PageProps } from "$fresh/server.ts";
import { Button } from "../../components/Button.tsx";
import { Card } from "../../components/Card.tsx";
import { BookOpen, History, School } from "lucide-preact";
import { getDb } from "../../lib/db.ts";
import { enrollments, submissions } from "../../db/schema.ts";
import { count, eq } from "npm:drizzle-orm@0.35.3";
import { State } from "../_middleware.ts";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) return ctx.next();

    const db = await getDb();
    const classResult = await db.select({ value: count() }).from(enrollments)
      .where(eq(enrollments.studentId, user.id));
    const submissionResult = await db.select({ value: count() }).from(
      submissions,
    ).where(eq(submissions.studentId, user.id));

    return ctx.render({
      stats: {
        classes: classResult[0]?.value || 0,
        submissions: submissionResult[0]?.value || 0,
      },
    });
  },
};

export default function StudentDashboard({ data, state }: PageProps) {
  const { stats } = data;
  const user = state?.user;

  return (
    <div className="space-y-5 md:space-y-7">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-black">
            Xin chào, {user?.name || "Học sinh"}!
          </h1>
          <p className="text-[9px] md:text-xs text-black font-bold uppercase tracking-tight opacity-70">
            Chọn một hoạt động để bắt đầu học tập.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Ôn tập thông minh */}
        <Card className="border-2 border-black shadow-neo hover:-translate-y-1 transition-transform bg-white">
          <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 md:p-2 bg-primary border-2 border-black">
                <BookOpen className="h-4 w-4 md:h-4 md:w-4 text-black" />
              </div>
              <h3 className="text-base md:text-lg font-black uppercase italic text-black">
                Ôn tập thông minh
              </h3>
            </div>
            <p className="text-[9px] md:text-xs font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Tự tạo bộ câu hỏi ngẫu nhiên dựa trên khối lớp của bạn
            </p>

            <a href="/student/exam" className="block w-full pt-1.5">
              <Button className="w-full h-9 md:h-10 text-xs md:text-sm font-black uppercase italic border-2 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all bg-white text-black">
                Bắt đầu làm bài
              </Button>
            </a>
          </div>
        </Card>

        {/* Lớp học */}
        <Card className="border-2 border-black shadow-neo hover:-translate-y-1 transition-transform bg-white">
          <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 md:p-2 bg-secondary border-2 border-black">
                <School className="h-4 w-4 md:h-5 md:w-5 text-black" />
              </div>
              <h3 className="text-base md:text-lg font-black uppercase italic text-black">
                Lớp học
              </h3>
            </div>
            <p className="text-[9px] md:text-xs font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Tham gia lớp học mới hoặc xem danh sách
            </p>

            <div className="flex gap-2 pt-1.5">
              <a href="/student/classes" className="w-full">
                <Button className="w-full h-9 md:h-10 px-3 text-[11px] md:text-xs font-black uppercase italic border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors">
                  VÀO LỚP HỌC
                </Button>
              </a>
            </div>
            <div className="text-[8px] md:text-[11px] font-black uppercase italic space-y-1">
              <p className="opacity-70 italic text-black">
                {stats.classes > 0
                  ? `Đã tham gia ${stats.classes} lớp học`
                  : "Chưa tham gia lớp học nào"}
              </p>
            </div>
          </div>
        </Card>

        {/* Lịch sử */}
        <Card className="border-2 border-black shadow-neo hover:-translate-y-1 transition-transform bg-white">
          <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 md:p-2 bg-accent border-2 border-black">
                <History className="h-4 w-4 md:h-5 md:w-5 text-black" />
              </div>
              <h3 className="text-base md:text-lg font-black uppercase italic text-black">
                Lịch sử làm bài
              </h3>
            </div>
            <p className="text-[9px] md:text-xs font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Xem lại kết quả và tiến độ
            </p>

            <div className="space-y-2.5 md:space-y-3 font-black uppercase italic text-[10px] md:text-xs pt-1.5">
              <p className="opacity-70 italic text-center py-1.5 md:py-3 text-black leading-tight">
                {stats.submissions > 0
                  ? `Bạn đã thực hiện ${stats.submissions} bài làm`
                  : "Chưa có lịch sử làm bài"}
              </p>
              <a href="/student/exam" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full h-9 border-2 border-black font-black uppercase italic hover:bg-black hover:text-white transition-colors text-black text-[10px] md:text-xs"
                >
                  XEM CHI TIẾT
                </Button>
              </a>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
