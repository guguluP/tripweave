import { mailConfigured, sendMail, type OutboundMail } from "./ses";
import { sendSmtpMail, smtpConfigured } from "./smtp";

export function bookingMailConfigured(): boolean {
  return smtpConfigured() || mailConfigured();
}

/** SMTP first, SES only when SMTP is unset. */
export async function sendBookingMail(message: OutboundMail): Promise<boolean> {
  if (smtpConfigured()) {
    await sendSmtpMail(message);
    return true;
  }
  if (mailConfigured()) return sendMail(message);
  return false;
}
