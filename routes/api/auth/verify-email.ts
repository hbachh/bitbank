import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { users } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing verification token", { status: 400 });
    }

    const db = await getDb();

    // Find user with verification token
    const userResult = await db.select().from(users).where(
      eq(users.verificationToken, token),
    ).limit(1);

    if (userResult.length === 0) {
      return new Response("Invalid verification token", { status: 400 });
    }

    const user = userResult[0];

    // Update user to mark email as verified
    await db.update(users)
      .set({ 
        emailVerified: true,
        verificationToken: null 
      })
      .where(eq(users.id, user.id));

    return new Response(`
      <html>
        <head>
          <title>Email Verified - Bitbank</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5; 
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
              max-width: 400px; 
              margin: 0 auto; 
            }
            h1 { color: #333; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .btn { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin-top: 20px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Email Verified Successfully!</h1>
            <p>Thank you ${user.name}, your email has been verified successfully.</p>
            <p>You can now log in to your account.</p>
            <a href="/login" class="btn">Go to Login</a>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" },
    });
  },
};
