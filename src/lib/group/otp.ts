/** Channel and mail copy for group join codes. WhatsApp stays available behind a switch. */

export type GroupOtpChannel = "email" | "whatsapp";

export function groupOtpChannel(env: NodeJS.ProcessEnv = process.env): GroupOtpChannel {
  return env.TW_GROUP_OTP_CHANNEL?.trim().toLowerCase() === "whatsapp" ? "whatsapp" : "email";
}

export function normalizeGroupEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function groupOtpMail(input: {
  code: string;
  title?: string | null;
  checkIn?: string | null;
  nights?: number | null;
}): { subject: string; text: string } {
  const subject = `Your TripWeave group code is ${input.code}`;
  const lines = [`Your TripWeave group code is ${input.code}. It expires in 10 minutes.`];
  const title = input.title?.trim();
  if (title) lines.push(`Trip: ${title}`);
  if (input.checkIn) {
    const nights = input.nights;
    const stay =
      nights && nights > 0
        ? `${input.checkIn}, ${nights} night${nights === 1 ? "" : "s"}`
        : input.checkIn;
    lines.push(`Dates: ${stay}`);
  }
  return { subject, text: lines.join("\n") };
}
