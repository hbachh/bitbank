import { Sidebar } from "../components/layout/Sidebar.tsx";
import { Header } from "../components/layout/Header.tsx";
import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { cn } from "../lib/utils.ts";

interface DashboardLayoutProps {
  children: ComponentChildren;
  user?: {
    name: string;
    role: string;
    grade?: number | null;
    school?: string | null;
  } | null;
  pathname?: string;
}

export default function DashboardLayout(
  { children, user, pathname }: DashboardLayoutProps,
) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-accent/5">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Persistent on Desktop, Toggleable on Mobile */}
      <Sidebar
        user={user}
        pathname={pathname}
        className={cn(
          "transition-transform duration-300 z-50 md:translate-x-0 w-48 md:w-52 lg:w-56",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      />

      <div className="flex-1 md:ml-52 lg:ml-56 flex flex-col min-w-0 md:pl-4 lg:pl-6">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3 md:p-4 lg:p-5 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
