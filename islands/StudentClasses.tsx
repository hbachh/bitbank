import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Input } from "../components/Input.tsx";
import { ArrowRight, Plus, Users } from "lucide-preact";

interface ClassItem {
  id: string;
  name: string;
  teacherName: string;
  studentCount: number;
  description: string | null;
}

interface StudentClassesProps {
  initialClasses: ClassItem[];
  user: any;
}

export default function StudentClasses(
  { initialClasses, user }: StudentClassesProps,
) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinClass = async (e: Event) => {
    e.preventDefault();
    if (!joinCode) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Tham gia lớp thành công!`);
        setJoinCode("");

        // Re-fetch classes or redirect
        const fetchRes = await fetch("/api/classes");
        if (fetchRes.ok) {
          const fetchResult = await fetchRes.json();
          setClasses(fetchResult.classes);
        }
      } else {
        const data = await res.json();
        if (data.message === "Already enrolled") {
          setError("Bạn đã tham gia lớp này rồi");
        } else {
          setError(data.error || "Mã lớp không hợp lệ");
        }
      }
    } catch (err) {
      setError("Lỗi khi tham gia lớp");
    } finally {
      setLoading(false);
    }
  };

  const navigateToClass = (classId: string) => {
    window.location.href = `/class?id=${classId}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex w-full md:w-auto gap-3 md:gap-4">
        <form
          onSubmit={handleJoinClass}
          className="flex w-full md:w-auto gap-2"
        >
          <Input
            placeholder="NHẬP MÃ LỚP ĐỂ THAM GIA..."
            value={joinCode}
            onInput={(e) => setJoinCode((e.target as HTMLInputElement).value)}
            className="md:w-64 border-2 md:border-4 border-black font-black uppercase italic text-xs md:text-sm h-10 md:h-12"
          />
          <Button
            type="submit"
            className="h-10 md:h-12 px-4 md:px-8 font-black uppercase italic text-xs md:text-sm border-2 md:border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0 transition-all bg-black text-white"
            disabled={loading || !joinCode}
          >
            {loading
              ? "ĐANG XỬ LÝ..."
              : (
                <span className="flex items-center gap-2">
                  <Plus className="h-3 w-3 md:h-4 md:w-4" /> THAM GIA
                </span>
              )}
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 text-sm font-black uppercase bg-red-100 border-4 border-black shadow-neo-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0
          ? (
            <div className="col-span-3 text-center py-12 border-4 border-dashed border-black bg-accent">
              <Users className="h-12 w-12 mx-auto text-black mb-4 opacity-50" />
              <h3 className="text-xl font-black uppercase italic">
                Chưa tham gia lớp học nào
              </h3>
              <p className="text-black font-bold uppercase tracking-tight mt-2 opacity-70">
                Hãy nhập mã lớp do giáo viên cung cấp để bắt đầu
              </p>
            </div>
          )
          : (
            classes.map((cls) => (
              <Card
                key={cls.id}
                className="border-4 border-black shadow-neo hover:-translate-y-1 transition-transform cursor-pointer group bg-white"
                onClick={() => navigateToClass(cls.id)}
              >
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl md:text-2xl font-black uppercase italic group-hover:text-primary transition-colors text-black">
                      {cls.name}
                    </h3>
                    <div className="p-1.5 md:p-2 bg-secondary border-2 border-black">
                      <Users className="h-4 w-4 md:h-5 md:w-5 text-black" />
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <p className="text-[10px] md:text-sm font-bold uppercase tracking-tight line-clamp-2 opacity-70 text-black leading-tight">
                      {cls.description || "Không có mô tả"}
                    </p>
                    <div className="flex justify-between items-center text-[8px] md:text-xs font-black uppercase italic text-black">
                      <span className="bg-accent/50 px-1.5 md:px-2 py-0.5 md:py-1 border-2 border-black uppercase italic">
                        HỌC KỲ 2
                      </span>
                      <span className="bg-primary px-1.5 md:px-2 py-0.5 md:py-1 border-2 border-black uppercase italic">
                        {cls.studentCount} HỌC SINH
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-10 md:h-12 justify-between border-2 border-black font-black uppercase italic text-[10px] md:text-sm group-hover:bg-black group-hover:text-white transition-all text-black bg-white"
                    >
                      XEM CHI TIẾT{" "}
                      <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
      </div>
    </div>
  );
}
