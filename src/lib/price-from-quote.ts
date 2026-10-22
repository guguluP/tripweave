import type { TravelPlan } from "./travel-plan.ts";

/**
 * TripWeave charges the room only. Airport cars are billed by the hotel.
 * `travel` is accepted so a later contract price can opt in without a call-site change.
 */
export function priceFromQuote(
  quotePerPerson: number,
  _travel?: Pick<TravelPlan, "includePickup"> | null,
): { amountInr: number; pickupInr: 0 } {
  return { amountInr: quotePerPerson, pickupInr: 0 };
}
