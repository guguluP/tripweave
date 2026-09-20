import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_BRIEF, type Brief } from "./packages.ts";
import {
  bucketOf,
  formatInrRange,
  lastMileId,
  parseInrRange,
  parseTravelPlan,
  pickupChargeInr,
  pickupQuoteFor,
  quoteTravel,
  rankLastMiles,
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
    const quote = quoteTravel("taj-puri-resort-spa", familyFly);
    assert.match(quote.costLine, /BBI/);
    assert.match(quote.bestLine, /recommended/i);
  });

  it("ranks cheap auto / walk first for a solo temple train arrival", () => {
    const ranked = rankLastMiles("chanakya-bnr-puri", soloValue);
    const best = ranked.find((r) => r.recommended);
    assert.ok(best);
    assert.match(best!.leg.mode.toLowerCase(), /walk|auto|bus/);
  });

  it("boosts station / auto options for a culture brief on Grand Road", () => {
    const ranked = rankLastMiles("empires-hotel-puri", coupleCulture);
    const best = ranked.find((r) => r.recommended);
    assert.ok(best);
    assert.match(best!.leg.mode.toLowerCase(), /auto|walk|train|station/);
  });

  it("treats Taj airport transfer as included pickup (no extra rupees)", () => {
    const pickup = pickupQuoteFor("taj-puri-resort-spa", "fly");
    assert.equal(pickup.available, true);
    assert.equal(pickup.included, true);
    assert.equal(pickup.price, 0);
    const plan = parseTravelPlan({
      lastMileId: "x",
      includePickup: true,
      arriveBy: "fly",
    });
    assert.equal(pickupChargeInr("taj-puri-resort-spa", plan), 0);
  });

  it("charges hotel pickup when the stay does not include a transfer", () => {
    const pickup = pickupQuoteFor("empires-hotel-puri", "fly");
    assert.equal(pickup.available, true);
    assert.equal(pickup.included, false);
    assert.ok(pickup.price >= 1000);
    const plan = parseTravelPlan({
      lastMileId: lastMileId(lastMileOptions("empires-hotel-puri", "fly")[0]!),
      includePickup: true,
      arriveBy: "fly",
    });
    assert.equal(pickupChargeInr("empires-hotel-puri", plan), pickup.price);
    plan.includePickup = false;
    assert.equal(pickupChargeInr("empires-hotel-puri", plan), 0);
  });

  it("lists last-mile options for every catalog arrival mode", () => {
    for (const arriveBy of ["fly", "train", "bus", "road"] as const) {
      const opts = lastMileOptions("chariot-resort-puri", arriveBy);
      assert.ok(opts.length >= 1, arriveBy);
    }
  });
});
