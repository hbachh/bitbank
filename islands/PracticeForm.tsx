import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { BookOpen, Play, Settings2 } from "lucide-preact";

interface PracticeFormProps {
  topics: any[];
}

export default function PracticeForm({ topics }: PracticeFormProps) {
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [fetchingLessons, setFetchingLessons] = useState(false);

  const [formData, setFormData] = useState({
    title: "BÀI TỰ LUYỆN - " + new Date().toLocaleDateString(),
    topicId: topics.length > 0 ? topics[0].id : "",
    lessonId: "",
    config: {
      tnCount: 10,
      tfCount: 0,
      saCount: 0,
    },
  });

  useEffect(() => {
    if (!formData.topicId) {
      setLessons([]);
      return;
    }
    const fetchLessons = async () => {
      setFetchingLessons(true);
      try {
        const res = await fetch(
          `/api/textbook/lessons?topicId=${formData.topicId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setLessons(data);
          setFormData((prev) => ({ ...prev, lessonId: "" }));
        }
      } catch (err) {
        console.error("Error fetching lessons:", err);
      } finally {
        setFetchingLessons(false);
      }
    };
    fetchLessons();
  }, [formData.topicId]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);

    try {
      // We'll reuse the assignment creation API but mark it as 'practice'
      const res = await fetch("/api/assignments/create-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        window.location.href = `/exam/practice/${result.id}`;
      } else {
        alert(result.error || "Lỗi khi tạo bài luyện tập");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-4 border-black shadow-neo-lg bg-white overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[10px] md:text-xs font-black uppercase italic text-black">
                Chủ đề cần ôn tập
              </Label>
              <select
                className="flex h-10 md:h-12 w-full border-4 border-black bg-white px-3 py-2 text-xs md:text-sm font-black uppercase italic focus:outline-none text-black"
                value={formData.topicId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    topicId: (e.target as HTMLSelectElement).value,
                  })}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[10px] md:text-xs font-black uppercase italic text-black">
                Bài học cụ thể (Tùy chọn)
              </Label>
              <select
                className="flex h-10 md:h-12 w-full border-4 border-black bg-white px-3 py-2 text-xs md:text-sm font-black uppercase italic focus:outline-none text-black disabled:opacity-50"
                value={formData.lessonId}
                disabled={fetchingLessons}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lessonId: (e.target as HTMLSelectElement).value,
                  })}
              >
                <option value="">Tất cả các bài</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 md:p-6 border-4 border-black bg-accent/10 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="h-5 w-5" />
              <h4 className="font-black uppercase italic text-sm">
                Số lượng câu hỏi luyện tập
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">
                  Trắc nghiệm (TN)
                </Label>
                <Input
                  type="number"
                  value={formData.config.tnCount}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        tnCount:
                          parseInt((e.target as HTMLInputElement).value) || 0,
                      },
                    })}
                  className="h-10 border-2 border-black font-black"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">
                  Đúng / Sai (TF)
                </Label>
                <Input
                  type="number"
                  value={formData.config.tfCount}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        tfCount:
                          parseInt((e.target as HTMLInputElement).value) || 0,
                      },
                    })}
                  className="h-10 border-2 border-black font-black"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">
                  Tự luận (SA)
                </Label>
                <Input
                  type="number"
                  value={formData.config.saCount}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        saCount:
                          parseInt((e.target as HTMLInputElement).value) || 0,
                      },
                    })}
                  className="h-10 border-2 border-black font-black"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 bg-muted/30 border-t-4 border-black flex justify-center">
          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto h-12 md:h-16 px-8 md:px-16 text-sm md:text-xl font-black uppercase italic border-4 border-black shadow-neo hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all bg-primary text-black"
          >
            {loading ? "ĐANG CHUẨN BỊ..." : "BẮT ĐẦU LUYỆN TẬP NGAY"}
            <Play className="ml-3 h-6 w-6 fill-current" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
