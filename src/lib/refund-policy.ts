/** Free-cancel window: 48 hours before noon IST check-in. Inside that, 50%. After check-in noon IST, none. */

export type RefundPolicy = {
  fraction: number;
  label: string;
  hoursUntilCheckIn: number;
};

export function hoursUntilCheckIn(checkIn: string, now = new Date()): number {
  const noon = new Date(`${checkIn}T12:00:00+05:30`);
  if (Number.isNaN(noon.getTime())) return 0;
  return (noon.getTime() - now.getTime()) / 36e5;
}

export function refundPolicyFor(checkIn: string, now = new Date()): RefundPolicy {
  const hours = hoursUntilCheckIn(checkIn, now);
  if (hours >= 48) {
    return {
      fraction: 1,
      label: "Full refund — more than 48 hours before check-in noon IST",
      hoursUntilCheckIn: hours,
    };
  }
  if (hours >= 0) {
    return {
      fraction: 0.5,
      label: "50% refund — inside 48 hours of check-in noon IST",
      hoursUntilCheckIn: hours,
    };
  }
  return { fraction: 0, label: "No refund after check-in noon IST", hoursUntilCheckIn: hours };
}

export function refundAmountInr(amountInr: number, checkIn: string, now = new Date()): number {
  const policy = refundPolicyFor(checkIn, now);
  return Math.round(amountInr * policy.fraction);
}

export function isClosedStay(status: string) {
  return status === "cancelled" || status === "refunded";
}

export function stayStatusLabel(status: string) {
  if (status === "refunded") return "Refunded";
  if (status === "refund_pending") return "Refund pending";
  if (status === "cancelled") return "Cancelled";
  if (status === "held") return "Held";
  if (status === "completed") return "Completed";
  if (status === "checked_in") return "Checked in";
  if (status === "desk_confirmed" || status === "confirmed") return "Hotel confirmed";
  if (status === "paid") return "Awaiting hotel confirmation";
  return "Paid";
}

/**
 * How the guest may cancel a stay from My trips.
 * - "refund": not yet confirmed by the hotel desk (paid, held, legacy confirmed, refund_pending).
 *   The time-based refund policy above applies.
 * - "no_refund": the hotel desk confirmed the room (desk_confirmed) or the guest has checked in
 *   (checked_in). The guest may still cancel, but no refund is issued (Piyush's decision,
 *   Oct 2026: "confirmed (or checked in) may cancel, no refund").
 * - null: nothing to cancel (completed, cancelled, refunded, failed, ...).
 *
 * Legacy "confirmed" rows predate the desk flow (desk_confirmed_at is empty on every one of them),
 * so they keep the refund policy.
 */
export type GuestCancelMode = "refund" | "no_refund";

const REFUND_CANCEL = new Set(["paid", "held", "confirmed", "refund_pending"]);
/** Statuses the guest may cancel without a refund. Same list as the SQL / Supabase writes. */
export const NO_REFUND_CANCEL_STATUSES = ["desk_confirmed", "checked_in"] as const;
const NO_REFUND_CANCEL = new Set<string>(NO_REFUND_CANCEL_STATUSES);

export function guestCancelMode(status: string | null | undefined): GuestCancelMode | null {
  if (typeof status !== "string") return null;
  if (REFUND_CANCEL.has(status)) return "refund";
  if (NO_REFUND_CANCEL.has(status)) return "no_refund";
  return null;
}

export const NO_REFUND_CANCEL_WARNING =
  "The hotel has confirmed this room. If you cancel now, no refund will be issued.";

export const NO_REFUND_CANCEL_WARNING_CHECKED_IN =
  "You have checked in at the hotel. If you cancel now, no refund will be issued.";

export const NO_REFUND_CANCEL_NEEDS_CONFIRM =
  "The hotel has confirmed this stay, so cancelling it now gives no refund. Refresh My trips and use Cancel (no refund) to go ahead.";

export const NO_REFUND_CANCELLED_MESSAGE =
  "Stay cancelled. The hotel had already confirmed it, so no refund was issued.";

export type VoucherClosedState = {
  /** Shown at the top of the voucher and in its footer. */
  notice: string;
  /** Value for the voucher's "Refund" row, or null to leave the row out. */
  refundLine: string | null;
};

/**
 * A voucher for a stay that is no longer valid at the hotel (cancelled, refunded, or cancelled
 * with the refund still pending). Returns null for a live stay. The voucher uses this to put the
 * notice on top and hide the desk slip and pass, so it cannot be shown at the desk as if paid.
 */
export function voucherClosedState(
  status: string,
  meta: { cancelNoRefund?: boolean; refundAmount?: number },
): VoucherClosedState | null {
  const inr = (n: number) => `\u20b9${n.toLocaleString("en-IN")}`;
  const refunded =
    typeof meta.refundAmount === "number" && meta.refundAmount > 0 ? meta.refundAmount : null;
  if (status === "cancelled") {
    if (meta.cancelNoRefund) {
      return {
        notice:
          "Cancelled. You cancelled this stay after the hotel confirmed it, so no refund was issued. Do not use this voucher at the hotel.",
        refundLine: "None (cancelled after the hotel confirmed)",
      };
    }
    return {
      notice: "Cancelled. Do not use this voucher at the hotel.",
      refundLine: refunded ? inr(refunded) : null,
    };
  }
  if (status === "refunded") {
    return {
      notice: "Cancelled and refunded. Do not use this voucher at the hotel.",
      refundLine: refunded
        ? `${inr(refunded)} to the original payment`
        : "Refunded to the original payment",
    };
  }
  if (status === "refund_pending") {
    return {
      notice: "Cancelled. The refund is being processed. Do not use this voucher at the hotel.",
      refundLine: refunded ? `${inr(refunded)}, pending` : "Pending",
    };
  }
  return null;
}
