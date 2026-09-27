/**
 * Desk notification channel. SES email is live when AWS/SES env is set.
 * WhatsApp is stubbed unless TW_WHATSAPP_* is configured.
 */
import { deskFor } from "@/lib/hotel-desk";
import { mailConfigured, sendMail } from "@/lib/mail/ses";
import {
  deskActionUrl,
  deskSigningReady,
  signDeskAction,
} from "@/lib/server/desk-auth";

export type DeskNotice = {
  bookingId: number;
  guestEmail?: string | null;
  packageId: string;
  packageName: string;
  confirmationCode: string;
  checkIn: string;
  nights: number;
  travelers: number;
  amountInr: number;
  payerName: string;
  roomName?: string;
};

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

/** Stub: logs intent. Wire a Meta Cloud API client when TW_WHATSAPP_* is set. */
async function sendWhatsAppStub(toPhone: string | undefined, text: string): Promise<boolean> {
  if (!whatsappConfigured()) {
    console.info("[notifyDesk] whatsapp stub (no TW_WHATSAPP_*):", text.slice(0, 120));
    return false;
  }
  console.info("[notifyDesk] whatsapp configured but client not wired; would send to", toPhone ?? "(desk)", text.slice(0, 80));
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
  if (desk.email && mailConfigured()) {
    try {
      emailOk = await sendMail({
        to: desk.email,
        subject: `Confirm stay ${input.confirmationCode} — ${input.packageName}`,
        text,
      });
    } catch (err) {
      console.error("[notifyDesk] email", err instanceof Error ? err.message : err);
    }
  } else if (desk.email) {
    console.info("[notifyDesk] SES not configured; desk email skipped for", desk.email);
  }

  const whatsapp = await sendWhatsAppStub(desk.phone, text);
  return { email: emailOk, whatsapp, acceptUrl, declineUrl };
}

export async function notifyGuestPaid(input: DeskNotice): Promise<boolean> {
  if (!input.guestEmail || !mailConfigured()) return false;
  const text = [
    `Payment received for ${input.packageName}.`,
    `Confirmation ${input.confirmationCode}`,
    `Check-in ${input.checkIn} · ${input.nights} nights`,
    "",
    "Your payment succeeded. The hotel desk still needs to confirm the room.",
    "My trips will say Awaiting hotel confirmation until the desk accepts.",
  ].join("\n");
  try {
    return await sendMail({
      to: input.guestEmail,
      subject: `Payment received — awaiting hotel confirmation (${input.confirmationCode})`,
      text,
    });
  } catch (err) {
    console.error("[notifyDesk] guest", err instanceof Error ? err.message : err);
    return false;
  }
}
