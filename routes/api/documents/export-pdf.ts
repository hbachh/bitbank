import { Handlers } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { verifyToken } from "../../../lib/jwt.ts";
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
      const { document, teacherName } = body;

      if (!document || !document.title || !document.content) {
        return new Response("Invalid document data", { status: 400 });
      }

      // Create PDF document
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

      // Add header
      addText("TRƯỜNG ĐẠI HỌC QUỐC GIA HÀ NỘI", 16, true);
      addText("ĐẠI HỌC CÔNG NGHỆ", 14, true);
      yPosition += 10;

      // Document title
      addText(document.title, 18, true);
      yPosition += 5;

      // Document type and metadata
      const typeLabels: Record<string, string> = {
        general: "TÀI LIỆU CHUNG",
        assignment: "BÀI TẬP",
        announcement: "THÔNG BÁO",
        lesson: "BÀI GIẢNG",
        exam: "ĐỀ THI"
      };

      addText(`Loại: ${typeLabels[document.type] || 'TÀI LIỆU'}`, 12, true);
      addText(`Người tạo: ${teacherName}`, 12, true);
      addText(`Ngày tạo: ${new Date(document.createdAt).toLocaleDateString('vi-VN')}`, 12, true);
      yPosition += 15;

      // Document content
      const contentLines = document.content.split('\n');
      contentLines.forEach((line: string) => {
        if (line.trim() === '') {
          yPosition += 8; // Add extra space for empty lines
        } else {
          addText(line, 12);
        }
      });

      // Footer
      yPosition = pageHeight - 30;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("Tài liệu được tạo từ hệ thống quản lý học tập", pageWidth / 2, yPosition, { align: 'center' });

      // Generate PDF
      const pdfOutput = doc.output('arraybuffer');
      const pdfBytes = new Uint8Array(pdfOutput);

      // Return PDF response
      return new Response(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
          "Cache-Control": "no-cache",
        },
      });

    } catch (error) {
      console.error("Error generating document PDF:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
};
