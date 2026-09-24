/**
 * Transactional mail for Better Auth password reset.
 * Set RESEND_API_KEY. RESEND_FROM is optional; otherwise the Resend test sender is used.
 */
import { resendClient, resendFrom } from "../mail/resend";

export function passwordEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const resend = resendClient();
  if (!resend) {
    throw new Error("Password reset email is not configured. Set RESEND_API_KEY.");
  }
  const { error } = await resend.emails.send({
    from: resendFrom(),
    to: [to],
    subject: "Reset your TripWeave password",
    html: `<p>Reset your TripWeave password.</p><p><a href="${url}">Choose a new password</a></p><p>If you did not ask for this, ignore this email.</p>`,
    text: `Reset your TripWeave password:\n\n${url}\n\nIf you did not ask for this, ignore this email.`,
  });
  if (error) {
    throw new Error(`Could not send reset email: ${error.message}`);
  }
}
