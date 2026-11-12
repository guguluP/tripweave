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

  it("seeds only catalog stays, and every seeded stay has room notes", () => {
    const catalog = new Set(PACKAGES.map((pkg) => pkg.id));
    const seeded = listSeededPackageIds();
    assert.ok(seeded.length >= 12, `seeded ${seeded.length}`);
    for (const id of seeded) {
      assert.ok(catalog.has(id), id);
      assert.ok(PACKAGE_VIDEOS[id], id);
      const seed = SEED_CONSENSUS[id];
      assert.ok(seed, id);
      assert.ok(seed.roomNotes, id);
      assert.ok(Object.keys(seed.roomNotes).length >= 2, id);
    }
  });
});
