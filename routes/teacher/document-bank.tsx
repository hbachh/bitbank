import { FreshContext, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../lib/jwt.ts";
import { getDb } from "../../lib/db.ts";
import {
  classes,
} from "../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import DocumentBankIsland from "../../islands/DocumentBankIsland.tsx";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;

    if (!token) {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new Response("", {
        status: 303,
        headers: { Location: "/login" },
      });
    }

    // Only teachers can access document bank
    if (user.role !== "teacher") {
      return new Response("Unauthorized", { status: 403 });
    }

    const db = await getDb();

    // Get teacher's classes for document context
    const teacherClasses = await db.select().from(classes).where(
      eq(classes.teacherId, user.id)
    );

    return ctx.render({
      user,
      classes: teacherClasses,
    });
  },
};

export default function DocumentBankPage({ data }: PageProps) {
  const { user, classes } = data;

  return (
    <DocumentBankIsland
      user={user}
      classes={classes}
    />
  );
}
