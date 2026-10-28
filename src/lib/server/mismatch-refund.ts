/**
 * Cold-path verify: the Razorpay order was found, but its amount or stay notes do not match
 * the stay being booked. The charge is sent back instead of kept. No booking is ever written
 * for that payment, and a payment that already has a booking is never refunded here.
 * Pure decision logic; bookings.ts does the I/O.
 */

/** Reconcile job marker. A job with this lastError only refunds; it never inserts a stay. */
export const MISMATCH_REFUND = "stay_mismatch_refund";

export const MISMATCH_MESSAGE = "Payment does not match this stay. Start checkout again.";

export type MismatchDecision =
  | { action: "refuse"; message: string }
  | { action: "already_refunded"; message: string }
  | { action: "refund"; amountInr: number }
  | { action: "retry"; message: string };

export const ALREADY_REFUNDED =
  "Payment does not match this stay, so no stay was booked. The charge was sent back. Start checkout again.";

export function refundQueuedMessage(paymentId: string): string {
  return `Payment ${paymentId} does not match this stay, so no stay was booked. A refund is queued. Do not pay again. Start checkout again.`;
}

export function refundSentMessage(amountInr: number): string {
  return `Payment does not match this stay, so no stay was booked. ₹${amountInr.toLocaleString("en-IN")} was sent back. Start checkout again.`;
}

/** True when an earlier verify already decided to send this payment back. */
export function isMismatchRefundJob(job: { state: string; lastError?: string } | null | undefined): boolean {
  return Boolean(job && job.lastError === MISMATCH_REFUND);
}

export function decideMismatchRefund(input: {
  userId: string;
  paymentId: string;
  /** userId written in the Razorpay order notes when the order was created. */
  notesUserId: string | null | undefined;
  /** Any stay already stored for this payment id, for any user. "unknown" when the lookup failed. */
  bookedAlready: boolean | "unknown";
  prior: { state: string; lastError?: string } | null;
  /** True when the durable reconcile-job read failed, so `prior` may be missing a row. */
  priorUnknown?: boolean;
  payment: { status: string; amountPaise: number; amountRefundedPaise: number } | null;
}): MismatchDecision {
  // Not this guest's order, or already a stay: a replay. Keep the old answer and refund nothing.
  if (!input.notesUserId || input.notesUserId !== input.userId) {
    return { action: "refuse", message: MISMATCH_MESSAGE };
  }
  if (!input.paymentId.startsWith("pay_")) return { action: "refuse", message: MISMATCH_MESSAGE };
  // A failed lookup is not "not booked": queue the refund marker and decide on the retry.
  if (input.bookedAlready === "unknown" || input.priorUnknown === true) {
    return { action: "retry", message: refundQueuedMessage(input.paymentId) };
  }
  if (input.bookedAlready) {
    return { action: "refuse", message: "This payment is already booked. Check My trips. Do not pay again." };
  }
  const prior = input.prior;
  if (prior && prior.state === "done") {
    return { action: "refuse", message: "This payment is already booked. Check My trips. Do not pay again." };
  }
  if (prior && prior.state === "refunded") {
    return { action: "already_refunded", message: ALREADY_REFUNDED };
  }
  // A webhook or retry is already booking this payment from its order notes.
  if (prior && prior.state === "queued" && !isMismatchRefundJob(prior)) {
    return {
      action: "refuse",
      message: "This payment is already being booked from its order. Check My trips in a few minutes. Do not pay again.",
    };
  }
  if (!input.payment) return { action: "retry", message: refundQueuedMessage(input.paymentId) };
  if (input.payment.status !== "captured") {
    // Authorized or failed payments are not kept by Razorpay without capture.
    return { action: "refuse", message: MISMATCH_MESSAGE };
  }
  const left = input.payment.amountPaise - input.payment.amountRefundedPaise;
  if (left <= 0) {
    return { action: "already_refunded", message: ALREADY_REFUNDED };
  }
  return { action: "refund", amountInr: left / 100 };
}

/** Refund attempts before a mismatch refund is marked failed and ops is alerted. */
export const MAX_REFUND_ATTEMPTS = 5;

export function refundDeskMessage(paymentId: string): string {
  return `Payment ${paymentId} does not match this stay, so no stay was booked. Automatic refund failed. Do not pay again. Quote payment ${paymentId} to the desk.`;
}

/** What a replay of a payment that already has a mismatch refund job should be told. */
export function mismatchJobMessage(job: { state: string }, paymentId: string): string {
  if (job.state === "refunded") return ALREADY_REFUNDED;
  if (job.state === "failed") return refundDeskMessage(paymentId);
  return refundQueuedMessage(paymentId);
}
