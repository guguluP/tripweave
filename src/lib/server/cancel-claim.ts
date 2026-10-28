/**
 * Cross-instance guard for cancel + refund on the Postgres (DATABASE_URL) store.
 *
 * withCancelLock only serializes cancels inside one server process. Two instances (two
 * serverless functions, or two Node servers on one database) could both read the stay as open
 * and both ask the gateway for a refund. Before the refund, the cancel now writes a short-lived
 * claim into the stay's meta with a compare-and-swap on the stored swaps text. Only one request
 * wins the swap; the other is told the cancel is already running. The final status write clears
 * the claim, and a failed refund puts the old swaps back. A claim left by a crashed request
 * expires after CANCEL_CLAIM_TTL_MS so the guest can retry.
 */
import { readMeta, writeMeta } from "../booking-meta.ts";

/** Longer than the gateway calls can take (fetch gives up after about 5 minutes). */
export const CANCEL_CLAIM_TTL_MS = 6 * 60 * 1000;

export const CANCEL_IN_PROGRESS_MESSAGE =
  "This stay is already being cancelled. Refresh My trips in a minute.";

/** True when another cancel claimed this stay recently and may still be refunding it. */
export function hasFreshCancelClaim(
  swaps: Record<string, string> | undefined | null,
  now: number = Date.now(),
): boolean {
  const at = readMeta(swaps).cancelClaimAt;
  if (!at) return false;
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return false;
  // A claim stamped in the future (clock skew between instances) still counts until it ages out.
  return now - t < CANCEL_CLAIM_TTL_MS;
}

/** The swaps to write when claiming the stay for this cancel. */
export function claimedSwaps(
  swaps: Record<string, string> | undefined | null,
  now: number = Date.now(),
): Record<string, string> {
  return writeMeta(swaps, { cancelClaimAt: new Date(now).toISOString() });
}

/**
 * The amount a refund_pending stay already owes, from its open refund intent.
 * A desk decline (or a cancel whose gateway call failed) decided the amount when the stay left
 * paid. Finishing that refund must use the same amount, not the guest policy for today.
 */
export function owedRefundInr(
  status: string | null | undefined,
  intent: { status: string; amountInr: number } | null | undefined,
): number | null {
  if (status !== "refund_pending" || !intent) return null;
  if (intent.status !== "pending" && intent.status !== "gateway_done") return null;
  const amount = Number(intent.amountInr);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}
