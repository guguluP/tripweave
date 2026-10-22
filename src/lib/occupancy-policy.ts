/**
 * How many people a room must sleep.
 * Everyone counts — adults, children, and infants. No age exemption.
 */
export function guestsForOccupancy(input: {
  adults: number;
  children: number;
  /** Ignored. Kept so a hotel rule can be passed without changing call sites. */
  childAgeFreeUnder?: number;
}): number {
  const adults = Number.isFinite(input.adults) ? Math.max(0, Math.round(input.adults)) : 0;
  const children = Number.isFinite(input.children) ? Math.max(0, Math.round(input.children)) : 0;
  return adults + children;
}
