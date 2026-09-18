/** Free-cancel window: 48 hours before noon check-in. Inside that, 50%. After check-in, none. */

export type RefundPolicy = {
  fraction: number;
  label: string;
  hoursUntilCheckIn: number;
};

export function hoursUntilCheckIn(checkIn: string, now = new Date()): number {
  const noon = new Date(`${checkIn}T12:00:00`);
  if (Number.isNaN(noon.getTime())) return 0;
  return (noon.getTime() - now.getTime()) / 36e5;
}

export function refundPolicyFor(checkIn: string, now = new Date()): RefundPolicy {
  const hours = hoursUntilCheckIn(checkIn, now);
  if (hours >= 48) {
    return { fraction: 1, label: "Full refund — more than 48 hours before check-in", hoursUntilCheckIn: hours };
  }
  if (hours >= 0) {
    return { fraction: 0.5, label: "50% refund — inside 48 hours of check-in", hoursUntilCheckIn: hours };
  }
  return { fraction: 0, label: "No refund after check-in noon", hoursUntilCheckIn: hours };
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
  if (status === "cancelled") return "Cancelled";
  if (status === "held") return "Held";
  if (status === "completed") return "Completed";
  return "Paid";
}
