import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  LogOut,
  Trophy,
  Users,
} from "lucide-preact";

interface ClassDetailProps {
  classData: any;
  students: any[];
  assignments: any[];
  user: any;
}

export default function ClassDetail(
  { classData, students, assignments, user }: ClassDetailProps,
) {
  const [activeTab, setActiveTab] = useState("assignments");
  const [leaving, setLeaving] = useState(false);

  const isTeacher = user?.role === "teacher";

  const leaveClass = async () => {
    if (!confirm("Bạn có chắc chắn muốn rời lớp học này?")) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/class/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: classData.id }),
      });
      if (res.ok) {
        window.location.href = "/student";
      } else {
        alert("Lỗi khi rời lớp");
      }
    } catch (e) {
      alert("Lỗi kết nối");
    } finally {
      setLeaving(false);
    }
  };

  const startAssignment = (assignmentId: string) => {
    if (isTeacher) {
      window.location.href = `/teacher/assignments/${assignmentId}`;
    } else {
      window.location.href = `/class/${classData.id}/e/${assignmentId}`;
    }
  };

  const createAssignment = () => {
    window.location.href =
      `/teacher/assignments/create?classId=${classData.id}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-none border-8 border-black p-8 text-white shadow-neo-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BookOpen className="h-32 w-32" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">
          {classData.name}
        </h1>
        <div className="flex flex-wrap gap-4 md:gap-6 text-[10px] md:text-sm font-black uppercase italic">
          <span className="flex items-center gap-2 bg-white text-black px-2 md:px-3 py-1 border-2 border-black shadow-neo-sm">
            <Calendar className="h-3 w-3 md:h-4 md:w-4" />{" "}
            {classData.schedule || "HỌC KỲ 2"}
          </span>
          <span className="flex items-center gap-2 bg-secondary text-black px-2 md:px-3 py-1 border-2 border-black shadow-neo-sm">
            <Users className="h-3 w-3 md:h-4 md:w-4" /> {students.length}{" "}
            HỌC SINH
          </span>
          <span className="flex items-center gap-2 bg-primary text-black px-2 md:px-3 py-1 border-2 border-black shadow-neo-sm">
            MÃ MỜI: {classData.inviteCode}
          </span>
          {!isTeacher && user?.role === "student" && (
            <Button
              size="sm"
              variant="outline"
              onClick={leaveClass}
              disabled={leaving}
              className="bg-red-500 text-white border-2 border-black font-black uppercase italic shadow-neo-sm h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs hover:bg-red-600 transition-colors"
            >
              <LogOut className="h-3 w-3 mr-1" />{" "}
              {leaving ? "ĐANG RỜI..." : "RỜI LỚP"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="flex border-b-4 md:border-b-8 border-black font-black uppercase italic text-sm md:text-lg bg-white sticky top-14 md:top-0 z-10">
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex-1 py-4 border-r-4 border-black transition-colors ${
                activeTab === "assignments" ? "bg-primary" : "hover:bg-accent"
              }`}
            >
              BÀI TẬP
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex-1 py-4 border-r-4 border-black transition-colors ${
                activeTab === "documents" ? "bg-secondary" : "hover:bg-accent"
              }`}
            >
              TÀI LIỆU
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 py-4 transition-colors ${
                activeTab === "members" ? "bg-accent" : "hover:bg-accent"
              }`}
            >
              THÀNH VIÊN
            </button>
          </div>

          <div className="mt-6">
            {activeTab === "assignments" && (
              <div className="space-y-6">
                {isTeacher && (
                  <Button
                    onClick={createAssignment}
                    className="w-full h-14 border-4 border-black bg-black text-white font-black uppercase italic shadow-neo hover:shadow-none translate-x-[-4px] translate-y-[-4px] transition-all"
                  >
                    + GIAO BÀI TẬP MỚI
                  </Button>
                )}
                {assignments.length === 0
                  ? (
                    <div className="p-12 text-center border-4 border-dashed border-black bg-white">
                      <p className="font-black uppercase italic opacity-50 text-xl">
                        Chưa có bài tập nào được giao
                      </p>
                    </div>
                  )
                  : (
                    assignments.map((assignment) => (
                      <Card
                        key={assignment.id}
                        className="border-4 border-black shadow-neo bg-white hover:-translate-y-1 transition-transform"
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                              {assignment.title}
                            </h3>
                            {assignment.status === "completed"
                              ? (
                                <div className="bg-green-500 text-white px-3 py-1 border-2 border-black font-black uppercase italic shadow-neo-sm flex items-center gap-2">
                                  <Trophy className="h-4 w-4" />{" "}
                                  ĐÃ NỘP ({assignment.score}đ)
                                </div>
                              )
                              : (
                                <div className="bg-orange-400 text-black px-3 py-1 border-2 border-black font-black uppercase italic shadow-neo-sm">
                                  CHƯA NỘP
                                </div>
                              )}
                          </div>
                          <p className="text-sm font-bold uppercase tracking-tight opacity-70 mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4" /> HẠN NỘP:{" "}
                            {assignment.endTime
                              ? new Date(assignment.endTime)
                                .toLocaleDateString()
                              : "KHÔNG CÓ HẠN"}
                          </p>
                          {isTeacher ? (
                            <div className="text-center py-4">
                              <p className="text-sm font-bold uppercase tracking-tight opacity-70 mb-4">
                                GIÁO VIÊN: XEM DANH SÁCH BÀI TẬP CỦA HỌC SINH
                              </p>
                              <Button
                                className="w-full h-12 text-lg font-black uppercase italic border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all bg-primary"
                                onClick={() => window.location.href = `/class/${classData.id}/e/${assignment.id}/r/`}
                              >
                                XEM KẾT QUẢ BÀI THI
                              </Button>
                            </div>
                          ) : (
                            <Button
                              className="w-full h-12 text-lg font-black uppercase italic border-4 border-black shadow-neo-sm hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all"
                              variant={assignment.status === "completed"
                                ? "outline"
                                : "default"}
                              onClick={() => startAssignment(assignment.id)}
                            >
                              {assignment.status === "completed"
                                ? "XEM LẠI BÀI LÀM"
                                : "LÀM BÀI NGAY"}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
              </div>
            )}

            {activeTab === "documents" && (
              <Card className="border-4 border-black shadow-neo bg-white">
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-black uppercase italic mb-4">
                    TÀI LIỆU LỚP HỌC
                  </h3>
                  {isTeacher ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-2">
                          Link tài liệu
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/document.pdf"
                          className="w-full h-10 border-2 border-black p-2 font-black text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-2">
                          Mô tả tài liệu
                        </label>
                        <textarea
                          placeholder="Nhập mô tả tài liệu..."
                          rows={3}
                          className="w-full border-2 border-black p-2 font-black text-sm focus:outline-none resize-none"
                        />
                      </div>
                      <Button className="w-full h-10 border-2 border-black bg-primary font-black uppercase italic">
                        THÊM TÀI LIỆU
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="font-black uppercase italic opacity-50">
                        Chưa có tài liệu nào được đăng tải
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === "members" && (
              <Card className="border-4 border-black shadow-neo bg-white">
                <div className="p-0 divide-y-4 divide-black">
                  {students.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="p-6 flex items-center gap-4 hover:bg-accent transition-colors"
                    >
                      <div className="bg-primary h-14 w-14 border-4 border-black shadow-neo-sm flex items-center justify-center text-black font-black text-2xl uppercase italic">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xl font-black uppercase italic">
                          {teacher.name}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-tight opacity-50">
                          GIÁO VIÊN
                        </p>
                      </div>
                      <ChevronRight className="ml-auto h-6 w-6 opacity-30" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <Card className="border-4 border-black shadow-neo bg-white">
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-black uppercase italic border-b-4 border-black pb-2">
                THÔNG TIN LỚP HỌC
              </h3>
              <p className="text-xs md:text-sm font-bold uppercase tracking-tight opacity-70 leading-relaxed">
                {classData.description ||
                  "Lớp học chính khóa môn Tin học - Năm học 2025-2026. Tối ưu hóa cho chương trình GDPT mới."}
              </p>
            </div>
          </Card>

          <Card className="border-4 border-black shadow-neo bg-primary">
            <div className="p-6 text-center space-y-4">
              <h3 className="text-xl font-black uppercase italic">
                TRÌNH TẠO ĐỀ AI
              </h3>
              <p className="text-xs font-black uppercase italic opacity-70">
                Sử dụng AI để tạo đề thi ôn tập riêng cho lớp này
              </p>
              <Button className="w-full h-12 border-4 border-black bg-white text-black font-black uppercase italic shadow-neo-sm hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all">
                BẮT ĐẦU TẠO ĐỀ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
