import { FreshContext, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../lib/jwt.ts";
import { getDb } from "../../lib/db.ts";
import {
  assignments,
  classes,
  enrollments,
  submissions,
  users,
} from "../../db/schema.ts";
import { and, eq, inArray } from "npm:drizzle-orm@0.35.3";
import ClassDetail from "../../islands/ClassDetail.tsx";
import DashboardLayout from "../../islands/DashboardLayout.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const classId = url.searchParams.get("id");

    // Check if this is an exam results URL: /class/{classId}/e/{examId}/r/
    const examResultsMatch = pathname.match(/^\/class\/([^\/]+)\/e\/([^\/]+)\/r\/?$/);
    if (examResultsMatch) {
      // Redirect to handle exam results
      const [, classIdFromPath, examId] = examResultsMatch;
      return ctx.redirect(`/class/${classIdFromPath}/e/${examId}/r/`);
    }

    // Original class page logic
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (!token) {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    if (!classId) {
      return new Response("Class ID not provided", { status: 400 });
    }

    const db = await getDb();

    // Fetch class details
    const classResult = await db.select().from(classes).where(
      eq(classes.id, classId),
    ).limit(1);
    const classData = classResult[0];

    if (!classData) {
      return new Response("Class not found", { status: 404 });
    }

    // Check permissions
    let isAuthorized = false;
    if (user.role === "teacher" && classData.teacherId === user.id) {
      isAuthorized = true;
    } else if (user.role === "student") {
      const enrollment = await db.select().from(enrollments).where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.studentId, user.id),
        ),
      ).limit(1);
      if (enrollment.length > 0) isAuthorized = true;
    } else if (user.role === "admin") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Fetch teachers (always display teachers in member list)
    const teachersData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, "teacher"))
      .limit(10); // Limit to reasonable number

    // Fetch assignments
    const rawAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.classId, classId));

    // Fetch student's submissions for these assignments
    let studentSubmissions: any[] = [];
    if (user.role === "student" && rawAssignments.length > 0) {
      studentSubmissions = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.studentId, user.id),
            inArray(submissions.assignmentId, rawAssignments.map((a) => a.id)),
          ),
        );
    }

    const subMap = new Map(studentSubmissions.map((s) => [s.assignmentId, s]));

    const assignmentsWithStatus = rawAssignments.map((a) => ({
      ...a,
      status: subMap.has(a.id) ? "completed" : "pending",
      score: subMap.get(a.id)?.score,
    }));

    return ctx.render({
      user,
      class: classData,
      students: teachersData,
      assignments: assignmentsWithStatus,
      pathname: url.pathname,
    });
  },
};

export default function ClassPage({ data }: PageProps) {
  const { user, class: classData, students, assignments, pathname } = data;

  return (
    <DashboardLayout user={user} pathname={pathname}>
      <ClassDetail
        classData={classData}
        students={students}
        assignments={assignments}
        user={user}
      />
    </DashboardLayout>
  );
}
