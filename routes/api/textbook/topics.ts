import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { textbookTopics } from "../../../db/schema.ts";
import { and, eq } from "npm:drizzle-orm@0.35.3";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { v4 as uuidv4 } from "npm:uuid@^9.0.1";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const grade = url.searchParams.get("grade");
      const subjectId = url.searchParams.get("subjectId");

      const db = await getDb();

      const conditions: any[] = [];
      if (grade) conditions.push(eq(textbookTopics.grade, parseInt(grade)));
      if (subjectId) conditions.push(eq(textbookTopics.subjectId, subjectId));

      const result = await db
        .select()
        .from(textbookTopics)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Fetch textbook topics error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to fetch topics" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },

  async POST(req: Request, _ctx: FreshContext) {
    try {
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) return new Response("Unauthorized", { status: 401 });

      const user = await verifyToken(token);
      if (!user || user.role !== "admin") {
        return new Response("Forbidden: Admin only", { status: 403 });
      }

      const body = await req.json();
      const { name, grade, subjectId } = body;

      if (!name || !grade || !subjectId) {
        return new Response("Name, grade, and subjectId are required", { status: 400 });
      }

      const db = await getDb();
      const id = uuidv4();
      await db.insert(textbookTopics).values({
        id,
        name,
        grade: parseInt(grade),
        subjectId: subjectId,
      });

      return new Response(JSON.stringify({ success: true, id }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
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
        return new Response("Forbidden: Admin only", { status: 403 });
      }

      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return new Response("ID required", { status: 400 });

      const db = await getDb();
      await db.delete(textbookTopics).where(eq(textbookTopics.id, id));

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(error.message, { status: 500 });
    }
  },
};
