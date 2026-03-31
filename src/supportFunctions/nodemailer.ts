import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (
  mailOptions: MailOptions,
): Promise<{ success: boolean; response?: string }> => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"zecserAuth" <${process.env.EMAIL_USER}>`,
      ...mailOptions,
    });

    return { success: true, response: info.response };
  } catch (error: any) {
    console.error("Error sending email:", error.message);
    return { success: false };
  }
};
