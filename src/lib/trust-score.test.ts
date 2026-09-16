import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PACKAGES, getPackage } from "./packages.ts";
import {
  TRUST_SCORE_MAX,
  computeTrustScore,
  formatTrustScore,
  trustScoreForPackage,
  youtubeSourcesLabel,
} from "./trust-score.ts";
import type { PackageReviewConsensus } from "./youtube/types.ts";

function stubConsensus(
  pkgId: string,
  sentiment: PackageReviewConsensus["overallSentiment"],
): PackageReviewConsensus {
  return {
    packageId: pkgId,
    overallSentiment: sentiment,
    keyPositives: ["a"],
    keyNegatives: ["b"],
    caveats: ["c"],
    consensusSummary: "x",
    sources: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    origin: "seed",
  };
}

describe("trust score", () => {
  it("keeps every catalog score in 0–100 and matches the formula", () => {
    for (const pkg of PACKAGES) {
      const breakdown = computeTrustScore(pkg);
      assert.equal(pkg.trustScore, breakdown.total, pkg.id);
      assert.ok(breakdown.total >= 0 && breakdown.total <= TRUST_SCORE_MAX, pkg.id);
      assert.equal(
        breakdown.consensus + breakdown.depth + breakdown.completeness,
        breakdown.total,
        pkg.id,
      );
      assert.equal(breakdown.youtubeSources, pkg.videos.length, pkg.id);
    }
  });

  it("always formats as X/100", () => {
    assert.equal(formatTrustScore(90), "90/100");
    assert.equal(formatTrustScore(0), "0/100");
    assert.equal(formatTrustScore(100), "100/100");
  });

  it("labels YouTube sources honestly", () => {
    assert.equal(youtubeSourcesLabel(1), "1 YouTube source");
    assert.equal(youtubeSourcesLabel(3), "3 YouTube sources");
  });

  it("scores positive consensus higher than mixed for the same property", () => {
    const pkg = getPackage("taj-puri-resort-spa")!;
    const positive = computeTrustScore(pkg, stubConsensus(pkg.id, "positive"));
    const mixed = computeTrustScore(pkg, stubConsensus(pkg.id, "mixed"));
    assert.ok(positive.total > mixed.total);
    assert.equal(trustScoreForPackage(pkg), pkg.trustScore);
  });
});
