import { FreshContext, PageProps } from "$fresh/server.ts";
import { Button } from "../../components/Button.tsx";
import { Card } from "../../components/Card.tsx";
import { BookPlus, FileCode, Users } from "lucide-preact";
import { getDb } from "../../lib/db.ts";
import { questions } from "../../db/schema.ts";
import { count, eq } from "npm:drizzle-orm@0.35.3";
import { State } from "../_middleware.ts";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) return ctx.next();

    const db = await getDb();
    const result = await db.select({ value: count() }).from(questions).where(
      eq(questions.createdBy, user.id),
    );

    return ctx.render({
      contributedCount: result[0]?.value || 0,
    });
  },
};

export default function TeacherDashboard({ data, state }: PageProps) {
  const { contributedCount } = data;
  const user = state?.user;

  return (
    <div className="space-y-5 md:space-y-7">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-black">
            Giáo viên Dashboard
          </h1>
          <p className="text-[9px] md:text-xs text-black font-bold uppercase tracking-tight opacity-70">
            Quản lý lớp học và ngân hàng câu hỏi.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quản lý lớp học */}
        <Card className="border-2 border-black shadow-neo hover:-translate-y-1 transition-transform bg-white">
          <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 md:p-2 bg-primary border-2 border-black">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-black" />
              </div>
              <h3 className="text-base md:text-lg font-black uppercase italic text-black">
                Quản lý lớp học
              </h3>
            </div>
            <p className="text-[9px] md:text-xs font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Tạo lớp và danh sách học viên
            </p>

            <div className="flex gap-2 pt-1.5">
              <a href="/teacher/classes" className="w-full">
                <Button className="w-full h-9 md:h-10 px-3 border-2 border-black font-black uppercase italic bg-black text-white hover:bg-white hover:text-black transition-colors text-[11px] md:text-xs">
                  VÀO QUẢN LÝ LỚP
                </Button>
              </a>
            </div>
            <div className="text-[8px] md:text-[11px] font-black uppercase italic space-y-1">
              <p className="opacity-70 italic text-black">
                Quản lý danh sách lớp và học sinh
              </p>
            </div>
          </div>
        </Card>

        {/* Quản lý câu hỏi */}
        <Card className="border-2 border-black shadow-neo hover:-translate-y-1 transition-transform bg-white">
          <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 md:p-2 bg-secondary border-2 border-black">
                <BookPlus className="h-4 w-4 md:h-5 md:w-5 text-black" />
              </div>
              <h3 className="text-base md:text-lg font-black uppercase italic text-black">
                Ngân hàng câu hỏi
              </h3>
            </div>
            <p className="text-[9px] md:text-xs font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Xem ngân hàng câu hỏi chung
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1.5">
              <a href="/teacher/exam">
                <Button
                  variant="outline"
                  className="w-full h-9 md:h-10 border-2 border-black font-black uppercase italic hover:bg-black hover:text-white transition-colors text-[11px] md:text-xs text-black"
                >
                  TRUY CẬP NGÂN HÀNG
                </Button>
              </a>
            </div>
            <div className="text-[8px] md:text-[11px] font-black uppercase italic mt-1.5 text-black">
              ĐÃ ĐÓNG GÓP:{" "}
              <span className="bg-primary px-1.5 md:px-2 border-2 border-black">
                {contributedCount} CÂU
              </span>
            </div>
          </div>
        </Card>

        {/* Trình tạo đề */}
        <Card className="border-2 border-black shadow-neo hover:-translate-y-1 transition-transform bg-white">
          <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 md:p-2 bg-white border-2 border-black">
                <FileCode className="h-4 w-4 md:h-5 md:w-5 text-black" />
              </div>
              <h3 className="text-base md:text-lg font-black uppercase italic text-black">
                Trình tạo đề thi
              </h3>
            </div>
            <p className="text-[9px] md:text-xs font-bold uppercase tracking-tight opacity-70 text-black leading-tight">
              Trộn đề ngẫu nhiên và xuất PDF
            </p>

            <div className="space-y-3 pt-1.5">
              <a href="/teacher/assignments/create">
                <Button className="w-full h-9 md:h-10 text-[11px] md:text-sm font-black uppercase italic border-2 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all bg-primary text-black">
                  GIAO BÀI TẬP MỚI
                </Button>
              </a>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
