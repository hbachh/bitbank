import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import { classes, enrollments, users } from "../../db/schema.ts";
import { eq, inArray } from "npm:drizzle-orm@0.35.3";
import StudentClasses from "../../islands/StudentClasses.tsx";
import { State } from "../_middleware.ts";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) return ctx.next(); // Should be handled by middleware

    const db = await getDb();

    // Get classes the student has joined
    const enrolled = await db.select().from(enrollments).where(
      eq(enrollments.studentId, user.id),
    );
    const classIds = enrolled.map((e) => e.classId);

    let joinedClasses = [];
    if (classIds.length > 0) {
      const classesData = await db.select().from(classes).where(
        inArray(classes.id, classIds),
      );

      // Fetch teacher names and student counts
      joinedClasses = await Promise.all(classesData.map(async (cls) => {
        const teacher = await db.select().from(users).where(
          eq(users.id, cls.teacherId),
        ).limit(1);
        const enrollmentList = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.classId, cls.id));

        return {
          ...cls,
          teacherName: teacher[0]?.name || "Giáo viên",
          studentCount: enrollmentList.length,
        };
      }));
    }

    return ctx.render({ joinedClasses });
  },
};

export default function ClassesPage({ data, state }: PageProps) {
  const { joinedClasses } = data;
  const { user } = state;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-black">
            Lớp học của tôi
          </h1>
          <p className="text-[10px] md:text-sm text-black font-bold uppercase tracking-tight opacity-70">
            Tham gia lớp học và quản lý lịch học
          </p>
        </div>
      </div>

      <StudentClasses initialClasses={joinedClasses} user={user} />
    </div>
  );
}
