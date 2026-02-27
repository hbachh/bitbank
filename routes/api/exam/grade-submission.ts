import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { submissions } from "../../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user || user.role !== "teacher") {
        return new Response("Forbidden: Teachers only", { status: 403 });
      }

      const { submissionId, score, answers, feedback, isGraded } = await req
        .json();

      if (!submissionId) {
        return new Response("Submission ID required", { status: 400 });
      }

      const db = await getDb();
      await db
        .update(submissions)
        .set({
          score,
          answers,
          feedback,
          isGraded: isGraded !== undefined ? isGraded : true,
        })
        .where(eq(submissions.id, submissionId));

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(error.message, { status: 500 });
    }
  },
};
