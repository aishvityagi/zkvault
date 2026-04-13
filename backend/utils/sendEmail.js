const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Mailtrap fallback (development)
  return nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || `"ZK Vault" <noreply@zkvault.app>`;

  
console.log(`[email] Sending to ${to} via ${transporter.options?.host}`);
  await transporter.sendMail({ from, to, subject, text });
  console.log(`[email] Sent successfully to ${to}`);
};

module.exports = sendEmail;
