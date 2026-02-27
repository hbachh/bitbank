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
          label: "BÀI TẬP & ÔN TẬP",
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
          label: "QUẢN LÝ LỚP",
          icon: GraduationCap,
          href: "/teacher/classes",
          active: pathname?.startsWith("/teacher/classes") ||
            pathname?.startsWith("/class"),
        },
        {
          label: "NGÂN HÀNG CÂU HỎI",
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
          label: "NGÂN HÀNG CÂU HỎI",
          icon: BookOpen,
          href: "/admin/questions",
          active: pathname?.startsWith("/admin/questions"),
        },
        {
          label: "DANH SÁCH MÔN HỌC",
          icon: LayoutList,
          href: "/admin/subjects",
          active: pathname?.startsWith("/admin/subjects"),
        },
      ];
    }

    if (user) {
      routes.push({
        label: "HỒ SƠ",
        icon: User,
        href: `${basePath}/profile`,
        active: pathname?.endsWith("/profile"),
      });
    }

    return routes;
  };

  const getRoleName = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "QUẢN TRỊ VIÊN";
      case "teacher":
        return "GIÁO VIÊN";
      case "student":
        return "HỌC SINH";
      default:
        return "HỌC SINH";
    }
  };

  const routes = getRoutes();

  return (
    <div
      className={cn(
        "pb-2 h-screen border-r-2 md:border-r-4 border-black bg-white w-56 md:w-60 fixed left-0 top-0 z-50",
        className,
      )}
    >
      <div className="space-y-3 py-2 flex flex-col justify-between h-full">
        <div className="px-3 py-1.5 flex-1 overflow-y-auto">
          <h2 className="mb-4 px-3 text-xl font-black uppercase tracking-tighter italic border-b-2 border-black pb-3">
            BITBANK
          </h2>
          <div className="space-y-1.5">
            {routes.map((route) => (
              <a
                key={route.href + route.label}
                href={route.href}
                className="block w-full"
              >
                <Button
                  variant={route.active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start font-black uppercase italic text-xs tracking-tight border-2 border-transparent h-10",
                    route.active &&
                      "bg-primary border-black shadow-neo-sm translate-x-[1px] translate-y-[1px]",
                  )}
                >
                  <route.icon className="mr-3 h-4 w-4" />
                  {route.label}
                </Button>
              </a>
            ))}
          </div>
        </div>
        <div className="px-3 py-3 border-t-2 md:border-t-3 border-black bg-accent/10">
          <div className="mb-3 px-3 space-y-1">
            <p className="text-[8px] font-black uppercase opacity-50 tracking-widest text-black">
              ĐANG ĐĂNG NHẬP
            </p>
            <p className="text-xs font-black uppercase italic truncate text-black">
              {user?.name || "KHÁCH"}
            </p>
            <p className="text-[9px] font-black uppercase bg-primary border border-black px-1.5 py-0.5 shadow-neo-sm">
                {getRoleName(role)}
              </p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start font-black uppercase italic text-xs border-2 border-black hover:bg-red-500 hover:text-white transition-colors h-10"
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => {
                window.location.href = "/login";
              });
            }}
          >
            <LogOut className="mr-3 h-4 w-4" />
            ĐĂNG XUẤT
          </Button>
        </div>
      </div>
    </div>
  );
}
