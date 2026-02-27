import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { users } from "../../../db/schema.ts";
import { signToken, verifyPassword } from "../../../lib/auth.ts";
// @ts-ignore
import { eq } from "drizzle-orm";
import { setCookie } from "$std/http/cookie.ts";

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const { email, password } = await req.json();

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const db = await getDb();

      // Check if user exists
      const existing = await db.select().from(users).where(
        eq(users.email, email),
      ).limit(1);
      const user = existing[0];

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Tài khoản không tồn tại" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Mật khẩu không chính xác" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return new Response(
          JSON.stringify({ 
            error: "Email chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.",
            requiresVerification: true 
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Sign JWT
      const token = await signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        grade: user.grade || undefined,
        school: user.school || undefined,
      });

      const body = JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          grade: user.grade,
          school: user.school,
        },
      });

      const response = new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

      // Set cookie
      setCookie(response.headers, {
        name: "auth_token",
        value: token,
        httpOnly: true,
        secure: false, // Set to true in production
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return response;
    } catch (error) {
      console.error("Login error:", error);
      return new Response(JSON.stringify({ error: "Failed to login" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
