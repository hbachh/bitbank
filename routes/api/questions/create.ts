import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { questions } from "../../../db/schema.ts";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";

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

      const decoded = await verifyToken(token);
      if (
        !decoded || (decoded.role !== "teacher" && decoded.role !== "admin")
      ) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Teachers only" }),
          { status: 403 },
        );
      }

      const body = await req.json();
      const { type, grade, topicId, lessonId, lesson, content, data, answer, isPublic } =
        body;

      if (!type || !grade || !content) {
        return new Response(
          JSON.stringify({ error: "Type, grade, and content are required" }),
          { status: 400 },
        );
      }

      const db = await getDb();
      const newQuestion = {
        id: uuidv4(),
        type,
        grade: parseInt(grade),
        topicId: topicId || null,
        lessonId: lessonId || null,
        lesson: lesson || null,
        content,
        data: data ? JSON.stringify(data) : null,
        answer: answer || null,
        createdBy: decoded.id,
        isPublic: isPublic !== undefined ? isPublic : true,
        source: "teacher",
      };

      await db.insert(questions).values(newQuestion);

      return new Response(
        JSON.stringify({ success: true, question: newQuestion }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      console.error("Create question error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
