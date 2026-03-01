import { PageProps } from "$fresh/server.ts";
import AdminUserManager from "../../islands/AdminUserManager.tsx";

export default function AdminUsersPage({ state }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black">
          Quản lý người dùng
        </h1>
        <p className="text-xs md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
          Xem và quản lý danh sách tài khoản trên hệ thống
        </p>
      </div>

      <AdminUserManager />
    </div>
  );
}
