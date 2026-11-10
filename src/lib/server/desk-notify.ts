/**
 * Desk notification channel. Booking mail uses the same SMTP mailbox as
 * password reset. SES is only the fallback when SMTP is unset.
 * WhatsApp is stubbed unless TW_WHATSAPP_* is configured.
 */
import { guestsPhrase, nightsPhrase } from "@/lib/packages";
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
  const { sendWhatsApp } = await import("@/lib/server/notify/whatsapp");
  const sent = await sendWhatsApp(toPhone, text);
  if (!sent && !whatsappConfigured()) {
    console.info("[notifyDesk] whatsapp skipped (no TW_WHATSAPP_*):", text.slice(0, 120));
  }
  return sent;
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
    `Check-in ${input.checkIn} · ${nightsPhrase(input.nights)} · ${guestsPhrase(input.travelers)}`,
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
    `Check-in ${input.checkIn} · ${nightsPhrase(input.nights)}`,
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

export async function notifyGroupDesk(input: {
  tripId: string;
  packageId: string;
  packageName: string;
  checkIn: string;
  nights: number;
  guests: number;
  elderly: number;
  needs: string[];
  rooms: number;
  amountInr: number;
}): Promise<NotifyResult> {
  const desk = deskFor(input.packageId);
  let acceptUrl: string | undefined;
  let declineUrl: string | undefined;
  if (deskSigningReady()) {
    const accept = signDeskAction({
      bookingId: 0,
      packageId: input.packageId,
      confirmationCode: "GROUP",
      action: "accept",
      groupTripId: input.tripId,
    });
    const decline = signDeskAction({
      bookingId: 0,
      packageId: input.packageId,
      confirmationCode: "GROUP",
      action: "decline",
      groupTripId: input.tripId,
    });
    if (accept) acceptUrl = deskActionUrl(accept);
    if (decline) declineUrl = deskActionUrl(decline);
  }
  const text = [
    `TripWeave group · ${input.rooms} rooms · ${input.guests} guests`,
    input.elderly ? `${input.elderly} elderly` : "",
    input.needs.length ? input.needs.join(", ") : "",
    input.packageName,
    `Check-in ${input.checkIn} · ${nightsPhrase(input.nights)}`,
    `Collected ₹${input.amountInr.toLocaleString("en-IN")}`,
    "",
    "Confirm all rooms, or decline the group. One action covers every room.",
    acceptUrl ? `Accept: ${acceptUrl}` : "Accept: open the desk portal.",
    declineUrl ? `Decline: ${declineUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  let email = false;
  if (desk.email && bookingMailConfigured()) {
    try {
      email = await sendBookingMail({
        to: desk.email,
        subject: `Group stay · ${input.packageName} · ${input.rooms} rooms`,
        text,
      });
    } catch (err) {
      console.error("[notifyDesk] group", err instanceof Error ? err.message : err);
    }
  }
  const whatsapp = await sendWhatsAppStub(desk.phone, text);
  return { email, whatsapp, acceptUrl, declineUrl };
}
