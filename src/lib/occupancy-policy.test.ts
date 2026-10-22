import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { guestsForOccupancy } from "./occupancy-policy.ts";

describe("guestsForOccupancy", () => {
  it("counts every adult and child", () => {
    assert.equal(guestsForOccupancy({ adults: 2, children: 1 }), 3);
    assert.equal(guestsForOccupancy({ adults: 1, children: 0 }), 1);
    assert.equal(guestsForOccupancy({ adults: 2, children: 2, childAgeFreeUnder: 5 }), 4);
  });
});
