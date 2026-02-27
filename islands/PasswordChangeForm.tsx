import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";

interface PasswordChangeFormProps {
  onSuccess?: () => void;
}

export default function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp!" });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "Mật khẩu đã được thay đổi. Vui lòng kiểm tra email để xác thực!" 
        });
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000);
        }
      } else {
        setMessage({
          type: "error",
          text: result.error || "Có lỗi xảy ra khi đổi mật khẩu.",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối mạng." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-3 border-4 border-black font-black uppercase italic text-xs shadow-neo-sm ${
            message.type === "success" ? "bg-primary" : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-2 text-black">
        <Label
          htmlFor="currentPassword"
          className="text-xs font-black uppercase italic text-black"
        >
          Mật khẩu hiện tại
        </Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onInput={(e) => setCurrentPassword((e.target as HTMLInputElement).value)}
          placeholder="Nhập mật khẩu hiện tại"
          className="h-12 border-4 border-black font-black uppercase italic text-sm"
          required
        />
      </div>

      <div className="grid gap-2 text-black">
        <Label
          htmlFor="newPassword"
          className="text-xs font-black uppercase italic text-black"
        >
          Mật khẩu mới
        </Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
          placeholder="Nhập mật khẩu mới"
          className="h-12 border-4 border-black font-black uppercase italic text-sm"
          required
        />
      </div>

      <div className="grid gap-2 text-black">
        <Label
          htmlFor="confirmPassword"
          className="text-xs font-black uppercase italic text-black"
        >
          Xác nhận mật khẩu mới
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
          placeholder="Nhập lại mật khẩu mới"
          className="h-12 border-4 border-black font-black uppercase italic text-sm"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 border-4 border-black bg-primary font-black uppercase italic shadow-neo-sm hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all"
        disabled={loading}
      >
        {loading ? "Đang xử lý..." : "ĐỔI MẬT KHẨU"}
      </Button>
    </form>
  );
}
