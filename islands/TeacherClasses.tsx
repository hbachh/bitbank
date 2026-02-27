import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { Textarea } from "../components/Textarea.tsx";
import { Check, Copy, Edit, Plus, Trash2, Users } from "lucide-preact";

interface ClassItem {
  id: string;
  name: string;
  grade: number;
  description: string | null;
  studentCount: number;
  inviteCode: string;
}

interface TeacherClassesProps {
  initialClasses: ClassItem[];
  user: any;
}

export default function TeacherClasses(
  { initialClasses, user }: TeacherClassesProps,
) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newClass, setNewClass] = useState({
    name: "",
    grade: "10",
    description: "",
  });

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(
          data.classes.map((c: any) => ({ ...c, studentCount: c.students })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch classes", error);
    }
  };

  const handleCreateClass = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });

      if (res.ok) {
        alert("Đã tạo lớp thành công!");
        setIsCreateOpen(false);
        setNewClass({ name: "", grade: "10", description: "" });
        fetchClasses();
      } else {
        const data = await res.json();
        alert(data.error || "Lỗi khi tạo lớp");
      }
    } catch (error) {
      alert("Lỗi khi tạo lớp");
    } finally {
      setLoading(false);
    }
  };

  const deleteClass = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa lớp này không?")) {
      try {
        const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Đã xóa lớp thành công!");
          fetchClasses();
        } else {
          alert("Lỗi khi xóa lớp");
        }
      } catch (e) {
        alert("Lỗi khi xóa lớp");
      }
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          className={`gap-2 h-10 md:h-12 px-4 md:px-6 font-black uppercase italic text-xs md:text-sm border-2 md:border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all ${
            isCreateOpen ? "bg-red-500 text-white" : "bg-primary"
          }`}
        >
          {isCreateOpen ? "HỦY BỎ" : (
            <span className="flex items-center gap-2">
              <Plus className="h-3 w-3 md:h-4 md:w-4" /> TẠO LỚP MỚI
            </span>
          )}
        </Button>
      </div>

      {isCreateOpen && (
        <Card className="border-2 md:border-4 border-black shadow-neo bg-white">
          <div className="p-4 md:p-8 space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-black">
              TẠO LỚP HỌC MỚI
            </h3>
            <form
              onSubmit={handleCreateClass}
              className="space-y-3 md:space-y-4"
            >
              <div className="space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="name"
                  className="text-[10px] md:text-xs font-black uppercase italic text-black"
                >
                  Tên lớp
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="VÍ DỤ: LỚP 10A1"
                  value={newClass.name}
                  onInput={(e) =>
                    setNewClass({
                      ...newClass,
                      name: (e.target as HTMLInputElement).value,
                    })}
                  className="h-10 md:h-12 border-2 md:border-4 border-black font-black uppercase italic text-xs md:text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="grade"
                  className="text-[10px] md:text-xs font-black uppercase italic text-black"
                >
                  Khối lớp
                </Label>
                <select
                  id="grade"
                  className="flex h-10 md:h-12 w-full border-2 md:border-4 border-black bg-white px-3 py-2 text-xs md:text-sm font-black uppercase italic focus:outline-none focus:ring-0 text-black"
                  value={newClass.grade}
                  onChange={(e) =>
                    setNewClass({
                      ...newClass,
                      grade: (e.target as HTMLSelectElement).value,
                    })}
                >
                  <option value="10">KHỐI 10</option>
                  <option value="11">KHỐI 11</option>
                  <option value="12">KHỐI 12</option>
                </select>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="description"
                  className="text-[10px] md:text-xs font-black uppercase italic text-black"
                >
                  Mô tả (Tùy chọn)
                </Label>
                <Textarea
                  id="description"
                  placeholder="MÔ TẢ VỀ LỚP HỌC..."
                  value={newClass.description}
                  onInput={(e) =>
                    setNewClass({
                      ...newClass,
                      description: (e.target as HTMLTextAreaElement).value,
                    })}
                  className="text-xs md:text-sm"
                />
              </div>
              <div className="flex justify-end pt-2 md:pt-4">
                <Button
                  type="submit"
                  className="h-10 md:h-12 px-8 md:px-12 font-black uppercase italic text-xs md:text-sm border-2 md:border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all bg-black text-white"
                  disabled={loading}
                >
                  {loading ? "ĐANG XỬ LÝ..." : "TẠO LỚP NGAY"}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0
          ? (
            <div className="col-span-3 text-center py-12 border-4 border-dashed border-black bg-accent">
              <Users className="h-12 w-12 mx-auto text-black mb-4 opacity-50" />
              <h3 className="text-xl font-black uppercase italic">
                Chưa có lớp học nào
              </h3>
              <p className="text-black font-bold uppercase tracking-tight mt-2 opacity-70">
                Hãy tạo lớp học mới để bắt đầu quản lý học sinh
              </p>
            </div>
          )
          : (
            classes.map((cls) => (
              <Card
                key={cls.id}
                className="border-4 border-black shadow-neo hover:-translate-y-1 transition-transform group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl md:text-2xl font-black uppercase italic group-hover:text-primary transition-colors">
                      {cls.name}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 md:h-10 md:w-10 p-0 border-2 border-black bg-white text-black"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteClass(cls.id)}
                        className="h-8 w-8 md:h-10 md:w-10 p-0 border-2 border-black text-red-500 hover:bg-red-500 hover:text-white bg-white"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 p-2 md:p-3 bg-accent/30 border-2 border-black">
                      <span className="text-[10px] md:text-xs font-black uppercase italic text-black">
                        Mã mời:
                      </span>
                      <code className="text-xs md:text-sm font-black text-primary">
                        {cls.inviteCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cls.inviteCode, cls.id)}
                        className="ml-auto p-1 h-auto text-black"
                      >
                        {copiedId === cls.id
                          ? (
                            <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                          )
                          : <Copy className="h-3 w-3 md:h-4 md:w-4" />}
                      </Button>
                    </div>

                    <p className="text-[10px] md:text-sm font-bold uppercase tracking-tight line-clamp-2 opacity-70 text-black leading-tight">
                      {cls.description || "Không có mô tả"}
                    </p>

                    <div className="flex justify-between items-center text-[8px] md:text-xs font-black uppercase italic text-black">
                      <span className="bg-secondary/50 px-1.5 md:px-2 py-0.5 md:py-1 border-2 border-black">
                        KHỐI {cls.grade}
                      </span>
                      <span className="bg-primary px-1.5 md:px-2 py-0.5 md:py-1 border-2 border-black">
                        {cls.studentCount} HỌC SINH
                      </span>
                    </div>

                    <a href={`/class?id=${cls.id}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full h-10 md:h-12 justify-between border-2 border-black font-black uppercase italic text-[10px] md:text-sm hover:bg-black hover:text-white transition-all text-black bg-white"
                      >
                        QUẢN LÝ LỚP <Users className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            ))
          )}
      </div>
    </div>
  );
}
