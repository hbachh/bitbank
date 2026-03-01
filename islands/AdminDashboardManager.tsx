import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import {
  CheckCircle,
  ChevronRight,
  Database,
  FileJson,
  LayoutList,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-preact";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { cn } from "../lib/utils.ts";

interface Topic {
  id: string;
  name: string;
  grade: number;
}

interface Question {
  id: string;
  content: string;
}

interface AdminDashboardManagerProps {
  stats: {
    questions: number;
    classes: number;
    teachers: number;
    students: number;
    totalUsers: number;
  };
  initialPendingQuestions: Question[];
}

export default function AdminDashboardManager(
  { stats }: AdminDashboardManagerProps,
) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary p-4 flex flex-col gap-1 border-2 border-black shadow-neo-sm">
          <div className="flex items-center gap-2">
            <Users className="size-4" />
            <span className="text-xs font-black uppercase italic tracking-tighter">Tổng người dùng</span>
          </div>
          <span className="text-3xl font-black">{stats.totalUsers}</span>
        </Card>

        <Card className="bg-secondary p-4 flex flex-col gap-1 border-2 border-black shadow-neo-sm text-black">
          <div className="flex items-center gap-2">
            <Database className="size-4" />
            <span className="text-xs font-black uppercase italic tracking-tighter">Câu hỏi hệ thống</span>
          </div>
          <span className="text-3xl font-black">{stats.questions}</span>
        </Card>

        <Card className="bg-accent p-4 flex flex-col gap-1 border-2 border-black shadow-neo-sm">
          <div className="flex items-center gap-2">
            <LayoutList className="size-4" />
            <span className="text-xs font-black uppercase italic tracking-tighter">Lớp học</span>
          </div>
          <span className="text-3xl font-black">{stats.classes}</span>
        </Card>

        <Card className="bg-white p-4 flex flex-col gap-1 border-2 border-black shadow-neo-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span className="text-xs font-black uppercase italic tracking-tighter">Giáo viên</span>
          </div>
          <span className="text-3xl font-black">{stats.teachers}</span>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-2 border-black shadow-neo bg-white">
          <h3 className="text-lg font-black uppercase italic mb-4 border-b-2 border-black pb-2">
            Hệ thống
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <Button
              className="justify-between group"
              onClick={() => window.location.href = "/admin/users"}
            >
              QUẢN LÝ NGƯỜI DÙNG
              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              className="justify-between group"
              onClick={() => window.location.href = "/admin/questions"}
            >
              QUẢN LÝ CÂU HỎI
              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              className="justify-between group"
              onClick={() => window.location.href = "/admin/subjects"}
            >
              QUẢN LÝ MÔN HỌC
              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-2 border-black shadow-neo bg-white">
          <h3 className="text-lg font-black uppercase italic mb-4 border-b-2 border-black pb-2">
            Thông tin
          </h3>
          <div className="space-y-4 text-sm font-bold uppercase italic opacity-70">
            <div className="flex justify-between">
              <span>Học sinh:</span>
              <span>{stats.students}</span>
            </div>
            <div className="flex justify-between">
              <span>Giáo viên:</span>
              <span>{stats.teachers}</span>
            </div>
            <div className="flex justify-between">
              <span>Admin:</span>
              <span>{stats.totalUsers - stats.students - stats.teachers}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
