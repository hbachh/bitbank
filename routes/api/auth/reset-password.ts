import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { users } from "../../../db/schema.ts";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword } from "../../../lib/auth.ts";
import { sendResetPasswordEmail } from "../../../lib/email.ts";

export const handler = {
  // Request reset password link
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const { email, token, password } = await req.json();

      const db = await getDb();

      // Case 1: Reset password with token
      if (token && password) {
        const result = await db.select().from(users).where(
          and(
            eq(users.resetToken, token),
            gt(users.resetTokenExpires, new Date())
          )
        ).limit(1);

        if (result.length === 0) {
          return new Response(
            JSON.stringify({ error: "Mã khôi phục không hợp lệ hoặc đã hết hạn." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const user = result[0];
        const hashedPassword = await hashPassword(password);

        await db.update(users).set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpires: null
        }).where(eq(users.id, user.id));

        return new Response(
          JSON.stringify({ success: true, message: "Mật khẩu đã được cập nhật thành công." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Case 2: Request reset link
      if (email) {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (result.length === 0) {
          // Don't reveal if user exists for security, but return success
          return new Response(
            JSON.stringify({ success: true, message: "Nếu email tồn tại, hướng dẫn khôi phục sẽ được gửi." }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        const user = result[0];
        const resetToken = crypto.randomUUID();
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await db.update(users).set({
          resetToken,
          resetTokenExpires: expires
        }).where(eq(users.id, user.id));

        try {
          await sendResetPasswordEmail(email, user.name, resetToken);
        } catch (err) {
          console.error("Failed to send reset email:", err);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Hướng dẫn khôi phục mật khẩu đã được gửi vào email của bạn." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Thiếu thông tin yêu cầu." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );

    } catch (error: any) {
      console.error("Reset password error:", error);
      return new Response(
        JSON.stringify({ error: "Lỗi hệ thống. Vui lòng thử lại sau." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
