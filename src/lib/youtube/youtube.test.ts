import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSeededConsensus, listSeededPackageIds, SEED_CONSENSUS } from "./get-seeded.ts";
import { PACKAGE_VIDEOS, videoHash, videosForPackage } from "./videos.ts";

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
