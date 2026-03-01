import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { questions } from "../../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";

export const handler = {
  async PUT(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user) return new Response("Unauthorized", { status: 401 });

      const body = await req.json();
      const {
        id,
        type,
        grade,
        topicId,
        lessonId,
        lesson,
        content,
        data,
        answer,
        isPublic,
      } = body;

      if (!id) return new Response("ID required", { status: 400 });

      const db = await getDb();

      // Check if user has permission (is admin or creator)
      const existing = await db.select().from(questions).where(
        eq(questions.id, id),
      ).limit(1);
      if (existing.length === 0) {
        return new Response("Question not found", { status: 404 });
      }

      if (user.role !== "admin" && existing[0].createdBy !== user.id) {
        return new Response("Forbidden", { status: 403 });
      }

      await db
        .update(questions)
        .set({
          type,
          grade: parseInt(grade),
          topicId,
          lessonId,
          lesson,
          content,
          data: data ? JSON.stringify(data) : null,
          answer,
          isPublic,
        })
        .where(eq(questions.id, id));

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
