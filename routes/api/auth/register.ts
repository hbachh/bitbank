import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { users } from "../../../db/schema.ts";
import { hashPassword } from "../../../lib/auth.ts";
import { eq } from "drizzle-orm";

// Email validation for teacher registration
function validateTeacherEmail(email: string): boolean {
  return email.endsWith(".edu.vn");
}

// Generate verification token
function generateVerificationToken(): string {
  return crypto.randomUUID();
}

export const handler = {
  async POST(req: Request, _ctx: FreshContext) {
    try {
      const { email, password, name, role, grade, school } = await req.json();

      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate teacher email domain
      if (role === "teacher" && !validateTeacherEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Teacher registration requires .edu.vn email domain" }),
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
      );
      if (existing.length > 0) {
        return new Response(JSON.stringify({ error: "Email already exists" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      const hashedPassword = await hashPassword(password);
      const verificationToken = generateVerificationToken();

      // Create user with email verification required
      await db.insert(users).values({
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        name,
        role: role || "student", // Default to student
        grade: role === "student" && grade ? parseInt(grade) : null,
        school: school || null,
        emailVerified: false, // Require email verification
        verificationToken,
      });

      // TODO: Send verification email via SMTP
      // For now, return success with verification required message
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User created successfully. Please check your email to verify your account.",
          requiresVerification: true 
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Register error:", error);
      return new Response(JSON.stringify({ error: "Failed to register" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
