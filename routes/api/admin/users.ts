import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { users } from "../../../db/schema.ts";
import { desc, sql, eq } from "drizzle-orm";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = 5;
      const offset = (page - 1) * limit;

      const db = await getDb();

      // Get total count
      const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users);
      const total = totalResult[0]?.count || 0;

      // Get users for current page
      const userList = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        grade: users.grade,
        school: users.school,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

      return new Response(JSON.stringify({
        users: userList,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      console.error("Admin API Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  async DELETE(req: Request, _ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const db = await getDb();
      await db.delete(users).where(eq(users.id, id));

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
