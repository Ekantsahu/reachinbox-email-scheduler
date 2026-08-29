import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({
  to,
  subject,
  body,
}: SendEmailParams) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text: body,
  });

  console.log("Email sent successfully");
  console.log("Message ID:", info.messageId);

  if (info.messageId) {
    console.log(
      "Ethereal preview:",
      nodemailer.getTestMessageUrl(info)
    );
  }

  return info;
}