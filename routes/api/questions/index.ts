import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { questions } from "../../../db/schema.ts";
import { and, eq } from "npm:drizzle-orm@0.35.3";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const grade = url.searchParams.get("grade");
      const topicId = url.searchParams.get("topicId");

      const db = await getDb();

      const conditions: any[] = [eq(questions.isPublic, true)];

      if (grade) {
        conditions.push(eq(questions.grade, parseInt(grade)));
      }

      if (topicId) {
        conditions.push(eq(questions.topicId, topicId));
      }

      const result = await db.select().from(questions).where(
        and(...conditions),
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Fetch questions error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch questions" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },

  async PATCH(req: Request, _ctx: FreshContext) {
    try {
      const { id, ...updateData } = await req.json();
      const db = await getDb();

      await db
        .update(questions)
        .set(updateData)
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
