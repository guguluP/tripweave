import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_BRIEF, type Brief } from "./packages.ts";
import { stayPin } from "./places.ts";
import {
  bucketOf,
  formatInrRange,
  lastMileId,
  mapMarkers,
  parseInrRange,
  pickupQuoteFor,
  quoteTravel,
  rankLastMiles,
  VOUCHER_HOTEL_ZOOM,
  voucherMapFocus,
} from "./travel-plan.ts";
import { lastMileOptions } from "./transport.ts";

const familyFly: Brief = { ...DEFAULT_BRIEF, style: "family", vibe: "beach", arriveBy: "fly", origin: "kolkata" };
const soloValue: Brief = { ...DEFAULT_BRIEF, style: "solo", budget: "value", vibe: "culture", arriveBy: "train", origin: "kolkata" };
const coupleCulture: Brief = { ...DEFAULT_BRIEF, style: "couple", vibe: "culture", arriveBy: "train", origin: "kolkata" };

describe("travel plan", () => {
  it("parses rupee ranges and included hints", () => {
    assert.deepEqual(parseInrRange("₹1,800–2,500 one way"), { min: 1800, max: 2500, included: false });
    assert.equal(parseInrRange("Usually included or ₹1,800–2,500 one way").included, true);
    assert.equal(parseInrRange("Usually included or ₹1,800–2,500 one way").min, 1800);
    assert.deepEqual(parseInrRange("₹0–180"), { min: 0, max: 180, included: false });
    assert.equal(formatInrRange(1800, 2500), "₹1,800–2,500");
    assert.equal(formatInrRange(40, 40), "₹40");
  });

  it("ranks hotel transfer first for a family flying in", () => {
    const ranked = rankLastMiles("taj-puri-resort-spa", familyFly);
    assert.ok(ranked.length >= 1);
    const best = ranked.find((r) => r.recommended);
    assert.ok(best);
    assert.equal(bucketOf(best!.leg), "hotel");
    const quote = quoteTravel("taj-puri-resort-spa", { ...familyFly, checkIn: "2026-06-26", nights: 3 });
    assert.match(quote.costLine, /BBI/);
    const flights = quote.bookingLinks.find((link) => link.label === "Google Flights");
    assert.ok(flights);
    assert.match(decodeURIComponent(flights.href), /on 2026-06-26 through 2026-06-29/);
    assert.match(quote.bestLine, /hotel private transfer recommended/i);
  });

  it("ranks cheap auto / walk first for a solo temple train arrival", () => {
    const ranked = rankLastMiles("chanakya-bnr-puri", soloValue);
    const best = ranked.find((r) => r.recommended);
    assert.ok(best);
    assert.match(best!.leg.mode.toLowerCase(), /walk|auto|bus/);
  });

  it("boosts station / auto options for a culture brief near the station", () => {
    const ranked = rankLastMiles("chanakya-bnr-puri", coupleCulture);
    const best = ranked.find((r) => r.recommended);
    assert.ok(best);
    assert.match(best!.leg.mode.toLowerCase(), /auto|walk|train|station/);
  });

  it("offers Taj airport pickup and drop with no TripWeave charge", () => {
    const pickup = pickupQuoteFor("taj-puri-resort-spa", "fly");
    assert.equal(pickup.available, true);
    assert.match(pickup.hotelRateHint ?? "", /paid to the hotel/i);
    assert.match(pickup.hotelRateHint ?? "", /1,800/);
    assert.equal(pickupQuoteFor("taj-puri-resort-spa", "train").available, false);
    assert.equal(pickupQuoteFor("mayfair-heritage-puri", "fly").available, true);
    assert.equal(pickupQuoteFor("hans-coco-palms", "fly").available, true);
    assert.equal(pickupQuoteFor("mayfair-waves-puri", "fly").available, false);
  });

  it("does not sell a pickup when the hotel does not list its own car", () => {
    const pickup = pickupQuoteFor("empires-hotel-puri", "fly");
    assert.equal(pickup.available, false);
    assert.equal(pickup.hotelRateHint, undefined);
    assert.ok(lastMileId(lastMileOptions("empires-hotel-puri", "fly")[0]!));
  });

  it("lists last-mile options for every catalog arrival mode", () => {
    for (const arriveBy of ["fly", "train", "bus", "road"] as const) {
      const opts = lastMileOptions("chariot-resort-puri", arriveBy);
      assert.ok(opts.length >= 1, arriveBy);
    }
  });

  it("voucher map marks only the hotel when the guest is already in Puri", () => {
    const stay = stayPin("mayfair-heritage-puri", "Mayfair Heritage, Puri");
    assert.ok(stay);
    const pins = mapMarkers("puri", stay);
    assert.equal(pins.length, 1);
    assert.equal(pins[0]?.label, "Mayfair Heritage, Puri");
    assert.equal(pins[0]?.lat, stay.lat);
    const focus = voucherMapFocus(stay);
    assert.equal(focus.lat, stay.lat);
    assert.equal(focus.lng, stay.lng);
    assert.equal(focus.zoom, VOUCHER_HOTEL_ZOOM);
    assert.ok(focus.zoom > 9);
  });

  it("voucher map adds a pin for the city the guest is coming from", () => {
    const stay = stayPin("mayfair-heritage-puri", "Mayfair Heritage, Puri");
    assert.ok(stay);
    const pins = mapMarkers("bhubaneswar", stay);
    assert.equal(pins.length, 2);
    assert.equal(pins[0]?.label, "Bhubaneswar");
    assert.ok((pins[0]?.lat ?? 0) > 20.2);
    assert.equal(pins[1]?.label, "Mayfair Heritage, Puri");
    assert.equal(pins[1]?.lat, stay.lat);
    const kolkata = mapMarkers("kolkata", stay);
    assert.equal(kolkata[0]?.label, "Kolkata");
    assert.ok(Math.abs((kolkata[0]?.lng ?? 0) - 88.36) < 0.1);
    assert.equal(mapMarkers("other", stay).length, 1);
    assert.equal(mapMarkers(undefined, stay).length, 1);
  });
});
