const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a board invitation email.
 */
const sendInviteEmail = async ({ to, inviterName, boardTitle, boardId }) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured — skipping invite email');
    return;
  }

  const boardUrl = `${process.env.CLIENT_URL}/boards/${boardId}`;

  await transporter.sendMail({
    from: `"LabCo" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${inviterName} invited you to "${boardTitle}" on LabCo`,
    html: `
      <h2>You've been invited to a board!</h2>
      <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${boardTitle}</strong>.</p>
      <a href="${boardUrl}" style="
        display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
        text-decoration:none;border-radius:8px;font-weight:600;
      ">Open Board</a>
      <p style="color:#888;font-size:12px;margin-top:16px;">
        If you don't have an account yet, register at <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a>
      </p>
    `,
  });
};

/**
 * Send an email verification link.
 */
const sendVerificationEmail = async ({ to, name, token }) => {
  if (!process.env.EMAIL_USER) {
    console.log(`Email not configured — skipping verification email for ${to}. Token: ${token}`);
    return;
  }

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"LabCo" <${process.env.EMAIL_USER}>`,
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
};

module.exports = { sendInviteEmail, sendVerificationEmail };
