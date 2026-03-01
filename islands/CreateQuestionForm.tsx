import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Input } from "../components/Input.tsx";
import { Label } from "../components/Label.tsx";
import { Plus, Trash2 } from "lucide-preact";

interface Topic {
  id: string;
  name: string;
  grade: number;
  subjectId?: string;
}

interface CreateQuestionFormProps {
  initialData?: any;
  onSuccess?: () => void;
  subjects?: any[];
  topics?: Topic[];
  isAdmin?: boolean;
}

export default function CreateQuestionForm(
  { initialData, onSuccess, subjects, topics, isAdmin }: CreateQuestionFormProps,
) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const [type, setType] = useState(initialData?.type || "TN"); // TN, TF, SA
  const [grade, setGrade] = useState(String(initialData?.grade || "10"));
  const [content, setContent] = useState(initialData?.content || "");
  const [topicId, setTopicId] = useState(initialData?.topicId || "");
  const [lessonId, setLessonId] = useState(initialData?.lessonId || "");
  const [lesson, setLesson] = useState(initialData?.lesson || "");
  const [isPublic, setIsPublic] = useState(
    initialData ? initialData.isPublic : true,
  );

  const [topicsList, setTopicsList] = useState<Topic[]>(topics || []);
  const [lessonsList, setLessonsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>(subjects || []);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [fetchingLessons, setFetchingLessons] = useState(false);

  // Parse initial data for options
  let initialOptions = ["", "", "", ""];
  let initialCorrect = 0;
  if (initialData?.type === "TN" && initialData.data) {
    try {
      const parsed = JSON.parse(initialData.data);
      initialOptions = parsed.options || ["", "", "", ""];
      initialCorrect = initialData.answer.charCodeAt(0) - 65;
    } catch (e) {}
  }

  const [options, setOptions] = useState(initialOptions);
  const [correctOption, setCorrectOption] = useState(initialCorrect);

  // TF specific: True/False with sub-questions
  const [tfContent, setTfContent] = useState("");
  const [tfSubQuestions, setTfSubQuestions] = useState([
    { text: "", answer: "true" },
    { text: "", answer: "true" },
    { text: "", answer: "true" },
    { text: "", answer: "true" },
  ]);

  // Initialize TF content and sub-questions from existing data
  if (initialData?.type === "TF" && initialData.data) {
    try {
      const parsed = JSON.parse(initialData.data);
      // Merge content and supplementary info
      const mergedContent = initialData.content || "";
      if (parsed.supplementaryInfo) {
        setTfContent(mergedContent + "\n\n" + parsed.supplementaryInfo);
      } else {
        setTfContent(mergedContent);
      }
      
      if (parsed.subQuestions && Array.isArray(parsed.subQuestions)) {
        setTfSubQuestions([
          ...parsed.subQuestions,
          ...Array(4 - parsed.subQuestions.length).fill({ text: "", answer: "true" })
        ].slice(0, 4));
      }
    } catch (e) {}
  }

  // SA specific: Short Answer
  const [saAnswer, setSaAnswer] = useState(
    initialData?.type === "SA" ? initialData.answer : "",
  );

  // Fetch subjects and topics when grade changes (only if not provided as props)
  useEffect(() => {
    if (!subjects || !topics) {
      const fetchData = async () => {
        setFetchingTopics(true);
        try {
          // Fetch subjects
          const subjectsRes = await fetch("/api/textbook/subjects");
          if (subjectsRes.ok) {
            const subjectsData = await subjectsRes.json();
            setSubjectsList(subjectsData);
          }

          // Fetch topics for selected grade
          const res = await fetch(`/api/textbook/topics?grade=${grade}`);
          if (res.ok) {
            const data = await res.json();
            setTopicsList(data);
            if (data.length > 0) {
              const firstTopicId = data[0].id;
              setTopicId(firstTopicId);
            }
            else setTopicId("");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          setFetchingTopics(false);
        }
      };
      fetchData();
    }
  }, [grade, subjects, topics]);

  // Fetch lessons when topic changes
  useEffect(() => {
    if (!topicId) {
      setLessonsList([]);
      return;
    }
    const fetchLessons = async () => {
      setFetchingLessons(true);
      try {
        const res = await fetch(`/api/textbook/lessons?topicId=${topicId}`);
        if (res.ok) {
          const data = await res.json();
          setLessonsList(data);
        }
      } catch (err) {
        console.error("Error fetching lessons:", err);
      } finally {
        setFetchingLessons(false);
      }
    };
    fetchLessons();
  }, [topicId]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation for TF questions
    if (type === "TF") {
      const filledSubQuestions = tfSubQuestions.filter(sq => sq.text.trim() !== "");
      if (filledSubQuestions.length < 2) {
        setMessage({ type: "error", text: "Câu hỏi Đúng/Sai phải có ít nhất 2 câu hỏi con." });
        setLoading(false);
        return;
      }
    }

    let answer = "";
    let data: any = null;

    if (type === "TN") {
      answer = String.fromCharCode(65 + correctOption); // A, B, C, D
      data = { options };
    } else if (type === "TF") {
      // Store TF questions with merged content and sub-questions
      const subQuestions = tfSubQuestions.map(sq => ({
        text: sq.text.trim(),
        answer: sq.answer // "true" or "false"
      }));
      
      // Split content into main content and supplementary info
      const contentParts = tfContent.split('\n\n');
      const mainContent = contentParts[0] || "";
      const supplementaryInfo = contentParts.slice(1).join('\n\n').trim();
      
      data = {
        supplementaryInfo: supplementaryInfo,
        subQuestions: subQuestions
      };
      // Store main content as the question content
      setContent(mainContent);
      // Store all answers as a comma-separated string for compatibility if needed, 
      // but the source of truth will be the JSON data
      answer = subQuestions.map(sq => sq.answer).join(",");
    } else {
      answer = saAnswer; // For SA, this is reference answer
    }

    try {
      const url = initialData
        ? "/api/questions/update"
        : "/api/questions/create";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialData?.id,
          type,
          grade,
          topicId,
          lessonId,
          lesson,
          content,
          data,
          answer,
          isPublic,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: initialData
            ? "Cập nhật thành công!"
            : "Tạo câu hỏi thành công!",
        });
        if (onSuccess) {
          setTimeout(onSuccess, 1000);
        }
        if (!initialData) {
          // Clear form if creating new
          setContent("");
          setSaAnswer("");
          setLesson("");
          setLessonId("");
        }
      } else {
        setMessage({ type: "error", text: result.error || "Lỗi khi lưu" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {message && (
        <div
          className={`p-4 border-4 border-black font-black uppercase italic text-sm shadow-neo-sm ${
            message.type === "success" ? "bg-primary" : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-black uppercase italic text-xs">
            Loại câu hỏi
          </Label>
          <select
            value={type}
            onChange={(e) => setType((e.target as HTMLSelectElement).value)}
            className="w-full h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm px-3 bg-white shadow-neo-sm"
          >
            <option value="TN">Trắc nghiệm (4 lựa chọn)</option>
            <option value="TF">Đúng / Sai</option>
            <option value="SA">Tự luận / Trả lời ngắn</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label className="font-black uppercase italic text-xs">
            Khối lớp
          </Label>
          <select
            value={grade}
            onChange={(e) => setGrade((e.target as HTMLSelectElement).value)}
            className="w-full h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm px-3 bg-white shadow-neo-sm"
          >
            {[10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}
            </option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-black uppercase italic text-xs">
            Môn học
          </Label>
          <select
            value={topicsList.find(t => t.id === topicId)?.subjectId || ""}
            onChange={(e) => {
              const subjectId = (e.target as HTMLSelectElement).value;
              // Filter topics by selected subject
              const subjectTopics = topicsList.filter(t => t.subjectId === subjectId);
              setTopicsList(subjectTopics);
              if (subjectTopics.length > 0) {
                setTopicId(subjectTopics[0].id);
              } else {
                setTopicId("");
              }
            }}
            disabled={fetchingTopics}
            className="w-full h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm px-3 bg-white shadow-neo-sm disabled:opacity-50"
          >
            <option value="">Chọn môn học</option>
            {subjectsList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="font-black uppercase italic text-xs">
            Chủ đề sách giáo khoa (Topic)
          </Label>
          <select
            value={topicId}
            onChange={(e) => {
              const newTopicId = (e.target as HTMLSelectElement).value;
              setTopicId(newTopicId);
              setLessonId(""); // Reset lesson when topic changes
            }}
            disabled={fetchingTopics}
            className="w-full h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm px-3 bg-white shadow-neo-sm disabled:opacity-50"
          >
            {topicsList.length === 0 ? (
              <option value="">
                {fetchingTopics ? "Đang tải..." : "Chưa có chủ đề nào"}
              </option>
            ) : (
              topicsList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-black uppercase italic text-xs">
            Bài học (Lesson) - Chọn từ danh sách
          </Label>
          <select
            value={lessonId}
            onChange={(e) => {
              const selLessonId = (e.target as HTMLSelectElement).value;
              setLessonId(selLessonId);
              // Also update the lesson string for compatibility
              const selectedLesson = lessonsList.find(l => l.id === selLessonId);
              if (selectedLesson) setLesson(selectedLesson.title);
            }}
            disabled={fetchingLessons || lessonsList.length === 0}
            className="w-full h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm px-3 bg-white shadow-neo-sm disabled:opacity-50"
          >
            <option value="">-- Chọn bài học --</option>
            {lessonsList.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="font-black uppercase italic text-xs">
            Hoặc nhập tên bài học tùy chỉnh
          </Label>
          <Input
            value={lesson}
            onInput={(e) => setLesson((e.target as HTMLInputElement).value)}
            placeholder="Ví dụ: Bài 1, Tiết 2..."
            className="h-10 md:h-12 border-4 border-black font-black uppercase italic text-xs md:text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-black uppercase italic text-xs">
          {type === "TF" ? "" : "Nội dung câu hỏi"}
        </Label>
        {type !== "TF" && (
          <textarea
            value={content}
            onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            required
            className="w-full min-h-[100px] border-4 border-black p-3 font-bold text-sm shadow-neo-sm focus:outline-none"
            placeholder="Nhập câu hỏi của bạn ở đây..."
          />
        )}
      </div>

      {/* Type Specific Fields */}
      <div className="p-4 border-4 border-black bg-accent/10 space-y-4">
        <div className="flex justify-between items-center border-b-2 border-black pb-2">
          <h4 className="font-black uppercase italic text-sm">
            Thiết lập đáp án
          </h4>
          {type === "SA" && (
            <span className="text-[10px] font-bold text-red-600 uppercase italic">
              Giáo viên sẽ chấm điểm thủ công
            </span>
          )}
        </div>

        {type === "TN" && (
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <input
                  type="radio"
                  name="correct-option"
                  checked={correctOption === idx}
                  onChange={() =>
                    setCorrectOption(idx)}
                  className="h-5 w-5 border-4 border-black accent-black"
                />
                <span className="font-black text-sm">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <Input
                  value={opt}
                  onInput={(e) => {
                    const newOpts = [...options];
                    newOpts[idx] = (e.target as HTMLInputElement).value;
                    setOptions(newOpts);
                  }}
                  required
                  placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}`}
                  className="flex-1 border-4 border-black"
                />
              </div>
            ))}
          </div>
        )}

        {type === "TF" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-black uppercase italic text-xs">
                Nội dung/Dữ kiện chung (Thông tin ở trên 4 câu hỏi con):
              </Label>
              <textarea
                value={type === "TF" ? tfContent : content}
                onInput={(e) => {
                  if (type === "TF") {
                    setTfContent((e.target as HTMLTextAreaElement).value);
                  } else {
                    setContent((e.target as HTMLTextAreaElement).value);
                  }
                }}
                required
                className="w-full min-h-[100px] border-4 border-black p-3 font-bold text-sm shadow-neo-sm focus:outline-none"
                placeholder="Nhập nội dung dẫn dắt hoặc dữ kiện chung cho 4 câu hỏi con..."
              />
            </div>
            
            <div className="space-y-3">
              <Label className="font-black uppercase italic text-xs text-primary">
                Câu hỏi con (Tối thiểu 2 câu)
              </Label>
              {tfSubQuestions.map((subQ, idx) => (
                <div key={idx} className="border-2 border-black p-3 bg-accent/5 shadow-neo-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-black text-sm shrink-0 w-8">
                      {String.fromCharCode(97 + idx)})
                    </span>
                    <Input
                      value={subQ.text}
                      onInput={(e) => {
                        const newSubQs = [...tfSubQuestions];
                        newSubQs[idx].text = (e.target as HTMLInputElement).value;
                        setTfSubQuestions(newSubQs);
                      }}
                      required
                      placeholder={`Nhập nội dung câu hỏi ${String.fromCharCode(97 + idx)}`}
                      className="flex-1 border-2 border-black h-10"
                    />
                  </div>
                  <div className="flex gap-4 ml-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`tf-sub-${idx}`}
                        checked={subQ.answer === "true"}
                        onChange={() => {
                          const newSubQs = [...tfSubQuestions];
                          newSubQs[idx].answer = "true";
                          setTfSubQuestions(newSubQs);
                        }}
                        className="h-4 w-4 border-2 border-black accent-black"
                      />
                      <span className="font-black uppercase italic text-xs">ĐÚNG</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`tf-sub-${idx}`}
                        checked={subQ.answer === "false"}
                        onChange={() => {
                          const newSubQs = [...tfSubQuestions];
                          newSubQs[idx].answer = "false";
                          setTfSubQuestions(newSubQs);
                        }}
                        className="h-4 w-4 border-2 border-black accent-black"
                      />
                      <span className="font-black uppercase italic text-xs">SAI</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "SA" && (
          <div className="space-y-2">
            <Label className="font-black uppercase italic text-xs">
              Gợi ý đáp án / Đáp án tham khảo
            </Label>
            <textarea
              value={saAnswer}
              onInput={(e) =>
                setSaAnswer((e.target as HTMLTextAreaElement).value)}
              placeholder="Nhập nội dung gợi ý đáp án để hệ thống lưu lại và giáo viên tham khảo khi chấm điểm..."
              className="w-full min-h-[80px] border-4 border-black p-3 font-bold text-sm shadow-neo-sm focus:outline-none bg-white"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic((e.target as HTMLInputElement).checked)}
          className="h-5 w-5 border-4 border-black accent-black"
        />
        <Label
          htmlFor="isPublic"
          className="font-black uppercase italic text-xs cursor-pointer"
        >
          Công khai câu hỏi này trong ngân hàng chung
        </Label>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto h-12 md:h-14 px-8 md:px-12 text-sm md:text-base font-black uppercase italic border-4 border-black shadow-neo hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all bg-primary text-black disabled:opacity-50"
        >
          {loading ? "ĐANG TẠO..." : "TẠO CÂU HỎI MỚI"}
        </Button>
      </div>
    </form>
  );
}
