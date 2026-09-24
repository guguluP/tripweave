import { deskFor } from "@/lib/hotel-desk";
import { sendMail } from "@/lib/mail/ses";

type Notice = {
  guestEmail?: string | null;
  packageId: string;
  packageName: string;
  confirmationCode: string;
  checkIn: string;
  nights: number;
  travelers: number;
  amountInr: number;
  payerName: string;
};

async function send(to: string, subject: string, text: string) {
  try {
    return await sendMail({ to, subject, text });
  } catch (err) {
    console.error("[mail] booking", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Guest and hotel desk. No-ops until Amazon SES is configured. */
export async function sendBookingNotices(input: Notice) {
  const desk = deskFor(input.packageId);
  const body = [
    `${input.payerName} · ${input.packageName}`,
    `Confirmation ${input.confirmationCode}`,
    `Check-in ${input.checkIn} · ${input.nights} nights · ${input.travelers} guests`,
    `Amount ₹${input.amountInr}`,
    "TripWeave recorded this payment. The desk still confirms the room.",
  ].join("\n");
  if (input.guestEmail) {
    await send(input.guestEmail, `TripWeave booking ${input.confirmationCode}`, body);
  }
  if (desk.email) {
    await send(desk.email, `New TripWeave stay ${input.confirmationCode}`, body);
  }
}
