import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { enrollments } from "../../../db/schema.ts";
import { and, eq } from "npm:drizzle-orm@0.35.3";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user || user.role !== "student") {
        return new Response("Forbidden: Students only", { status: 403 });
      }

      const { classId } = await req.json();
      if (!classId) return new Response("Class ID required", { status: 400 });

      const db = await getDb();
      await db
        .delete(enrollments)
        .where(
          and(
            eq(enrollments.classId, classId),
            eq(enrollments.studentId, user.id),
          ),
        );

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  },
};
