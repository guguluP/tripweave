import { clampNights, getPackage, getRoom } from "@/lib/packages";
import { quoteStay, travelersFitRoom } from "@/lib/inventory";
import { parseTravelPlan, pickupChargeInr } from "@/lib/travel-plan";
import { readMeta } from "@/lib/booking-meta";
import { refreshOccupancy } from "@/lib/server/occupancy";

export type PayableInput = {
  packageId: string;
  swaps?: Record<string, string>;
  travelers: number;
  checkIn: string;
  nights?: number;
  roomId?: string;
};

export type PayableQuote =
  | {
      ok: true;
      packageId: string;
      packageName: string;
      roomId: string;
      nights: number;
      travelers: number;
      checkIn: string;
      amountInr: number;
      pickupInr: number;
      perPerson: number;
    }
  | { ok: false; message: string; field?: string };

function validCheckIn(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const checkIn = new Date(`${iso}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(checkIn.getTime()) && checkIn >= today;
}

/** Single source of truth for what the guest must pay. Never trust client totals. */
export async function computePayable(input: PayableInput): Promise<PayableQuote> {
  const pkg = getPackage(input.packageId);
  if (!pkg) return { ok: false, message: "Stay not found." };
  if (!validCheckIn(input.checkIn)) {
    return { ok: false, message: "Check-in must be today or later.", field: "checkIn" };
  }

  const nights = clampNights(pkg, input.nights ?? pkg.nights);
  const room = getRoom(pkg, input.roomId);
  const travelers = Math.round(Number(input.travelers));
  if (!Number.isFinite(travelers) || travelers < 1 || travelers > 12) {
    return { ok: false, message: "Guest count looks wrong.", field: "travelers" };
  }
  if (!travelersFitRoom(room.occupancy, travelers)) {
    return {
      ok: false,
      message: `This room sleeps ${room.occupancy}. You listed ${travelers} guests.`,
      field: "travelers",
    };
  }

  await refreshOccupancy().catch(() => []);
  const quote = quoteStay({
    packageId: pkg.id,
    roomId: room.id,
    checkIn: input.checkIn,
    nights,
    swaps: input.swaps ?? {},
  });
  if (!quote?.available) {
    return { ok: false, message: "Those nights are sold out for this room. Pick another date." };
  }

  const travel = parseTravelPlan(readMeta(input.swaps ?? {}).travel);
  const pickupInr = pickupChargeInr(pkg.id, travel);
  const amountInr = quote.perPerson * travelers + pickupInr;
  if (!Number.isFinite(amountInr) || amountInr < 1) {
    return { ok: false, message: "Could not price this stay." };
  }

  return {
    ok: true,
    packageId: pkg.id,
    packageName: `${pkg.name} · ${room.name}`,
    roomId: room.id,
    nights,
    travelers,
    checkIn: input.checkIn,
    amountInr,
    pickupInr,
    perPerson: quote.perPerson,
  };
}

export function sandboxPaymentsAllowed() {
  if (process.env.ALLOW_SANDBOX_PAY === "true") return true;
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

export function payTestAllowed() {
  return process.env.ALLOW_PAY_TEST === "true" && !process.env.VERCEL;
}
