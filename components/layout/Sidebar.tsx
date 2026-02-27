import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutList,
  LogOut,
  User,
  Users,
  MessageCircle,
} from "lucide-preact";
import { cn } from "../../lib/utils.ts";
import { Button } from "../Button.tsx";

interface SidebarProps {
  className?: string;
  user?: {
    name: string;
    role: string;
    school?: string | null;
    grade?: string | null;
  } | null;
  pathname?: string;
}

export function Sidebar({ className, user, pathname }: SidebarProps) {
  const getRolePath = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "teacher":
        return "/teacher";
      case "student":
        return "/student";
      default:
        return "/student";
    }
  };

  const role = user?.role || "student";
  const basePath = getRolePath(role);

  const getRoutes = () => {
    const common = [
      {
        label: "TRANG CHỦ",
        icon: Home,
        href: basePath,
        active: pathname === basePath,
      },
    ];

    let routes = [...common];

    if (role === "student") {
      routes = [
        ...routes,
        {
          label: "LỚP HỌC",
          icon: Users,
          href: "/student/classes",
          active: pathname?.startsWith("/student/classes") ||
            pathname?.startsWith("/class"),
        },
        {
          label: "BÀI TẬP",
          icon: BookOpen,
          href: "/student/exam",
          active: pathname?.startsWith("/student/exam") ||
            pathname?.startsWith("/exam"),
        },
        {
          label: "HỎI AI",
          icon: MessageCircle,
          href: "/student/ask-ai",
          active: pathname?.startsWith("/student/ask-ai"),
        },
      ];
    } else if (role === "teacher") {
      routes = [
        ...routes,
        {
          label: "LỚP HỌC",
          icon: GraduationCap,
          href: "/teacher/classes",
          active: pathname?.startsWith("/teacher/classes") ||
            pathname?.startsWith("/class"),
        },
        {
          label: "NGÂN HÀNG",
          icon: ClipboardList,
          href: "/teacher/exam",
          active: pathname?.startsWith("/teacher/exam"),
        },
        {
          label: "CHẤM ĐIỂM",
          icon: BookOpen,
          href: "/teacher/grading",
          active: pathname?.startsWith("/teacher/grading"),
        },
        {
          label: "HỎI AI",
          icon: MessageCircle,
          href: "/teacher/ask-ai",
          active: pathname?.startsWith("/teacher/ask-ai"),
        },
      ];
    } else if (role === "admin") {
      routes = [
        ...routes,
        {
          label: "LỚP HỌC",
          icon: Users,
          href: "/admin/classes",
          active: pathname?.startsWith("/admin/classes"),
        },
        {
          label: "NGƯỜI DÙNG",
          icon: LayoutList,
          href: "/admin/users",
          active: pathname?.startsWith("/admin/users"),
        },
      ];
    }

    return routes;
  };

  const routes = getRoutes();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 flex flex-col bg-white border-r-2 md:border-r-4 border-black",
        className,
      )}
    >
      <div className="px-2 py-1 flex-1 overflow-y-auto">
        <h2 className="mb-2 px-2 text-base md:text-lg font-black uppercase tracking-tighter italic border-b-2 border-black pb-1.5">
          BITBANK
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <a
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-[11px] md:text-xs font-black uppercase italic tracking-tight border-2 border-transparent transition-all hover:bg-accent hover:border-black hover:shadow-neo-sm",
                route.active &&
                  "bg-primary border-black shadow-neo-sm translate-x-[2px] -translate-y-[2px]",
              )}
            >
              <route.icon className="size-3.5 md:size-4" />
              {route.label}
            </a>
          ))}
        </div>
      </div>

      <div className="p-2 border-t-2 md:border-t-4 border-black bg-accent/5">
        <div className="mb-2 px-2 py-1.5 border-2 border-black bg-white shadow-neo-sm">
          <p className="text-[10px] font-black uppercase truncate italic">
            {user?.name || "KHÁCH"}
          </p>
          <p className="text-[8px] font-bold uppercase text-muted-foreground truncate">
            {user?.role === "student"
              ? `HỌC SINH LỚP ${user?.grade || "?"}`
              : user?.role === "teacher"
              ? "GIÁO VIÊN"
              : "QUẢN TRỊ VIÊN"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Button
            variant="outline"
            size="xs"
            className="w-full text-[9px] md:text-[10px] p-0"
            onClick={() => window.location.href = `${basePath}/profile`}
          >
            <User className="mr-1 size-2.5 md:size-3" />
            HỒ SƠ
          </Button>
          <Button
            variant="destructive"
            size="xs"
            className="w-full text-[9px] md:text-[10px] p-0 shadow-neo-sm"
            onClick={() => window.location.href = "/logout"}
          >
            <LogOut className="mr-1 size-2.5 md:size-3" />
            THOÁT
          </Button>
        </div>
      </div>
    </div>
  );
}
