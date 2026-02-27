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
    <header className="flex h-11 md:h-12 items-center gap-2 md:gap-3 border-b-2 border-black bg-white px-3 md:px-4 sticky top-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden border-2 border-black h-8 w-8 p-0"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="w-full flex-1">
        <h1 className="text-xs md:text-sm font-black uppercase tracking-tight italic">
          {getRoleName(user?.role)}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] md:text-[10px] font-black uppercase italic">
            {user?.name || "NGƯỜI DÙNG"}
          </span>
          <span className="text-[8px] md:text-[9px] bg-primary border border-black px-1.5 py-[0.5px] font-black uppercase italic mt-0.5">
            {getRoleName(user?.role)}
          </span>
        </div>
        <div className="h-7 w-7 md:h-8 md:w-8 border-2 border-black bg-primary shadow-neo-sm flex items-center justify-center font-black text-[10px] md:text-xs italic">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
