import { PageProps } from "$fresh/server.ts";
import { Button } from "../../components/Button.tsx";
import { Card } from "../../components/Card.tsx";
import ProfileForm from "../../islands/ProfileForm.tsx";

export default function StudentProfilePage({ state }: PageProps) {
  const user = state?.user;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl font-black uppercase italic">
          Vui lòng đăng nhập để xem hồ sơ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black">
            Hồ sơ cá nhân
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70 text-black">
            Quản lý thông tin tài khoản và cài đặt
          </p>
        </div>
      </div>

      <Card className="border-4 border-black shadow-neo bg-white">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black uppercase italic text-black">
              Thông tin chung
            </h3>
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-tight opacity-70 text-black">
              Thông tin cơ bản của bạn trên hệ thống
            </p>
          </div>

          <ProfileForm user={user} />
        </div>
      </Card>

      <Card className="border-4 border-black shadow-neo">
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase italic">Bảo mật</h3>
            <p className="text-sm font-bold uppercase tracking-tight opacity-70">
              Đổi mật khẩu và cài đặt bảo mật
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              className="h-12 px-6 border-4 border-black font-black uppercase italic hover:bg-black hover:text-white transition-colors"
            >
              Đổi mật khẩu
            </Button>
            <Button
              variant="outline"
              className="h-12 px-6 border-4 border-black font-black uppercase italic hover:bg-black hover:text-white transition-colors"
            >
              Xem lịch sử đăng nhập
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
