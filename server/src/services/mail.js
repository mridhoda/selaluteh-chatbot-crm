import nodemailer from 'nodemailer';

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;
  const smtpUrl = process.env.SMTP_URL || '';
  if (!smtpUrl) return null; // dev fallback: no SMTP, log to console
  transporter = nodemailer.createTransport(smtpUrl);
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log('[DEV][MAIL]', { to, subject, text: text || html });
    return { dev: true };
  }
  const from = process.env.SMTP_FROM || 'no-reply@chatbot.local';
  return t.sendMail({ from, to, subject, html, text });
}