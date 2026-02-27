import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import {
  questions,
  textbookLessons,
  textbookTopics,
  users,
} from "../../../db/schema.ts";
import { inArray, eq } from "npm:drizzle-orm@0.35.3";
import { PDFDocument, rgb } from "npm:pdf-lib@^1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@^1.1.1";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { join, fromFileUrl } from "$std/path/mod.ts";

export const handler = {
  async GET(req: Request, _ctx: FreshContext) {
    try {
      const url = new URL(req.url);
      const idsString = url.searchParams.get("ids");
      const topicId = url.searchParams.get("topicId");
      const lessonId = url.searchParams.get("lessonId");
      
      if (!idsString) return new Response("IDs required", { status: 400 });

      const ids = idsString.split(",");
      const db = await getDb();

      // Resolve current user to get school name
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      let schoolName = "TRƯỜNG THPT X";
      if (token) {
        const payload = await verifyToken(token);
        if (payload?.id) {
          const userRows = await db.select().from(users).where(
            eq(users.id, payload.id as string),
          );
          const u = userRows[0];
          if (u?.school) schoolName = u.school;
        }
      }

      const questionList = await db.select().from(questions).where(
        inArray(questions.id, ids),
      );

      // Get topic and lesson info
      let topicName = "N/A";
      let lessonTitle = "N/A";
      
      if (topicId) {
        const topics = await db.select().from(textbookTopics).where(
          eq(textbookTopics.id, topicId),
        );
        topicName = topics[0]?.name || "N/A";
      }
      
      if (lessonId) {
        const lessons = await db.select().from(textbookLessons).where(
          eq(textbookLessons.id, lessonId),
        );
        lessonTitle = lessons[0]?.title || "N/A";
      } else if (questionList[0]?.lessonId) {
        const lessons = await db.select().from(textbookLessons).where(
          eq(textbookLessons.id, questionList[0].lessonId),
        );
        lessonTitle = lessons[0]?.title || "N/A";
      }

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      // Load fonts from static folder
      const fontDir = join(fromFileUrl(new URL("../../../static/fonts/", import.meta.url)));
      const regularFontBytes = await Deno.readFile(join(fontDir, "Roboto-Regular.ttf"));
      const boldFontBytes = await Deno.readFile(join(fontDir, "Roboto-Bold.ttf"));

      const regularFont = await pdfDoc.embedFont(regularFontBytes);
      const boldFont = await pdfDoc.embedFont(boldFontBytes);

      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;

      const checkNewPage = (neededHeight: number) => {
        if (y - neededHeight < margin) {
          page = pdfDoc.addPage();
          y = height - margin;
        }
      };

      const wrapText = (text: string, maxWidth: number, font: any, fontSize: number) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = "";
        
        for (const word of words) {
          const testLine = currentLine + word + " ";
          const widthText = font.widthOfTextAtSize(testLine, fontSize);
          if (widthText > maxWidth) {
            lines.push(currentLine.trim());
            currentLine = word + " ";
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine.trim());
        return lines;
      };

      // 1. School Name
      page.drawText(schoolName, {
        x: margin,
        y: y,
        size: 14,
        font: boldFont,
      });
      y -= 25;

      // 2. Topic and Lesson
      page.drawText(`Topic: ${topicName} - Lesson: ${lessonTitle}`, {
        x: margin,
        y: y,
        size: 12,
        font: boldFont,
      });
      y -= 35;

      // 3. Student Info Fields
      page.drawText("Full Name: ....................................................................................", {
        x: margin,
        y: y,
        size: 11,
        font: regularFont,
      });
      y -= 20;
      page.drawText("Class: ..............................................................................................", {
        x: margin,
        y: y,
        size: 11,
        font: regularFont,
      });
      y -= 40;

      // 4. Questions
      questionList.forEach((q: any, idx: number) => {
        checkNewPage(40);

        // Question header
        const qHeader = `Question ${idx + 1}: ${q.content}`;
        const qLines = wrapText(qHeader, width - 2 * margin, regularFont, 11);
        
        qLines.forEach(line => {
          checkNewPage(15);
          page.drawText(line, { x: margin, y: y, size: 11, font: regularFont });
          y -= 15;
        });
        y -= 5;

        // Question Type Specifics
        if (q.type === 'TN') {
          try {
            const data = typeof q.data === 'string' ? JSON.parse(q.data) : q.data;
            const options = data?.options || [];
            ['A', 'B', 'C', 'D'].forEach((label, i) => {
              checkNewPage(15);
              const optText = options[i] || "";
              const optLines = wrapText(optText, width - 2 * margin - 30, regularFont, 10);
              
              optLines.forEach((optLine, lineIdx) => {
                checkNewPage(15);
                const prefix = lineIdx === 0 ? `${label}. ` : "   ";
                page.drawText(`${prefix}${optLine}`, { x: margin + 20, y: y, size: 10, font: regularFont });
                y -= 15;
              });
            });
          } catch (e) {
            ['A.', 'B.', 'C.', 'D.'].forEach(opt => {
              checkNewPage(15);
              page.drawText(opt, { x: margin + 20, y: y, size: 10, font: regularFont });
              y -= 15;
            });
          }
        } else if (q.type === 'TF') {
          try {
            const data = typeof q.data === 'string' ? JSON.parse(q.data) : q.data;
            const statements = data?.statements || [];
            ['a)', 'b)', 'c)', 'd)'].forEach((label, i) => {
              checkNewPage(15);
              const stmtText = statements[i] || "";
              const stmtLines = wrapText(stmtText, width - 2 * margin - 30, regularFont, 10);
              
              stmtLines.forEach((stmtLine, lineIdx) => {
                checkNewPage(15);
                const prefix = lineIdx === 0 ? `${label} ` : "   ";
                page.drawText(`${prefix}${stmtLine}`, { x: margin + 20, y: y, size: 10, font: regularFont });
                y -= 15;
              });
            });
          } catch (e) {
            ['a)', 'b)', 'c)', 'd)'].forEach(label => {
              checkNewPage(15);
              page.drawText(label, { x: margin + 20, y: y, size: 10, font: regularFont });
              y -= 15;
            });
          }
        } else if (q.type === 'SA') {
          const answerLength = q.answer?.length || 0;
          let linesCount = 1;
          if (answerLength > 200) linesCount = 5;
          else if (answerLength > 100) linesCount = 4;
          else if (answerLength > 50) linesCount = 3;
          else if (answerLength > 20) linesCount = 2;

          for (let i = 0; i < linesCount; i++) {
            checkNewPage(20);
            page.drawText("........................................................................................................................................................................................................................................", {
              x: margin,
              y: y,
              size: 8,
              font: regularFont,
            });
            y -= 20;
          }
        }
        y -= 10;
      });

      const pdfBytes = await pdfDoc.save();
      return new Response(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="exam-questions.pdf"`,
        },
      });
    } catch (error) {
      console.error("PDF Export error:", error);
      return new Response(`Error exporting PDF: ${error.message}`, { status: 500 });
    }
  }
};
