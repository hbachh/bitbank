import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getDb } from "../../../lib/db.ts";
import { users } from "../../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";

// Generate verification token for email changes
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
      const { name, school, grade, email } = body;

      if (!name) {
        return new Response(JSON.stringify({ error: "Name is required" }), {
          status: 400,
        });
      }

      const db = await getDb();
      
      // Get current user data
      const currentUser = await db.select().from(users).where(
        eq(users.id, decoded.id),
      ).limit(1);
      
      if (currentUser.length === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
        });
      }

      const user = currentUser[0];

      // Check if email is being changed
      if (email && email !== user.email) {
        // For email changes, require verification
        const verificationToken = generateVerificationToken();
        
        await db
          .update(users)
          .set({
            name,
            school: school || null,
            grade: grade ? parseInt(grade) : null,
            email, // New email
            emailVerified: false, // Reset verification
            verificationToken, // Set new verification token
          })
          .where(eq(users.id, decoded.id));

        return new Response(
          JSON.stringify({
            success: true,
            message: "Profile updated successfully. Please check your new email to verify it.",
            requiresEmailVerification: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } else {
        // Regular profile update (no email change)
        await db
          .update(users)
          .set({
            name,
            school: school || null,
            grade: grade ? parseInt(grade) : null,
          })
          .where(eq(users.id, decoded.id));

        return new Response(
          JSON.stringify({
            success: true,
            message: "Profile updated successfully",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
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
