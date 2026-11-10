import { GROUP_STATUSES, type GroupStatus } from "./types.ts";

export type GroupEvent =
  | "publish"
  | "lock"
  | "unlock"
  | "shares_sent"
  | "required_paid"
  | "deadline_lapsed"
  | "desk_confirm"
  | "desk_decline"
  | "checkout_passed"
  | "organiser_cancel";

const EDGES: Record<GroupStatus, Partial<Record<GroupEvent, GroupStatus>>> = {
  draft: { publish: "voting", organiser_cancel: "cancelled" },
  voting: { lock: "locked", organiser_cancel: "cancelled" },
  locked: { unlock: "voting", shares_sent: "collecting", organiser_cancel: "cancelled" },
  collecting: {
    required_paid: "fully_paid_awaiting_hotel",
    deadline_lapsed: "expired",
    organiser_cancel: "cancelled",
  },
  fully_paid_awaiting_hotel: {
    desk_confirm: "hotel_confirmed",
    desk_decline: "cancelled",
    deadline_lapsed: "cancelled",
  },
  hotel_confirmed: { checkout_passed: "completed", organiser_cancel: "cancelled" },
  completed: {},
  expired: {},
  cancelled: {},
};

export function isGroupStatus(value: string): value is GroupStatus {
  return (GROUP_STATUSES as readonly string[]).includes(value);
}

/** Pure edge. Guards (who, money, dates) live in the store under the row lock. */
export function nextStatus(status: GroupStatus, event: GroupEvent): GroupStatus | null {
  return EDGES[status][event] ?? null;
}

export function statusLabel(status: GroupStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "voting":
      return "Voting";
    case "locked":
      return "Stay locked";
    case "collecting":
      return "Collecting shares";
    case "fully_paid_awaiting_hotel":
      return "Waiting for the hotel";
    case "hotel_confirmed":
      return "Hotel confirmed";
    case "completed":
      return "Completed";
    case "expired":
      return "Payment window closed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
