import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  briefToSearch,
  mergeBriefUrl,
  searchHasBrief,
  searchToBrief,
} from "./brief-url.ts";
import { DEFAULT_BRIEF } from "./packages.ts";

describe("brief URL", () => {
  it("round-trips key brief fields including check-in", () => {
    const state = {
      ...DEFAULT_BRIEF,
      vibe: "culture" as const,
      budget: "value" as const,
      style: "family" as const,
      nights: 2,
      flexible: true,
      origin: "bhubaneswar" as const,
      arriveBy: "train" as const,
      checkIn: "2026-10-12",
    };
    const search = briefToSearch(state);
    assert.equal(search.checkIn, "2026-10-12");
    assert.equal(search.flexible, "1");
    assert.equal(search.nights, "2");
    assert.equal(search.arriveBy, "train");
    const parsed = searchToBrief(search);
    const merged = mergeBriefUrl(DEFAULT_BRIEF, parsed);
    assert.equal(merged.vibe, "culture");
    assert.equal(merged.budget, "value");
    assert.equal(merged.style, "family");
    assert.equal(merged.nights, 2);
    assert.equal(merged.flexible, true);
    assert.equal(merged.origin, "bhubaneswar");
    assert.equal(merged.arriveBy, "train");
    assert.equal(merged.checkIn, "2026-10-12");
  });

  it("keeps a free-text originCity only for other", () => {
    const search = briefToSearch({
      ...DEFAULT_BRIEF,
      origin: "other",
      originCity: "Singapore",
      arriveBy: "fly",
    });
    assert.equal(search.originCity, "Singapore");
    const listed = briefToSearch({ ...DEFAULT_BRIEF, origin: "kolkata" });
    assert.equal(listed.originCity, undefined);
  });

  it("ignores junk search values", () => {
    const parsed = searchToBrief({ vibe: "zzz", nights: "0", checkIn: "not-a-date", arriveBy: "teleport" });
    assert.equal(parsed.vibe, undefined);
    assert.equal(parsed.nights, undefined);
    assert.equal(parsed.checkIn, undefined);
    assert.equal(parsed.arriveBy, undefined);
    assert.equal(searchHasBrief({}), false);
    assert.equal(searchHasBrief({ nights: "3" }), true);
  });

  it("clamps arriveBy when origin forbids it", () => {
    const merged = mergeBriefUrl(DEFAULT_BRIEF, {
      origin: "puri",
      arriveBy: "fly",
    });
    assert.notEqual(merged.arriveBy, "fly");
  });
});

import { matchPackages, rankEyebrow, DEFAULT_BRIEF as BRIEF } from "./packages.ts";

describe("rankEyebrow", () => {
  it("leads with flew-into-BBI for fly arrivals", () => {
    const top = matchPackages({ ...BRIEF, arriveBy: "fly", origin: "kolkata" })[0]!;
    const line = rankEyebrow(top, { ...BRIEF, arriveBy: "fly", origin: "kolkata" }, 0);
    assert.match(line, /First because you flew into BBI/i);
  });
});
