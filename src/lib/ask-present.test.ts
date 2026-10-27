import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { presentAnswer, takeQuota } from "./ask-present.ts";

const EVISA = "https://indianvisaonline.gov.in/evisa/";

describe("presentAnswer", () => {
  it("lifts an official URL into a chip and leaves the sentence", () => {
    const view = presentAnswer(`Apply at least 4 days ahead. ${EVISA}`, [EVISA]);
    assert.equal(view.prose.includes("http"), false);
    assert.equal(view.chips[0]?.url, EVISA);
    assert.equal(view.chips[0]?.title, "India e-Visa");
    assert.equal(view.tripweave, false);
  });

  it("keeps a TripWeave fact with no chip", () => {
    const view = presentAnswer("TripWeave refund if cancelled now: ₹500.", [EVISA]);
    assert.equal(view.tripweave, true);
    assert.equal(view.chips.length, 0);
    assert.match(view.prose, /TripWeave/);
  });
});

describe("takeQuota", () => {
  it("allows ten asks in an hour and blocks the eleventh", () => {
    const now = 1_000_000;
    let kept: number[] = [];
    for (let i = 0; i < 10; i++) {
      const next = takeQuota(kept, now + i, 10);
      assert.equal(next.ok, true);
      kept = next.kept;
    }
    const blocked = takeQuota(kept, now + 20, 10);
    assert.equal(blocked.ok, false);
    const later = takeQuota(kept, now + 60 * 60_000 + 5, 10);
    assert.equal(later.ok, true);
  });
});
