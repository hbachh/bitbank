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

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [grade, setGrade] = useState("12");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, grade, school }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Register failed");
      }

      window.location.href = "/login?registered=true";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm border-2 border-black shadow-neo-sm bg-white p-0 my-4">
      <CardHeader className="space-y-1.5 border-b-2 border-black p-4 md:p-6 pb-3 md:pb-4">
        <CardTitle className="text-xl md:text-2xl font-black text-center uppercase italic tracking-tighter text-black">
          ĐĂNG KÝ
        </CardTitle>
        <CardDescription className="text-center font-bold uppercase text-black text-[9px] md:text-xs">
          Tạo tài khoản mới để bắt đầu học tập
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
              htmlFor="name"
              className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
            >
              HỌ VÀ TÊN
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              required
              className="border-2 border-black h-9 md:h-10"
            />
          </div>
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
          <div className="space-y-1.5 md:space-y-2">
            <Label
              htmlFor="password"
              className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
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
          <div className="space-y-1.5 md:space-y-2">
            <Label
              htmlFor="school"
              className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
            >
              TRƯỜNG HỌC
            </Label>
            <Input
              id="school"
              type="text"
              placeholder="VD: THPT CHUYÊN HÀ NỘI - AMSTERDAM"
              value={school}
              onInput={(e) => setSchool((e.target as HTMLInputElement).value)}
              required
              className="border-2 border-black h-9 md:h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 md:space-y-2">
              <Label
                htmlFor="role"
                className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
              >
                VAI TRÒ
              </Label>
              <select
                value={role}
                onChange={(e) => setRole((e.target as HTMLSelectElement).value)}
                className="w-full h-9 md:h-10 border-2 border-black bg-white px-2 py-1 text-[11px] md:text-xs font-bold shadow-neo-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <option value="student">HỌC SINH</option>
                <option value="teacher">GIÁO VIÊN</option>
              </select>
            </div>
            {role === "student" && (
              <div className="space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="grade"
                  className="font-black uppercase italic tracking-tight text-[9px] md:text-xs text-black"
                >
                  KHỐI LỚP
                </Label>
                <select
                  value={grade}
                  onChange={(e) =>
                    setGrade((e.target as HTMLSelectElement).value)}
                  className="w-full h-9 md:h-10 border-2 border-black bg-white px-2 py-1 text-[11px] md:text-xs font-bold shadow-neo-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <option value="10">LỚP 10</option>
                  <option value="11">LỚP 11</option>
                  <option value="12">LỚP 12</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 md:space-y-4 p-4 md:p-6 pt-0 pb-6 md:pb-8">
          <Button
            type="submit"
            className="w-full h-9 md:h-11 font-black uppercase italic tracking-tighter border-2 border-black shadow-neo-sm hover:shadow-none transition-all bg-secondary"
            disabled={loading}
          >
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
          </Button>
          <div className="text-center text-[9px] md:text-xs font-bold uppercase italic tracking-tight">
            Đã có tài khoản?{" "}
            <a href="/login" className="font-black underline hover:text-primary transition-colors">
              Đăng nhập
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
