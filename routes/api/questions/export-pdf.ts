import { FreshContext } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import {
  questions,
  textbookLessons,
  textbookTopics,
  users,
} from "../../../db/schema.ts";
import { inArray, eq } from "npm:drizzle-orm@0.35.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { encodeBase64 } from "$std/encoding/base64.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";

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
      let schoolName = "";
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

      // Get topic and lesson info from parameters or fallback to first question
      let topicName = "";
      let lessonTitle = "";
      
      if (topicId) {
        const topics = await db.select().from(textbookTopics).where(
          textbookTopics.id.eq(topicId),
        );
        topicName = topics[0]?.name || "";
      }
      
      if (lessonId) {
        const lessons = await db.select().from(textbookLessons).where(
          textbookLessons.id.eq(lessonId),
        );
        lessonTitle = lessons[0]?.title || "";
      } else {
        // Fallback: infer from first question if no lessonId provided
        const first = questionList[0];
        if (first?.lessonId) {
          const lessons = await db.select().from(textbookLessons).where(
            textbookLessons.id.eq(first.lessonId),
          );
          lessonTitle = lessons[0]?.title || "";
        }
      }

      // Load Vietnamese-supporting fonts from local static folder
      let fontRegularData, fontBoldData;
      try {
        fontRegularData = await Deno.readFile(
          "./static/fonts/Roboto-Regular.ttf",
        );
        fontBoldData = await Deno.readFile("./static/fonts/Roboto-Bold.ttf");
      } catch (e) {
        console.error("Local font loading error:", e.message);
        throw new Error(
          "Không thể tải font hệ thống. Vui lòng liên hệ quản trị viên.",
        );
      }

      const fontRegularBase64 = encodeBase64(fontRegularData);
      const fontBoldBase64 = encodeBase64(fontBoldData);

      // Create PDF
      const doc = new jsPDF();

      // Add fonts to VFS and document
      doc.addFileToVFS("Roboto-Regular.ttf", fontRegularBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", fontBoldBase64);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      doc.setFont("Roboto", "normal");

      // Header: School + topic/lesson + student info
      doc.setFontSize(14);
      doc.setFont("Roboto", "bold");
      const schoolLine = schoolName || "TRƯỜNG: ........................................";
      doc.text(schoolLine, 20, 20);

      doc.setFontSize(12);
      doc.setFont("Roboto", "bold");
      const topicLine = `Topic ${topicName || "................................"}`;
      const lessonLine = ` - Lesson: ${lessonTitle || "................................"}`;
      doc.text(topicLine + lessonLine, 20, 30, { maxWidth: 170 });

      doc.setFontSize(11);
      doc.setFont("Roboto", "normal");
      doc.text(
        "Full Name:....................................................................................",
        20,
        45,
      );
      doc.text(
        "Class:..............................................................................................",
        20,
        55,
      );

      doc.line(20, 65, 190, 65);

      let y = 75;
      questionList.forEach((q, index) => {
        // Check for page break
        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFont("Roboto", "normal");
        }

        doc.setFont("Roboto", "bold");
        doc.text(`Câu ${index + 1}: ${q.content}`, 20, y, { maxWidth: 170 });

        // Calculate lines for wrapping
        const lines = doc.splitTextToSize(q.content, 170);
        y += (lines.length * 6) + 4;

        if (q.type === "TN" && q.data) {
          // Trắc nghiệm: A/B/C/D
          try {
            const data = JSON.parse(q.data);
            if (data.options && Array.isArray(data.options)) {
              data.options.forEach((opt: string, optIdx: number) => {
                const label = String.fromCharCode(65 + optIdx);
                doc.setFont("Roboto", "normal");
                doc.text(`${label}. ${opt}`, 28, y, { maxWidth: 160 });
                y += 6;
              });
            }
          } catch (_e) {
            // Ignore parse errors
          }
        } else if (q.type === "TF") {
          // True/False with supplementary info and sub-questions
          if (q.data) {
            try {
              const tfData = JSON.parse(q.data);
              
              // Display supplementary info if available
              if (tfData.supplementaryInfo && tfData.supplementaryInfo.trim()) {
                doc.setFont("Roboto", "italic");
                doc.setFontSize(10);
                doc.text(tfData.supplementaryInfo, 20, y, { maxWidth: 170 });
                y += 8;
                doc.setFont("Roboto", "normal");
                doc.setFontSize(11);
              }
              
              // Display sub-questions
              if (tfData.subQuestions && Array.isArray(tfData.subQuestions)) {
                const labels = ["a", "b", "c", "d"];
                tfData.subQuestions.slice(0, 4).forEach((item: any, idx: number) => {
                  if (item.text && item.text.trim()) {
                    const label = labels[idx] || String.fromCharCode(97 + idx);
                    const text = item.text || "";
                    doc.text(
                      `Question ${label}) ${text}  [Đúng / Sai]`,
                      28,
                      y,
                      { maxWidth: 160 },
                    );
                    const subLines = doc.splitTextToSize(
                      `Question ${label}) ${text}  [Đúng / Sai]`,
                      160,
                    );
                    y += (subLines.length * 6) + 2;
                  }
                });
              } else {
                // Fallback: single Đúng/Sai
                doc.text("a) .......... [Đúng / Sai]", 28, y);
                y += 6;
              }
            } catch {
              // fallback: single Đúng/Sai
              doc.text("a) .......... [Đúng / Sai]", 28, y);
              y += 6;
            }
          } else {
            doc.text("a) .......... [Đúng / Sai]", 28, y);
            y += 6;
          }
        } else if (q.type === "SA") {
          // Tự luận: số dòng dựa trên độ dài đáp án (min 1, max 5)
          doc.setFont("Roboto", "normal");
          const answerText = (q.answer as string) || "";
          const approxCharsPerLine = 70;
          const neededLines = Math.max(
            1,
            Math.min(
              5,
              Math.ceil(answerText.length / approxCharsPerLine),
            ),
          );
          for (let i = 0; i < neededLines; i++) {
            doc.text(
              "......................................................................................",
              28,
              y,
            );
            y += 6;
          }
        }

        y += 6;
      });

      const pdfArrayBuffer = doc.output("arraybuffer");

      return new Response(pdfArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="aiyoungguru-test.pdf"',
        },
      });
    } catch (error: any) {
      console.error("PDF Export error:", error);
      return new Response(error.message, { status: 500 });
    }
  },
};
