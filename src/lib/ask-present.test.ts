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

  it("chips a Mappls direction link", () => {
    const url = "https://www.mappls.com/direction?places=19.78,85.78;19.88,86.09";
    const view = presentAnswer(`Konark is 35 km. Directions: ${url}`, ["https://www.mappls.com/"]);
    assert.equal(view.chips[0]?.title, "Directions on Mappls");
    assert.equal(view.chips[0]?.url, url);
    assert.equal(view.prose.includes("http"), false);
    assert.equal(view.prose.includes("Directions:"), false);
    assert.match(view.prose, /Konark is 35 km\./);
  });

  it("chips the Puri forecast page and no other outside site", () => {
    const imd = "https://city.imd.gov.in/citywx/citywxnew_warnings.php?id=43053";
    const view = presentAnswer(`India Meteorological Department, Puri. ${imd} See https://example.com/news`, [EVISA, imd]);
    assert.equal(view.chips.length, 1);
    assert.equal(view.chips[0]?.url, imd);
    assert.equal(view.chips[0]?.title, "India Meteorological Department");
    assert.equal(view.prose.includes("example.com"), false);
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
