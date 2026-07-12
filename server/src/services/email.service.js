const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send a board invitation email using Nodemailer.
 */
const sendInviteEmail = async ({ to, inviterName, boardTitle, boardId, token }) => {
  const transporter = getTransporter();
  const inviteUrl = `${process.env.CLIENT_URL}/accept-invite?token=${token}&boardId=${boardId}`;

  if (!transporter) {
    console.log('SMTP configuration missing — skipping invite email');
    console.log(`Invite link would have been: ${inviteUrl}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LabCo" <noreply@labco.com>',
      to,
      subject: `${inviterName} invited you to "${boardTitle}" on LabCo`,
      html: `
        <h2>You've been invited to a board!</h2>
        <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${boardTitle}</strong>.</p>
        <p>Click the link below to accept the invitation and join the board:</p>
        <a href="${inviteUrl}" style="
          display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
          text-decoration:none;border-radius:8px;font-weight:600;
        ">Accept Invitation</a>
        <p style="color:#888;font-size:12px;margin-top:16px;">
          If you don't have an account yet, you will be asked to create one before joining.
        </p>
      `
    });
  } catch (error) {
    console.error('Failed to send invite email via Nodemailer:', error.message);
  }
};

/**
 * Send an email verification link using Nodemailer.
 */
const sendVerificationEmail = async ({ to, name, token }) => {
  const transporter = getTransporter();
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  if (!transporter) {
    console.log(`SMTP configuration missing — skipping verification email for ${to}. Token: ${token}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LabCo" <noreply@labco.com>',
      to,
      subject: `Verify your email address for LabCo`,
      html: `
        <h2>Welcome to LabCo, ${name}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="
          display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
          text-decoration:none;border-radius:8px;font-weight:600;
        ">Verify Email</a>
        <p style="color:#888;font-size:12px;margin-top:16px;">
          If you did not create this account, you can safely ignore this email.
        </p>
      `
    });
  } catch (error) {
    console.error('Failed to send verification email via Nodemailer:', error.message);
  }
};

module.exports = { sendInviteEmail, sendVerificationEmail };
