import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { recordHold, releaseHoldById, roomUnits, tryReserveHold } from "@/lib/inventory";
import { getPackage } from "@/lib/packages";
import { computePayable, payTestAllowed } from "@/lib/server/payable";
import { pendingHoldId as checkoutPendingId, releaseCheckoutHold, reserveCheckoutHold } from "@/lib/server/room-holds";

function getKeyId() {
  return process.env.RAZORPAY_KEY_ID?.trim() || process.env.VITE_RAZORPAY_KEY_ID?.trim() || "";
}

function getKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || "";
}

function authHeader() {
  const id = getKeyId();
  const secret = getKeySecret();
  if (!id || !secret) {
    throw new Error("Razorpay is not configured (missing KEY_ID or KEY_SECRET).");
  }
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

type PendingOrder = {
  orderId: string;
  userId: string;
  amountInr: number;
  amountPaise: number;
  packageId: string;
  roomId: string;
  nights: number;
  travelers: number;
  checkIn: string;
  createdAt: number;
  used?: boolean;
};

const g = globalThis as typeof globalThis & { __twPendingOrders__?: Map<string, PendingOrder> };
if (!g.__twPendingOrders__) g.__twPendingOrders__ = new Map();

const ORDER_TTL_MS = 45 * 60 * 1000;

function pruneOrders(now = Date.now()) {
  const store = g.__twPendingOrders__!;
  for (const [id, row] of store) {
    if (row.used || now - row.createdAt > ORDER_TTL_MS) store.delete(id);
  }
}

export function rememberOrder(row: PendingOrder) {
  pruneOrders();
  g.__twPendingOrders__!.set(row.orderId, row);
}

export function peekOrder(orderId: string): PendingOrder | undefined {
  pruneOrders();
  return g.__twPendingOrders__!.get(orderId);
}

export function consumeOrder(orderId: string, userId: string): PendingOrder | undefined {
  const row = peekOrder(orderId);
  if (!row || row.userId !== userId || row.used) return undefined;
  row.used = true;
  return row;
}

const staySchema = z.object({
  packageId: z.string().min(1),
  swaps: z.record(z.string(), z.string()).optional().default({}),
  travelers: z.number().int().min(1).max(12),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().min(1).max(14).optional(),
  roomId: z.string().max(40).optional(),
  receipt: z.string().min(1).max(40).optional(),
});

const createOrderSchema = z.discriminatedUnion("kind", [
  staySchema.extend({ kind: z.literal("stay") }),
  z.object({
    kind: z.literal("test"),
    receipt: z.string().min(1).max(40).optional(),
  }),
]);

export type CreateOrderResult =
  | { ok: true; orderId: string; amount: number; currency: string; keyId: string; amountInr: number }
  | { ok: false; message: string };

async function razorpayCreateOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const body = {
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes,
  };
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    id?: string;
    amount?: number;
    currency?: string;
    error?: { description?: string; code?: string };
  };
  if (!res.ok || !json.id) {
    const msg = json.error?.description ?? `Razorpay order failed (${res.status})`;
    console.error("[razorpay] create order failed", res.status, json);
    if (res.status === 401) {
      return { ok: false as const, message: "Razorpay authentication failed. Check API keys." };
    }
    return { ok: false as const, message: msg };
  }
  return {
    ok: true as const,
    orderId: json.id,
    amount: json.amount ?? amountPaise,
    currency: json.currency ?? "INR",
  };
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{
  id: string;
  status: string;
  amountPaise: number;
  amountRefundedPaise: number;
  orderId: string | null;
} | null> {
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      id?: string;
      status?: string;
      amount?: number;
      amount_refunded?: number;
      order_id?: string;
    };
    if (!json.id || !json.status || !json.amount) return null;
    return {
      id: json.id,
      status: json.status,
      amountPaise: json.amount,
      amountRefundedPaise: json.amount_refunded ?? 0,
      orderId: json.order_id ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchRazorpayOrder(orderId: string): Promise<{ amountPaise: number } | null> {
  try {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { amount?: number };
    if (!json.amount || !Number.isFinite(json.amount)) return null;
    return { amountPaise: json.amount };
  } catch {
    return null;
  }
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data, context }): Promise<CreateOrderResult> => {
    let pendingHoldId = "";
    try {
      if (data.kind === "test") {
        if (!payTestAllowed()) {
          return { ok: false, message: "Test charges are disabled on this host." };
        }
        const amountPaise = 100;
        const created = await razorpayCreateOrder(amountPaise, data.receipt ?? `tw_test_${Date.now()}`, {
          purpose: "razorpay_activation_test",
          userId: context.userId,
        });
        if (!created.ok) return created;
        rememberOrder({
          orderId: created.orderId,
          userId: context.userId,
          amountInr: 1,
          amountPaise,
          packageId: "_test",
          roomId: "",
          nights: 0,
          travelers: 0,
          checkIn: "",
          createdAt: Date.now(),
        });
        return {
          ok: true,
          orderId: created.orderId,
          amount: created.amount,
          currency: created.currency,
          keyId: getKeyId(),
          amountInr: 1,
        };
      }

      const payable = await computePayable(data);
      if (!payable.ok) return { ok: false, message: payable.message };
      const pkgForHold = getPackage(payable.packageId);
      const units = pkgForHold ? roomUnits(pkgForHold, payable.roomId) : 1;
      pendingHoldId = checkoutPendingId({
        userId: context.userId,
        packageId: payable.packageId,
        roomId: payable.roomId,
        checkIn: payable.checkIn,
        nights: payable.nights,
      });
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const holdBody = {
        holdId: pendingHoldId,
        packageId: payable.packageId,
        roomId: payable.roomId,
        checkIn: payable.checkIn,
        nights: payable.nights,
        status: "held" as const,
        expiresAt,
      };
      const reserved = await reserveCheckoutHold({
        ...holdBody,
        userId: context.userId,
        units,
      });
      if (reserved === "sold_out") {
        return { ok: false, message: "Those nights just sold out. Pick another date." };
      }
      if (reserved === "ok") {
        recordHold(holdBody);
      } else if (reserved === "missing" || !(process.env.VERCEL || process.env.NODE_ENV === "production")) {
        if (!tryReserveHold(holdBody)) {
          return { ok: false, message: "Those nights just sold out. Pick another date." };
        }
      } else {
        return { ok: false, message: "Could not reserve this room. Try again in a moment." };
      }
      const amountPaise = Math.round(payable.amountInr * 100);
      if (amountPaise < 100) {
        releaseHoldById(pendingHoldId);
        await releaseCheckoutHold({ userId: context.userId, holdId: pendingHoldId });
        return { ok: false, message: "Amount must be at least \u20b91 (100 paise)." };
      }

      const created = await razorpayCreateOrder(
        amountPaise,
        data.receipt ?? `tw_${payable.packageId}_${Date.now()}`.slice(0, 40),
        {
          packageId: payable.packageId,
          roomId: payable.roomId,
          travelers: String(payable.travelers),
          checkIn: payable.checkIn,
          nights: String(payable.nights),
          pickupInr: String(payable.pickupInr),
          userId: context.userId,
        },
      );
      if (!created.ok) {
        releaseHoldById(pendingHoldId);
        await releaseCheckoutHold({ userId: context.userId, holdId: pendingHoldId });
        return created;
      }
      recordHold({
        holdId: created.orderId,
        packageId: payable.packageId,
        roomId: payable.roomId,
        checkIn: payable.checkIn,
        nights: payable.nights,
        status: "held",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
      releaseHoldById(pendingHoldId);

      rememberOrder({
        orderId: created.orderId,
        userId: context.userId,
        amountInr: payable.amountInr,
        amountPaise,
        packageId: payable.packageId,
        roomId: payable.roomId,
        nights: payable.nights,
        travelers: payable.travelers,
        checkIn: payable.checkIn,
        createdAt: Date.now(),
      });

      return {
        ok: true,
        orderId: created.orderId,
        amount: created.amount,
        currency: created.currency,
        keyId: getKeyId(),
        amountInr: payable.amountInr,
      };
    } catch (err) {
      if (pendingHoldId) {
        releaseHoldById(pendingHoldId);
        await releaseCheckoutHold({ userId: context.userId, holdId: pendingHoldId });
      }
      console.error("[razorpay] create order error", err);
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Could not create payment order.",
      };
    }
  });

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyPaymentResult =
  | { ok: true; orderId: string; paymentId: string }
  | { ok: false; message: string };

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i]! ^ b[i]!;
  return out === 0;
}

export function verifyRazorpaySignature(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): { ok: true } | { ok: false; message: string } {
  const secret = getKeySecret();
  if (!secret) {
    return { ok: false, message: "Razorpay is not configured." };
  }
  const payload = `${input.razorpay_order_id}|${input.razorpay_payment_id}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(input.razorpay_signature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, message: "Payment signature mismatch. Payment was not accepted." };
  }
  return { ok: true };
}

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }): Promise<VerifyPaymentResult> => {
    const result = verifyRazorpaySignature(data);
    if (!result.ok) return result;
    return {
      ok: true,
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
    };
  });

export type RefundResult =
  | { ok: true; refundId: string; amountInr: number }
  | { ok: false; message: string };

export async function refundRazorpayPayment(
  paymentId: string,
  amountInr: number,
): Promise<RefundResult> {
  if (!paymentId.startsWith("pay_")) {
    return { ok: false, message: "Not a Razorpay payment." };
  }
  const amountPaise = Math.round(amountInr * 100);
  if (amountPaise <= 0) {
    return { ok: false, message: "Nothing to refund." };
  }
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: amountPaise }),
    });
    const json = (await res.json()) as {
      id?: string;
      amount?: number;
      error?: { description?: string };
    };
    if (!res.ok || !json.id) {
      return { ok: false, message: json.error?.description ?? `Refund failed (${res.status})` };
    }
    return { ok: true, refundId: json.id, amountInr: Math.round((json.amount ?? amountPaise) / 100) };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Refund failed." };
  }
}

export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  return getKeyId();
});
