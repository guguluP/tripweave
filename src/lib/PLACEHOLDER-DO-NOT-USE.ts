import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_BRIEF,
  getPackage,
  matchPackages,
  originFitReason,
  originFitScore,
} from "./packages.ts";
import {
  leftoverForRooms,
  quoteStay,
  recordHold,
  releaseHoldById,
  roomUnits,
  seasonFor,
  travelersFitRoom,
} from "./inventory.ts";
import { hoursUntilCheckIn, refundAmountInr, refundPolicyFor } from "./refund-policy.ts";

// Note: this file is inventory.test.ts but also hosts origin ranking tests historically.
describe("dated rates", () => {
  it("says the festival calendar has ended after June 2027", () => {
    assert.equal(seasonFor("2027-07-01"), "shoulder");
  });
});
