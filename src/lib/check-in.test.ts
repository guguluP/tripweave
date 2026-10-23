import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkInRefusal, isRealIsoDate } from "./check-in.ts";

describe("isRealIsoDate", () => {
  it("accepts a real day", () => {
    assert.equal(isRealIsoDate("2027-02-28"), true);
    assert.equal(isRealIsoDate("2028-02-29"), true);
  });

  it("rejects days the calendar does not have", () => {
    assert.equal(isRealIsoDate("2027-02-30"), false);
    assert.equal(isRealIsoDate("2027-02-29"), false);
    assert.equal(isRealIsoDate("2027-04-31"), false);
    assert.equal(isRealIsoDate("2027-13-01"), false);
  });

  it("names an impossible day separately from a past day", () => {
    assert.equal(checkInRefusal("2027-02-30", "2026-10-23"), "That date doesn't exist");
    assert.equal(checkInRefusal("2026-10-22", "2026-10-23"), "Check-in must be today or later.");
    assert.equal(checkInRefusal("2026-10-23", "2026-10-23"), null);
    assert.equal(checkInRefusal("2028-02-29", "2026-10-23"), null);
  });
});
