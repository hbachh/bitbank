import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { classes, enrollments, users } from "../../../db/schema.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { eq, inArray } from "npm:drizzle-orm@0.35.3";
import { getCookies } from "$std/http/cookie.ts";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      const user = await verifyToken(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      const db = await getDb();

      if (user.role === "teacher") {
        const teacherClasses = await db.select().from(classes).where(
          eq(classes.teacherId, user.id),
        );

        const classesWithCount = await Promise.all(
          teacherClasses.map(async (cls) => {
            const enrollmentList = await db
              .select()
              .from(enrollments)
              .where(eq(enrollments.classId, cls.id));

            return { ...cls, students: enrollmentList.length };
          }),
        );

        return new Response(JSON.stringify({ classes: classesWithCount }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else if (user.role === "student") {
        const enrolled = await db.select().from(enrollments).where(
          eq(enrollments.studentId, user.id),
        );
        const classIds = enrolled.map((e) => e.classId);

        if (classIds.length === 0) {
          return new Response(JSON.stringify({ classes: [] }), { status: 200 });
        }

        const joinedClasses = await db.select().from(classes).where(
          inArray(classes.id, classIds),
        );

        const classesWithDetails = await Promise.all(
          joinedClasses.map(async (cls) => {
            const teacher = await db.select().from(users).where(
              eq(users.id, cls.teacherId),
            ).limit(1);
            const enrollmentList = await db
              .select()
              .from(enrollments)
              .where(eq(enrollments.classId, cls.id));

            return {
              ...cls,
              teacherName: teacher[0]?.name || "Unknown",
              students: enrollmentList.length,
            };
          }),
        );

        return new Response(JSON.stringify({ classes: classesWithDetails }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 403,
      });
    } catch (error) {
      console.error("Error fetching classes:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
      });
    }
  },

  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      const user = await verifyToken(token);
      if (!user || user.role !== "teacher") {
        return new Response(
          JSON.stringify({ error: "Forbidden: Teachers only" }),
          { status: 403 },
        );
      }

      const body = await req.json();
      const { name, grade, description, subject } = body;

      if (!name) {
        return new Response(
          JSON.stringify({ error: "Class name is required" }),
          { status: 400 },
        );
      }

      const classId = crypto.randomUUID();
      const inviteCode = Math.random().toString(36).substring(2, 8)
        .toUpperCase();

      const db = await getDb();
      await db.insert(classes).values({
        id: classId,
        name,
        teacherId: user.id,
        grade: parseInt(grade) || 10,
        subject: subject || "General",
        description,
        inviteCode,
        createdAt: new Date(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          class: { id: classId, name, inviteCode },
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      console.error("Error creating class:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        { status: 500 },
      );
    }
  },
};
