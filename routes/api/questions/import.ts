import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { questions } from "../../../db/schema.ts";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user || user.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
      }

      const { questions: questionList } = await req.json();
      if (!Array.isArray(questionList)) {
        return new Response("Questions array required", { status: 400 });
      }

      const db = await getDb();
      const inserts = questionList.map((q: any) => ({
        id: uuidv4(),
        content: q.content,
        type: q.type || "TN",
        grade: parseInt(q.grade) || 10,
        topicId: q.topicId,
        lessonId: q.lessonId,
        answer: q.answer,
        data: q.data ? JSON.stringify(q.data) : null,
        isPublic: true,
        createdBy: user.id,
      }));

      for (const item of inserts) {
        await db.insert(questions).values(item);
      }

      return new Response(
        JSON.stringify({ success: true, count: inserts.length }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  },
};
