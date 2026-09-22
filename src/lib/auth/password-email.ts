/**
 * Transactional mail for Better Auth password reset.
 * Set RESEND_API_KEY and RESEND_FROM (a verified Resend sender).
 */
export function passwordEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!key || !from) {
    throw new Error("Password reset email is not configured. Set RESEND_API_KEY and RESEND_FROM.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your TripWeave password",
      text: `Reset your TripWeave password:\n\n${url}\n\nIf you did not ask for this, ignore this email.`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Could not send reset email (${res.status}): ${body.slice(0, 180)}`);
  }
}
