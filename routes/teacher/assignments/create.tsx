import { FreshContext, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { classes } from "../../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import DashboardLayout from "../../../islands/DashboardLayout.tsx";
import CreateAssignmentForm from "../../../islands/CreateAssignmentForm.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (!token) {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "teacher") {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    const db = await getDb();
    let classData = null;
    if (classId) {
      const result = await db.select().from(classes).where(
        eq(classes.id, classId),
      ).limit(1);
      classData = result[0];
    }

    // Get all classes for the teacher to choose from
    const teacherClasses = await db.select().from(classes).where(
      eq(classes.teacherId, user.id),
    );

    return ctx.render({
      user,
      classData,
      teacherClasses,
      pathname: url.pathname,
    });
  },
};

export default function CreateAssignmentPage({ data }: PageProps) {
  const { user, classData, teacherClasses, pathname } = data;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center gap-3 md:gap-4">
        <a href={classData ? `/class?id=${classData.id}` : "/teacher/classes"}>
          <button className="p-1.5 md:p-2 border-4 border-black bg-white hover:bg-accent shadow-neo-sm text-[10px] md:text-xs font-black uppercase italic text-black">
            QUAY LẠI
          </button>
        </a>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic leading-tight text-black text-black">
            Giao bài tập mới
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
            {classData
              ? `Đang giao bài cho lớp: ${classData.name}`
              : "Chọn lớp và thiết lập thông tin bài tập"}
          </p>
        </div>
      </div>

      <CreateAssignmentForm
        classes={teacherClasses}
        initialClassId={classData?.id}
      />
    </div>
  );
}
