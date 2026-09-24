import { deskFor } from "@/lib/hotel-desk";
import { resendClient, resendFrom } from "@/lib/mail/resend";

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
  const resend = resendClient();
  if (!resend || !to) return false;
  const { error } = await resend.emails.send({
    from: resendFrom(),
    to: [to],
    subject,
    text,
  });
  if (error) console.error("[mail] booking", error.message);
  return !error;
}

/** Guest and hotel desk. No-ops until RESEND_API_KEY is set. */
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
