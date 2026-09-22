import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { charge, methodLabel, type PayMethod } from "@/lib/pay";
import { getPackage, getRoom } from "@/lib/packages";
import { recordHold, releaseHoldById, roomUnits } from "@/lib/inventory";
import {
  listReconcileJobs,
  listRefundIntents,
  memoryBookingsFor,
  memoryInsertBooking,
  memoryUpdateBooking,
  mergeReconcileJobs,
  refundIntentFor,
  type ReconcileJob,
} from "@/lib/booking-memory";
import { computePayable, sandboxPaymentsAllowed } from "@/lib/server/payable";
import {
  hydrateRefundIntents,
  loadReconcileJobs,
  persistReconcileJob,
  persistRefundIntent,
} from "@/lib/server/payment-ops";
import { holdIdsForCheckout, releaseCheckoutHold } from "@/lib/server/room-holds";
import { writeMeta, readMeta } from "@/lib/booking-meta";
import { deskFor } from "@/lib/hotel-desk";
import { parseTravelPlan } from "@/lib/travel-plan";
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
  userId?: string;
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
  user_id?: string;
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
    userId: row.user_id,
    payerName: row.payer_name,
    confirmationCode: row.confirmation_code,
    paymentMethod: row.payment_method ?? "card",
    paymentRef: row.payment_ref,
    upiHandle: row.upi_handle,
    bankName: row.bank_name,
    createdAt: row.created_at,
  };
}

function useMemoryStore() {
  if (isSupabaseConfigured()) return false;
  return shouldSkipNeon() || Boolean(process.env.VERCEL);
}

/** Production must not tell the guest they are booked when the durable insert failed. */
function failClosedAfterCapture() {
  return isSupabaseConfigured() || process.env.VERCEL_ENV === "production";
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "TW-";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function applyRefundIntents(userId: string, rows: BookingRow[]): BookingRow[] {
  const open = new Map(listRefundIntents(userId).map((intent) => [intent.bookingId, intent]));
  return rows.map((row) => {
    const intent = open.get(row.id);
    if (!intent || intent.status === "applied") return row;
    if (row.status === "paid" || row.status === "held" || row.status === "confirmed") {
      return { ...row, status: "refund_pending" };
    }
    return row;
  });
}

export const listBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      await hydrateRefundIntents(context.userId);
      await drainReconcileJobs(context.userId);
    } catch (err) {
      console.error("[bookings] ops hydrate", err);
    }
    if (isSupabaseConfigured()) {
      try {
        const rows = await sbListBookings(context.userId);
        if (rows) return applyRefundIntents(context.userId, rows.map((row) => ({ ...row, userId: row.userId ?? context.userId })));
      } catch (err) {
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[bookings] supabase list failed", err);
      }
    }
    if (useMemoryStore()) return applyRefundIntents(context.userId, memoryBookingsFor(context.userId));
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
      return applyRefundIntents(context.userId, rows.map((row) => mapBooking({ ...row, user_id: context.userId })));
    } catch (err) {
      markDurableDbFailed(err);
      return applyRefundIntents(context.userId, memoryBookingsFor(context.userId));
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

type CaptureLocal = Omit<BookingRow, "id" | "createdAt">;
type StoredPayload = CaptureLocal & {
  roomId?: string;
  units?: number;
  exceptHoldIds?: string[];
};

function parsePayload(job: ReconcileJob): StoredPayload | null {
  try {
    return JSON.parse(job.payloadJson) as StoredPayload;
  } catch {
    return null;
  }
}

async function touchJob(id: string, patch: Partial<ReconcileJob>) {
  const current = listReconcileJobs().find((row) => row.id === id);
  if (!current) return;
  await persistReconcileJob({ ...current, ...patch, updatedAt: new Date().toISOString() });
}

function asBooking(value: unknown): BookingRow | null {
  let row: Record<string, unknown> | null = null;
  if (typeof value === "string") {
    try {
      row = JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (value && typeof value === "object") {
    row = value as Record<string, unknown>;
  }
  if (!row || row.id == null) return null;
  const swaps = typeof row.swaps === "string" ? row.swaps : JSON.stringify(row.swaps ?? {});
  return mapBooking({
    id: Number(row.id),
    package_id: String(row.package_id),
    package_name: String(row.package_name),
    nights: Number(row.nights),
    travelers: Number(row.travelers),
    check_in: String(row.check_in).slice(0, 10),
    amount_inr: Number(row.amount_inr),
    swaps,
    status: String(row.status),
    card_last4: row.card_last4 == null ? null : String(row.card_last4),
    card_brand: row.card_brand == null ? null : String(row.card_brand),
    user_id: row.user_id == null ? undefined : String(row.user_id),
    payer_name: String(row.payer_name),
    confirmation_code: String(row.confirmation_code),
    payment_method: row.payment_method == null ? null : String(row.payment_method),
    payment_ref: row.payment_ref == null ? null : String(row.payment_ref),
    upi_handle: row.upi_handle == null ? null : String(row.upi_handle),
    bank_name: row.bank_name == null ? null : String(row.bank_name),
    created_at: String(row.created_at),
  });
}

function neonWire(
  local: CaptureLocal,
  userId: string,
  roomId: string,
  units: number,
  exceptHoldIds: string[],
) {
  return {
    user_id: local.userId || userId,
    package_id: local.packageId,
    package_name: local.packageName,
    nights: local.nights,
    travelers: local.travelers,
    check_in: local.checkIn,
    amount_inr: local.amountInr,
    swaps: local.swaps,
    status: local.status,
    card_last4: local.cardLast4,
    card_brand: local.cardBrand,
    payer_name: local.payerName,
    confirmation_code: local.confirmationCode,
    payment_method: local.paymentMethod,
    payment_ref: local.paymentRef,
    upi_handle: local.upiHandle,
    bank_name: local.bankName,
    room_id: roomId,
    units,
    except_hold_ids: exceptHoldIds,
  };
}

async function insertNeonBooking(
  payload: Record<string, unknown>,
): Promise<{ ok: true; booking: BookingRow } | { ok: false; soldOut: boolean; missing: boolean }> {
  try {
    const sql = await getSql();
    const rows = await sql.query<{ booking: unknown }>("select tw_reserve_booking($1::jsonb) as booking", [
      JSON.stringify(payload),
    ]);
    const booking = asBooking(rows[0]?.booking);
    if (!booking) return { ok: false, soldOut: false, missing: false };
    return { ok: true, booking };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/sold_out/i.test(message)) return { ok: false, soldOut: true, missing: false };
    if (/42883|does not exist|tw_reserve_booking/i.test(message)) {
      return { ok: false, soldOut: false, missing: true };
    }
    throw err;
  }
}

async function insertCapturedBooking(job: ReconcileJob, payload: StoredPayload): Promise<BookingRow | null> {
  const roomId = payload.roomId || readMeta(payload.swaps).roomId || "";
  const units = payload.units || 1;
  const exceptHoldIds = payload.exceptHoldIds ?? [];
  if (isSupabaseConfigured()) {
    return sbInsertBooking({
      userId: payload.userId || job.userId,
      packageId: payload.packageId,
      packageName: payload.packageName,
      nights: payload.nights,
      travelers: payload.travelers,
      checkIn: payload.checkIn,
      amountInr: payload.amountInr,
      swaps: payload.swaps,
      status: payload.status,
      cardLast4: payload.cardLast4,
      cardBrand: payload.cardBrand,
      payerName: payload.payerName,
      confirmationCode: payload.confirmationCode,
      paymentMethod: payload.paymentMethod,
      paymentRef: payload.paymentRef,
      upiHandle: payload.upiHandle,
      bankName: payload.bankName,
      roomId,
      units,
      exceptHoldIds,
    });
  }
  if (shouldSkipNeon()) throw new Error("no durable store");
  const neon = await insertNeonBooking(neonWire(payload, job.userId, roomId, units, exceptHoldIds));
  if (neon.soldOut) throw new Error("sold_out");
  if (!neon.ok) throw new Error(neon.missing ? "no durable store" : "insert returned empty");
  return neon.booking;
}

async function releasePayloadHolds(userId: string, exceptHoldIds: string[] | undefined) {
  for (const id of exceptHoldIds ?? []) {
    releaseHoldById(id);
    await releaseCheckoutHold({ userId, holdId: id });
  }
}

async function compensateSoldOut(job: ReconcileJob, amountInr: number): Promise<string> {
  const payload = parsePayload(job);
  await releasePayloadHolds(job.userId, payload?.exceptHoldIds);
  const paymentId = job.paymentId;
  if (!paymentId.startsWith("pay_")) {
    await touchJob(job.id, { state: "failed", lastError: "sold_out" });
    return `Payment ${paymentId} was captured, but those nights are sold out and the stay is not confirmed. Do not pay again.`;
  }
  const { fetchRazorpayPayment, refundRazorpayPayment } = await import("@/lib/server/razorpay");
  const payment = await fetchRazorpayPayment(paymentId);
  const already = (payment?.amountRefundedPaise ?? 0) >= Math.round(amountInr * 100);
  if (already) {
    await touchJob(job.id, { state: "refunded", lastError: "sold_out" });
    return "Those nights sold out after payment. The charge was sent back. The stay is not confirmed.";
  }
  const refunded = await refundRazorpayPayment(paymentId, amountInr);
  if (refunded.ok) {
    await touchJob(job.id, { state: "refunded", lastError: "sold_out" });
    return `Those nights sold out after payment. ₹${amountInr.toLocaleString("en-IN")} was sent back. The stay is not confirmed.`;
  }
  await touchJob(job.id, { state: "queued", lastError: "sold_out" });
  return `Payment ${paymentId} was captured, but those nights are sold out and the stay is not confirmed. Automatic refund failed. Do not pay again. Quote ${paymentId} to the desk.`;
}

async function runReconcileJob(job: ReconcileJob): Promise<BookingRow | null> {
  if (job.state === "done" || job.state === "refunded" || job.state === "failed") return null;
  if (job.lastError?.includes("sold_out")) return null;
  const attempt = job.attempts + 1;
  await touchJob(job.id, { attempts: attempt });
  const payload = parsePayload(job);
  if (!payload) {
    await touchJob(job.id, { lastError: "bad payload", state: "failed" });
    return null;
  }
  const { fetchRazorpayPayment } = await import("@/lib/server/razorpay");
  const payment = await fetchRazorpayPayment(job.paymentId);
  if (!payment || (payment.status !== "captured" && payment.status !== "authorized")) {
    await touchJob(job.id, {
      lastError: payment ? `status ${payment.status}` : "payment lookup failed",
    });
    return null;
  }
  try {
    const booking = await insertCapturedBooking(job, payload);
    if (!booking) {
      await touchJob(job.id, {
        lastError: "insert returned empty",
        state: attempt >= 5 ? "failed" : "queued",
      });
      return null;
    }
    const roomId = payload.roomId || readMeta(payload.swaps).roomId || "";
    if (roomId) {
      recordHold({
        holdId: booking.confirmationCode,
        packageId: booking.packageId,
        roomId,
        checkIn: booking.checkIn,
        nights: booking.nights,
        status: "paid",
      });
    }
    await touchJob(job.id, { lastError: undefined, state: "done" });
    return { ...booking, userId: job.userId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "insert failed";
    if (message.includes("sold_out")) {
      await touchJob(job.id, { lastError: "sold_out" });
      return null;
    }
    await touchJob(job.id, { lastError: message, state: attempt >= 5 ? "failed" : "queued" });
    console.error("[bookings] reconcile insert failed", err);
    return null;
  }
}

async function drainReconcileJobs(userId: string) {
  const loaded = await loadReconcileJobs(userId);
  if (loaded) mergeReconcileJobs(loaded);
  const now = Date.now();
  for (const job of listReconcileJobs()) {
    if (job.userId !== userId || job.state !== "queued") continue;
    if (job.attempts >= 5) continue;
    if (job.lastError?.includes("sold_out")) {
      const payload = parsePayload(job);
      await compensateSoldOut(job, Number(payload?.amountInr ?? 0));
      continue;
    }
    if (job.attempts > 0 && now - Date.parse(job.updatedAt) < 60_000) continue;
    await runReconcileJob(job);
  }
}

async function queueCaptureReconcile(input: {
  userId: string;
  paymentId: string;
  orderId: string | null;
  local: CaptureLocal;
  roomId: string;
  units: number;
  exceptHoldIds: string[];
}): Promise<CreateBookingResult> {
  const now = new Date().toISOString();
  const job: ReconcileJob = {
    id: `rec_${input.paymentId}`,
    userId: input.userId,
    paymentId: input.paymentId,
    orderId: input.orderId,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    state: "queued",
    payloadJson: JSON.stringify({
      ...input.local,
      roomId: input.roomId,
      units: input.units,
      exceptHoldIds: input.exceptHoldIds,
    }),
  };
  const saved = await persistReconcileJob(job);
  const booking = await runReconcileJob(job);
  if (booking) return { ok: true, booking, stored: isSupabaseConfigured() ? "supabase" : "local" };
  const current = listReconcileJobs().find((row) => row.id === job.id);
  if (current?.lastError?.includes("sold_out")) {
    return { ok: false, message: await compensateSoldOut(current, input.local.amountInr) };
  }
  if (!saved) {
    return {
      ok: false,
      message: `Payment ${input.paymentId} was captured, but the stay is not confirmed and the retry could not be saved. Do not pay again. Quote payment ${input.paymentId} to the desk.`,
    };
  }
  return {
    ok: false,
    message: `Payment ${input.paymentId} was captured, but the stay is not saved yet. A retry is queued. Do not pay again — check My trips in a few minutes.`,
  };
}

export const createBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ context, data }): Promise<CreateBookingResult> => {
    const payable = await computePayable({
      packageId: data.packageId,
      swaps: data.swaps,
      travelers: data.travelers,
      checkIn: data.checkIn,
      nights: data.nights,
      roomId: data.roomId,
    });
    if (!payable.ok) return { ok: false, message: payable.message, field: payable.field };

    const pkg = getPackage(payable.packageId);
    if (!pkg) return { ok: false, message: "Stay not found." };
    const room = getRoom(pkg, payable.roomId);
    const nights = payable.nights;
    const amount = payable.amountInr;
    const pickupInr = payable.pickupInr;
    const packageName = payable.packageName;
    const code = makeCode();
    const travel = parseTravelPlan(readMeta(data.swaps ?? {}).travel);

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
      const { verifyRazorpaySignature, peekOrder, consumeOrder, fetchRazorpayOrder } = await import("@/lib/server/razorpay");
      const verified = verifyRazorpaySignature({
        razorpay_order_id: data.razorpayOrderId,
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
      });
      if (!verified.ok) {
        return { ok: false, message: verified.message || "Payment verification failed." };
      }
      const pending = peekOrder(data.razorpayOrderId);
      if (pending) {
        if (pending.userId !== context.userId) {
          return { ok: false, message: "This payment belongs to another session." };
        }
        if (
          pending.packageId !== payable.packageId ||
          pending.checkIn !== payable.checkIn ||
          pending.roomId !== payable.roomId ||
          pending.nights !== payable.nights ||
          pending.travelers !== payable.travelers ||
          pending.amountInr !== payable.amountInr
        ) {
          return { ok: false, message: "Payment does not match this stay. Start checkout again." };
        }
      }
      const remote = await fetchRazorpayOrder(data.razorpayOrderId);
      if (remote && remote.amountPaise !== Math.round(payable.amountInr * 100)) {
        return { ok: false, message: "Paid amount does not match the current stay price." };
      }
      consumeOrder(data.razorpayOrderId, context.userId);
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
      if (!sandboxPaymentsAllowed()) {
        return { ok: false, message: "Only Razorpay checkout is accepted on this host." };
      }
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
      userId: context.userId,
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

    const holdBase = {
      packageId: pkg.id,
      roomId: room.id,
      checkIn: data.checkIn,
      nights,
      status: "paid" as const,
    };
    const checkoutHoldIds = holdIdsForCheckout({
      userId: context.userId,
      packageId: pkg.id,
      roomId: room.id,
      checkIn: data.checkIn,
      nights,
      orderId: data.razorpayOrderId,
    });
    const freeCheckoutHolds = async () => {
      for (const id of checkoutHoldIds) {
        releaseHoldById(id);
        await releaseCheckoutHold({ userId: context.userId, holdId: id });
      }
    };
    const queuedCapture = () =>
      queueCaptureReconcile({
        userId: context.userId,
        paymentId: paid.ref,
        orderId: data.razorpayOrderId ?? null,
        local,
        roomId: room.id,
        units: roomUnits(pkg, room.id),
        exceptHoldIds: checkoutHoldIds,
      });

    const finishStored = async (booking: BookingRow, stored: "supabase" | "local") => {
      await freeCheckoutHolds();
      recordHold({ ...holdBase, holdId: booking.confirmationCode });
      if (stored === "supabase") {
        await sbInsertPaymentEvent({
          userId: context.userId,
          bookingId: booking.id,
          eventType: "captured",
          orderId: data.razorpayOrderId ?? null,
          paymentId: paid.ref,
          payload: { method: paid.method, confirmation: code },
        });
      }
      return { ok: true as const, booking, stored };
    };

    if (isSupabaseConfigured()) {
      try {
        const booking = await sbInsertBooking({
          userId: context.userId,
          ...local,
          roomId: room.id,
          units: roomUnits(pkg, room.id),
          exceptHoldIds: checkoutHoldIds,
        });
        if (booking) return await finishStored({ ...booking, userId: context.userId }, "supabase");
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("sold_out")) {
          if (paid.method === "razorpay" && failClosedAfterCapture()) return queuedCapture();
          await freeCheckoutHolds();
          return { ok: false, message: "Those nights are sold out for this room. Pick another date." };
        }
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[bookings] supabase insert failed", err);
      }
      if (paid.method === "razorpay" && failClosedAfterCapture()) return queuedCapture();
    }

    if (useMemoryStore()) {
      if (paid.method === "razorpay" && failClosedAfterCapture()) return queuedCapture();
      await freeCheckoutHolds();
      recordHold({ ...holdBase, holdId: code });
      return { ok: true, booking: memoryInsertBooking(local), stored: "local" };
    }

    try {
      const neon = await insertNeonBooking(
        neonWire(local, context.userId, room.id, roomUnits(pkg, room.id), checkoutHoldIds),
      );
      if (neon.ok) return await finishStored(neon.booking, "local");
      if (neon.soldOut) {
        if (paid.method === "razorpay" && failClosedAfterCapture()) return queuedCapture();
        await freeCheckoutHolds();
        return { ok: false, message: "Those nights are sold out for this room. Pick another date." };
      }
      if (!neon.missing) {
        if (paid.method === "razorpay" && failClosedAfterCapture()) return queuedCapture();
        await freeCheckoutHolds();
        recordHold({ ...holdBase, holdId: code });
        return { ok: true, booking: memoryInsertBooking(local), stored: "local" };
      }
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
        if (paid.method === "razorpay" && failClosedAfterCapture()) return queuedCapture();
        await freeCheckoutHolds();
        recordHold({ ...holdBase, holdId: code });
        return { ok: true, booking: memoryInsertBooking(local), stored: "local" };
      }
      return await finishStored(mapBooking({ ...row, user_id: context.userId }), "local");
    } catch (err) {
      markDurableDbFailed(err);
      if (paid.method === "razorpay" && failClosedAfterCapture()) return queuedCapture();
      await freeCheckoutHolds();
      recordHold({ ...holdBase, holdId: code });
      return { ok: true, booking: memoryInsertBooking(local), stored: "local" };
    }
  });

export type CancelResult =
  | { ok: true; status: string; refundAmount: number; message: string }
  | { ok: false; message: string };

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => id)
  .handler(async ({ context, data: id }): Promise<CancelResult> => {
    try {
      await hydrateRefundIntents(context.userId);
    } catch (err) {
      console.error("[bookings] refund hydrate", err);
    }
    let rows: BookingRow[] = memoryBookingsFor(context.userId);
    if (isSupabaseConfigured()) {
      try {
        const cloud = await sbListBookings(context.userId);
        if (cloud?.length) rows = cloud.map((row) => ({ ...row, userId: row.userId ?? context.userId }));
      } catch {
        /* memory */
      }
    }
    const target = rows.find((b) => b.id === id);
    const openStatus = target?.status === "paid" || target?.status === "held" || target?.status === "confirmed" || target?.status === "refund_pending";
    if (!target || !openStatus) {
      return { ok: false, message: "That stay is not open to cancel." };
    }
    if (target.userId && target.userId !== context.userId) {
      return { ok: false, message: "That stay is not open to cancel." };
    }

    const policy = refundPolicyFor(target.checkIn);
    const amount = refundAmountInr(target.amountInr, target.checkIn);
    if (policy.fraction <= 0) {
      return { ok: false, message: policy.label };
    }

    const prior = refundIntentFor(context.userId, id);
    let refundId = prior?.refundId;
    const ref = target.paymentRef ?? "";
    const intentBase = {
      id: prior?.id ?? `refund_${context.userId}_${id}`,
      userId: context.userId,
      bookingId: id,
      paymentRef: ref,
      amountInr: amount,
      createdAt: prior?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const durableRequired = isSupabaseConfigured() || process.env.VERCEL_ENV === "production";
    const pendingSaved = await persistRefundIntent({
      ...intentBase,
      status: prior?.status === "gateway_done" || prior?.status === "applied" ? prior.status : "pending",
      refundId,
    });
    if (!pendingSaved && durableRequired && prior?.status !== "gateway_done" && prior?.status !== "applied") {
      return { ok: false, message: "Could not record the refund. Nothing was sent back. Try again." };
    }

    if (target.paymentMethod === "razorpay" && ref.startsWith("pay_") && prior?.status !== "gateway_done" && prior?.status !== "applied") {
      const { fetchRazorpayPayment, refundRazorpayPayment } = await import("@/lib/server/razorpay");
      const payment = await fetchRazorpayPayment(ref);
      const already = (payment?.amountRefundedPaise ?? 0) >= Math.round(amount * 100);
      if (already) {
        refundId = refundId ?? "already_refunded";
        await persistRefundIntent({ ...intentBase, status: "gateway_done", refundId });
      } else {
        const refunded = await refundRazorpayPayment(ref, amount);
        if (!refunded.ok) return { ok: false, message: refunded.message };
        refundId = refunded.refundId;
        await persistRefundIntent({ ...intentBase, status: "gateway_done", refundId });
      }
    }

    const status = "refunded";
    const meta = writeMeta(target.swaps, {
      refundId,
      refundAmount: amount,
      refundedAt: new Date().toISOString(),
    });
    memoryUpdateBooking(context.userId, id, { status, swaps: meta });
    releaseHoldById(target.confirmationCode);
    const roomId = readMeta(meta).roomId ?? "";
    if (roomId) releaseHoldById(`${target.packageId}:${roomId}:${target.checkIn}`);

    let statusSaved = true;
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
        statusSaved = false;
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
          where id = ${id} and user_id = ${context.userId} and status in ('paid', 'held', 'confirmed')
        `;
      } catch (err) {
        statusSaved = false;
        markDurableDbFailed(err);
      }
    }

    if (!statusSaved) {
      return {
        ok: false,
        message: `₹${amount.toLocaleString("en-IN")} was sent back, but the stay status did not update. It will show as refund pending. Do not request another refund.`,
      };
    }

    await persistRefundIntent({ ...intentBase, status: "applied", refundId });
    return {
      ok: true,
      status,
      refundAmount: amount,
      message: `${policy.label}. \u20b9${amount.toLocaleString("en-IN")} will return to the original payment.`,
    };
  });

export { methodLabel };
