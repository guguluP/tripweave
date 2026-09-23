import { deskFor } from "@/lib/hotel-desk";

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
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!key || !from || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) console.error("[mail] booking", res.status, (await res.text()).slice(0, 180));
  return res.ok;
}

/** Guest and hotel desk. No-ops until RESEND_API_KEY and RESEND_FROM are set. */
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
