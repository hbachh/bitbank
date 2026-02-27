import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Input } from "../components/Input.tsx";
import {
  BookOpen,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-preact";
import { cn } from "../lib/utils.ts";

interface Topic {
  id: string;
  name: string;
  grade: number;
  subject?: string | null;
}

interface Lesson {
  id: string;
  title: string;
  topicId: string;
}

interface AdminSubjectManagerProps {
  initialTopics: Topic[];
}

export default function AdminSubjectManager(
  { initialTopics }: AdminSubjectManagerProps,
) {
  const [topics, setTopics] = useState(initialTopics);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newTopic, setNewTopic] = useState({
    name: "",
    grade: "10",
    subject: "Tin học",
  });
  const [newLessonTitle, setNewLessonTitle] = useState("");

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchLessons = async (topic: Topic) => {
    setSelectedTopic(topic);
    try {
      const res = await fetch(`/api/textbook/lessons?topicId=${topic.id}`);
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addTopic = async () => {
    if (!newTopic.name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/textbook/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTopic),
      });
      if (res.ok) {
        const data = await res.json();
        setTopics([...topics, {
          id: data.id,
          ...newTopic,
          grade: parseInt(newTopic.grade),
        }]);
        setNewTopic({ name: "", grade: "10", subject: "Tin học" });
        setShowAddTopic(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTopic = async (id: string) => {
    if (!confirm("Xóa chủ đề này sẽ xóa tất cả bài học liên quan?")) return;
    const res = await fetch(`/api/textbook/topics?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTopics(topics.filter((t) => t.id !== id));
      if (selectedTopic?.id === id) setSelectedTopic(null);
    }
  };

  const addLesson = async () => {
    if (!newLessonTitle || !selectedTopic) return;
    setLoading(true);
    try {
      const res = await fetch("/api/textbook/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          title: newLessonTitle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLessons([...lessons, {
          id: data.id,
          title: newLessonTitle,
          topicId: selectedTopic.id,
        }]);
        setNewLessonTitle("");
        setShowAddLesson(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (id: string) => {
    const res = await fetch(`/api/textbook/lessons?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLessons(lessons.filter((l) => l.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
      {/* Topics List - Left Column */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex justify-between items-end mb-2">
          <h3 className="font-black uppercase italic text-xl tracking-tight">
            Chủ đề sách khoa
          </h3>
          <Button
            onClick={() => setShowAddTopic(true)}
            size="sm"
            className="bg-primary text-black border-2 border-black shadow-neo-sm h-9 px-4 font-black uppercase italic text-xs"
          >
            <Plus className="h-4 w-4 mr-2" /> Thêm chủ đề
          </Button>
        </div>

        <Card className="border-4 border-black shadow-neo bg-white flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b-4 border-black bg-accent/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
              <Input
                placeholder="Tìm kiếm chủ đề..."
                value={searchTerm}
                onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                className="h-10 pl-10 border-2 border-black font-black uppercase italic text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {showAddTopic && (
              <div className="p-4 border-4 border-black bg-secondary/10 space-y-4 mb-4 animate-in slide-in-from-top duration-200">
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs uppercase italic tracking-widest text-black/60">
                    Tạo chủ đề mới
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddTopic(false)} className="h-6 w-6 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Tên chủ đề (VD: Chủ đề 1: Máy tính...)"
                  value={newTopic.name}
                  onInput={(e) =>
                    setNewTopic({
                      ...newTopic,
                      name: (e.target as HTMLInputElement).value,
                    })}
                  className="h-10 border-2 border-black font-black"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-50 ml-1">Khối lớp</label>
                    <select
                      value={newTopic.grade}
                      onChange={(e) =>
                        setNewTopic({
                          ...newTopic,
                          grade: (e.target as HTMLSelectElement).value,
                        })}
                      className="w-full h-10 border-2 border-black font-black uppercase italic px-2 bg-white text-xs"
                    >
                      <option value="10">Lớp 10</option>
                      <option value="11">Lớp 11</option>
                      <option value="12">Lớp 12</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-50 ml-1">Môn học</label>
                    <Input
                      placeholder="VD: Tin học"
                      value={newTopic.subject || ""}
                      onInput={(e) =>
                        setNewTopic({
                          ...newTopic,
                          subject: (e.target as HTMLInputElement).value,
                        })}
                      className="h-10 border-2 border-black font-black text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={addTopic}
                  disabled={loading || !newTopic.name}
                  className="w-full h-10 bg-black text-white font-black uppercase italic shadow-neo-sm active:translate-x-0 active:translate-y-0 transition-all"
                >
                  {loading ? "ĐANG LƯU..." : "XÁC NHẬN LƯU"}
                </Button>
              </div>
            )}

            {filteredTopics.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                <Search className="h-12 w-12 mb-4" />
                <p className="font-black uppercase italic text-sm">Không tìm thấy chủ đề nào</p>
              </div>
            ) : (
              filteredTopics.map((t) => (
                <div
                  key={t.id}
                  onClick={() => fetchLessons(t)}
                  className={cn(
                    "group p-4 border-4 border-black cursor-pointer transition-all flex justify-between items-center relative",
                    selectedTopic?.id === t.id
                      ? "bg-primary translate-x-1 translate-y-1 shadow-none"
                      : "bg-white shadow-neo-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-black text-white uppercase italic">
                        LỚP {t.grade}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-accent border border-black uppercase italic">
                        {t.subject || "GENERAL"}
                      </span>
                    </div>
                    <p className="font-black uppercase italic text-sm tracking-tight truncate">
                      {t.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTopic(t.id);
                      }}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white border-2 border-transparent hover:border-black"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className={cn(
                      "h-5 w-5 transition-transform",
                      selectedTopic?.id === t.id && "translate-x-1"
                    )} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Lessons List - Right Column */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex justify-between items-end mb-2">
          <h3 className="font-black uppercase italic text-xl tracking-tight">
            {selectedTopic ? "Danh sách bài học" : "Nội dung chi tiết"}
          </h3>
          {selectedTopic && (
            <Button
              onClick={() => setShowAddLesson(true)}
              size="sm"
              className="bg-secondary text-black border-2 border-black shadow-neo-sm h-9 px-4 font-black uppercase italic text-xs"
            >
              <Plus className="h-4 w-4 mr-2" /> Thêm bài học
            </Button>
          )}
        </div>

        <Card className="border-4 border-black shadow-neo bg-white flex flex-col h-[600px] overflow-hidden">
          {!selectedTopic ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-accent/10 border-4 border-dashed border-black/20 flex items-center justify-center mb-6">
                <BookOpen className="h-12 w-12 opacity-20" />
              </div>
              <p className="font-black uppercase italic text-xl text-black/30 max-w-[280px]">
                Chọn một chủ đề để quản lý bài học
              </p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b-4 border-black bg-primary/10 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">ĐANG QUẢN LÝ CHỦ ĐỀ</span>
                  <div className="h-1 flex-1 bg-black/10" />
                </div>
                <h4 className="font-black uppercase italic text-lg tracking-tight">
                  {selectedTopic.name}
                </h4>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {showAddLesson && (
                  <div className="p-5 border-4 border-black bg-accent/10 space-y-4 mb-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs uppercase italic text-black/60">Thêm bài học mới</span>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddLesson(false)} className="h-6 w-6 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Tên bài học (VD: Bài 1: Thông tin là gì?)"
                      value={newLessonTitle}
                      onInput={(e) =>
                        setNewLessonTitle((e.target as HTMLInputElement).value)}
                      className="h-12 border-2 border-black font-black uppercase italic text-sm"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowAddLesson(false)}
                        variant="outline"
                        className="flex-1 h-10 border-2 border-black font-black uppercase italic text-xs"
                      >
                        HỦY BỎ
                      </Button>
                      <Button
                        onClick={addLesson}
                        disabled={loading || !newLessonTitle}
                        className="flex-[2] h-10 bg-black text-white font-black uppercase italic shadow-neo-sm active:translate-x-0 active:translate-y-0 transition-all"
                      >
                        {loading ? "ĐANG LƯU..." : "LƯU BÀI HỌC"}
                      </Button>
                    </div>
                  </div>
                )}

                {lessons.length === 0 ? (
                  <div className="p-20 text-center border-4 border-dashed border-black/20 bg-accent/5">
                    <p className="font-black uppercase italic text-sm opacity-30">
                      Chủ đề này chưa có bài học nào
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {lessons.map((l) => (
                      <div
                        key={l.id}
                        className="group p-5 border-4 border-black bg-white flex justify-between items-center shadow-neo-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 bg-black text-white flex items-center justify-center font-black text-xs border-2 border-black">
                            {lessons.indexOf(l) + 1}
                          </div>
                          <span className="font-black uppercase italic text-sm tracking-tight">
                            {l.title}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLesson(l.id)}
                          className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white border-2 border-transparent hover:border-black"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
