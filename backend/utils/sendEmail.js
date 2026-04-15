const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

const sendEmail = async ({ to, subject, text }) => {
  try {
    console.log("📤 Sending email to:", to);

    await transporter.sendMail({
      from: '"ZK Vault" <no-reply@zkvault.com>',
      to,
      subject,
      text,
    });

    console.log("✅ Email sent successfully");
  } catch (err) {
    console.error("❌ Email failed:", err);
  }
};

module.exports = sendEmail;