/** Extra booking fields stored inside swaps.__tw so we do not need a schema bump. */

import type { TravelPlan } from "./travel-plan.ts";

export type BookingMeta = {
  roomId?: string;
  hotelEmail?: string;
  hotelNotifiedAt?: string;
  refundId?: string;
  refundAmount?: number;
  refundedAt?: string;
  travel?: TravelPlan;
  pickupInr?: number;
};

const KEY = "__tw";

export function readMeta(swaps: Record<string, string> | undefined | null): BookingMeta {
  const raw = swaps?.[KEY];
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as BookingMeta;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeMeta(
  swaps: Record<string, string> | undefined | null,
  patch: BookingMeta,
): Record<string, string> {
  const next = { ...(swaps ?? {}) };
  const merged = { ...readMeta(next), ...patch };
  next[KEY] = JSON.stringify(merged);
  return next;
}

export function guestSwaps(swaps: Record<string, string> | undefined | null): Record<string, string> {
  const next = { ...(swaps ?? {}) };
  delete next[KEY];
  return next;
}
