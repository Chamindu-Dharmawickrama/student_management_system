import { z } from 'zod';
import { EMAIL_TYPES } from './email.types.js';

// create a HTML layout for the email (Base HTML)
const baseHtml = (title, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
                        padding:32px 40px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;
                           letter-spacing:0.5px;">NoteVault</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f6f9;padding:24px 40px;text-align:center;
                        border-top:1px solid #e8ecf0;">
              <p style="margin:0;color:#9aa5b4;font-size:12px;line-height:1.6;">
                This is an automated message. Please do not reply to this email.<br/>
                If you did not request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;


// Registration Confirmation 
const registrationConfirmationTemplate = {
  type: EMAIL_TYPES.REGISTRATION_CONFIRMATION,

  payloadSchema: z.object({
    username: z.string().min(1),
    email: z.string().email(),
  }),

  render({ username, email }) {
    const subject = 'Welcome to NoteVault — your account is ready';

    const bodyHtml = `
          <h1 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;font-weight:700;">
            Welcome, ${username}!
          </h1>
          <p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:1.7;">
            Your account has been successfully created. You're all set to start
            using the platform.
          </p>

          <table cellpadding="0" cellspacing="0" width="100%"
                 style="background:#f8fafc;border-radius:6px;
                        border:1px solid #e2e8f0;margin-bottom:28px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 6px;color:#718096;font-size:12px;
                           text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">
                  Account Details
                </p>
                <p style="margin:0;color:#2d3748;font-size:15px;">
                  <strong>Username:</strong> ${username}<br/>
                  <strong>Email:</strong> ${email}
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#718096;font-size:13px;line-height:1.7;">
            If you did not create this account, please contact support immediately.
          </p>
        `;

    const text = [
      `Welcome to NoteVault, ${username}!`,
      '',
      'Your account has been successfully created.',
      '',
      `Username : ${username}`,
      `Email    : ${email}`,
      '',
      'If you did not create this account, please contact support immediately.',
    ].join('\n');

    return { subject, html: baseHtml(subject, bodyHtml), text };
  },
};


// Password Reset
const passwordResetTemplate = {
  type: EMAIL_TYPES.PASSWORD_RESET,

  payloadSchema: z.object({
    username: z.string().min(1),
    email: z.string().email(),
    resetUrl: z.string().url(),
    expiresInMinutes: z.number().int().positive(),
  }),

  render({ username, resetUrl, expiresInMinutes }) {
    const subject = 'Password Reset Request';

    const bodyHtml = `
          <h1 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;font-weight:700;">
            Reset Your Password
          </h1>
          <p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:1.7;">
            Hi <strong>${username}</strong>, we received a request to reset the password
            for your account. Click the button below to choose a new password.
          </p>

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="border-radius:6px;
                          background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                <a href="${resetUrl}"
                   style="display:inline-block;padding:14px 32px;
                          color:#ffffff;font-size:15px;font-weight:600;
                          text-decoration:none;border-radius:6px;
                          letter-spacing:0.3px;">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 16px;color:#718096;font-size:13px;line-height:1.7;">
            This link will expire in <strong>${expiresInMinutes} minutes</strong>.
            If you did not request a password reset, you can safely ignore this email —
            your password will not change.
          </p>

          <p style="margin:0;color:#a0aec0;font-size:12px;line-height:1.7;
                     word-break:break-all;">
            If the button above doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color:#667eea;">${resetUrl}</a>
          </p>
        `;

    const text = [
      `Hi ${username},`,
      '',
      'We received a request to reset the password for your account.',
      '',
      `Reset your password here: ${resetUrl}`,
      '',
      `This link expires in ${expiresInMinutes} minutes.`,
      '',
      'If you did not request a password reset, you can safely ignore this email.',
    ].join('\n');

    return { subject, html: baseHtml(subject, bodyHtml), text };
  },
};

// Registry templates 
export const templateRegistry = Object.freeze({
  [EMAIL_TYPES.REGISTRATION_CONFIRMATION]: registrationConfirmationTemplate,
  [EMAIL_TYPES.PASSWORD_RESET]: passwordResetTemplate,
});
