import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutEmptyState } from "./checkout-empty.ts";

describe("checkoutEmptyState", () => {
  it("keeps the form when a stay is pending", () => {
    assert.deepEqual(checkoutEmptyState({ pending: true, lastBooking: "TW-1" }), { kind: "form" });
  });

  it("redirects to the last booking when the cart is empty", () => {
    assert.deepEqual(checkoutEmptyState({ pending: false, lastBooking: "TW-1" }), {
      kind: "redirect",
      code: "TW-1",
    });
  });

  it("says there is nothing to check out", () => {
    assert.deepEqual(checkoutEmptyState({ pending: false, lastBooking: "  " }), { kind: "empty" });
    assert.deepEqual(checkoutEmptyState({ pending: false, lastBooking: null }), { kind: "empty" });
  });
});
