import { FreshContext, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../../lib/jwt.ts";
import { getDb } from "../../../../lib/db.ts";
import { assignments, questions, submissions } from "../../../../db/schema.ts";
import { and, desc, eq, inArray } from "npm:drizzle-orm@0.35.3";
import ExamExercise from "../../../../islands/ExamExercise.tsx";
import DashboardLayout from "../../../../islands/DashboardLayout.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const { classId, exerciseId } = ctx.params;
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;
    const url = new URL(req.url);

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

    const db = await getDb();

    // Fetch assignment
    const assignmentResult = await db.select().from(assignments).where(
      eq(assignments.id, exerciseId),
    ).limit(1);
    const assignment = assignmentResult[0];

    if (!assignment) {
      return new Response("Assignment not found", { status: 404 });
    }

    // Fetch questions for this assignment
    let assignmentQuestions = [];
    if (assignment.questionIds) {
      const ids = JSON.parse(assignment.questionIds);
      if (ids.length > 0) {
        assignmentQuestions = await db.select().from(questions).where(
          inArray(questions.id, ids),
        );
      }
    }

    // Fetch student's submissions for this assignment
    const studentSubmissions = await db.select().from(submissions).where(
      and(
        eq(submissions.studentId, user.id),
        eq(submissions.assignmentId, exerciseId),
      ),
    ).orderBy(desc(submissions.submittedAt));

    const attemptsCount = studentSubmissions.length;
    const maxAttempts = assignment.maxAttempts || 1;
    const isReview = url.searchParams.get("review") === "true" ||
      attemptsCount >= maxAttempts;

    // Use the latest submission for review or if attempts are exhausted
    let reviewResult = null;
    if (isReview && attemptsCount > 0) {
      const latestSub = studentSubmissions[0];
      reviewResult = {
        score: latestSub.score,
        total: assignmentQuestions.length,
        results: JSON.parse(latestSub.answers || "[]"),
      };
    }

    return ctx.render({
      user,
      assignment,
      questions: assignmentQuestions,
      pathname: url.pathname,
      isReview,
      reviewResult,
      attemptsCount,
      maxAttempts,
    });
  },
};

export default function AssignmentPage({ data }: PageProps) {
  const {
    user,
    assignment,
    questions: assignmentQuestions,
    pathname,
    isReview,
    reviewResult,
    attemptsCount,
    maxAttempts,
  } = data;

  return (
    <DashboardLayout user={user} pathname={pathname}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href={`/class?id=${assignment.classId}`}>
            <button className="p-2 border-4 border-black bg-white hover:bg-accent shadow-neo-sm font-black uppercase italic text-xs">
              Quay lại lớp
            </button>
          </a>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">
              {assignment.title}
            </h1>
            <p className="text-[10px] font-black uppercase opacity-70">
              {isReview ? "CHẾ ĐỘ XEM LẠI" : "ĐANG LÀM BÀI"} • LƯỢT: {attemptsCount} / {maxAttempts}
            </p>
          </div>
        </div>
        {isReview && attemptsCount < maxAttempts && (
          <a href={pathname}>
            <button className="p-2 px-4 border-4 border-black bg-primary hover:bg-primary/80 shadow-neo-sm font-black uppercase italic text-xs">
              LÀM LẠI BÀI
            </button>
          </a>
        )}
      </div>
      <ExamExercise
        user={user}
        assignmentId={assignment.id}
        initialQuestions={assignmentQuestions}
        isReview={isReview}
        reviewResult={reviewResult}
        duration={assignment.duration || 15}
      />
    </DashboardLayout>
  );
}
