import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { classes, enrollments } from "../../../db/schema.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { and, eq } from "npm:drizzle-orm@0.35.3";
import { getCookies } from "$std/http/cookie.ts";

export const handler = {
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
      if (!user || user.role !== "student") {
        return new Response(
          JSON.stringify({ error: "Forbidden: Students only" }),
          { status: 403 },
        );
      }

      const body = await req.json();
      const { inviteCode } = body;

      if (!inviteCode) {
        return new Response(
          JSON.stringify({ error: "Invite code is required" }),
          { status: 400 },
        );
      }

      const db = await getDb();

      // Find class by invite code
      const targetClass = await db
        .select()
        .from(classes)
        .where(eq(classes.inviteCode, inviteCode))
        .limit(1);

      if (targetClass.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid invite code" }), {
          status: 404,
        });
      }

      const classId = targetClass[0].id;

      // Check if already enrolled
      const existingEnrollment = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, user.id),
            eq(enrollments.classId, classId),
          ),
        )
        .limit(1);

      if (existingEnrollment.length > 0) {
        return new Response(
          JSON.stringify({
            message: "Already enrolled",
            classId: classId,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Enroll
      await db.insert(enrollments).values({
        studentId: user.id,
        classId: classId,
        joinedAt: new Date(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          classId: classId,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      console.error("Error joining class:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        { status: 500 },
      );
    }
  },
};
