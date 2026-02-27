import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { Plus, Trash2, FileText } from "lucide-preact";

interface Topic {
  id: string;
  name: string;
  grade: number;
}

interface Lesson {
  id: string;
  title: string;
  topicId: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  grade: number;
  topicId: string;
  lesson: string;
  isPublic: boolean;
  createdBy: string;
}

interface CreateTestFormProps {
  user?: any;
  onSuccess?: () => void;
}

export default function CreateTestForm({ user, onSuccess }: CreateTestFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const [grade, setGrade] = useState("10");
  const [topicId, setTopicId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [useRandomSelection, setUseRandomSelection] = useState(false);
  const [randomCount, setRandomCount] = useState(5);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [fetchingLessons, setFetchingLessons] = useState(false);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);

  // Fetch topics when grade changes
  useEffect(() => {
    const fetchTopics = async () => {
      setFetchingTopics(true);
      try {
        const res = await fetch(`/api/textbook/topics?grade=${grade}`);
        if (res.ok) {
          const data = await res.json();
          setTopics(data);
          if (data.length > 0) setTopicId(data[0].id);
          else setTopicId("");
        }
      } catch (err) {
        console.error("Error fetching topics:", err);
      } finally {
        setFetchingTopics(false);
      }
    };
    fetchTopics();
  }, [grade]);

  // Fetch lessons when topic changes
  useEffect(() => {
    if (!topicId) {
      setLessons([]);
      setLessonId("");
      return;
    }

    const fetchLessons = async () => {
      setFetchingLessons(true);
      try {
        const res = await fetch(`/api/textbook/lessons?topicId=${topicId}`);
        if (res.ok) {
          const data = await res.json();
          setLessons(data);
          if (data.length > 0) setLessonId(data[0].id);
          else setLessonId("");
        }
      } catch (err) {
        console.error("Error fetching lessons:", err);
      } finally {
        setFetchingLessons(false);
      }
    };
    fetchLessons();
  }, [topicId]);

  // Fetch available questions when topic/lesson changes
  useEffect(() => {
    if (!topicId) {
      setAvailableQuestions([]);
      return;
    }

    const fetchQuestions = async () => {
      setFetchingQuestions(true);
      try {
        const params = new URLSearchParams({ topicId });
        if (lessonId) params.append("lessonId", lessonId);
        
        const res = await fetch(`/api/questions/available?${params}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableQuestions(data);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setFetchingQuestions(false);
      }
    };
    fetchQuestions();
  }, [topicId, lessonId]);

  const toggleQuestion = (questionId: string) => {
    if (useRandomSelection) return; // Don't allow manual selection when random mode is on
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) newSelected.delete(questionId);
    else newSelected.add(questionId);
    setSelectedQuestions(newSelected);
  };

  const getRandomQuestions = () => {
    if (availableQuestions.length === 0) return;
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(randomCount, availableQuestions.length));
    setSelectedQuestions(new Set(selected.map(q => q.id)));
  };

  const handleExportPDF = async () => {
    let questionsToExport = Array.from(selectedQuestions);
    
    if (useRandomSelection) {
      if (availableQuestions.length === 0) {
        setMessage({ type: "error", text: "Không có câu hỏi nào để xuất PDF!" });
        return;
      }
      const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
      questionsToExport = shuffled.slice(0, Math.min(randomCount, availableQuestions.length)).map(q => q.id);
    } else {
      if (questionsToExport.length === 0) {
        setMessage({ type: "error", text: "Vui lòng chọn ít nhất một câu hỏi để xuất PDF!" });
        return;
      }
    }

    const params = new URLSearchParams({ 
      ids: questionsToExport.join(","),
      topicId,
      lessonId
    });
    
    window.open(`/api/questions/export-pdf?${params}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 border-4 border-black font-black uppercase italic text-sm shadow-neo-sm ${
            message.type === "success" ? "bg-primary" : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="border-4 border-black shadow-neo bg-white p-6">
        <h2 className="text-xl md:text-2xl font-black uppercase italic mb-6">
          Tạo Đề Thi Mới
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="font-black uppercase italic text-xs">
              Khối lớp
            </Label>
            <select
              value={grade}
              onChange={(e) => setGrade((e.target as HTMLSelectElement).value)}
              className="w-full h-12 border-4 border-black font-black uppercase italic text-sm px-3 bg-white shadow-neo-sm"
            >
              {[10, 11, 12].map((g) => (
                <option key={g} value={g}>Lớp {g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="font-black uppercase italic text-xs">
              Chủ đề
            </Label>
            <select
              value={topicId}
              onChange={(e) => setTopicId((e.target as HTMLSelectElement).value)}
              disabled={fetchingTopics}
              className="w-full h-12 border-4 border-black font-black uppercase italic text-sm px-3 bg-white shadow-neo-sm disabled:opacity-50"
            >
              {topics.length === 0 ? (
                <option value="">
                  {fetchingTopics ? "Đang tải..." : "Chưa có chủ đề nào"}
                </option>
              ) : (
                topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="font-black uppercase italic text-xs">
              Bài học
            </Label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId((e.target as HTMLSelectElement).value)}
              disabled={fetchingLessons || !topicId}
              className="w-full h-12 border-4 border-black font-black uppercase italic text-sm px-3 bg-white shadow-neo-sm disabled:opacity-50"
            >
              <option value="">Tất cả các bài</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-4 border-black p-4 bg-accent/10 mb-6">
          <h3 className="font-black uppercase italic text-sm mb-4">Lựa chọn câu hỏi</h3>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="selection-mode"
                checked={!useRandomSelection}
                onChange={() => {
                  setUseRandomSelection(false);
                  setSelectedQuestions(new Set());
                }}
                className="h-4 w-4 border-2 border-black accent-black"
              />
              <span className="font-black uppercase italic text-sm">Chọn thủ công</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="selection-mode"
                checked={useRandomSelection}
                onChange={() => {
                  setUseRandomSelection(true);
                  setSelectedQuestions(new Set());
                }}
                className="h-4 w-4 border-2 border-black accent-black"
              />
              <span className="font-black uppercase italic text-sm">Chọn ngẫu nhiên</span>
            </label>
          </div>

          {useRandomSelection && (
            <div className="flex items-center gap-4">
              <Label className="font-black uppercase italic text-xs">
                Số lượng câu hỏi:
              </Label>
              <Input
                type="number"
                min="1"
                max={availableQuestions.length}
                value={randomCount}
                onInput={(e) => setRandomCount(parseInt((e.target as HTMLInputElement).value) || 5)}
                className="w-24 h-10 border-2 border-black font-black text-sm px-2"
              />
              <Button
                onClick={getRandomQuestions}
                disabled={availableQuestions.length === 0}
                className="h-10 px-4 border-2 border-black font-black uppercase italic text-xs bg-primary hover:bg-primary/80 transition-colors"
              >
                Chọn ngẫu nhiên
              </Button>
            </div>
          )}
        </div>

        <div className="border-4 border-black overflow-x-auto mb-6">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-black text-white font-black uppercase italic text-sm">
              <tr>
                <th className="p-4 border-r-2 border-white/20 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 border-2 border-white accent-primary"
                    checked={selectedQuestions.size === availableQuestions.length && availableQuestions.length > 0 && !useRandomSelection}
                    onChange={() => {
                      if (!useRandomSelection) {
                        if (selectedQuestions.size === availableQuestions.length) {
                          setSelectedQuestions(new Set());
                        } else {
                          setSelectedQuestions(new Set(availableQuestions.map(q => q.id)));
                        }
                      }
                    }}
                    disabled={useRandomSelection}
                  />
                </th>
                <th className="p-4 border-r-2 border-white/20">NỘI DUNG</th>
                <th className="p-4 border-r-2 border-white/20">LOẠI</th>
                <th className="p-4 border-r-2 border-white/20">NGUỒN</th>
              </tr>
            </thead>
            <tbody className="font-bold uppercase italic text-sm divide-y-4 divide-black bg-white text-black">
              {fetchingQuestions ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    Đang tải câu hỏi...
                  </td>
                </tr>
              ) : availableQuestions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center opacity-50">
                    {topicId ? "Không có câu hỏi nào cho chủ đề/bài học này" : "Vui lòng chọn chủ đề"}
                  </td>
                </tr>
              ) : (
                availableQuestions.map((q) => (
                  <tr
                    key={q.id}
                    className={`hover:bg-accent/10 transition-colors ${
                      selectedQuestions.has(q.id) && "bg-primary/5"
                    }`}
                  >
                    <td className="p-4 border-r-4 border-black text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 border-2 border-black accent-black"
                        checked={selectedQuestions.has(q.id)}
                        onChange={() => toggleQuestion(q.id)}
                        disabled={useRandomSelection}
                      />
                    </td>
                    <td className="p-4 border-r-4 border-black max-w-md truncate">
                      {q.content}
                    </td>
                    <td className="p-4 border-r-4 border-black text-center">
                      {q.type === "TN" ? "Trắc nghiệm" : q.type === "TF" ? "Đúng/Sai" : "Tự luận"}
                    </td>
                    <td className="p-4 border-r-4 border-black text-center">
                      <span className={`px-2 py-1 text-xs border border-black ${
                        q.createdBy === user?.id ? "bg-primary" : "bg-accent"
                      }`}>
                        {q.createdBy === user?.id ? "Cá nhân" : "Hệ thống"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm font-black uppercase italic">
            {useRandomSelection 
              ? `Sẽ chọn ngẫu nhiên ${randomCount} câu hỏi` 
              : `Đã chọn: ${selectedQuestions.size} câu hỏi`
            }
          </div>
          
          <Button
            onClick={handleExportPDF}
            disabled={(useRandomSelection && availableQuestions.length === 0) || (!useRandomSelection && selectedQuestions.size === 0)}
            className="h-12 px-6 border-4 border-black font-black uppercase italic shadow-neo-sm hover:shadow-none transition-all flex items-center gap-2 bg-secondary text-black disabled:opacity-50"
          >
            <FileText className="h-5 w-5" />
            XUẤT ĐỀ PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}
