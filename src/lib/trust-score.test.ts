import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PACKAGES, getPackage } from "./packages.ts";
import {
  TRUST_GUEST_MAX,
  TRUST_SCORE_MAX,
  computeTrustScore,
  formatTrustBreakdown,
  formatTrustScore,
  guestNotesPoints,
  looksLikeHotelUpload,
  trustScoreForPackage,
  youtubeSourcesLabel,
} from "./trust-score.ts";
import type { PackageReviewConsensus } from "./youtube/types.ts";

function stubConsensus(
  pkgId: string,
  sentiment: PackageReviewConsensus["overallSentiment"],
  opts?: { caveats?: boolean },
): PackageReviewConsensus {
  return {
    packageId: pkgId,
    overallSentiment: sentiment,
    keyPositives: ["a"],
    keyNegatives: opts?.caveats === false ? [] : ["b"],
    caveats: opts?.caveats === false ? [] : ["c"],
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
        breakdown.consensus +
          breakdown.depth +
          breakdown.completeness +
          breakdown.guestNotes,
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

  it("spreads Taj above thinner Grand Road inventories when inputs differ", () => {
    const taj = computeTrustScore(getPackage("taj-puri-resort-spa")!);
    const empires = computeTrustScore(getPackage("empires-hotel-puri")!);
    const chanakya = computeTrustScore(getPackage("chanakya-bnr-puri")!);
    assert.ok(taj.total - empires.total >= 12, `taj ${taj.total} vs empires ${empires.total}`);
    assert.ok(taj.total - chanakya.total >= 12, `taj ${taj.total} vs chanakya ${chanakya.total}`);
    assert.ok(taj.total < 92, `expected taj under 92, got ${taj.total}`);
  });

  it("detects hotel-upload channels and penalizes all-hotel sets", () => {
    assert.equal(
      looksLikeHotelUpload(
        { channel: "Taj Hotels Official", title: "Property walkthrough" },
        "Taj Puri Resort & Spa",
      ),
      true,
    );
    assert.equal(
      looksLikeHotelUpload(
        { channel: "MOinsideHIT", title: "My Luxury Stay at New Taj Puri" },
        "Taj Puri Resort & Spa",
      ),
      false,
    );

    const pkg = getPackage("taj-puri-resort-spa")!;
    const base = computeTrustScore(pkg, stubConsensus(pkg.id, "positive"));
    assert.equal(base.hotelUploadPenalty, 0);
    assert.ok(base.hotelUploadRatio < 0.8);
  });

  it("folds guest notes with a small disclosed weight (0 until data)", () => {
    assert.equal(guestNotesPoints(null), 0);
    assert.equal(guestNotesPoints({ guestRating: 5, guestCount: 0 }), 0);
    assert.equal(guestNotesPoints({ guestRating: 5, guestCount: 2 }), TRUST_GUEST_MAX);
    assert.equal(guestNotesPoints({ guestRating: 4, guestCount: 3 }), 4);

    const pkg = getPackage("taj-puri-resort-spa")!;
    const without = computeTrustScore(pkg, stubConsensus(pkg.id, "positive"), {
      guestRating: null,
      guestCount: 0,
    });
    const withGuests = computeTrustScore(pkg, stubConsensus(pkg.id, "positive"), {
      guestRating: 5,
      guestCount: 4,
    });
    assert.equal(without.guestNotes, 0);
    assert.equal(withGuests.guestNotes, TRUST_GUEST_MAX);
    assert.equal(withGuests.total - without.total, TRUST_GUEST_MAX);
  });

  it("formats the card breakdown line", () => {
    assert.equal(
      formatTrustBreakdown({ consensus: 50, depth: 19, completeness: 20, guestNotes: 0 }),
      "50 - 19 - 20",
    );
    assert.equal(
      formatTrustBreakdown({ consensus: 50, depth: 19, completeness: 20, guestNotes: 4 }),
      "50 - 19 - 20 - +4 guests",
    );
  });

  it("marks honesty bonus when caveats exist", () => {
    const pkg = getPackage("taj-puri-resort-spa")!;
    const honest = computeTrustScore(pkg, stubConsensus(pkg.id, "positive", { caveats: true }));
    const polished = computeTrustScore(pkg, stubConsensus(pkg.id, "positive", { caveats: false }));
    assert.equal(honest.honestyBonus, true);
    assert.equal(polished.honestyBonus, false);
    assert.ok(honest.depth > polished.depth);
  });
});
