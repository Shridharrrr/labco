const axios = require('axios');

/**
 * Send a board invitation email using Resend.
 */
const sendInviteEmail = async ({ to, inviterName, boardTitle, boardId, token }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured — skipping invite email');
    console.log(`Invite link would have been: ${process.env.CLIENT_URL}/accept-invite?token=${token}&boardId=${boardId}`);
    return;
  }

  const inviteUrl = `${process.env.CLIENT_URL}/accept-invite?token=${token}&boardId=${boardId}`;

  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'LabCo <onboarding@resend.dev>',
      to: [to],
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
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to send invite email via Resend:', error?.response?.data || error.message);
  }
};

/**
 * Send an email verification link using Resend.
 */
const sendVerificationEmail = async ({ to, name, token }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`RESEND_API_KEY not configured — skipping verification email for ${to}. Token: ${token}`);
    return;
  }

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'LabCo <onboarding@resend.dev>',
      to: [to],
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
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to send verification email via Resend:', error?.response?.data || error.message);
  }
};

module.exports = { sendInviteEmail, sendVerificationEmail };
