import { useState, useEffect } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { Card } from "../components/Card.tsx";
import { Trash2, User, Mail, Shield, School, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-preact";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  grade: number | null;
  school: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUserManager() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${p}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers(page);
      } else {
        const data = await res.json();
        alert(data.error || "Xóa thất bại");
      }
    } catch (error) {
      alert("Lỗi kết nối");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black uppercase italic tracking-tighter">
          QUẢN LÝ NGƯỜI DÙNG ({total})
        </h2>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
          </div>
        ) : users.length === 0 ? (
          <Card className="p-10 text-center font-bold uppercase opacity-50">
            Không có người dùng nào
          </Card>
        ) : (
          users.map((u) => (
            <Card key={u.id} className="p-0 border-2 border-black shadow-neo-sm overflow-hidden bg-white">
              <div className="flex flex-col md:flex-row md:items-center p-3 md:p-4 gap-3 md:gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black uppercase italic text-sm truncate">{u.name}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 border border-black uppercase ${
                      u.role === 'admin' ? 'bg-red-500 text-white' : 
                      u.role === 'teacher' ? 'bg-secondary text-black' : 
                      'bg-primary text-black'
                    }`}>
                      {u.role === 'admin' ? 'ADMIN' : u.role === 'teacher' ? 'GIÁO VIÊN' : 'HỌC SINH'}
                    </span>
                    {u.emailVerified ? (
                      <CheckCircle className="size-3 text-green-600" title="Đã xác thực" />
                    ) : (
                      <XCircle className="size-3 text-gray-400" title="Chưa xác thực" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10px] md:text-xs font-bold uppercase text-muted-foreground italic">
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    {u.school && (
                      <div className="flex items-center gap-1.5">
                        <School className="size-3" />
                        <span className="truncate">{u.school}</span>
                      </div>
                    )}
                    {u.role === 'student' && u.grade && (
                      <div className="flex items-center gap-1.5">
                        <Shield className="size-3" />
                        <span>KHỐI {u.grade}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <User className="size-3" />
                      <span>THAM GIA: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <Button
                    variant="destructive"
                    size="xs"
                    className="h-8 w-8 p-0 shadow-neo-sm"
                    onClick={() => handleDelete(u.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="border-2 border-black shadow-neo-sm h-8 w-8 p-0"
          >
            <ChevronLeft className="size-4" />
          </Button>
          
          <div className="px-4 py-1 border-2 border-black bg-white font-black italic text-xs shadow-neo-sm">
            TRANG {page} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="border-2 border-black shadow-neo-sm h-8 w-8 p-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
