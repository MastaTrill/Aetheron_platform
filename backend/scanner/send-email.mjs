// send-email.mjs - Utility for sending emails (Node.js, using nodemailer)
import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecureEnv = process.env.SMTP_SECURE;
const smtpSecure =
  typeof smtpSecureEnv !== 'undefined'
    ? smtpSecureEnv === 'true' || smtpSecureEnv === '1'
    : smtpPort === 465;

const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textToHtml(text) {
  return `<p>${escapeHtml(text).replace(/\r?\n/g, '<br>')}</p>`;
}

export async function sendPaymentEmail({ to, subject, text }) {
  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Aetheron <no-reply@aetheron.online>',
      to,
      subject,
      text,
      html: textToHtml(text),
    });
  } catch (error) {
    console.error('Failed to send payment email via SMTP:', error);
    const message =
      error instanceof Error
        ? `Failed to send payment email: ${error.message}`
        : 'Failed to send payment email due to an unknown error.';
    throw new Error(message);
  }
}
