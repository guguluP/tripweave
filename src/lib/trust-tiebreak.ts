import type { StayPackage } from "./packages.ts";

type TieFields = Pick<StayPackage, "id" | "trustScore" | "priceFrom" | "videos">;

/**
 * Order for stays whose Trust Score (and, where used, match score) is equal.
 * Proposal — the order is a product decision:
 *   1. higher Trust Score
 *   2. more YouTube sources behind the score (more evidence)
 *   3. lower nightly price from
 *   4. stay id (alphabetical), so the order never depends on catalog file order
 */
export function compareByTrust(a: TieFields, b: TieFields): number {
  return (
    b.trustScore - a.trustScore ||
    b.videos.length - a.videos.length ||
    a.priceFrom - b.priceFrom ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}
