import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Edit, FileText, Plus, Search, Trash2, X } from "lucide-preact";
import CreateQuestionForm from "./CreateQuestionForm.tsx";
import { cn } from "../lib/utils.ts";

interface QuestionBankManagerProps {
  initialQuestions: any[];
  user?: any;
  /** When true, hide create/edit controls and only allow delete. */
  deleteOnly?: boolean;
}

export default function QuestionBankManager(
  { initialQuestions, user, deleteOnly = false }: QuestionBankManagerProps,
) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [topics, setTopics] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");

  const handleEdit = (q: any) => {
    setEditingQuestion(q);
    setShowCreateForm(true);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleExportDocument = async () => {
    if (user?.role === "admin") {
      alert("Tính năng Xuất tài liệu bị vô hiệu hóa cho Admin.");
      return;
    }
    if (selectedIds.size === 0) {
      alert("Vui lòng chọn ít nhất một câu hỏi để xuất tài liệu!");
      return;
    }

    const ids = Array.from(selectedIds);
    const params = new URLSearchParams();
    params.set("ids", ids.join(","));
    
    // Open export options modal or redirect to export page
    const exportUrl = `/api/questions/export-document?${params.toString()}`;
    window.open(exportUrl, "_blank");
  };

  // Fetch all topics to map topicId to name
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch("/api/textbook/topics");
        if (res.ok) {
          const data = await res.json();
          const topicMap: Record<string, string> = {};
          data.forEach((t: any) => {
            topicMap[t.id] = t.name;
          });
          setTopics(topicMap);
        }
      } catch (err) {
        console.error("Error fetching topics for mapping:", err);
      }
    };
    fetchTopics();
  }, []);

  const filteredQuestions = initialQuestions.filter((q) =>
    (searchQuery && (
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.lesson && q.lesson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topicId &&
        topics[q.topicId]?.toLowerCase().includes(searchQuery.toLowerCase()))
    )) ||
    (!searchQuery && (
      (selectedTopic && q.topicId === selectedTopic) ||
      (selectedLesson && q.lesson === selectedLesson) ||
      (!selectedTopic && !selectedLesson)
    ))
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic leading-tight text-black">
            Ngân hàng câu hỏi
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
            {deleteOnly
              ? "Quản trị viên xem và xóa câu hỏi trong hệ thống"
              : "Xem và quản lý ngân hàng câu hỏi hệ thống"}
          </p>
        </div>
        {!deleteOnly && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleExportDocument}
              className={cn(
                "h-10 md:h-12 px-4 border-4 border-black font-black uppercase italic shadow-neo-sm hover:shadow-none transition-all flex items-center gap-2 bg-secondary text-black",
                selectedIds.size === 0 && "opacity-50",
              )}
            >
              <FileText className="h-4 w-4 md:h-5 md:w-5" />
              XUẤT THÀNH TÀI LIỆU ({selectedIds.size})
            </Button>
            <Button
              onClick={() => {
                setEditingQuestion(null);
                setShowCreateForm(!showCreateForm);
              }}
              className={`h-10 md:h-12 px-6 border-4 border-black font-black uppercase italic shadow-neo-sm hover:shadow-none transition-all flex items-center gap-2 ${
                showCreateForm
                  ? "bg-red-500 text-white"
                  : "bg-primary text-black"
              }`}
            >
              {showCreateForm
                ? <X className="h-4 w-4 md:h-5 md:w-5" />
                : <Plus className="h-4 w-4 md:h-5 md:w-5" />}
              {showCreateForm ? "ĐÓNG FORM" : "TẠO CÂU HỎI MỚI"}
            </Button>
          </div>
        )}
      </div>

      {!deleteOnly && showCreateForm && (
        <Card className="border-4 border-black shadow-neo bg-white p-4 md:p-8">
          <div className="mb-6 flex justify-between items-center border-b-4 border-black pb-4">
            <h2 className="text-xl md:text-2xl font-black uppercase italic">
              {editingQuestion ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}
            </h2>
            <Button
              variant="ghost"
              onClick={() => {
                setEditingQuestion(null);
                setShowCreateForm(false);
              }}
              className="p-0 h-8 w-8"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <CreateQuestionForm
            initialData={editingQuestion}
            onSuccess={() => {
              setEditingQuestion(null);
              setShowCreateForm(false);
              window.location.reload();
            }}
          />
        </Card>
      )}

      <Card className="border-4 border-black shadow-neo bg-white">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic((e.target as HTMLSelectElement).value)}
                className="w-full h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm focus:outline-none bg-white text-black mb-2"
              >
                <option value="">Tất cả chủ đề</option>
                {Object.entries(topics).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="TÌM KIẾM CÂU HỎI THEO NỘI DUNG, CHỦ ĐỀ, BÀI HỌC..."
                value={searchQuery}
                onInput={(e) =>
                  setSearchQuery((e.target as HTMLInputElement).value)}
                className="w-full h-10 md:h-12 pl-10 pr-4 border-4 border-black font-black uppercase italic text-xs md:text-sm focus:outline-none bg-white text-black"
              />
            </div>
          </div>

          <div className="border-4 border-black overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-black text-white font-black uppercase italic text-[10px] md:text-sm">
                <tr>
                  {!deleteOnly && (
                    <th className="p-3 md:p-4 border-r-2 border-white/20 w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 border-2 border-white accent-primary"
                        checked={selectedIds.size ===
                            filteredQuestions.length &&
                          filteredQuestions.length > 0}
                        onChange={() => {
                          if (
                            selectedIds.size === filteredQuestions.length
                          ) setSelectedIds(new Set());
                          else {
                            setSelectedIds(
                              new Set(filteredQuestions.map((q) => q.id)),
                            );
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="p-3 md:p-4 border-r-2 border-white/20">
                    NỘI DUNG
                  </th>
                  <th className="p-3 md:p-4 border-r-2 border-white/20">
                    LOẠI
                  </th>
                  <th className="p-3 md:p-4 border-r-2 border-white/20">
                    KHỐI
                  </th>
                  <th className="p-3 md:p-4 border-r-2 border-white/20 text-center">
                    BÀI HỌC / CHỦ ĐỀ
                  </th>
                  <th className="p-3 md:p-4">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="font-bold uppercase italic text-[10px] md:text-sm divide-y-4 divide-black bg-white text-black">
                {filteredQuestions.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 md:p-12 text-center bg-accent/10 opacity-50"
                      >
                        {searchQuery
                          ? "Không tìm thấy câu hỏi nào phù hợp"
                          : "Chưa có câu hỏi nào trong ngân hàng"}
                      </td>
                    </tr>
                  )
                  : (
                    filteredQuestions.map((q: any) => (
                      <tr
                        key={q.id}
                        className={cn(
                          "hover:bg-accent/10 transition-colors",
                          selectedIds.has(q.id) && "bg-primary/5",
                        )}
                      >
                        {!deleteOnly && (
                          <td className="p-3 md:p-4 border-r-4 border-black text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 border-2 border-black accent-black"
                              checked={selectedIds.has(q.id)}
                              onChange={() => toggleSelect(q.id)}
                            />
                          </td>
                        )}
                        <td className="p-3 md:p-4 border-r-4 border-black max-w-[200px] md:max-w-md truncate">
                          <div className="font-black mb-1">{q.content}</div>
                        </td>
                        <td className="p-3 md:p-4 border-r-4 border-black text-center">
                          {q.type}
                        </td>
                        <td className="p-3 md:p-4 border-r-4 border-black text-center">
                          {q.grade}
                        </td>
                        <td className="p-3 md:p-4 border-r-4 border-black text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <span className="bg-accent px-1.5 py-0.5 border border-black text-[8px] md:text-[10px]">
                              {q.lesson || "CHƯA CÓ BÀI HỌC"}
                            </span>
                            <span className="text-[8px] md:text-[9px] opacity-70 uppercase font-black truncate max-w-[120px]">
                              {topics[q.topicId] || "CHƯA PHÂN LOẠI"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 md:p-4">
                          <div className="flex gap-2 justify-center">
                            {!deleteOnly && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(q)}
                                className="h-7 w-7 md:h-8 md:w-8 p-0 border-2 border-black bg-white text-black hover:bg-primary"
                              >
                                <Edit className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteQuestion(q.id)}
                              className="h-7 w-7 md:h-8 md:w-8 p-0 border-2 border-black bg-white text-black hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
