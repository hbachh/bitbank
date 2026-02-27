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
    <Card className="w-full max-w-md border-2 md:border-4 border-black shadow-neo bg-white">
      <CardHeader className="space-y-2 border-b-2 md:border-b-4 border-black pb-4 md:pb-6">
        <CardTitle className="text-xl md:text-3xl font-black text-center uppercase italic tracking-tighter text-black">
          ĐĂNG KÝ
        </CardTitle>
        <CardDescription className="text-center font-bold uppercase text-black text-[10px] md:text-sm">
          Tạo tài khoản mới để bắt đầu học tập
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
              htmlFor="name"
              className="font-black uppercase italic tracking-tight text-[10px] md:text-xs text-black"
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
              className="border-2 border-black h-10 md:h-12"
            />
          </div>
          <div className="space-y-2 md:space-y-3">
            <Label
              htmlFor="email"
              className="font-black uppercase italic tracking-tight text-[10px] md:text-xs text-black"
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
              className="font-black uppercase italic tracking-tight text-[10px] md:text-xs text-black"
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
          <div className="space-y-2 md:space-y-3">
            <Label
              htmlFor="school"
              className="font-black uppercase italic tracking-tight text-[10px] md:text-xs text-black"
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
              className="border-2 border-black h-10 md:h-12"
            />
          </div>
          <div className="space-y-2 md:space-y-3">
            <Label
              htmlFor="role"
              className="font-black uppercase italic tracking-tight text-[10px] md:text-xs text-black"
            >
              VAI TRÒ
            </Label>
            <select
              value={role}
              onChange={(e) => setRole((e.target as HTMLSelectElement).value)}
              className="w-full h-10 border-2 border-black bg-white px-3 py-2 text-xs md:text-sm font-bold shadow-neo-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <option value="student">HỌC SINH</option>
              <option value="teacher">GIÁO VIÊN</option>
            </select>
          </div>
          {role === "student" && (
            <div className="space-y-2 md:space-y-3">
              <Label
                htmlFor="grade"
                className="font-black uppercase italic tracking-tight text-[10px] md:text-xs text-black"
              >
                KHỐI LỚP
              </Label>
              <select
                value={grade}
                onChange={(e) =>
                  setGrade((e.target as HTMLSelectElement).value)}
                className="w-full h-10 border-2 border-black bg-white px-3 py-2 text-xs md:text-sm font-bold shadow-neo-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <option value="10">LỚP 10</option>
                <option value="11">LỚP 11</option>
                <option value="12">LỚP 12</option>
              </select>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 md:space-y-6 pt-4 md:pt-6 pb-6 md:pb-8">
          <Button
            type="submit"
            className="w-full h-10 md:h-12 text-sm md:text-lg uppercase bg-secondary"
            disabled={loading}
          >
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
          </Button>
          <div className="text-[10px] md:text-sm text-center font-bold uppercase tracking-tight">
            Đã có tài khoản?{" "}
            <a
              href="/login"
              className="underline decoration-4 decoration-primary hover:bg-primary/20 transition-colors"
            >
              Đăng nhập
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
