import { useState } from "preact/hooks";

interface User {
  id: string;
  name: string;
  role: string;
}

interface Class {
  id: string;
  name: string;
  teacherId: string;
}

interface DocumentBankIslandProps {
  user: User;
  classes: Class[];
}

export default function DocumentBankIsland({
  user,
  classes,
}: DocumentBankIslandProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocument, setCurrentDocument] = useState({
    title: "",
    content: "",
    classId: "",
    type: "general", // general, assignment, announcement, etc.
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const createDocument = () => {
    if (!currentDocument.title.trim() || !currentDocument.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung tài liệu");
      return;
    }

    const newDoc = {
      id: crypto.randomUUID(),
      ...currentDocument,
      createdAt: new Date().toISOString(),
      teacherId: user.id,
    };

    setDocuments(prev => [...prev, newDoc]);
    setCurrentDocument({
      title: "",
      content: "",
      classId: "",
      type: "general",
    });
    setIsCreating(false);
  };

  const exportToPDF = async (document: any) => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/documents/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document,
          teacherName: user.name,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Không thể kết nối với máy chủ. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const deleteDocument = (docId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black">
                Ngân Hàng Tài Liệu
              </h1>
              <p className="text-sm md:text-base text-black font-bold uppercase tracking-tight opacity-70">
                Tạo và xuất tài liệu PDF chuyên nghiệp
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.history.back()}
                className="h-10 px-4 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="h-10 px-4 border-2 border-black font-black uppercase italic text-xs bg-black text-white hover:bg-white hover:text-black transition-colors"
              >
                + TẠO TÀI LIỆU MỚI
              </button>
            </div>
          </div>
        </div>

        {/* Create Document Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-4 border-black shadow-neo max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black uppercase italic">Tạo Tài Liệu Mới</h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-2xl font-bold hover:text-red-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black uppercase mb-2">
                      Tiêu đề tài liệu
                    </label>
                    <input
                      type="text"
                      value={currentDocument.title}
                      onChange={(e) => setCurrentDocument(prev => ({
                        ...prev,
                        title: (e.target as HTMLInputElement).value
                      }))}
                      className="w-full h-10 border-2 border-black p-2 font-bold focus:outline-none"
                      placeholder="Nhập tiêu đề tài liệu..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase mb-2">
                      Loại tài liệu
                    </label>
                    <select
                      value={currentDocument.type}
                      onChange={(e) => setCurrentDocument(prev => ({
                        ...prev,
                        type: (e.target as HTMLSelectElement).value
                      }))}
                      className="w-full h-10 border-2 border-black p-2 font-bold focus:outline-none"
                    >
                      <option value="general">Tài liệu chung</option>
                      <option value="assignment">Bài tập</option>
                      <option value="announcement">Thông báo</option>
                      <option value="lesson">Bài giảng</option>
                      <option value="exam">Đề thi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase mb-2">
                      Lớp học (tùy chọn)
                    </label>
                    <select
                      value={currentDocument.classId}
                      onChange={(e) => setCurrentDocument(prev => ({
                        ...prev,
                        classId: (e.target as HTMLSelectElement).value
                      }))}
                      className="w-full h-10 border-2 border-black p-2 font-bold focus:outline-none"
                    >
                      <option value="">Không chọn lớp</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase mb-2">
                      Nội dung tài liệu
                    </label>
                    <textarea
                      value={currentDocument.content}
                      onChange={(e) => setCurrentDocument(prev => ({
                        ...prev,
                        content: (e.target as HTMLTextAreaElement).value
                      }))}
                      className="w-full h-40 border-2 border-black p-3 font-bold focus:outline-none resize-none"
                      placeholder="Nhập nội dung tài liệu..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={createDocument}
                      className="flex-1 h-12 border-4 border-black bg-primary font-black uppercase italic shadow-neo-sm hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all"
                    >
                      TẠO TÀI LIỆU
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="h-12 px-6 border-2 border-black font-black uppercase italic hover:bg-gray-100 transition-colors"
                    >
                      HỦY
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="border-2 border-black bg-white shadow-neo">
          <div className="p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase italic">Danh sách tài liệu</h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="font-black uppercase italic opacity-50 text-xl">
                Chưa có tài liệu nào
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Nhấn "TẠO TÀI LIỆU MỚI" để bắt đầu tạo tài liệu đầu tiên
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-black uppercase italic text-black mb-2">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="px-2 py-1 bg-gray-100 border-2 border-gray-300 font-bold uppercase text-xs">
                          {doc.type === 'general' ? 'Tài liệu chung' :
                           doc.type === 'assignment' ? 'Bài tập' :
                           doc.type === 'announcement' ? 'Thông báo' :
                           doc.type === 'lesson' ? 'Bài giảng' : 'Đề thi'}
                        </span>
                        {doc.classId && (
                          <span className="font-bold">
                            Lớp: {classes.find(c => c.id === doc.classId)?.name}
                          </span>
                        )}
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {doc.content.substring(0, 150)}...
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => exportToPDF(doc)}
                        disabled={isExporting}
                        className="h-8 px-3 border-2 border-black font-black uppercase italic text-xs bg-primary hover:bg-primary/80 transition-colors disabled:opacity-50"
                      >
                        {isExporting ? "..." : "PDF"}
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="h-8 px-3 border-2 border-black font-black uppercase italic text-xs bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        XÓA
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
