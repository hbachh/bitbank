// lib/email.ts
import nodemailer from "npm:nodemailer";
import config from "./config.ts";

const transporter = nodemailer.createTransport({
  host: config.get("SMTP_HOST"),
  port: parseInt(config.get("SMTP_PORT") || "465"),
  secure: config.get("SMTP_PORT") === "465", // true for 465, false for other ports
  auth: {
    user: config.get("SMTP_USER"),
    pass: config.get("SMTP_PASS"),
  },
});

const NEO_BRUTALISM_STYLE = `
  body { font-family: 'Be Vietnam Pro', sans-serif; background-color: #F3F4F6; padding: 20px; }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #FFFFFF; 
    border: 4px solid #000000; 
    box-shadow: 8px 8px 0px 0px #000000; 
    padding: 40px;
  }
  .header { 
    background-color: #FFD100; /* Primary color */
    border-bottom: 4px solid #000000;
    margin: -40px -40px 40px -40px;
    padding: 20px;
    text-align: center;
  }
  .header h1 { 
    margin: 0; 
    font-size: 32px; 
    font-weight: 900; 
    text-transform: uppercase; 
    font-style: italic; 
    letter-spacing: -1px;
  }
  .content { font-size: 16px; line-height: 1.6; color: #000000; font-weight: 700; }
  .button-container { text-align: center; margin-top: 30px; }
  .button { 
    display: inline-block; 
    padding: 15px 30px; 
    background-color: #FFD100; 
    color: #000000; 
    text-decoration: none; 
    font-weight: 900; 
    text-transform: uppercase; 
    border: 3px solid #000000; 
    box-shadow: 4px 4px 0px 0px #000000; 
    transition: all 0.2s;
  }
  .footer { 
    margin-top: 40px; 
    font-size: 12px; 
    text-align: center; 
    color: #666; 
    text-transform: uppercase; 
    font-weight: 900;
  }
`;

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const origin = config.get("ORIGIN") || "https://bitbank.is-app.top";
  const verificationUrl = `${origin}/api/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${NEO_BRUTALISM_STYLE}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BITBANK</h1>
          </div>
          <div class="content">
            <p>XIN CHÀO ${name.toUpperCase()},</p>
            <p>CHÀO MỪNG BẠN ĐẾN VỚI BITBANK - NỀN TẢNG HỌC TẬP VÀ KIỂM TRA TIN HỌC THÔNG MINH.</p>
            <p>VUI LÒNG NHẤN VÀO NÚT DƯỚI ĐÂY ĐỂ XÁC THỰC TÀI KHOẢN CỦA BẠN:</p>
          </div>
          <div class="button-container">
            <a href="${verificationUrl}" class="button">XÁC THỰC TÀI KHOẢN</a>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} BITBANK. ALL RIGHTS RESERVED.
          </div>
        </div>
      </body>
    </html>
  `;

  return await transporter.sendMail({
    from: `"Bitbank" <${config.get("SMTP_FROM")}>`,
    to: email,
    subject: "XÁC THỰC TÀI KHOẢN BITBANK",
    html,
  });
}

export async function sendNotificationEmail(email: string, subject: string, title: string, message: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${NEO_BRUTALISM_STYLE}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BITBANK</h1>
          </div>
          <div class="content">
            <h2 style="text-transform: uppercase; font-weight: 900;">${title}</h2>
            <p>${message}</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} BITBANK. ALL RIGHTS RESERVED.
          </div>
        </div>
      </body>
    </html>
  `;

  return await transporter.sendMail({
    from: `"Bitbank" <${config.get("SMTP_FROM")}>`,
    to: email,
    subject: `BITBANK: ${subject.toUpperCase()}`,
    html,
  });
}
