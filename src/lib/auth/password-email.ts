/**
 * Transactional mail for Better Auth password reset.
 * Needs AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and SES_FROM.
 */
import { mailConfigured, sendMail } from "../mail/ses";

export function passwordEmailConfigured() {
  return mailConfigured();
}

export async function sendPasswordResetEmail(to: string, url: string) {
  if (!mailConfigured()) {
    throw new Error(
      "Password reset email is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and SES_FROM.",
    );
  }
  try {
    await sendMail({
      to,
      subject: "Reset your TripWeave password",
      html: `<p>Reset your TripWeave password.</p><p><a href="${url}">Choose a new password</a></p><p>If you did not ask for this, ignore this email.</p>`,
      text: `Reset your TripWeave password:\n\n${url}\n\nIf you did not ask for this, ignore this email.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SES rejected the message";
    throw new Error(`Could not send reset email: ${message}`);
  }
}
