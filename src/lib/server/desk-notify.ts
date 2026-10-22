/**
 * Desk notification channel. Booking mail uses the same SMTP mailbox as
 * password reset. SES is only the fallback when SMTP is unset.
 * WhatsApp is stubbed unless TW_WHATSAPP_* is configured.
 */
import { foreignDeskLine, foreignNationalCount } from "@/lib/arrival-rules";
import { deskFor } from "@/lib/hotel-desk";
import { bookingMailConfigured, sendBookingMail } from "@/lib/mail/send";
import {
  deskActionUrl,
  deskSigningReady,
  signDeskAction,
} from "@/lib/server/desk-auth";
import {
  airportCarLine,
  guestConfirmedLines,
  guestPaidLines,
  guestRosterLines,
  type DeskNoticeCore,
  type NoticeGuest,
} from "@/lib/desk-notice";

export type { NoticeGuest };
export type DeskNotice = DeskNoticeCore;
export { airportCarLine, guestConfirmedLines, guestPaidLines, guestRosterLines };

export type NotifyResult = {
  email: boolean;
  whatsapp: boolean;
  acceptUrl?: string;
  declineUrl?: string;
};

function whatsappConfigured(): boolean {
  return Boolean(
    process.env.TW_WHATSAPP_TOKEN?.trim() &&
      process.env.TW_WHATSAPP_PHONE_ID?.trim(),
  );
}

/**
 * WhatsApp desk notify is intentionally stubbed.
 * Set TW_WHATSAPP_TOKEN + TW_WHATSAPP_PHONE_ID when a Meta Cloud API client is wired;
 * until then this only logs and returns false (email remains the live desk channel).
 */
async function sendWhatsAppStub(toPhone: string | undefined, text: string): Promise<boolean> {
  if (!whatsappConfigured()) {
    console.info("[notifyDesk] whatsapp stub (no TW_WHATSAPP_*):", text.slice(0, 120));
    return false;
  }
  console.info(
    "[notifyDesk] whatsapp env set but Meta Cloud API client not wired; skipped send to",
    toPhone ?? "(desk)",
    text.slice(0, 80),
  );
  return false;
}

export async function notifyDesk(input: DeskNotice): Promise<NotifyResult> {
  const desk = deskFor(input.packageId);
  let acceptUrl: string | undefined;
  let declineUrl: string | undefined;
  if (deskSigningReady()) {
    const accept = signDeskAction({
      bookingId: input.bookingId,
      packageId: input.packageId,
      confirmationCode: input.confirmationCode,
      action: "accept",
    });
    const decline = signDeskAction({
      bookingId: input.bookingId,
      packageId: input.packageId,
      confirmationCode: input.confirmationCode,
      action: "decline",
    });
    if (accept) acceptUrl = deskActionUrl(accept);
    if (decline) declineUrl = deskActionUrl(decline);
  }

  const lines = [
    `New TripWeave stay ${input.confirmationCode}`,
    `${input.payerName} · ${input.packageName}`,
    input.roomName ? `Room: ${input.roomName}` : "",
    `Check-in ${input.checkIn} · ${input.nights} nights · ${input.travelers} guests`,
    airportCarLine(input),
    ...guestRosterLines(input),
    foreignDeskLine(foreignNationalCount(input)),
    `Amount paid ₹${input.amountInr.toLocaleString("en-IN")}`,
    "",
    "Payment succeeded. Please confirm or decline the room.",
    acceptUrl ? `Accept: ${acceptUrl}` : "Accept: open the desk portal (set TW_DESK_SECRET for one-click links).",
    declineUrl ? `Decline: ${declineUrl}` : "",
    "",
    "Until you confirm, the guest sees awaiting hotel confirmation.",
  ].filter(Boolean);

  const text = lines.join("\n");
  let emailOk = false;
  if (desk.email && bookingMailConfigured()) {
    try {
      emailOk = await sendBookingMail({
        to: desk.email,
        subject: `Confirm stay ${input.confirmationCode} — ${input.packageName}`,
        text,
      });
    } catch (err) {
      console.error("[notifyDesk] email", err instanceof Error ? err.message : err);
    }
  } else if (desk.email) {
    console.info("[notifyDesk] mail not configured; desk email skipped for", desk.email);
  }

  const whatsapp = await sendWhatsAppStub(desk.phone, text);
  return { email: emailOk, whatsapp, acceptUrl, declineUrl };
}

export async function notifyGuestPaid(input: DeskNotice): Promise<boolean> {
  if (!input.guestEmail || !bookingMailConfigured()) return false;
  const text = guestPaidLines(input).join("\n");
  try {
    return await sendBookingMail({
      to: input.guestEmail,
      subject: `Payment received — awaiting hotel confirmation (${input.confirmationCode})`,
      text,
    });
  } catch (err) {
    console.error("[notifyDesk] guest", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function notifyGuestConfirmed(input: DeskNotice): Promise<boolean> {
  if (!input.guestEmail || !bookingMailConfigured()) return false;
  const text = guestConfirmedLines(input).join("\n");
  try {
    return await sendBookingMail({
      to: input.guestEmail,
      subject: `Stay confirmed — ${input.confirmationCode}`,
      text,
    });
  } catch (err) {
    console.error("[notifyDesk] confirmed", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function notifyGuestCheckedIn(input: DeskNotice): Promise<boolean> {
  if (!input.guestEmail || !bookingMailConfigured()) return false;
  const text = [
    `${input.packageName} has checked you in.`,
    `Confirmation ${input.confirmationCode}`,
    `Check-in ${input.checkIn} · ${input.nights} nights`,
    "",
    "You are checked in. Enjoy the stay.",
  ].join("\n");
  try {
    return await sendBookingMail({
      to: input.guestEmail,
      subject: `Checked in — ${input.confirmationCode}`,
      text,
    });
  } catch (err) {
    console.error("[notifyDesk] check-in", err instanceof Error ? err.message : err);
    return false;
  }
}
