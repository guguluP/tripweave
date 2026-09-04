import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { charge, methodLabel, type PayMethod } from "@/lib/pay";
import { getPackage, priceWithSwaps } from "@/lib/packages";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  sbCancelBooking,
  sbInsertBooking,
  sbListBookings,
} from "@/lib/supabase/bookings";

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
  | { ok: true; booking: BookingRow }
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

/** In-memory bookings when no DATABASE_URL (Vercel without Neon). Process-local. */
const g = globalThis as typeof globalThis & {
  __twMemoryBookings__?: BookingRow[];
  __twMemoryId__?: number;
};
if (!g.__twMemoryBookings__) g.__twMemoryBookings__ = [];
if (!g.__twMemoryId__) g.__twMemoryId__ = 1;

function useMemoryStore() {
  return !process.env.DATABASE_URL?.trim();
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "TW-";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const listBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (isSupabaseConfigured()) {
      const rows = await sbListBookings(context.userId);
      if (rows) return rows;
    }
    if (useMemoryStore()) {
      return g.__twMemoryBookings__ ?? [];
    }
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
  });

const createSchema = z.object({
  packageId: z.string(),
  swaps: z.record(z.string(), z.string()).optional().default({}),
  travelers: z.number().int().min(1).max(12),
  checkIn: z.string(),
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

    const amount = priceWithSwaps(pkg, data.swaps) * data.travelers;
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

    if (isSupabaseConfigured()) {
      try {
        const booking = await sbInsertBooking({
          userId: context.userId,
          packageId: pkg.id,
          packageName: pkg.name,
          nights: pkg.nights,
          travelers: data.travelers,
          checkIn: data.checkIn,
          amountInr: amount,
          swaps: data.swaps ?? {},
          status: "paid",
          cardLast4: paid.last4,
          cardBrand: paid.brand,
          payerName: data.payerName,
          confirmationCode: code,
          paymentMethod: paid.method,
          paymentRef: paid.ref,
          upiHandle: paid.upiHandle,
          bankName: paid.bank,
        });
        if (booking) return { ok: true, booking };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save booking.";
        return { ok: false, message };
      }
    }

    if (useMemoryStore()) {
      const booking: BookingRow = {
        id: (g.__twMemoryId__ = (g.__twMemoryId__ ?? 1) + 1) - 1,
        packageId: pkg.id,
        packageName: pkg.name,
        nights: pkg.nights,
        travelers: data.travelers,
        checkIn: data.checkIn,
        amountInr: amount,
        swaps: data.swaps ?? {},
        status: "paid",
        cardLast4: paid.last4,
        cardBrand: paid.brand,
        payerName: data.payerName,
        confirmationCode: code,
        paymentMethod: paid.method,
        paymentRef: paid.ref,
        upiHandle: paid.upiHandle,
        bankName: paid.bank,
        createdAt: new Date().toISOString(),
      };
      g.__twMemoryBookings__ = [booking, ...(g.__twMemoryBookings__ ?? [])];
      return { ok: true, booking };
    }

    const sql = await getSql();
    const swapsJson = JSON.stringify(data.swaps ?? {});
    const rows = await sql<DbBooking>`
      insert into bookings (
        user_id, package_id, package_name, nights, travelers, check_in,
        amount_inr, swaps, status, card_last4, card_brand, payer_name, confirmation_code,
        payment_method, payment_ref, upi_handle, bank_name
      ) values (
        ${context.userId}, ${pkg.id}, ${pkg.name}, ${pkg.nights}, ${data.travelers},
        ${data.checkIn}::date, ${amount}, ${swapsJson}, 'paid',
        ${paid.last4}, ${paid.brand}, ${data.payerName}, ${code},
        ${paid.method}, ${paid.ref}, ${paid.upiHandle}, ${paid.bank}
      )
      returning id, package_id, package_name, nights, travelers, check_in, amount_inr,
                swaps, status, card_last4, card_brand, payer_name, confirmation_code,
                payment_method, payment_ref, upi_handle, bank_name, created_at
    `;
    const row = rows[0];
    if (!row) return { ok: false, message: "Could not save booking." };
    return { ok: true, booking: mapBooking(row) };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }) => {
    if (isSupabaseConfigured()) {
      try {
        await sbCancelBooking(context.userId, id);
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not cancel.";
        return { ok: false, message };
      }
    }
    if (useMemoryStore()) {
      const list = g.__twMemoryBookings__ ?? [];
      const b = list.find((x) => x.id === id);
      if (b) b.status = "cancelled";
      return { ok: true };
    }
    const sql = await getSql();
    await sql`
      update bookings
      set status = 'cancelled'
      where id = ${id} and user_id = ${context.userId} and status = 'paid'
    `;
    return { ok: true };
  });

export { methodLabel };
