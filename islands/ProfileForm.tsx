import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { Select } from "../components/Select.tsx";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    grade?: number | null;
    school?: string | null;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [school, setSchool] = useState(user.school || "");
  const [grade, setGrade] = useState(user.grade || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/update_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, school, grade: user.role === 'student' ? grade : user.grade }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.requiresEmailVerification) {
          setMessage({ 
            type: "success", 
            text: "Vui lòng kiểm tra email mới để xác thực thay đổi!" 
          });
        } else {
          setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        setMessage({
          type: "error",
          text: result.error || "Có lỗi xảy ra khi cập nhật.",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối mạng." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      {message && (
        <div
          className={`p-3 border-4 border-black font-black uppercase italic text-xs md:text-sm shadow-neo-sm ${
            message.type === "success" ? "bg-primary" : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-1.5 md:gap-2 text-black">
        <Label
          htmlFor="name"
          className="text-[10px] md:text-xs font-black uppercase italic text-black"
        >
          Họ và tên
        </Label>
        <Input
          id="name"
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          placeholder="Nhập họ tên của bạn"
          className="h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm"
          required
        />
      </div>

      <div className="grid gap-1.5 md:gap-2 text-black">
        <Label
          htmlFor="email"
          className="text-[10px] md:text-xs font-black uppercase italic text-black"
        >
          Email
        </Label>
        <Input
          id="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="Nhập email của bạn"
          className="h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 text-black">
        <div className="grid gap-1.5 md:gap-2">
          <Label
            htmlFor="role"
            className="text-[10px] md:text-xs font-black uppercase italic text-black"
          >
            Vai trò
          </Label>
          <Input
            id="role"
            value={user.role === "student"
              ? "Học sinh"
              : user.role === "teacher"
              ? "Giáo viên"
              : "Quản trị viên"}
            disabled
            className="h-10 md:h-12 border-4 border-black font-black uppercase italic bg-accent/30 cursor-not-allowed opacity-70 text-xs md:text-sm"
          />
        </div>
        <div className="grid gap-1.5 md:gap-2">
          <Label
            htmlFor="grade"
            className="text-[10px] md:text-xs font-black uppercase italic text-black"
          >
            Khối lớp
          </Label>
          {user.role === "student" ? (
            <Select
              id="grade"
              value={grade}
              onChange={(e) => setGrade((e.target as HTMLSelectElement).value)}
              className="h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm"
              required
            >
              <option value="">Chọn khối lớp</option>
              <option value="1">Lớp 1</option>
              <option value="2">Lớp 2</option>
              <option value="3">Lớp 3</option>
              <option value="4">Lớp 4</option>
              <option value="5">Lớp 5</option>
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </Select>
          ) : (
            <Input
              id="grade"
              value={user.grade ? `Lớp ${user.grade}` : "Chưa cập nhật"}
              disabled
              className="h-10 md:h-12 border-4 border-black font-black uppercase italic bg-accent/30 cursor-not-allowed opacity-70 text-xs md:text-sm"
            />
          )}
        </div>
      </div>

      <div className="grid gap-1.5 md:gap-2 text-black">
        <Label
          htmlFor="school"
          className="text-[10px] md:text-xs font-black uppercase italic text-black"
        >
          Trường học
        </Label>
        <Input
          id="school"
          value={school}
          onInput={(e) => setSchool((e.target as HTMLInputElement).value)}
          placeholder="Nhập tên trường học"
          className="h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm"
        />
      </div>

      <div className="pt-2 md:pt-4 flex gap-3 md:gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="h-10 md:h-12 px-6 md:px-8 text-xs md:text-sm font-black uppercase italic border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all bg-primary text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
        <a href="/api/auth/logout">
          <Button
            type="button"
            variant="secondary"
            className="h-10 md:h-12 px-6 md:px-8 text-xs md:text-sm font-black uppercase italic border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all bg-red-500 text-white"
          >
            Đăng xuất
          </Button>
        </a>
      </div>
    </form>
  );
}
