import { FreshContext, PageProps } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { getDb } from "../../../lib/db.ts";
import {
  assignments,
  questions,
  submissions,
  users,
} from "../../../db/schema.ts";
import { eq, inArray } from "npm:drizzle-orm@0.35.3";
import GradingForm from "../../../islands/GradingForm.tsx";

export const handler = {
  async GET(_req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    if (!user || user.role !== "teacher") return ctx.next();

    const db = await getDb();

    // Get submission
    const submissionData = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);

    if (submissionData.length === 0) return ctx.next();
    const submission = submissionData[0];

    // Get student info
    const studentData = await db.select().from(users).where(
      eq(users.id, submission.studentId),
    ).limit(1);
    const student = studentData[0];

    // Get assignment info
    const assignmentData = await db.select().from(assignments).where(
      eq(assignments.id, submission.assignmentId),
    ).limit(1);
    const assignment = assignmentData[0];

    // Parse student answers and get question details
    const studentAnswers = JSON.parse(submission.answers || "[]");
    const questionIds = studentAnswers.map((a: any) => a.questionId);

    const questionDetails = await db.select().from(questions).where(
      inArray(questions.id, questionIds),
    );
    const questionMap = new Map(questionDetails.map((q) => [q.id, q]));

    const fullResults = studentAnswers.map((a: any) => ({
      ...a,
      question: questionMap.get(a.questionId),
    }));

    return ctx.render({
      submission,
      student,
      assignment,
      results: fullResults,
    });
  },
};

export default function SubmissionDetailPage({ data }: PageProps) {
  const { submission, student, assignment, results } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase italic text-black">
          Chi tiết bài nộp
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase italic border-2 border-black">
            HS: {student.name}
          </span>
          <span className="bg-primary text-black px-2 py-1 text-[10px] font-black uppercase italic border-2 border-black">
            BÀI: {assignment.title}
          </span>
        </div>
      </div>

      <GradingForm submission={submission} results={results} />
    </div>
  );
}
