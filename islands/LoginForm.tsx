import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/Card.tsx";
import { Label } from "../components/Label.tsx";
import { Input } from "../components/Input.tsx";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Redirect based on role
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else if (data.user.role === "teacher") {
        window.location.href = "/teacher";
      } else {
        window.location.href = "/student";
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm border-2 border-black shadow-neo-sm bg-white p-0">
      <CardHeader className="space-y-1.5 border-b-2 border-black p-4 md:p-6 pb-3 md:pb-4">
        <CardTitle className="text-xl md:text-2xl font-black text-center uppercase italic tracking-tighter">
          ĐĂNG NHẬP
        </CardTitle>
        <CardDescription className="text-center font-bold uppercase text-black text-[9px] md:text-xs">
          Nhập email và mật khẩu để truy cập hệ thống
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          {error && (
            <div className="p-2.5 md:p-3 text-[9px] md:text-xs font-black uppercase bg-red-100 border-2 border-black shadow-neo-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1.5 md:space-y-2">
            <Label
              htmlFor="email"
              className="font-black uppercase italic tracking-tight text-[9px] md:text-xs"
            >
              EMAIL
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
              className="border-2 border-black h-9 md:h-10"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label
              htmlFor="password"
              className="font-black uppercase italic tracking-tight text-[9px] md:text-xs"
            >
              MẬT KHẨU
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              className="border-2 border-black h-9 md:h-10"
            />
          </div>
          <div className="flex justify-end mt-1">
            <a href="/reset-password" class="text-[9px] md:text-[10px] font-black uppercase underline italic hover:text-primary transition-colors">
              Quên mật khẩu?
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 md:space-y-4 p-4 md:p-6 pt-0 pb-6 md:pb-8">
          <Button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-black shadow-neo-sm hover:shadow-none transition-all h-9 md:h-11 font-black uppercase italic tracking-tighter bg-primary"
          >
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
          </Button>
          <div className="text-center text-[9px] md:text-xs font-bold uppercase italic tracking-tight">
            Chưa có tài khoản?{" "}
            <a href="/register" className="font-black underline hover:text-primary transition-colors">
              Đăng ký ngay
            </a>
          </div>

          {/* Demo Accounts Info */}
          <div className="mt-4 p-3 border-2 border-black bg-accent/5 rounded-none text-left space-y-2">
            <p className="text-[10px] font-black uppercase italic border-b border-black pb-1 mb-1">Tài khoản dùng thử:</p>
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold">
                <span className="bg-primary px-1 border border-black mr-1">HỌC SINH:</span>
                <code className="bg-white px-1 border border-black">hs@bitbank.is-app.top</code> / <code>hocsinh@A</code>
              </div>
              <div className="text-[9px] font-bold">
                <span className="bg-secondary px-1 border border-black mr-1">GIÁO VIÊN:</span>
                <code className="bg-white px-1 border border-black">gv@bitbank.edu.vn</code> / <code>giaovien@A</code>
              </div>
              <div className="text-[9px] font-bold">
                <span className="bg-black text-white px-1 border border-black mr-1">ADMIN:</span>
                <code className="bg-white text-black px-1 border border-black">admin@bitbank.is-app.top</code> / <code>admin12@A</code>
              </div>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
