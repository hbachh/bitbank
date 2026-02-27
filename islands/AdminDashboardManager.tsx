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
  { stats, initialPendingQuestions }: AdminDashboardManagerProps,
) {
  const [pendingQuestions, setPendingQuestions] = useState(
    initialPendingQuestions,
  );
  const [jsonInput, setJsonInput] = useState("");
  const [showImportJson, setShowImportJson] = useState(false);
  const [loading, setLoading] = useState(false);

  const approveQuestion = async (id: string) => {
    try {
      const res = await fetch("/api/questions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setPendingQuestions(pendingQuestions.filter((q) => q.id !== id));
      }
    } catch (err) {
      console.error("Failed to approve question:", err);
    }
  };

  const rejectQuestion = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối câu hỏi này?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPendingQuestions(pendingQuestions.filter((q) => q.id !== id));
      }
    } catch (err) {
      console.error("Failed to reject question:", err);
    }
  };

  const handleImportJson = async () => {
    if (!jsonInput.trim()) return;
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsed }),
      });
      if (res.ok) {
        alert("Import thành công!");
        setJsonInput("");
        setShowImportJson(false);
        window.location.reload();
      } else {
        const err = await res.json();
        alert("Lỗi import: " + err.error);
      }
    } catch (e) {
      alert("JSON không hợp lệ: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Thống kê người dùng */}
      <Card className="border-2 border-black shadow-neo-sm bg-white overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary border-2 border-black shadow-neo-sm">
              <Users className="h-5 w-5 text-black" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-black">
              Người dùng
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-accent/10 border-2 border-black">
              <div className="text-3xl font-black italic tracking-tighter text-black">
                {stats.teachers}/{stats.students}
              </div>
              <div className="text-[10px] font-black uppercase opacity-60 text-black tracking-widest mt-1">
                Giáo viên / Học sinh
              </div>
            </div>
            <div className="p-4 bg-primary/20 border-2 border-black">
              <div className="text-3xl font-black italic tracking-tighter text-black">
                {stats.totalUsers}
              </div>
              <div className="text-[10px] font-black uppercase opacity-60 text-black tracking-widest mt-1">
                Tổng số người dùng
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tạo câu hỏi mới */}
      <Card className="border-2 border-black shadow-neo-sm bg-white overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary border-2 border-black shadow-neo-sm">
              <Plus className="h-5 w-5 text-black" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-black">
              Tạo câu hỏi mới
            </h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-tight opacity-50 text-black leading-tight">
            Tạo câu hỏi mới cho ngân hàng câu hỏi hệ thống.
          </p>
          <a href="/admin/create-question">
            <Button className="w-full border-2 border-black font-black uppercase italic shadow-neo-sm h-10 bg-primary text-black text-xs">
              TẠO CÂU HỎI MỚI
            </Button>
          </a>
        </div>
      </Card>

      {/* Nhập câu hỏi JSON */}
      <Card className="border-2 border-black shadow-neo-sm bg-white overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black border-2 border-black shadow-neo-sm">
              <FileJson className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-black">
              Import JSON
            </h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-tight opacity-50 text-black leading-tight">
            Thêm nhiều câu hỏi cùng lúc bằng định dạng JSON chuẩn.
          </p>

          {!showImportJson ? (
            <Button
              onClick={() => setShowImportJson(true)}
              className="w-full border-2 border-black font-black uppercase italic shadow-neo-sm h-10 bg-accent text-black text-xs"
            >
              MỞ TRÌNH NHẬP DỮ LIỆU
            </Button>
          ) : (
            <div className="space-y-3 animate-in zoom-in-95 duration-200">
              <textarea
                value={jsonInput}
                onInput={(e) =>
                  setJsonInput((e.target as HTMLTextAreaElement).value)}
                placeholder='[{"content": "...", "type": "TN", ...}]'
                className="w-full h-40 border-2 border-black p-3 font-mono text-[10px] focus:outline-none bg-accent/5"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowImportJson(false)}
                  variant="outline"
                  className="flex-1 border-2 border-black font-black uppercase italic h-10 text-xs"
                >
                  HỦY
                </Button>
                <Button
                  onClick={handleImportJson}
                  disabled={loading || !jsonInput}
                  className="flex-[2] border-2 border-black font-black uppercase italic bg-primary text-black h-10 shadow-neo-sm text-xs"
                >
                  {loading ? "ĐANG IMPORT..." : "BẮT ĐẦU IMPORT"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Thống kê hệ thống */}
      <Card className="border-2 border-black shadow-neo-sm bg-white overflow-hidden lg:col-span-3">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent border-2 border-black shadow-neo-sm">
                <Database className="h-5 w-5 text-black" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight text-black">
                Thống kê hệ thống
              </h3>
            </div>
            <a href="/admin/subjects">
              <Button variant="outline" className="h-9 border-2 border-black font-black uppercase italic text-[10px] bg-secondary shadow-neo-sm">
                QUẢN LÝ MÔN HỌC <ChevronRight className="ml-2 h-3 w-3" />
              </Button>
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-accent/5 border-2 border-black">
              <div className="text-3xl font-black italic tracking-tighter text-black">
                {stats.questions}
              </div>
              <div className="text-[10px] font-black uppercase opacity-50 text-black tracking-widest mt-1">
                Tổng câu hỏi
              </div>
            </div>
            <div className="p-4 bg-accent/5 border-2 border-black">
              <div className="text-3xl font-black italic tracking-tighter text-black">
                {stats.classes}
              </div>
              <div className="text-[10px] font-black uppercase opacity-50 text-black tracking-widest mt-1">
                Lớp học đang mở
              </div>
            </div>
            <div className="p-4 bg-accent/5 border-2 border-black">
              <div className="text-3xl font-black italic tracking-tighter text-black">
                {stats.teachers}
              </div>
              <div className="text-[10px] font-black uppercase opacity-50 text-black tracking-widest mt-1">
                Giáo viên
              </div>
            </div>
            <div className="p-4 bg-accent/5 border-2 border-black">
              <div className="text-3xl font-black italic tracking-tighter text-black">
                {stats.students}
              </div>
              <div className="text-[10px] font-black uppercase opacity-50 text-black tracking-widest mt-1">
                Học sinh
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
