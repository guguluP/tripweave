import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scorePackages } from "./match-score.ts";
import { ORIGINS } from "./origins.ts";
import type { Brief } from "./packages.ts";

const VIBES = ["culture", "beach", "relax", "adventure"] as const;
const BUDGETS = ["value", "mid", "premium"] as const;
const STYLES = ["solo", "couple", "family", "friends"] as const;

function* briefs(): Generator<Brief> {
  for (const origin of ORIGINS)
    for (const arriveBy of ["fly", "train", "bus", "road"] as const)
      for (const vibe of VIBES)
        for (const budget of BUDGETS)
          for (const style of STYLES)
            for (const nights of [1, 3, 5]) {
              yield { vibe, budget, style, nights, flexible: false, origin: origin.id, arriveBy, adults: 2, children: 0 };
            }
}

describe("ranking with equal scores", () => {
  it("match scores carry no float noise, so equal fits reach the Trust Score tie-break", () => {
    for (const brief of briefs()) {
      const ranked = scorePackages(brief);
      for (let i = 1; i < ranked.length; i += 1) {
        const a = ranked[i - 1]!;
        const b = ranked[i]!;
        const diff = a.matchScore - b.matchScore;
        assert.ok(diff === 0 || diff >= 0.005, `${a.id} ${a.matchScore} vs ${b.id} ${b.matchScore}`);
        if (diff === 0) assert.ok(a.trustScore >= b.trustScore, `${a.id} above ${b.id} with lower trust`);
      }
    }
  });

  it("the same brief always gives the same order", () => {
    const brief: Brief = { vibe: "beach", budget: "value", style: "family", nights: 1, flexible: false, origin: "kolkata", arriveBy: "fly", adults: 2, children: 2 };
    const first = scorePackages(brief).map((p) => p.id).join();
    for (let i = 0; i < 5; i += 1) assert.equal(scorePackages(brief).map((p) => p.id).join(), first);
  });
});
