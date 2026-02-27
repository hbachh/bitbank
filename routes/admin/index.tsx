import { FreshContext, PageProps } from "$fresh/server.ts";
import { getDb } from "../../lib/db.ts";
import { assignments, classes, questions, users } from "../../db/schema.ts";
import { and, count, eq, or, sql } from "npm:drizzle-orm@0.35.3";
import { State } from "../_middleware.ts";
import AdminDashboardManager from "../../islands/AdminDashboardManager.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const db = await getDb();

    // Fetch real statistics
    const questionCountResult = await db.select({ value: count() }).from(
      questions,
    );
    const classCountResult = await db.select({ value: count() }).from(classes);

    // Fetch User statistics: {teachers}/{students} out of total {n}
    const teacherCountRes = await db.select({ value: count() }).from(users)
      .where(eq(users.role, "teacher"));
    const studentCountRes = await db.select({ value: count() }).from(users)
      .where(eq(users.role, "student"));
    const totalUserRes = await db.select({ value: count() }).from(users);

    const teacherCount = teacherCountRes[0]?.value || 0;
    const studentCount = studentCountRes[0]?.value || 0;
    const totalUsers = totalUserRes[0]?.value || 0;

    return ctx.render({
      stats: {
        questions: questionCountResult[0]?.value || 0,
        classes: classCountResult[0]?.value || 0,
        teachers: teacherCount,
        students: studentCount,
        totalUsers: totalUsers,
      },
      pendingQuestions: [],
    });
  },
};

export default function AdminDashboard({ data }: PageProps) {
  const { stats, pendingQuestions } = data;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-black">
            Quản trị viên Dashboard
          </h1>
          <p className="text-black font-bold uppercase tracking-tight opacity-70">
            {stats.teachers}/{stats.students} trong tổng số {stats.totalUsers}
            {" "}
            người dùng
          </p>
        </div>
      </div>

      <AdminDashboardManager
        stats={stats}
        initialPendingQuestions={pendingQuestions}
      />
    </div>
  );
}
