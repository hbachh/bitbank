import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { getDb } from "../../../lib/db.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { questions } from "../../../db/schema.ts";
import { inArray } from "npm:drizzle-orm@0.35.3";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@^1.17.1";

export const handler = {
  async GET(req: Request, ctx: FreshContext) {
    // Verify authentication first
    const cookies = getCookies(req.headers);
    const token = cookies.auth_token;
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "teacher") {
      return new Response("Unauthorized", { status: 403 });
    }

    const url = new URL(req.url);
    const idsString = url.searchParams.get("ids");
    const topicId = url.searchParams.get("topicId");
    const lessonId = url.searchParams.get("lessonId");
    const questionCount = url.searchParams.get("questionCount") || "10";
    const source = url.searchParams.get("source") || "all";

    if (!idsString) {
      return new Response("Missing question IDs", { status: 400 });
    }

    const db = await getDb();
    const ids = idsString.split(",");

    // Fetch questions
    let questionList = [];
    if (ids.length > 0) {
      questionList = await db.select().from(questions).where(
        inArray(questions.id, ids),
      );
    }
    // Get school name from user data and use topicId as topic name
    const schoolName = String(user.school || "TRƯỜNG ĐẠI HỌC QUỐC GIA HÀ NỘI");
    const topicName = topicId || "Tổng hợp";

    try {
    // Create PDF document using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Use standard fonts for now (Helvetica supports basic Unicode)
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 12;
    const titleFontSize = 16;
    const questionFontSize = 11;
    let yPosition = height - 50;

    // Helper function to sanitize text for PDF generation
    const sanitizeText = (text: string): string => {
      // Replace common Vietnamese Unicode characters with ASCII equivalents
      return text
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[ÌÍỊỈĨ]/g, 'I')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/[ỲÝỴỶỸ]/g, 'Y')
        .replace(/[đ]/g, 'd')
        .replace(/[Đ]/g, 'D')
        .replace(/[^\x00-\x7F]/g, '?'); // Replace any remaining non-ASCII with ?
    };

    // Simplified text drawing function
    const drawText = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false) => {
      try {
        const sanitizedText = sanitizeText(text);
        const font = isBold ? helveticaBoldFont : helveticaFont;
        page.drawText(sanitizedText, {
          x,
          y,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      } catch (error) {
        // Fallback: draw without font specification
        try {
          const sanitizedText = sanitizeText(text);
          page.drawText(sanitizedText, {
            x,
            y,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
        } catch (fallbackError) {
          // Last resort: replace all non-ASCII and draw
          const safeText = text.replace(/[^\x00-\x7F]/g, '?');
          page.drawText(safeText, {
            x,
            y,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
        }
      }
    };

    // Draw header
    drawText(schoolName, 50, height - 50, titleFontSize, true);

    // Draw metadata
    drawText(`Chủ đề: ${topicName}`, 50, height - 160, fontSize);
    drawText(`Bài học: ${lessonId || "Tổng hợp"}`, 50, height - 175, fontSize);

    // Draw student info fields
    drawText("Full Name: _______________________________", 50, height - 205, fontSize, true);
    drawText("Class: ___________________________________", 50, height - 220, fontSize, true);

    // Draw questions
    let currentY = height - 250;
    questionList.forEach((question: any, index: number) => {
      if (currentY < 100) {
        // Add new page if needed
        pdfDoc.addPage();
        const newPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
        currentY = height - 50;
      }

      // Question number and content
      const questionText = `Question ${index + 1}: ${question.content}`;
      drawText(questionText, 50, currentY, questionFontSize, true);
      currentY -= 20;

      // Question metadata
      const metaText = `Loại: ${question.type === 'TN' ? 'Trắc nghiệm' : question.type === 'TF' ? 'Đúng/Sai' : 'Tự luận'} | Khối: ${question.grade}`;
      drawText(metaText, 50, currentY, 10);
      currentY -= 15;

      if (question.lesson) {
        drawText(`Bài học: ${question.lesson}`, 50, currentY, 10);
        currentY -= 15;
      }

      // Options for multiple choice
      if (question.type === 'TN' && question.data) {
        try {
          const options = JSON.parse(question.data);
          if (Array.isArray(options)) {
            for (let i = 0; i < 4; i++) {
              const letter = String.fromCharCode(65 + i);
              const optionText = options[i]?.text || options[i] || "";
              drawText(`${letter}. ${optionText}`, 70, currentY, 10);
              currentY -= 15;
            }
          }
        } catch (error) {
          // Draw default options
          for (let i = 0; i < 4; i++) {
            const letter = String.fromCharCode(65 + i);
            drawText(`${letter}.`, 70, currentY, 10);
            currentY -= 15;
          }
        }
      } else if (question.type === 'TF') {
        const tfOptions = ['a)', 'b)', 'c)', 'd)'];
        tfOptions.forEach(option => {
          drawText(option, 70, currentY, 10);
          currentY -= 15;
        });
      } else if (question.type === 'SA') {
        // Draw answer lines
        const answerLength = question.answer?.length || 0;
        let lineCount = 1;
        if (answerLength > 100) lineCount = 5;
        else if (answerLength > 50) lineCount = 3;
        else if (answerLength > 20) lineCount = 2;

        for (let i = 0; i < lineCount; i++) {
          page.drawLine({
            start: { x: 50, y: currentY - 3 },
            end: { x: width - 50, y: currentY - 3 },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
          });
          currentY -= 20;
        }
      }

      currentY -= 10; // Space between questions
    });

    // Serialize the PDF document
    const pdfBytes = await pdfDoc.save();

    console.log(`PDF generated successfully: ${pdfBytes.length} bytes`);

    // Return PDF response
    return new Response(pdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="danh-sach-cau-hoi.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  }
  catch (error) {
    console.error("Error generating question PDF:", error);

    // Fallback: Generate simple text version if PDF fails
    console.log("Falling back to text export due to PDF generation error");

    const textContent = `
DANH SÁCH CÂU HỎI
==================

Nguồn: Tất cả
Số câu hỏi: ${questionList.length}

${questionList.map((q: any, index: number) => `
Câu ${index + 1}: ${q.content}
Loại: ${q.type}
Khối: ${q.grade}
${q.lesson ? `Bài học: ${q.lesson}` : ""}
Đáp án: ${q.answer}
---
`).join('\n')}
`;

    // Return text response as fallback
    return new Response(textContent, {
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "Content-Disposition": `attachment; filename="questions-export.txt"`,
      },
    });
  }
},
};
