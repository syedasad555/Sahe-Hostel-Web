import { getMailTransporter } from './mailTransport.js';

export async function sendOtpEmail({ to, from, otp, purpose }) {
  const safeTo = String(to || '').trim();
  const safeFrom = String(from || process.env.EMAIL_USER || '').trim();
  if (!safeTo) throw new Error('OTP recipient email is missing');
  if (!safeFrom) throw new Error('OTP sender email is missing');
  if (!otp) throw new Error('OTP code is missing');

  const subject = `Your ${purpose || 'verification'} OTP`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h3>${purpose || 'Verification'}</h3>
      <p>Your OTP code is:</p>
      <div style="font-size: 24px; font-weight: 700; letter-spacing: 2px;">${otp}</div>
      <p>This code will expire soon. If you did not request this, please ignore this email.</p>
    </div>
  `;

  const transporter = await getMailTransporter();
  return transporter.sendMail({
    from: safeFrom,
    to: safeTo,
    subject,
    html,
  });
}
