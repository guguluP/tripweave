import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSeededConsensus, listSeededPackageIds, SEED_CONSENSUS } from "./get-seeded.ts";
import { PACKAGE_VIDEOS, videoHash, videosForPackage } from "./videos.ts";
import { PACKAGES } from "../packages.ts";

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

  it("maps every catalog stay with room notes", () => {
    const ids = PACKAGES.map((pkg) => pkg.id).sort();
    assert.deepEqual(listSeededPackageIds().slice().sort(), ids);
    for (const id of ids) {
      assert.ok(PACKAGE_VIDEOS[id], id);
      const seed = SEED_CONSENSUS[id];
      assert.ok(seed, id);
      assert.ok(seed.roomNotes);
      assert.ok(Object.keys(seed.roomNotes).length >= 2, id);
    }
  });
});
