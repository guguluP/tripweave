import { readMeta } from "./booking-meta.ts";
import { parseTravelPlan } from "./travel-plan.ts";

export type NoticeGuest = {
  fullName: string;
  phone?: string;
  role?: string;
  ageBand?: string;
  isLead?: boolean;
};

export type DeskNoticeCore = {
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
  swaps?: Record<string, string>;
  guests?: NoticeGuest[];
};

export function ageBandLabel(band?: string): string {
  if (band === "adult") return "adult";
  if (band === "child_5_11") return "child 5–11";
  if (band === "infant_0_4") return "infant 0–4";
  return "";
}

/** Present only when the guest asked the hotel for a car. */
export function airportCarLine(input: { swaps?: Record<string, string> | null }): string {
  const travel = parseTravelPlan(readMeta(input.swaps ?? undefined).travel);
  if (!travel.includePickup) return "";
  const when = travel.arrivalTime.trim() || "time not given";
  return `Airport car requested · arriving ${when}`;
}

export function guestRosterLines(input: { guests?: NoticeGuest[] | null }): string[] {
  const guests = input.guests ?? [];
  if (guests.length === 0) return [];
  const leadIndex = guests.findIndex((g) => g.role === "lead" || g.isLead);
  const lead = leadIndex >= 0 ? guests[leadIndex] : guests[0];
  const lines: string[] = [];
  if (lead?.fullName) {
    const digits = (lead.phone ?? "").replace(/\D/g, "");
    const phone = digits ? ` (+91 ${digits.slice(-10)})` : "";
    lines.push(`Lead: ${lead.fullName}${phone}`);
  }
  guests.forEach((guest, index) => {
    if (!guest.fullName || guest === lead) return;
    if (leadIndex < 0 && index === 0) return;
    const band = ageBandLabel(guest.ageBand);
    lines.push(band ? `${guest.fullName} · ${band}` : guest.fullName);
  });
  return lines;
}

export function deskMessageLines(input: DeskNoticeCore): string[] {
  return [
    `New TripWeave stay ${input.confirmationCode}`,
    `${input.payerName} · ${input.packageName}`,
    input.roomName ? `Room: ${input.roomName}` : "",
    `Check-in ${input.checkIn} · ${input.nights} nights · ${input.travelers} guests`,
    airportCarLine(input),
    ...guestRosterLines(input),
    `Amount paid ₹${input.amountInr.toLocaleString("en-IN")}`,
    "",
    "Payment succeeded. Please confirm or decline the room.",
    "",
    "Until you confirm, the guest sees awaiting hotel confirmation.",
  ].filter((line) => line !== "");
}

export function guestPaidLines(input: DeskNoticeCore): string[] {
  return [
    `Payment received for ${input.packageName}.`,
    `Confirmation ${input.confirmationCode}`,
    `Check-in ${input.checkIn} · ${input.nights} nights · ${input.travelers} guests`,
    airportCarLine(input),
    ...guestRosterLines(input),
    "",
    "Your payment succeeded. The hotel desk still needs to confirm the room.",
    "My trips will say Awaiting hotel confirmation until the desk accepts.",
  ].filter((line) => line !== "");
}

export function guestConfirmedLines(input: DeskNoticeCore): string[] {
  return [
    `${input.packageName} confirmed your stay.`,
    `Confirmation ${input.confirmationCode}`,
    `Check-in ${input.checkIn} · ${input.nights} nights · ${input.travelers} guests`,
    airportCarLine(input),
    ...guestRosterLines(input),
    "",
    "Show this confirmation at the desk when you arrive.",
  ].filter((line) => line !== "");
}
