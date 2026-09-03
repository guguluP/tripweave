import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

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

const createOrderSchema = z.object({
  amountInr: z.number().positive(),
  receipt: z.string().min(1).max(40).optional(),
  notes: z.record(z.string(), z.string()).optional(),
});

export type CreateOrderResult =
  | { ok: true; orderId: string; amount: number; currency: string; keyId: string }
  | { ok: false; message: string };

/**
 * Create a Razorpay order. Amount is in whole rupees; we convert to paise.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    const amountPaise = Math.round(data.amountInr * 100);
    if (amountPaise < 100) {
      return { ok: false, message: "Amount must be at least ₹1 (100 paise)." };
    }

    try {
      const body = {
        amount: amountPaise,
        currency: "INR",
        receipt: data.receipt ?? `tw_${Date.now()}`,
        notes: data.notes ?? {},
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
          return { ok: false, message: "Razorpay authentication failed. Check API keys." };
        }
        return { ok: false, message: msg };
      }

      return {
        ok: true,
        orderId: json.id,
        amount: json.amount ?? amountPaise,
        currency: json.currency ?? "INR",
        keyId: getKeyId(),
      };
    } catch (err) {
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

/** Core signature check — usable from other server modules without createServerFn. */
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

/**
 * Verify Razorpay payment signature: HMAC-SHA256(order_id|payment_id, secret).
 */
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

/** Public key id for the client (never the secret). */
export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  return getKeyId();
});
