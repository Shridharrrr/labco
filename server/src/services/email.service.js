const nodemailer = require('nodemailer');

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Check if SMTP credentials are provided and not placeholders
  if (!user || !pass || user === 'your_smtp_user' || user === 'your_brevo_login_email' || pass === 'your_smtp_password' || pass === 'your_brevo_smtp_key') {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587 (STARTTLS)
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send a board invitation email using Brevo / Nodemailer.
 */
const sendInviteEmail = async ({ to, inviterName, boardTitle, boardId, token }) => {
  const transporter = getTransporter();
  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite?token=${token}&boardId=${boardId}`;

  if (!transporter) {
    console.log('📬 Brevo / SMTP configuration not active (credentials missing or placeholder).');
    console.log(`   Invite link generated: ${inviteUrl}`);
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
      `,
    });
    console.log(`✉️ Invite email dispatched to ${to} via Brevo`);
  } catch (error) {
    console.error('Failed to send invite email via Brevo / Nodemailer:', error.message);
    console.log(`📬 Fallback direct invite link: ${inviteUrl}`);
  }
};

/**
 * Send an email verification link using Brevo / Nodemailer.
 */
const sendVerificationEmail = async ({ to, name, token }) => {
  const transporter = getTransporter();
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  if (!transporter) {
    console.log(`📬 Brevo / SMTP configuration not active. Verification link: ${verifyUrl}`);
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
      `,
    });
    console.log(`✉️ Verification email dispatched to ${to} via Brevo`);
  } catch (error) {
    console.error('Failed to send verification email via Brevo / Nodemailer:', error.message);
    console.log(`📬 Fallback direct verification link: ${verifyUrl}`);
  }
};

module.exports = { sendInviteEmail, sendVerificationEmail };
