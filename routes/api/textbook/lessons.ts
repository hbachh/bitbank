import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { textbookLessons } from "../../../db/schema.ts";
import { and, asc, eq } from "npm:drizzle-orm@0.35.3";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const topicId = url.searchParams.get("topicId");

      const db = await getDb();

      const result = await db
        .select()
        .from(textbookLessons)
        .where(topicId ? eq(textbookLessons.topicId, topicId) : undefined)
        .orderBy(asc(textbookLessons.order));

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  },

  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user || user.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
      }

      const { topicId, title, order } = await req.json();
      if (!topicId || !title) {
        return new Response("TopicId and Title required", { status: 400 });
      }

      const db = await getDb();
      const id = uuidv4();
      await db.insert(textbookLessons).values({
        id,
        topicId,
        title,
        order: order || 0,
      });

      return new Response(JSON.stringify({ success: true, id }), {
        status: 201,
      });
    } catch (error: any) {
      return new Response(error.message, { status: 500 });
    }
  },

  async DELETE(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user || user.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
      }

      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return new Response("ID required", { status: 400 });

      const db = await getDb();
      await db.delete(textbookLessons).where(eq(textbookLessons.id, id));

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
      return new Response(error.message, { status: 500 });
    }
  },
};
