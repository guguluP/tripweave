import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateSummaries, majoritySentiment } from "./aggregate.ts";
import { getSeededConsensus, listSeededPackageIds, SEED_CONSENSUS } from "./get-seeded.ts";
import { parseVideoSummary } from "./summarize.ts";
import { cleanTranscriptText, pickPreferredTrack } from "./transcript.ts";
import { LANGUAGE_PRIORITY } from "./types.ts";
import { PACKAGE_VIDEOS, videoHash, videosForPackage } from "./videos.ts";

describe("language priority", () => {
  it("prefers manual Odia over auto English", () => {
    const picked = pickPreferredTrack(
      [
        { languageCode: "en", isGenerated: true },
        { languageCode: "or", isGenerated: false },
        { languageCode: "hi", isGenerated: true },
      ],
      LANGUAGE_PRIORITY,
    );
    assert.equal(picked?.languageCode, "or");
    assert.equal(picked?.isGenerated, false);
  });

  it("falls back to Hindi auto when no manual track exists", () => {
    const picked = pickPreferredTrack(
      [
        { languageCode: "en", isGenerated: true },
        { languageCode: "hi", isGenerated: true },
        { languageCode: "fr", isGenerated: false },
      ],
      LANGUAGE_PRIORITY,
    );
    assert.equal(picked?.languageCode, "hi");
  });

  it("returns null for an empty list", () => {
    assert.equal(pickPreferredTrack([]), null);
  });
});

describe("transcript cleaning", () => {
  it("drops music tags and joins snippets", () => {
    const text = cleanTranscriptText([
      { text: "[Music]", start: 0, duration: 1 },
      { text: "The  rooms  were clean", start: 1, duration: 2 },
      { text: "[Applause]", start: 3, duration: 1 },
      { text: "breakfast was good.", start: 4, duration: 2 },
    ]);
    assert.equal(text, "The rooms were clean breakfast was good.");
  });
});

describe("aggregation", () => {
  it("majority-votes sentiment and dedupes bullets", () => {
    const a = {
      videoId: "aaaaaaaaaaa",
      overallSentiment: "positive" as const,
      positives: ["Clean rooms", "Helpful staff"],
      negatives: ["Slow Wi-Fi"],
      caveats: ["Beach is public"],
      summary: "Mostly a good stay.",
    };
    const b = {
      videoId: "bbbbbbbbbbb",
      overallSentiment: "positive" as const,
      positives: ["Very clean rooms", "Good breakfast"],
      negatives: ["Slow wifi"],
      caveats: ["Beach is public and crowded"],
      summary: "Would return.",
    };
    const c = {
      videoId: "ccccccccccc",
      overallSentiment: "mixed" as const,
      positives: ["Helpful staff"],
      negatives: ["Overpriced"],
      caveats: [],
      summary: "Fine, not great.",
    };
    assert.equal(majoritySentiment([a, b, c]), "positive");
    const consensus = aggregateSummaries(
      "taj-puri-resort-spa",
      [a, b, c],
      [],
      [],
      "live",
    );
    assert.equal(consensus.origin, "live");
    assert.ok(consensus.keyPositives.some((p) => /clean/i.test(p)));
    assert.ok(consensus.keyPositives.length <= 6);
    assert.ok(consensus.consensusSummary.length > 0);
  });

  it("marks empty when no summaries land", () => {
    const consensus = aggregateSummaries("x", [], []);
    assert.equal(consensus.origin, "empty");
    assert.equal(consensus.consensusSummary, "");
  });

  it("uses the single-video summary as the consensus", () => {
    const one = {
      videoId: "aaaaaaaaaaa",
      overallSentiment: "mixed" as const,
      positives: ["Pool"],
      negatives: ["Noise"],
      caveats: [],
      summary: "Fine if you want the pool.",
    };
    const consensus = aggregateSummaries("x", [one], [], [], "live");
    assert.equal(consensus.consensusSummary, "Fine if you want the pool.");
    assert.equal(consensus.overallSentiment, "mixed");
  });
});

describe("LLM json parse", () => {
  it("reads a fenced JSON payload", () => {
    const raw = `Sure.\n\`\`\`json
{"overall_sentiment":"positive","positives":["Clean rooms"],"negatives":[],"caveats":["Crowded beach"],"summary":"A calm stay."}
\`\`\``;
    const parsed = parseVideoSummary("abcdefghijk", raw);
    assert.ok(parsed);
    assert.equal(parsed?.overallSentiment, "positive");
    assert.deepEqual(parsed?.positives, ["Clean rooms"]);
  });
});

describe("curated mapping", () => {
  it("covers every seeded package with 2–4 videos", () => {
    const ids = listSeededPackageIds();
    assert.ok(ids.length >= 3);
    for (const id of ids) {
      const videos = videosForPackage(id);
      assert.ok(videos.length >= 2 && videos.length <= 4, id);
      for (const v of videos) {
        assert.match(v.videoId, /^[a-zA-Z0-9_-]{11}$/);
        assert.ok(v.title.length > 4);
      }
      const seed = getSeededConsensus(id);
      assert.ok(seed);
      assert.ok(seed!.consensusSummary.length > 40);
      assert.ok(seed!.sources.length === videos.length);
      assert.ok(videoHash(id).startsWith(`${id}:`));
    }
  });

  it("maps all twelve stays with room notes", () => {
    const ids = [
      "taj-puri-resort-spa",
      "mayfair-heritage-puri",
      "swosti-premium-beach-resort",
      "regenta-central-puri",
      "hans-coco-palms",
      "empires-hotel-puri",
      "mayfair-waves-puri",
      "toshali-sands-puri",
      "chariot-resort-puri",
      "chanakya-bnr-puri",
      "mahodadhi-palace-puri",
      "holiday-resort-puri",
    ];
    assert.equal(listSeededPackageIds().length, 12);
    for (const id of ids) {
      assert.ok(PACKAGE_VIDEOS[id], id);
      const seed = SEED_CONSENSUS[id];
      assert.ok(seed, id);
      assert.ok(seed.roomNotes);
      assert.ok(Object.keys(seed.roomNotes).length >= 2, id);
    }
  });
});
