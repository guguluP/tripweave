import type { BookingRow } from "@/lib/server/bookings";
import { writeMeta } from "@/lib/booking-meta";
import { refundAmountInr, refundPolicyFor } from "@/lib/refund-policy";

const KEY = "tripweave-demo-bookings";

function read(): BookingRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as BookingRow[];
  } catch {
    return [];
  }
}

function write(rows: BookingRow[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* quota / private mode */
  }
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "TW-";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** Persist a confirmed booking on this device (survives a dead DATABASE_URL). */
export function saveDemoBooking(booking: BookingRow) {
  const existing = read().filter(
    (b) => b.id !== booking.id && b.confirmationCode !== booking.confirmationCode,
  );
  write([booking, ...existing]);
}

export function listDemoBookings(): BookingRow[] {
  return read();
}

export function mergeBookings(server: BookingRow[]): BookingRow[] {
  const local = read();
  const seen = new Set(server.map((b) => b.confirmationCode));
  const extra = local.filter((b) => !seen.has(b.confirmationCode));
  return [...extra, ...server].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function cancelDemoBooking(id: number): { ok: true; refundAmount: number; message: string } | { ok: false; message: string } {
  const rows = read();
  const target = rows.find((b) => b.id === id);
  if (!target || (target.status !== "paid" && target.status !== "held")) {
    return { ok: false, message: "That stay is not open to cancel." };
  }
  const policy = refundPolicyFor(target.checkIn);
  const amount = refundAmountInr(target.amountInr, target.checkIn);
  if (policy.fraction <= 0) {
    return { ok: false, message: policy.label };
  }
  const next = rows.map((b) =>
    b.id === id
      ? {
          ...b,
          status: "refunded",
          swaps: writeMeta(b.swaps, {
            refundAmount: amount,
            refundedAt: new Date().toISOString(),
          }),
        }
      : b,
  );
  write(next);
  return {
    ok: true,
    refundAmount: amount,
    message: `${policy.label}. ₹${amount.toLocaleString("en-IN")} will return to the original payment.`,
  };
}

export function clearDemoBookings() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Local confirmation when the server cannot persist after Razorpay captured. */
export function localPaidBooking(input: {
  packageId: string;
  packageName: string;
  nights: number;
  travelers: number;
  checkIn: string;
  amountInr: number;
  swaps: Record<string, string>;
  payerName: string;
  paymentRef: string;
}): BookingRow {
  const booking: BookingRow = {
    id: Date.now(),
    packageId: input.packageId,
    packageName: input.packageName,
    nights: input.nights,
    travelers: input.travelers,
    checkIn: input.checkIn,
    amountInr: input.amountInr,
    swaps: input.swaps,
    status: "paid",
    cardLast4: input.paymentRef.slice(-4),
    cardBrand: "Razorpay",
    payerName: input.payerName,
    confirmationCode: makeCode(),
    paymentMethod: "razorpay",
    paymentRef: input.paymentRef,
    upiHandle: null,
    bankName: null,
    createdAt: new Date().toISOString(),
  };
  saveDemoBooking(booking);
  return booking;
}
