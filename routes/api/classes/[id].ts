import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import {
  assignments,
  classes,
  enrollments,
  users,
} from "../../../db/schema.ts";
import { and, eq } from "npm:drizzle-orm@0.35.3";
import { verifyToken } from "../../../lib/jwt.ts";
import { getCookies } from "$std/http/cookie.ts";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    try {
      const classId = ctx.params.id;
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;

      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      const user = await verifyToken(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
        });
      }

      const db = await getDb();

      // Fetch class details
      const classResult = await db
        .select()
        .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);

      const classData = classResult[0];

      if (!classData) {
        return new Response(JSON.stringify({ error: "Class not found" }), {
          status: 404,
        });
      }

      // Check permissions
      let isAuthorized = false;

      if (user.role === "teacher" && classData.teacherId === user.id) {
        isAuthorized = true;
      } else if (user.role === "student") {
        const enrollment = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.classId, classId),
              eq(enrollments.studentId, user.id),
            ),
          )
          .limit(1);

        if (enrollment.length > 0) {
          isAuthorized = true;
        }
      } else if (user.role === "admin") {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return new Response(
          JSON.stringify({
            error: "Forbidden: You do not have access to this class",
          }),
          { status: 403 },
        );
      }

      // Fetch enrolled students
      const studentsData = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          joinedAt: enrollments.joinedAt,
        })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.studentId, users.id))
        .where(eq(enrollments.classId, classId));

      // Fetch assignments
      const assignmentsData = await db
        .select()
        .from(assignments)
        .where(eq(assignments.classId, classId));

      return new Response(
        JSON.stringify({
          class: classData,
          students: studentsData,
          assignments: assignmentsData,
          isTeacher: user.id === classData.teacherId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      console.error("Error fetching class details:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        { status: 500 },
      );
    }
  },

  async DELETE(req: Request, ctx: FreshContext) {
    try {
      const classId = ctx.params.id;
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;

      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      const user = await verifyToken(token);
      if (!user || (user.role !== "teacher" && user.role !== "admin")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
        });
      }

      const db = await getDb();

      // Check ownership
      if (user.role === "teacher") {
        const classResult = await db
          .select()
          .from(classes)
          .where(eq(classes.id, classId))
          .limit(1);

        if (classResult.length === 0 || classResult[0].teacherId !== user.id) {
          return new Response(
            JSON.stringify({ error: "Forbidden: You don't own this class" }),
            { status: 403 },
          );
        }
      }

      // Delete class (cascade would be better, but let's do it manually or assume DB handles it)
      await db.delete(classes).where(eq(classes.id, classId));

      // Also delete enrollments
      await db.delete(enrollments).where(eq(enrollments.classId, classId));

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
      console.error("Error deleting class:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        { status: 500 },
      );
    }
  },
};
