import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { charge, methodLabel, type PayMethod } from "@/lib/pay";
import { clampNights, getPackage, getRoom } from "@/lib/packages";
import { quoteStay, recordHold, releaseHold, roomUnits, travelersFitRoom } from "@/lib/inventory";
import { refreshOccupancy } from "@/lib/server/occupancy";
import { writeMeta, readMeta } from "@/lib/booking-meta";
import { deskFor } from "@/lib/hotel-desk";
import { parseTravelPlan, pickupChargeInr } from "@/lib/travel-plan";
import { refundAmountInr, refundPolicyFor } from "@/lib/refund-policy";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  sbCancelBooking,
  sbInsertBooking,
  sbListBookings,
} from "@/lib/supabase/bookings";
import { sbInsertPaymentEvent } from "@/lib/supabase/payments";
import {
  isDurableDbError,
  markDurableDbFailed,
  shouldSkipNeon,
} from "./db-fallback";

export type BookingRow = {
  id: number;
  packageId: string;
  packageName: string;
  nights: number;
  travelers: number;
  checkIn: string;
  amountInr: number;
  swaps: Record<string, string>;
  status: string;
  cardLast4: string | null;
  cardBrand: string | null;
  payerName: string;
  confirmationCode: string;
  paymentMethod: string;
  paymentRef: string | null;
  upiHandle: string | null;
  bankName: string | null;
  createdAt: string;
};

export type CreateBookingResult =
  | { ok: true; booking: BookingRow; stored: "supabase" | "local" }
  | { ok: false; message: string; field?: string };

type DbBooking = {
  id: number;
  package_id: string;
  package_name: string;
  nights: number;
  travelers: number;
  check_in: string;
  amount_inr: number;
  swaps: string;
  status: string;
  card_last4: string | null;
  card_brand: string | null;
  payer_name: string;
  confirmation_code: string;
  payment_method: string | null;
  payment_ref: string | null;
  upi_handle: string | null;
  bank_name: string | null;
  created_at: string;
};

function mapBooking(row: DbBooking): BookingRow {
  let swaps: Record<string, string> = {};
  try {
    const parsed = JSON.parse(row.swaps) as unknown;
    if (parsed && typeof parsed === "object") {
      swaps = parsed as Record<string, string>;
    }
  } catch {
    swaps = {};
  }
  return {
    id: row.id,
    packageId: row.package_id,
    packageName: row.package_name,
    nights: row.nights,
    travelers: row.travelers,
    checkIn: row.check_in,
    amountInr: row.amount_inr,
    swaps,
    status: row.status,
    cardLast4: row.card_last4,
    cardBrand: row.card_brand,
    payerName: row.payer_name,
    confirmationCode: row.confirmation_code,
    paymentMethod: row.payment_method ?? "card",
    paymentRef: row.payment_ref,
    upiHandle: row.upi_handle,
    bankName: row.bank_name,
    createdAt: row.created_at,
  };
}

/** In-memory bookings when Neon/Postgres is unavailable. Process-local. */
const g = globalThis as typeof globalThis & {
  __twMemoryBookings__?: BookingRow[];
  __twMemoryId__?: number;
};
if (!g.__twMemoryBookings__) g.__twMemoryBookings__ = [];
if (!g.__twMemoryId__) g.__twMemoryId__ = 1;

function useMemoryStore() {
  // Auth already skips DATABASE_URL on Vercel (bad pooler password).
  // There is no bookings table in migrations/*.sql — Neon would 500 even with
  // a working password. Persist via Supabase REST, else memory + localStorage.
  if (isSupabaseConfigured()) return false;
  return shouldSkipNeon() || Boolean(process.env.VERCEL);
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "TW-";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function rememberBooking(booking: BookingRow): BookingRow {
  g.__twMemoryBookings__ = [booking, ...(g.__twMemoryBookings__ ?? [])];
  return booking;
}

function memoryBooking(input: Omit<BookingRow, "id" | "createdAt"> & { createdAt?: string }): BookingRow {
  const booking: BookingRow = {
    ...input,
    id: (g.__twMemoryId__ = (g.__twMemoryId__ ?? 1) + 1) - 1,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  return rememberBooking(booking);
}

export const listBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (isSupabaseConfigured()) {
      try {
        const rows = await sbListBookings(context.userId);
        if (rows) return rows;
      } catch (err) {
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[bookings] supabase list failed", err);
      }
    }
    if (useMemoryStore()) {
      return g.__twMemoryBookings__ ?? [];
    }
    try {
      const sql = await getSql();
      const rows = await sql<DbBooking>`
        select id, package_id, package_name, nights, travelers, check_in, amount_inr,
               swaps, status, card_last4, card_brand, payer_name, confirmation_code,
               payment_method, payment_ref, upi_handle, bank_name, created_at
        from bookings
        where user_id = ${context.userId}
        order by created_at desc
      `;
      return rows.map(mapBooking);
    } catch (err) {
      markDurableDbFailed(err);
      return g.__twMemoryBookings__ ?? [];
    }
  });

const createSchema = z.object({
  packageId: z.string(),
  swaps: z.record(z.string(), z.string()).optional().default({}),
  travelers: z.number().int().min(1).max(12),
  checkIn: z.string(),
  nights: z.number().int().min(1).max(14).optional(),
  roomId: z.string().max(40).optional(),
  payerName: z.string().min(2),
  method: z.enum(["card", "upi", "netbanking", "razorpay"]),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  cvc: z.string().optional(),
  upiId: z.string().optional(),
  bankId: z.string().optional(),
  bankPin: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ context, data }): Promise<CreateBookingResult> => {
    const pkg = getPackage(data.packageId);
    if (!pkg) return { ok: false, message: "Stay not found." };

    const checkIn = new Date(`${data.checkIn}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(checkIn.getTime()) || checkIn < today) {
      return { ok: false, message: "Check-in must be today or later.", field: "checkIn" };
    }

    const nights = clampNights(pkg, data.nights ?? pkg.nights);
    const room = getRoom(pkg, data.roomId);
    if (!travelersFitRoom(room.occupancy, data.travelers)) {
      return {
        ok: false,
        message: `This room sleeps ${room.occupancy}. You listed ${data.travelers} guests.`,
        field: "travelers",
      };
    }
    await refreshOccupancy().catch(() => []);
    const quote = quoteStay({
      packageId: pkg.id,
      roomId: room.id,
      checkIn: data.checkIn,
      nights,
      swaps: data.swaps,
    });
    if (!quote?.available) {
      return { ok: false, message: "Those nights are sold out for this room. Pick another date." };
    }
    const travel = parseTravelPlan(readMeta(data.swaps).travel);
    const pickupInr = pickupChargeInr(pkg.id, travel);
    const amount = quote.perPerson * data.travelers + pickupInr;
    const packageName = `${pkg.name} · ${room.name}`;
    const code = makeCode();

    let paid: {
      ok: true;
      method: PayMethod;
      brand: string | null;
      last4: string | null;
      upiHandle: string | null;
      bank: string | null;
      ref: string;
    };

    if (data.method === "razorpay") {
      if (!data.razorpayPaymentId || !data.razorpayOrderId || !data.razorpaySignature) {
        return { ok: false, message: "Missing Razorpay payment details." };
      }
      const { verifyRazorpaySignature } = await import("@/lib/server/razorpay");
      const verified = verifyRazorpaySignature({
        razorpay_order_id: data.razorpayOrderId,
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
      });
      if (!verified.ok) {
        return { ok: false, message: verified.message || "Payment verification failed." };
      }
      paid = {
        ok: true,
        method: "razorpay",
        brand: "Razorpay",
        last4: data.razorpayPaymentId.slice(-4),
        upiHandle: null,
        bank: null,
        ref: data.razorpayPaymentId,
      };
    } else {
      const result = charge({
        method: data.method as PayMethod,
        payerName: data.payerName,
        cardNumber: data.method === "card" ? data.cardNumber : undefined,
        expiry: data.method === "card" ? data.expiry : undefined,
        cvc: data.method === "card" ? data.cvc : undefined,
        upiId: data.method === "upi" ? data.upiId : undefined,
        bankId: data.method === "netbanking" ? data.bankId : undefined,
        bankPin: data.method === "netbanking" ? data.bankPin : undefined,
      });
      if (!result.ok) return { ok: false, message: result.message, field: result.field };
      paid = result;
    }

    const local = {
      packageId: pkg.id,
      packageName,
      nights,
      travelers: data.travelers,
      checkIn: data.checkIn,
      amountInr: amount,
      swaps: writeMeta(data.swaps ?? {}, {
        roomId: room.id,
        hotelEmail: deskFor(pkg.id).email,
        travel,
        pickupInr,
      }),
      status: "paid",
      cardLast4: paid.last4,
      cardBrand: paid.brand,
      payerName: data.payerName,
      confirmationCode: code,
      paymentMethod: paid.method,
      paymentRef: paid.ref,
      upiHandle: paid.upiHandle,
      bankName: paid.bank,
    };

    // Payment is already captured. Never fail the guest on a dead DATABASE_URL.
    if (isSupabaseConfigured()) {
      try {
        const booking = await sbInsertBooking({
          userId: context.userId,
          ...local,
          roomId: room.id,
          units: roomUnits(pkg, room.id),
        });
        if (booking) {
          recordHold({
            packageId: pkg.id,
            roomId: room.id,
            checkIn: data.checkIn,
            nights,
            status: "paid",
          });
          await sbInsertPaymentEvent({
            userId: context.userId,
            bookingId: booking.id,
            eventType: "captured",
            orderId: data.razorpayOrderId ?? null,
            paymentId: paid.ref,
            payload: {
              method: paid.method,
              confirmation: code,
            },
          });
          return { ok: true, booking, stored: "supabase" };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("sold_out")) {
          return { ok: false, message: "Those nights are sold out for this room. Pick another date." };
        }
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[bookings] supabase insert failed, keeping confirmation", err);
      }
    }

    if (useMemoryStore()) {
      recordHold({
        packageId: pkg.id,
        roomId: room.id,
        checkIn: data.checkIn,
        nights,
        status: "paid",
      });
      return { ok: true, booking: memoryBooking(local), stored: "local" };
    }

    try {
      const sql = await getSql();
      const swapsJson = JSON.stringify(local.swaps);
      const rows = await sql<DbBooking>`
        insert into bookings (
          user_id, package_id, package_name, nights, travelers, check_in,
          amount_inr, swaps, status, card_last4, card_brand, payer_name, confirmation_code,
          payment_method, payment_ref, upi_handle, bank_name
        ) values (
          ${context.userId}, ${pkg.id}, ${packageName}, ${nights}, ${data.travelers},
          ${data.checkIn}::date, ${amount}, ${swapsJson}, 'paid',
          ${paid.last4}, ${paid.brand}, ${data.payerName}, ${code},
          ${paid.method}, ${paid.ref}, ${paid.upiHandle}, ${paid.bank}
        )
        returning id, package_id, package_name, nights, travelers, check_in, amount_inr,
                  swaps, status, card_last4, card_brand, payer_name, confirmation_code,
                  payment_method, payment_ref, upi_handle, bank_name, created_at
      `;
      const row = rows[0];
      if (!row) {
        recordHold({
          packageId: pkg.id,
          roomId: room.id,
          checkIn: data.checkIn,
          nights,
          status: "paid",
        });
        return { ok: true, booking: memoryBooking(local), stored: "local" };
      }
      recordHold({
        packageId: pkg.id,
        roomId: room.id,
        checkIn: data.checkIn,
        nights,
        status: "paid",
      });
      return { ok: true, booking: mapBooking(row), stored: "local" };
    } catch (err) {
      markDurableDbFailed(err);
      recordHold({
        packageId: pkg.id,
        roomId: room.id,
        checkIn: data.checkIn,
        nights,
        status: "paid",
      });
      return { ok: true, booking: memoryBooking(local), stored: "local" };
    }
  });

export type CancelResult =
  | { ok: true; status: string; refundAmount: number; message: string }
  | { ok: false; message: string };

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }): Promise<CancelResult> => {
    let rows: BookingRow[] = [...(g.__twMemoryBookings__ ?? [])];
    if (isSupabaseConfigured()) {
      try {
        const cloud = await sbListBookings(context.userId);
        if (cloud?.length) rows = cloud;
      } catch {
        /* memory */
      }
    }
    const target = rows.find((b) => b.id === id);
    if (!target || (target.status !== "paid" && target.status !== "held")) {
      return { ok: false, message: "That stay is not open to cancel." };
    }

    const policy = refundPolicyFor(target.checkIn);
    const amount = refundAmountInr(target.amountInr, target.checkIn);
    if (policy.fraction <= 0) {
      return { ok: false, message: policy.label };
    }

    let refundId: string | undefined;
    const ref = target.paymentRef ?? "";
    if (target.paymentMethod === "razorpay" && ref.startsWith("pay_")) {
      const { refundRazorpayPayment } = await import("@/lib/server/razorpay");
      const refunded = await refundRazorpayPayment(ref, amount);
      if (!refunded.ok) return { ok: false, message: refunded.message };
      refundId = refunded.refundId;
    }

    const status = "refunded";
    const meta = writeMeta(target.swaps, {
      refundId,
      refundAmount: amount,
      refundedAt: new Date().toISOString(),
    });
    target.status = status;
    target.swaps = meta;
    const roomId = readMeta(meta).roomId ?? "";
    if (roomId) releaseHold(target.packageId, roomId, target.checkIn, target.nights);

    g.__twMemoryBookings__ = (g.__twMemoryBookings__ ?? []).map((b) =>
      b.id === id ? { ...b, status, swaps: meta } : b,
    );

    if (isSupabaseConfigured()) {
      try {
        await sbCancelBooking(context.userId, id, { status, swaps: meta });
        await sbInsertPaymentEvent({
          userId: context.userId,
          bookingId: id,
          eventType: "refunded",
          paymentId: refundId ?? target.paymentRef,
          payload: { amount, refundId, confirmation: target.confirmationCode },
        });
      } catch (err) {
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[bookings] supabase cancel failed", err);
      }
    } else if (!useMemoryStore()) {
      try {
        const sql = await getSql();
        const swapsJson = JSON.stringify(meta);
        await sql`
          update bookings
          set status = ${status}, swaps = ${swapsJson}
          where id = ${id} and user_id = ${context.userId} and status in ('paid', 'held')
        `;
      } catch (err) {
        markDurableDbFailed(err);
      }
    }

    return {
      ok: true,
      status,
      refundAmount: amount,
      message: `${policy.label}. ₹${amount.toLocaleString("en-IN")} will return to the original payment.`,
    };
  });

export { methodLabel };
