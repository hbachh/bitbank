import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { subjects } from "../../../db/schema.ts";
import { eq } from "npm:drizzle-orm@0.35.3";

export const handler = {
  async GET(_req: Request, _ctx: FreshContext) {
    try {
      const db = await getDb();
      const subjectList = await db.select().from(subjects);

      // Add Computer Science by default if no subjects exist
      if (subjectList.length === 0) {
        await db.insert(subjects).values({
          id: crypto.randomUUID(),
          name: "Computer Science"
        });
        const updatedList = await db.select().from(subjects);
        return new Response(JSON.stringify(updatedList), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(subjectList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching subjects:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subjects" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },

  async POST(req: Request, _ctx: FreshContext) {
    try {
      const db = await getDb();
      const { name } = await req.json();

      if (!name || name.trim() === "") {
        return new Response(
          JSON.stringify({ error: "Subject name is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const newSubject = {
        id: crypto.randomUUID(),
        name: name.trim(),
      };

      await db.insert(subjects).values(newSubject);

      return new Response(JSON.stringify(newSubject), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating subject:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create subject" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
