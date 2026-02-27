import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/Card.tsx";
import { Label } from "../components/Label.tsx";
import { Input } from "../components/Input.tsx";

export default function ResetPasswordForm({ token }: { token?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (token && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra.");
      }

      setMessage(data.message);
      if (token) {
        // Redirect to login after successful reset
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
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
        <CardTitle className="text-xl md:text-2xl font-black text-center uppercase italic tracking-tighter text-black">
          {token ? "ĐẶT LẠI MẬT KHẨU" : "KHÔI PHỤC MẬT KHẨU"}
        </CardTitle>
        <CardDescription className="text-center font-bold uppercase text-black text-[9px] md:text-xs">
          {token 
            ? "Nhập mật khẩu mới cho tài khoản của bạn" 
            : "Nhập email để nhận liên kết khôi phục mật khẩu"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          {error && (
            <div className="p-2.5 md:p-3 text-[9px] md:text-xs font-black uppercase bg-red-100 border-2 border-black shadow-neo-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="p-2.5 md:p-3 text-[9px] md:text-xs font-black uppercase bg-green-100 border-2 border-black shadow-neo-sm text-green-600">
              {message}
            </div>
          )}

          {!token ? (
            <div className="space-y-1.5 md:space-y-2">
              <Label
                htmlFor="email"
                className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
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
          ) : (
            <>
              <div className="space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="password"
                  className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
                >
                  MẬT KHẨU MỚI
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
              <div className="space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
                >
                  XÁC NHẬN MẬT KHẨU
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                  required
                  className="border-2 border-black h-9 md:h-10"
                />
              </div>
            </>
          )}
        </CardContent>
        <div className="p-4 md:p-6 pt-0 pb-6 md:pb-8">
          <Button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-black shadow-neo-sm hover:shadow-none transition-all h-9 md:h-11 font-black uppercase italic tracking-tighter bg-primary"
          >
            {loading ? "ĐANG XỬ LÝ..." : (token ? "CẬP NHẬT MẬT KHẨU" : "GỬI LIÊN KẾT")}
          </Button>
          <div className="mt-4 text-center">
            <a href="/login" className="text-[9px] md:text-xs font-black uppercase underline italic hover:text-primary transition-colors">
              Quay lại đăng nhập
            </a>
          </div>
        </div>
      </form>
    </Card>
  );
}
