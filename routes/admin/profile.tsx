import { PageProps } from "$fresh/server.ts";
import { Card } from "../../components/Card.tsx";
import ProfileForm from "../../islands/ProfileForm.tsx";

export default function AdminProfilePage({ state }: PageProps) {
  const user = state?.user;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-xl font-black uppercase italic text-black">
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
            Hồ sơ quản trị viên
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
            Quản lý thông tin tài khoản admin
          </p>
        </div>
      </div>

      <Card className="border-4 border-black shadow-neo bg-white">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black uppercase italic text-black">
              Thông tin tài khoản
            </h3>
            <p className="text-[10px] md:text-sm font-bold uppercase tracking-tight opacity-70 text-black">
              Thông tin quản trị hệ thống
            </p>
          </div>

          <ProfileForm user={user} />
        </div>
      </Card>
    </div>
  );
}
