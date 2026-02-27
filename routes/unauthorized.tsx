import { Button } from "../components/Button.tsx";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-accent p-4 text-center">
      <div className="bg-white border-8 border-black p-12 shadow-neo-lg space-y-8">
        <h1 className="text-6xl font-black text-red-600 uppercase italic tracking-tighter">
          403 - TRUY CẬP BỊ CHẶN
        </h1>
        <p className="text-2xl font-bold text-black uppercase tracking-tight">
          Bạn không có quyền truy cập vào khu vực này.
        </p>
        <div className="pt-4">
          <a href="/login">
            <Button
              size="lg"
              className="h-16 text-xl px-12 font-black uppercase italic border-4 border-black shadow-neo hover:shadow-none translate-x-[-4px] translate-y-[-4px] active:translate-x-0 active:translate-y-0 transition-all"
            >
              QUAY LẠI ĐĂNG NHẬP
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
