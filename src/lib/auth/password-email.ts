/**
 * Password reset mail. A Gmail (or other) mailbox on SMTP sends the link.
 * No site domain is required. Amazon SES remains only when SMTP is unset.
 */
import { mailConfigured, sendMail } from "../mail/ses";
import { sendSmtpMail, smtpConfigured } from "../mail/smtp";

export function passwordEmailConfigured() {
  return smtpConfigured() || mailConfigured();
}

export async function sendPasswordResetEmail(to: string, url: string) {
  if (!passwordEmailConfigured()) {
    throw new Error(
      "Password reset email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    );
  }
  const message = {
    to,
    subject: "Reset your TripWeave password",
    html: `<p>Reset your TripWeave password.</p><p><a href="${url}">Choose a new password</a></p><p>If you did not ask for this, ignore this email.</p>`,
    text: `Reset your TripWeave password:\n\n${url}\n\nIf you did not ask for this, ignore this email.`,
  };
  try {
    if (smtpConfigured()) await sendSmtpMail(message);
    else await sendMail(message);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "mail rejected the message";
    throw new Error(`Could not send reset email: ${detail}`);
  }
}
