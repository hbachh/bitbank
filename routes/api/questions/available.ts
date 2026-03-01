import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { questions } from "../../../db/schema.ts";
import { eq, and, or } from "npm:drizzle-orm@0.35.3";
import { State } from "../../_middleware.ts";

export const handler = {
  async GET(req: Request, ctx: FreshContext<State>) {
    const { user } = ctx.state;
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const topicId = url.searchParams.get("topicId");
    const lessonId = url.searchParams.get("lessonId");

    if (!topicId) {
      return new Response("Topic ID is required", { status: 400 });
    }

    try {
      const db = await getDb();

      // Build conditions
      const conditions = [
        eq(questions.topicId, topicId),
        eq(questions.isPublic, true), // Only show public questions for test creation
      ];

      if (lessonId) {
        conditions.push(eq(questions.lessonId, lessonId));
      }

      let availableQuestions = await db
        .select()
        .from(questions)
        .where(and(...conditions));

      // Fallback: If no questions found for specific lesson, return all questions for the topic
      if (availableQuestions.length === 0 && lessonId) {
        availableQuestions = await db
          .select()
          .from(questions)
          .where(and(
            eq(questions.topicId, topicId),
            eq(questions.isPublic, true),
          ));
      }

      return new Response(JSON.stringify(availableQuestions), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching available questions:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
};
