import { travelersFitRoom, todayIso } from "./inventory.ts";
import type { GuestDetailsPolicy } from "./hotel-desk.ts";
import { guestErrorBanner } from "./focus-first-error.ts";
import { orderedGuestErrors, type Traveler } from "./travelers.ts";

export type CheckoutBlock = { message: string; fieldId: string };

export type CheckoutReadyInput = {
  pending: { packageId?: string; checkIn?: string; travelers?: number; roomId?: string } | null;
  guests: Traveler[];
  policy: GuestDetailsPolicy;
  inventory: {
    known?: boolean;
    failed?: boolean;
    released?: boolean;
    available?: boolean;
    occupancy?: number;
  };
  payerName: string;
};

/** First thing that blocks Pay, with a field id the page can focus. */
export function checkoutReady(input: CheckoutReadyInput): CheckoutBlock | null {
  const pending = input.pending;
  if (!pending?.packageId) {
    return { message: "Nothing to check out.", fieldId: "stay" };
  }
  if (!pending.checkIn || pending.checkIn < todayIso()) {
    return { message: "This check-in has passed. Go back and pick a new date.", fieldId: "checkIn" };
  }
  const count = input.guests.length > 0 ? input.guests.length : (pending.travelers ?? 0);
  const occupancy = input.inventory.occupancy ?? 0;
  if (occupancy > 0 && !travelersFitRoom(occupancy, count)) {
    return {
      message: `This room sleeps ${occupancy}. You listed ${count} guests.`,
      fieldId: "room",
    };
  }
  const guestErrors = orderedGuestErrors(input.guests, input.policy);
  if (guestErrors.length > 0) {
    return { message: guestErrorBanner(guestErrors), fieldId: guestErrors[0]!.id };
  }
  if (input.payerName.trim().length < 2) {
    return { message: "Name on the payment, please.", fieldId: "payerName" };
  }
  if (input.inventory.failed || input.inventory.known === false) {
    return { message: "Couldn't check rooms for these dates. Try again.", fieldId: "checkIn" };
  }
  if (input.inventory.released === false) {
    return { message: "The hotel has not released these nights yet.", fieldId: "checkIn" };
  }
  if (input.inventory.available === false) {
    return { message: "Those nights are sold out. Pick another date.", fieldId: "checkIn" };
  }
  return null;
}
