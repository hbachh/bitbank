import { PageProps } from "$fresh/server.ts";
import { Card } from "../components/Card.tsx";
import { Button } from "../components/Button.tsx";
import PasswordChangeForm from "../islands/PasswordChangeForm.tsx";

export default function ChangePasswordPage({ state }: PageProps) {
  const user = state?.user;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl font-black uppercase italic">
          Vui lòng đăng nhập để đổi mật khẩu
        </p>
      </div>
    );
  }

  const getRolePath = (role: string | undefined) => {
    switch (role) {
      case "admin": return "/admin";
      case "teacher": return "/teacher";
      case "student": return "/student";
      default: return "/student";
    }
  };

  const profilePath = `${getRolePath(user?.role)}/profile`;

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black">
            Đổi mật khẩu
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70 text-black">
            Thay đổi mật khẩu tài khoản của bạn
          </p>
        </div>
      </div>

      <Card className="border-4 border-black shadow-neo bg-white">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black uppercase italic text-black">
              Đổi mật khẩu
            </h3>
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-tight opacity-70 text-black">
              Nhập mật khẩu hiện tại và mật khẩu mới của bạn
            </p>
          </div>

          <PasswordChangeForm onSuccess={() => {
            window.location.href = profilePath;
          }} />
        </div>
      </Card>

      <div className="flex justify-center">
        <Button
          variant="outline"
          className="h-12 px-6 border-4 border-black font-black uppercase italic hover:bg-black hover:text-white transition-colors"
          onClick={() => window.location.href = profilePath}
        >
          Quay lại hồ sơ
        </Button>
      </div>
    </div>
  );
}
