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
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic text-black">
            Xin chào, {user?.name || "Học sinh"}!
          </h1>
          <p className="text-[8px] md:text-[10px] text-black font-bold uppercase tracking-tight opacity-70">
            Chọn một hoạt động để bắt đầu học tập.
          </p>
        </div>
      </div>

      <div className="grid gap-2.5 md:gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Ôn tập thông minh */}
        <Card className="border-2 border-black shadow-neo-sm hover:-translate-y-0.5 transition-transform bg-white p-0">
          <div className="p-2.5 md:p-3.5 space-y-2 md:space-y-2.5">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1 md:p-1.5 bg-primary border-2 border-black">
                <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 text-black" />
              </div>
              <h3 className="text-sm md:text-base font-black uppercase italic text-black">
                Ôn tập thông minh
              </h3>
            </div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Tự tạo bộ câu hỏi ngẫu nhiên dựa trên khối lớp của bạn
            </p>

            <a href="/student/exam" className="block w-full pt-1">
              <Button size="sm" className="w-full font-black uppercase italic border-2 border-black shadow-neo-sm hover:shadow-none transition-all bg-white text-black">
                Bắt đầu làm bài
              </Button>
            </a>
          </div>
        </Card>

        {/* Lớp học */}
        <Card className="border-2 border-black shadow-neo-sm hover:-translate-y-0.5 transition-transform bg-white p-0">
          <div className="p-2.5 md:p-3.5 space-y-2 md:space-y-2.5">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1 md:p-1.5 bg-secondary border-2 border-black">
                <School className="h-3.5 w-3.5 md:h-4 md:w-4 text-black" />
              </div>
              <h3 className="text-sm md:text-base font-black uppercase italic text-black">
                Lớp học
              </h3>
            </div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Tham gia lớp học mới hoặc xem danh sách
            </p>

            <div className="flex gap-2 pt-1">
              <a href="/student/classes" className="w-full">
                <Button size="sm" className="w-full font-black uppercase italic border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors">
                  VÀO LỚP HỌC
                </Button>
              </a>
            </div>
            <div className="text-[8px] md:text-[9px] font-black uppercase italic">
              <p className="opacity-70 italic text-black">
                {stats.classes > 0
                  ? `Đã tham gia ${stats.classes} lớp học`
                  : "Chưa tham gia lớp học nào"}
              </p>
            </div>
          </div>
        </Card>

        {/* Lịch sử */}
        <Card className="border-2 border-black shadow-neo-sm hover:-translate-y-0.5 transition-transform bg-white p-0">
          <div className="p-2.5 md:p-3.5 space-y-2 md:space-y-2.5">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1 md:p-1.5 bg-accent border-2 border-black">
                <History className="h-3.5 w-3.5 md:h-4 md:w-4 text-black" />
              </div>
              <h3 className="text-sm md:text-base font-black uppercase italic text-black">
                Lịch sử làm bài
              </h3>
            </div>
            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Xem lại kết quả và tiến độ
            </p>

            <div className="space-y-2 md:space-y-2.5 font-black uppercase italic text-[9px] md:text-xs pt-1">
              <p className="opacity-70 italic text-center py-1 md:py-2 text-black leading-tight">
                {stats.submissions > 0
                  ? `Bạn đã thực hiện ${stats.submissions} bài làm`
                  : "Chưa có lịch sử làm bài"}
              </p>
              <a href="/student/exam" className="block w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-2 border-black font-black uppercase italic hover:bg-black hover:text-white transition-colors text-black"
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
