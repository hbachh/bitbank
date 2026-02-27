import { Menu } from "lucide-preact";
import { Button } from "../Button.tsx";

interface HeaderProps {
  user?: {
    name: string;
    role: string;
    grade?: number | null;
    school?: string | null;
  } | null;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const getRoleName = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "QUẢN TRỊ VIÊN";
      case "teacher":
        return "GIÁO VIÊN";
      case "student":
        return "HỌC SINH";
      default:
        return "BẢNG ĐIỀU KHIỂN";
    }
  };

  return (
    <header className="flex h-12 md:h-14 items-center gap-3 md:gap-4 border-b-2 md:border-b-4 border-black bg-white px-3 md:px-5 sticky top-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden border-2 border-black h-9 w-9 p-0"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="w-full flex-1">
        <h1 className="text-sm md:text-lg font-black uppercase tracking-tight italic">
          {getRoleName(user?.role)}
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] md:text-[11px] font-black uppercase">
            {user?.name || "NGƯỜI DÙNG"}
          </span>
          <span className="text-[9px] md:text-[11px] bg-primary border border-black px-1.5 py-[1px] font-black uppercase italic">
            {getRoleName(user?.role)}
          </span>
        </div>
        <div className="h-7 w-7 md:h-9 md:w-9 border-2 md:border-4 border-black bg-primary shadow-neo-sm flex items-center justify-center font-black text-[11px] md:text-sm">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
