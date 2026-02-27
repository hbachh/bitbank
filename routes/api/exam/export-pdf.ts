import { Handlers } from "$fresh/server.ts";
import { getDb } from "../../../lib/db.ts";
import { verifyToken } from "../../../lib/jwt.ts";
import { getCookies } from "$std/http/cookie.ts";
import { eq } from "npm:drizzle-orm@0.35.3";
import jsPDF from "npm:jspdf@2.5.1";

export const handler: Handlers = {
  async POST(req) {
    try {
      // Verify authentication
      const cookies = getCookies(req.headers);
      const token = cookies.auth_token;
      if (!token) {
        return new Response("Unauthorized", { status: 401 });
      }

      const user = await verifyToken(token);
      if (!user || user.role !== "teacher") {
        return new Response("Unauthorized", { status: 403 });
      }

      const body = await req.json();
      const {
        classId,
        examId,
        schoolName,
        topicName,
        students,
        questions,
        answers
      } = body;

      if (!classId || !examId || !students || !questions) {
        return new Response("Missing required parameters", { status: 400 });
      }

      const db = await getDb();

      // Create PDF document with proper configuration
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text and handle page breaks
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        if (isBold) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.setFontSize(fontSize);

        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        const lineHeight = fontSize * 0.4;

        lines.forEach((line: string) => {
          if (yPosition + lineHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        yPosition += 5; // Add some spacing after text
      };

      // Add header with school name
      addText(schoolName, 16, true);

      // Add topic and lesson info
      addText(`Topic ${topicName}`, 14, true);
      yPosition += 10;

      // Process each student
      students.forEach((student: any, studentIndex: number) => {
        // Check if we need a new page for student info
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        // Student info
        addText(`Full Name: ${student.name}`, 12, true);
        addText(`Class: ${student.grade || "N/A"}`, 12, true);
        yPosition += 10;

        // Questions and answers
        questions.forEach((question: any, index: number) => {
          const studentAnswers = answers.get(student.id) || [];
          const answer = studentAnswers.find((a: any) => a.questionId === question.id);

          // Check if we need a new page for question
          if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = margin;
          }

          // Question
          addText(`Question ${index + 1}: ${question.question}`, 11, true);

          if (question.type === "TN") {
            // Multiple Choice
            const options = question.options || [];
            options.forEach((option: string, optIndex: number) => {
              const letter = String.fromCharCode(65 + optIndex); // A, B, C, D...
              addText(`${letter}. ${option}`, 10);
            });
            if (answer) {
              addText(`Student Answer: ${answer.answer}`, 10, true);
            }
          } else if (question.type === "TF") {
            // True/False - show all sub-questions
            const options = question.options || [];
            options.forEach((option: string, optIndex: number) => {
              addText(`${String.fromCharCode(97 + optIndex)}) ${option}`, 10); // a), b), c), d)
            });
            if (answer) {
              addText(`Student Answer: ${answer.answer}`, 10, true);
            }
          } else if (question.type === "SA") {
            // Short Answer - determine line count based on answer length
            const studentAnswer = answer ? answer.answer : "";
            const answerLength = studentAnswer.length;

            // Calculate number of lines (1-5 lines based on content length)
            let lineCount = 1;
            if (answerLength > 100) lineCount = 5;
            else if (answerLength > 50) lineCount = 3;
            else if (answerLength > 20) lineCount = 2;

            if (studentAnswer) {
              addText(`Student Answer: ${studentAnswer}`, 10, true);
            }

            // Add empty lines for writing
            for (let i = 0; i < lineCount; i++) {
              if (yPosition + 15 > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
              }
              // Draw underline for writing
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.3);
              doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3);
              yPosition += 8;
            }
          }

          yPosition += 5; // Space between questions
        });

        // Separator between students (except for last student)
        if (studentIndex < students.length - 1) {
          yPosition += 10;
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 15;
        }
      });

      // Generate PDF as Uint8Array (more reliable than arraybuffer)
      const pdfOutput = doc.output('arraybuffer');
      const pdfBytes = new Uint8Array(pdfOutput);

      // Return PDF response with proper headers
      return new Response(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="ket-qua-bai-thi-${topicName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
          "Cache-Control": "no-cache",
        },
      });

    } catch (error) {
      console.error("Error generating exam results PDF:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
};
