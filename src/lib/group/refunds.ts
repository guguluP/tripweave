import { guestCancelMode, refundAmountInr } from "../refund-policy.ts";
import type { GroupPayment, GroupStatus } from "./types.ts";

export type GroupRefundReason =
  | "expire"
  | "decline"
  | "unavailable"
  | "organiser_cancel"
  | "member_drop"
  | "late"
  | "duplicate";

export type RefundLine = {
  paymentId: string;
  razorpayPaymentId: string;
  amountInr: number;
  fraction: number;
  reason: GroupRefundReason;
};

/**
 * Before the hotel confirms, every failure refunds the captured share in full.
 * After desk confirmation, guestCancelMode('desk_confirmed') is no_refund, so a
 * dropout gets nothing. That is the current product rule, not a hotel deposit term.
 */
export function groupRefundPlan(input: {
  status: GroupStatus;
  checkIn: string;
  payments: GroupPayment[];
  reason: GroupRefundReason;
  now?: Date;
}): RefundLine[] {
  const captured = input.payments.filter((payment) => !payment.late && payment.amountInr > 0);
  const full =
    input.reason === "expire" ||
    input.reason === "decline" ||
    input.reason === "unavailable" ||
    input.reason === "late" ||
    input.reason === "duplicate" ||
    input.status === "collecting" ||
    input.status === "locked" ||
    input.status === "voting" ||
    input.status === "fully_paid_awaiting_hotel" ||
    input.status === "expired";

  return captured.map((payment) => {
    if (full && input.status !== "hotel_confirmed" && input.status !== "completed") {
      return line(payment, input.reason, 1, payment.amountInr);
    }
    if (guestCancelMode("desk_confirmed") === "no_refund") {
      return line(payment, input.reason, 0, 0);
    }
    const amount = refundAmountInr(payment.amountInr, input.checkIn, input.now);
    const fraction = payment.amountInr > 0 ? amount / payment.amountInr : 0;
    return line(payment, input.reason, fraction, amount);
  });
}

function line(payment: GroupPayment, reason: GroupRefundReason, fraction: number, amountInr: number): RefundLine {
  return {
    paymentId: payment.id,
    razorpayPaymentId: payment.razorpayPaymentId,
    amountInr,
    fraction,
    reason,
  };
}
