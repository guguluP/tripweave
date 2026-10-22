import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPhone, isAcceptablePhone, toE164 } from "./phone.ts";

describe("phone", () => {
  it("round-trips international numbers and legacy Indian mobiles", () => {
    assert.equal(toE164("9876543210"), "+919876543210");
    assert.equal(toE164("+44 7911 123456", "GB"), "+447911123456");
    assert.equal(isAcceptablePhone("+447911123456"), true);
    assert.equal(isAcceptablePhone("+12025550123"), true);
    assert.equal(isAcceptablePhone("+915876543210"), false);
    assert.match(formatPhone("+447911123456"), /\+44/);
    assert.match(formatPhone("+919876543210"), /98765 43210|9876543210/);
  });
});
