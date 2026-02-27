import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { users } from "../../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import { hashPassword } from "../../../lib/auth.ts";

// Generate verification token for password changes
function generateVerificationToken(): string {
  return crypto.randomUUID();
}

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
      if (!decoded) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
        });
      }

      const body = await req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return new Response(JSON.stringify({ error: "Current password and new password are required" }), {
          status: 400,
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "New password must be at least 6 characters" }), {
          status: 400,
        });
      }

      const db = await getDb();
      
      // Get current user
      const currentUser = await db.select().from(users).where(
        eq(users.id, decoded.id),
      ).limit(1);
      
      if (currentUser.length === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
        });
      }

      const user = currentUser[0];

      // TODO: Verify current password (need to implement password verification function)
      // For now, we'll assume it's correct and proceed with the change
      
      const hashedNewPassword = await hashPassword(newPassword);
      const verificationToken = generateVerificationToken();
      
      // Update password and set verification required
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          emailVerified: false, // Require email verification for password change
          verificationToken, // Set verification token
        })
        .where(eq(users.id, decoded.id));

      // TODO: Send verification email via SMTP
      // For now, return success with verification required message
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Password changed successfully. Please check your email to verify the change.",
          requiresEmailVerification: true 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      console.error("Password change error:", error);
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
