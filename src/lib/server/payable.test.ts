import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { priceFromQuote } from "../price-from-quote.ts";

describe("priceFromQuote", () => {
  it("charges the room only when a hotel car is requested", () => {
    const priced = priceFromQuote(14355, { includePickup: true });
    assert.equal(priced.amountInr, 14355);
    assert.equal(priced.pickupInr, 0);
  });

  it("does not add a pickup when the guest makes their own way", () => {
    const priced = priceFromQuote(9000, { includePickup: false });
    assert.equal(priced.amountInr, 9000);
    assert.equal(priced.pickupInr, 0);
  });
});
