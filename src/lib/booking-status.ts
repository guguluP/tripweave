/**
 * Partner desk booking state machine.
 * held → paid → desk_confirmed → checked_in
 * Legacy status "confirmed" is treated as desk_confirmed.
 */

export const BOOKING_STATUSES = [
  "held",
  "paid",
  "desk_confirmed",
  "checked_in",
  "confirmed", // legacy alias of desk_confirmed
  "completed",
  "cancelled",
  "refunded",
  "refund_pending",
  "pending",
  "failed",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type DeskTransition =
  | "mark_paid"
  | "desk_confirm"
  | "desk_decline"
  | "check_in"
  | "cancel"
  | "refund";

const CONFIRMED = new Set(["desk_confirmed", "confirmed"]);

export function isDeskConfirmed(status: string): boolean {
  return CONFIRMED.has(status);
}

/** Guest-facing: payment alone is not a hotel room confirmation. */
export function isAwaitingDesk(status: string): boolean {
  return status === "paid";
}

export function consumesInventory(status: string): boolean {
  return (
    status === "held" ||
    status === "paid" ||
    isDeskConfirmed(status) ||
    status === "checked_in"
  );
}

export function canTransition(from: string, action: DeskTransition): boolean {
  switch (action) {
    case "mark_paid":
      return from === "held" || from === "pending";
    case "desk_confirm":
      return from === "paid";
    case "desk_decline":
      return from === "paid";
    case "check_in":
      return isDeskConfirmed(from);
    case "cancel":
      return from === "held" || from === "paid" || isDeskConfirmed(from);
    case "refund":
      return from === "paid" || isDeskConfirmed(from) || from === "held" || from === "refund_pending";
    default:
      return false;
  }
}

export function nextStatus(from: string, action: DeskTransition): string | null {
  if (!canTransition(from, action)) return null;
  switch (action) {
    case "mark_paid":
      return "paid";
    case "desk_confirm":
      return "desk_confirmed";
    case "desk_decline":
      return "cancelled";
    case "check_in":
      return "checked_in";
    case "cancel":
      return "cancelled";
    case "refund":
      return "refunded";
    default:
      return null;
  }
}

/** Minutes after paid before ops auto-flag (15–30). Default 20. */
export function deskConfirmTimeoutMinutes(): number {
  const raw = Number(process.env.TW_DESK_CONFIRM_MINUTES ?? "20");
  if (!Number.isFinite(raw)) return 20;
  return Math.min(30, Math.max(15, Math.round(raw)));
}
