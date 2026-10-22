/** Extra booking fields stored inside swaps.__tw so we do not need a schema bump. */

import { isCountryCode } from "./countries.ts";
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
  guestEmail?: string;
  /** Sign-in email. Lets a later login find this stay after the cookie user id changes. */
  accountEmail?: string;
  deskNote?: string;
  /** SES guest/desk notice outcome. */
  mailStatus?: "sent" | "failed" | "skipped" | "partial";
  mailSentAt?: string;
  mailError?: string;
  /** Razorpay order id — used for double-submit / webhook idempotency. */
  razorpayOrderId?: string;
  /** Set when a GST invoice PDF can be generated for this stay. */
  invoiceReady?: boolean;
  /** Unique ISO alpha-2 codes for the party. At most 12. */
  guestNationalities?: string[];
};

export function sanitizeGuestNationalities(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const code = item.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || !isCountryCode(code)) continue;
    if (!out.includes(code)) out.push(code);
    if (out.length >= 12) break;
  }
  return out.length > 0 ? out : undefined;
}

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
  if ("guestNationalities" in merged) {
    const clean = sanitizeGuestNationalities(merged.guestNationalities);
    if (clean) merged.guestNationalities = clean;
    else delete merged.guestNationalities;
  }
  next[KEY] = JSON.stringify(merged);
  return next;
}

export function guestSwaps(swaps: Record<string, string> | undefined | null): Record<string, string> {
  const next = { ...(swaps ?? {}) };
  delete next[KEY];
  return next;
}
