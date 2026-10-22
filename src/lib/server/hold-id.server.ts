import { createHash } from "node:crypto";

/**
 * Stable public hold id. The raw id can be a confirmation code and must not
 * reach the browser. Same digest as the previous copies in occupancy.ts and
 * payable.ts, so existing holds still match.
 */
export function publicHoldId(raw: string) {
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}
