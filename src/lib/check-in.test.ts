import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRealIsoDate } from "./check-in.ts";

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
});
