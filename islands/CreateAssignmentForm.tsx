import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { BookOpen, Calendar, Clock, Settings2 } from "lucide-preact";

interface CreateAssignmentFormProps {
  classes: any[];
  initialClassId?: string;
}

interface Topic {
  id: string;
  name: string;
  grade: number;
}

interface Lesson {
  id: string;
  title: string;
}

export default function CreateAssignmentForm(
  { classes, initialClassId }: CreateAssignmentFormProps,
) {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [fetchingLessons, setFetchingLessons] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: initialClassId || (classes.length > 0 ? classes[0].id : ""),
    duration: "45",
    endTime: "",
    topicId: "",
    lessonId: "",
    maxAttempts: "1",
    config: {
      tnCount: 10,
      tfCount: 5,
      saCount: 2,
    },
  });

  // Get grade of selected class to fetch appropriate topics
  const selectedClass = classes.find((c) => c.id === formData.classId);
  const classGrade = selectedClass?.grade || 10;

  useEffect(() => {
    const fetchTopics = async () => {
      setFetchingTopics(true);
      try {
        const res = await fetch(`/api/textbook/topics?grade=${classGrade}`);
        if (res.ok) {
          const data = await res.json();
          setTopics(data);
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, topicId: data[0].id }));
          }
        }
      } catch (err) {
        console.error("Error fetching topics:", err);
      } finally {
        setFetchingTopics(false);
      }
    };
    fetchTopics();
  }, [classGrade]);

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
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, lessonId: data[0].id }));
          } else setFormData((prev) => ({ ...prev, lessonId: "" }));
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
      const res = await fetch("/api/assignments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Tạo bài tập thành công!");
        window.location.href = `/class?id=${formData.classId}`;
      } else {
        alert(result.error || "Lỗi khi tạo bài tập");
      }
    } catch (err) {
      alert("Lỗi khi xử lý");
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
              <Label
                htmlFor="title"
                className="text-[10px] md:text-xs font-black uppercase italic text-black"
              >
                Tiêu đề bài tập
              </Label>
              <Input
                id="title"
                required
                placeholder="VD: KIỂM TRA 15 PHÚT CHƯƠNG 1"
                value={formData.title}
                onInput={(e) =>
                  setFormData({
                    ...formData,
                    title: (e.target as HTMLInputElement).value,
                  })}
                className="h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm text-black"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label
                htmlFor="classId"
                className="text-[10px] md:text-xs font-black uppercase italic text-black"
              >
                Lớp học áp dụng
              </Label>
              <select
                id="classId"
                className="flex h-10 md:h-12 w-full border-4 border-black bg-white px-3 py-2 text-xs md:text-sm font-black uppercase italic focus:outline-none focus:ring-0 text-black"
                value={formData.classId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    classId: (e.target as HTMLSelectElement).value,
                  })}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (KHỐI {c.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            <div className="space-y-1.5 md:space-y-2">
              <Label
                htmlFor="topicId"
                className="text-[10px] md:text-xs font-black uppercase italic text-black"
              >
                Chủ đề sách giáo khoa
              </Label>
              <select
                id="topicId"
                className="flex h-10 md:h-12 w-full border-4 border-black bg-white px-3 py-2 text-xs md:text-sm font-black uppercase italic focus:outline-none focus:ring-0 text-black disabled:opacity-50"
                value={formData.topicId}
                disabled={fetchingTopics}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    topicId: (e.target as HTMLSelectElement).value,
                  })}
              >
                {topics.length === 0
                  ? (
                    <option value="">
                      {fetchingTopics ? "Đang tải..." : "Chưa có chủ đề"}
                    </option>
                  )
                  : (
                    topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  )}
              </select>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label
                htmlFor="lessonId"
                className="text-[10px] md:text-xs font-black uppercase italic text-black"
              >
                Bài học (Theo sách)
              </Label>
              <select
                id="lessonId"
                className="flex h-10 md:h-12 w-full border-4 border-black bg-white px-3 py-2 text-xs md:text-sm font-black uppercase italic focus:outline-none focus:ring-0 text-black disabled:opacity-50"
                value={formData.lessonId}
                disabled={fetchingLessons}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lessonId: (e.target as HTMLSelectElement).value,
                  })}
              >
                {lessons.length === 0
                  ? (
                    <option value="">
                      {fetchingLessons ? "Đang tải..." : "Toàn bộ chủ đề"}
                    </option>
                  )
                  : (
                    <>
                      <option value="">Toàn bộ chủ đề</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </>
                  )}
              </select>
            </div>
          </div>

          <div className="p-4 md:p-6 border-4 border-black bg-accent/10 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="h-5 w-5" />
              <h4 className="font-black uppercase italic text-sm">
                Cấu hình số lượng câu hỏi
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
                        tnCount: parseInt((e.target as HTMLInputElement).value),
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
                        tfCount: parseInt((e.target as HTMLInputElement).value),
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
                        saCount: parseInt((e.target as HTMLInputElement).value),
                      },
                    })}
                  className="h-10 border-2 border-black font-black"
                />
              </div>
            </div>
            <p className="text-[9px] font-bold italic opacity-60">
              * Hệ thống sẽ tự động lấy câu hỏi từ ngân hàng cá nhân của giáo
              viên và ngân hàng chung của hệ thống.
            </p>
          </div>

          <div className="space-y-1.5 md:space-y-2 text-black">
            <Label
              htmlFor="description"
              className="text-[10px] md:text-xs font-black uppercase italic"
            >
              Mô tả chi tiết
            </Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Nhập hướng dẫn làm bài cho học sinh..."
              value={formData.description}
              onInput={(e) =>
                setFormData({
                  ...formData,
                  description: (e.target as HTMLTextAreaElement).value,
                })}
              className="w-full border-4 border-black p-3 font-bold text-xs md:text-sm focus:outline-none bg-white"
            />
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            <div className="space-y-1.5 md:space-y-2 text-black">
              <Label
                htmlFor="duration"
                className="text-[10px] md:text-xs font-black uppercase italic"
              >
                Thời gian làm bài (phút)
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      duration: (e.target as HTMLInputElement).value,
                    })}
                  className="h-10 md:h-12 pl-10 border-4 border-black font-black uppercase italic text-xs md:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2 text-black">
              <Label
                htmlFor="maxAttempts"
                className="text-[10px] md:text-xs font-black uppercase italic"
              >
                Số lần làm bài tối đa
              </Label>
              <div className="relative">
                <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  value={formData.maxAttempts}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      maxAttempts: (e.target as HTMLInputElement).value,
                    })}
                  className="h-10 md:h-12 pl-10 border-4 border-black font-black uppercase italic text-xs md:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2 text-black">
              <Label
                htmlFor="endTime"
                className="text-[10px] md:text-xs font-black uppercase italic"
              >
                Hạn chót nộp bài
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      endTime: (e.target as HTMLInputElement).value,
                    })}
                  className="h-10 md:h-12 pl-10 border-4 border-black font-black uppercase italic text-xs md:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 bg-muted/30 border-t-4 border-black flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto h-12 md:h-14 px-8 md:px-12 text-sm md:text-base font-black uppercase italic border-4 border-black shadow-neo hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all bg-primary text-black"
          >
            {loading ? "Đang lưu..." : "Tạo bài tập ngay"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
