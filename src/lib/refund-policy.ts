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
 * Statuses the guest cancel flow accepts. Ask TripWeave and cancelBooking share this,
 * so a stay that cannot be cancelled is never quoted a refund.
 * desk_confirmed and checked_in go through the hotel desk, not the guest cancel button.
 */
const CANCELLABLE = new Set(["paid", "held", "confirmed", "refund_pending"]);

export function isCancellableStatus(status: string | null | undefined): boolean {
  return typeof status === "string" && CANCELLABLE.has(status);
}

/**
 * A stay that is still live for the guest: booked and not cancelled, refunded, refund pending,
 * checked in or completed. Hotel requests (airport car) are only sent for these.
 */
const ACTIVE = new Set(["paid", "held", "confirmed", "desk_confirmed"]);

export function isActiveStayStatus(status: string | null | undefined): boolean {
  return typeof status === "string" && ACTIVE.has(status);
}
