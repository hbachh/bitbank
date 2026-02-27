import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import { classes, enrollments } from "../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import TeacherClasses from "../../islands/TeacherClasses.tsx";
import { State } from "../_middleware.ts";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) return ctx.next();

    const db = await getDb();

    // Get classes created by this teacher
    const teacherClasses = await db.select().from(classes).where(
      eq(classes.teacherId, user.id),
    );

    const classesWithCount = await Promise.all(
      teacherClasses.map(async (cls) => {
        const enrollmentList = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.classId, cls.id));

        return {
          ...cls,
          studentCount: enrollmentList.length,
        };
      }),
    );

    return ctx.render({ joinedClasses: classesWithCount });
  },
};

export default function ClassesPage({ data, state }: PageProps) {
  const { joinedClasses } = data;
  const { user } = state;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black text-black">
            Quản lý Lớp học
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
            Tạo và quản lý các lớp học của bạn
          </p>
        </div>
      </div>

      <TeacherClasses initialClasses={joinedClasses} user={user} />
    </div>
  );
}
