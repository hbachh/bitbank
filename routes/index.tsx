import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../lib/jwt.ts";
import { Button } from "../components/Button.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (token) {
      const user = await verifyToken(token);
      if (user) {
        if (user.role === "admin") {
          return new Response("", {
            status: 303,
            headers: { Location: "/admin" },
          });
        }
        if (user.role === "teacher") {
          return new Response("", {
            status: 303,
            headers: { Location: "/teacher" },
          });
        }
        return new Response("", {
          status: 303,
          headers: { Location: "/student" },
        });
      }
    }

    return ctx.render();
  },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-4 md:px-6 h-16 md:h-18 flex items-center border-b-2 md:border-b-3 border-black justify-between">
        <a
          href="/"
          className="flex items-center gap-1.5 font-black text-xl md:text-2xl uppercase italic tracking-tighter"
        >
          BITBANK
        </a>
        <div className="flex gap-3 text-xs md:text-sm font-black items-center">
          <nav className="flex gap-4 md:gap-6">
            <a href="#" className="hover:underline hidden sm:block uppercase">
              Giới thiệu
            </a>
            <a href="#" className="hover:underline hidden sm:block uppercase">
              Tính năng
            </a>
          </nav>
          <div className="flex gap-3">
            <a href="/login">
              <Button variant="outline" size="sm" className="uppercase">
                Đăng nhập
              </Button>
            </a>
            <a href="/register">
              <Button size="sm" className="uppercase">
                Đăng ký
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-16 lg:py-20 text-center space-y-8 container mx-auto px-4 md:px-6">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase italic leading-[0.95]">
              Hệ thống Ngân hàng <br className="hidden sm:inline" />
              <span className="bg-secondary px-4 border-4 border-black inline-block -rotate-1">
                Đề thi
              </span>{" "}
              Tin học
            </h1>
            <p className="mx-auto max-w-[620px] text-black text-sm md:text-lg font-bold uppercase tracking-tight">
              Tối ưu hóa cho chương trình GDPT mới. Tạo đề thi tự động, chấm
              điểm thông minh, và hỗ trợ học tập với AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/student" className="w-full sm:w-56">
              <Button size="lg" className="w-full text-lg h-12 bg-primary">
                HỌC SINH
              </Button>
            </a>
            <a href="/teacher" className="w-full sm:w-56">
              <Button
                size="lg"
                variant="secondary"
                className="w-full text-lg h-12"
              >
                GIÁO VIÊN
              </Button>
            </a>
          </div>
        </section>

        <section className="w-full py-14 border-t-2 md:border-t-3 border-black bg-accent">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white border-2 border-black p-5 md:p-6 shadow-neo-lg hover:-translate-y-1 transition-transform">
                <div className="mb-4 flex h-14 w-14 items-center justify-center border-2 border-black bg-primary">
                  <svg
                    className="h-6 w-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-black uppercase mb-2 italic">
                  Trộn đề thông minh
                </h3>
                <p className="text-sm md:text-base font-bold text-black uppercase tracking-tight">
                  Thuật toán Fisher-Yates xáo trộn câu hỏi và đáp án ngẫu nhiên
                  ngay tại Edge.
                </p>
              </div>
              <div className="bg-white border-2 border-black p-5 md:p-6 shadow-neo-lg hover:-translate-y-1 transition-transform">
                <div className="mb-4 flex h-14 w-14 items-center justify-center border-2 border-black bg-secondary">
                  <svg
                    className="h-6 w-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-black uppercase mb-2 italic">
                  Xuất bản PDF
                </h3>
                <p className="text-sm md:text-base font-bold text-black uppercase tracking-tight">
                  Tạo file PDF chuyên nghiệp với Syntax Highlighting cho mã
                  nguồn.
                </p>
              </div>
              <div className="bg-white border-2 border-black p-5 md:p-6 shadow-neo-lg hover:-translate-y-1 transition-transform">
                <div className="mb-4 flex h-14 w-14 items-center justify-center border-2 border-black bg-white">
                  <svg
                    className="h-6 w-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-black uppercase mb-2 italic">
                  AI Tutor
                </h3>
                <p className="text-sm md:text-base font-bold text-black uppercase tracking-tight">
                  Hỏi AI để giải thích chi tiết các câu hỏi khó và kiến thức lập
                  trình.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 md:py-8 w-full border-t-2 md:border-t-3 border-black bg-white text-center font-black uppercase italic tracking-widest text-[10px] md:text-xs">
        &copy; 2026 AI YOUNG GURU. POWERED BY DENO & FRESH.
      </footer>
    </div>
  );
}
