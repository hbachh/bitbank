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
    <Card className="w-full max-w-md border-2 md:border-4 border-black shadow-neo bg-white">
      <CardHeader className="space-y-2 border-b-2 md:border-b-4 border-black pb-4 md:pb-6">
        <CardTitle className="text-xl md:text-3xl font-black text-center uppercase italic tracking-tighter">
          ĐĂNG NHẬP
        </CardTitle>
        <CardDescription className="text-center font-bold uppercase text-black text-[10px] md:text-sm">
          Nhập email và mật khẩu để truy cập hệ thống
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="mt-4 md:mt-6">
        <CardContent className="space-y-4 md:space-y-6">
          {error && (
            <div className="p-3 md:p-4 text-[10px] md:text-sm font-black uppercase bg-red-100 border-2 border-black shadow-neo-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-2 md:space-y-3">
            <Label
              htmlFor="email"
              className="font-black uppercase italic tracking-tight text-[10px] md:text-xs"
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
              className="border-2 border-black h-10 md:h-12"
            />
          </div>
          <div className="space-y-2 md:space-y-3">
            <Label
              htmlFor="password"
              className="font-black uppercase italic tracking-tight text-[10px] md:text-xs"
            >
              MẬT KHẨU
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              className="border-2 border-black h-10 md:h-12"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 md:space-y-6 pt-4 md:pt-6 pb-6 md:pb-8">
          <Button
            type="submit"
            className="w-full h-10 md:h-12 text-sm md:text-lg uppercase bg-primary"
            disabled={loading}
          >
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
          </Button>
          <div className="text-[10px] md:text-sm text-center font-bold uppercase tracking-tight">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="underline decoration-4 decoration-secondary hover:bg-secondary/20 transition-colors"
            >
              Đăng ký ngay
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
