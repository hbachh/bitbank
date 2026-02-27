import { FreshContext, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "@/lib/jwt.ts";
import { getDb } from "@/lib/db.ts";
import {
  assignments,
  classes,
  enrollments,
  submissions,
  users,
  questions,
} from "@/db/schema.ts";
import { and, eq, inArray } from "npm:drizzle-orm@0.35.3";
import ExamResultsIsland from "@/islands/ExamResultsIsland.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const { id: classId, exam_id: examId } = ctx.params;
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

    // Only teachers can view exam results
    if (user.role !== "teacher") {
      return new Response("Unauthorized", { status: 403 });
    }

    const db = await getDb();

    // Fetch class details and verify teacher owns it
    const classResult = await db.select().from(classes).where(
      and(
        eq(classes.id, classId),
        eq(classes.teacherId, user.id)
      )
    ).limit(1);

    if (!classResult.length) {
      return new Response("Class not found or unauthorized", { status: 404 });
    }

    const classData = classResult[0];

    // Fetch assignment details
    const assignmentResult = await db.select().from(assignments).where(
      and(
        eq(assignments.id, examId),
        eq(assignments.classId, classId)
      )
    ).limit(1);

    if (!assignmentResult.length) {
      return new Response("Assignment not found", { status: 404 });
    }

    const assignment = assignmentResult[0];

    // Fetch enrolled students
    const enrolledStudents = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        grade: users.grade,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.classId, classId));

    // Fetch submissions for this assignment
    const assignmentSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, examId));

    // Fetch questions for this assignment
    let assignmentQuestions = [];
    if (assignment.questionIds) {
      try {
        const questionIds = JSON.parse(assignment.questionIds);
        if (questionIds.length > 0) {
          assignmentQuestions = await db.select().from(questions).where(
            inArray(questions.id, questionIds),
          );
        }
      } catch (error) {
        console.error("Error parsing question IDs:", error);
      }
    }

    // Create submission map and parse answers
    const submissionMap = new Map(assignmentSubmissions.map(s => [s.studentId, s]));
    const answersMap = new Map<string, any>();

    // Parse answers from submissions
    assignmentSubmissions.forEach(submission => {
      try {
        const parsedAnswers = JSON.parse(submission.answers || "[]");
        parsedAnswers.forEach((answer: any) => {
          const key = `${answer.questionId}-${submission.studentId}`;
          answersMap.set(key, {
            questionId: answer.questionId,
            studentId: submission.studentId,
            answer: answer.userAnswer,
            isCorrect: answer.isCorrect,
            score: answer.pendingGrading ? 0 : (answer.isCorrect ? 1 : 0), // Simple scoring
          });
        });
      } catch (error) {
        console.error("Error parsing answers for submission:", submission.id, error);
      }
    });

    // Combine student data with submission status
    const studentsWithStatus = enrolledStudents.map(student => {
      const submission = submissionMap.get(student.id);
      return {
        ...student,
        hasSubmitted: !!submission,
        submission,
        score: submission?.score,
        submittedAt: submission?.submittedAt,
      };
    });

    // Provide default school information for PDF export
    const school = {
      id: "default",
      name: "Trường Đại Học Quốc Gia Hà Nội" // Default school name
    };

    return ctx.render({
      user,
      class: classData,
      assignment,
      students: studentsWithStatus,
      questions: assignmentQuestions,
      answers: answersMap,
      school,
    });
  },
};

export default function ExamResultsPage({ data }: PageProps) {
  const { user, class: classData, assignment, students, questions, answers, school } = data;

  return (
    <ExamResultsIsland
      user={user}
      classData={classData}
      assignment={assignment}
      students={students}
      questions={questions}
      answers={answers}
      school={school}
    />
  );
}
