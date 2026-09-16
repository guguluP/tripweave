import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PACKAGES,
  clampNights,
  daysForStay,
  getPackage,
  getRoom,
  nightsPhrase,
  priceWithSwaps,
  stayTotal,
} from "./packages.ts";
import { getSeededConsensus } from "./youtube/seed.ts";

describe("catalog", () => {
  it("lists twelve Puri stays with rooms, photos, videos, and 1-night stays", () => {
    assert.equal(PACKAGES.length, 12);
    for (const pkg of PACKAGES) {
      assert.equal(pkg.nightsMin, 1, pkg.id);
      assert.ok(pkg.nightsMax >= pkg.nightsMin, pkg.id);
      assert.ok(pkg.rooms.length >= 2, pkg.id);
      assert.ok(pkg.images.length >= 4, pkg.id);
      assert.ok(pkg.videos.length >= 2, pkg.id);
      assert.equal(pkg.image, pkg.images[0]);
      assert.equal(pkg.priceFrom, pkg.pricePerNight);
      assert.ok(pkg.rooms[0]!.deltaPerNight === 0, pkg.id);
      for (const video of pkg.videos) {
        assert.match(video.videoId, /^[a-zA-Z0-9_-]{11}$/, video.videoId);
      }
      // Named hotels use YouTube/property media — never random Unsplash stock.
      assert.match(pkg.image, /i\.ytimg\.com\/vi\//, pkg.id);
      assert.ok(!pkg.image.includes("unsplash"), pkg.id);
      const videoIds = new Set(pkg.videos.map((v) => v.videoId));
      for (const src of pkg.images) {
        assert.match(src, /i\.ytimg\.com\/vi\//, `${pkg.id} gallery`);
        const id = src.split("/vi/")[1]?.split("/")[0];
        assert.ok(id && videoIds.has(id), `${pkg.id} gallery id ${id}`);
      }
      const roomImages = new Set<string>();
      for (const room of pkg.rooms) {
        assert.match(room.image, /i\.ytimg\.com\/vi\//, `${pkg.id}:${room.id}`);
        assert.ok(!room.image.includes("unsplash"), `${pkg.id}:${room.id}`);
        const id = room.image.split("/vi/")[1]?.split("/")[0];
        assert.ok(id && videoIds.has(id), `${pkg.id}:${room.id} cross-hotel?`);
        roomImages.add(room.image);
      }
      // Distinct per room when enough property videos; otherwise reuse this stay's media only.
      assert.equal(
        roomImages.size,
        Math.min(pkg.rooms.length, pkg.videos.length),
        `${pkg.id} unique room images`,
      );
    }
  });

  it("includes the six new properties", () => {
    for (const id of [
      "mayfair-waves-puri",
      "toshali-sands-puri",
      "chariot-resort-puri",
      "chanakya-bnr-puri",
      "mahodadhi-palace-puri",
      "holiday-resort-puri",
    ]) {
      assert.ok(getPackage(id), id);
    }
  });

  it("has reviewer notes for every room", () => {
    for (const pkg of PACKAGES) {
      const seed = getSeededConsensus(pkg.id);
      assert.ok(seed, pkg.id);
      for (const room of pkg.rooms) {
        assert.ok(seed!.roomNotes?.[room.id], `${pkg.id}:${room.id}`);
      }
    }
  });
});

describe("stay pricing", () => {
  const pkg = getPackage("taj-puri-resort-spa")!;

  it("charges one night at the base room rate", () => {
    assert.equal(stayTotal(pkg, 1, "garden"), pkg.pricePerNight);
  });

  it("adds the room delta per night", () => {
    const sea = getRoom(pkg, "sea");
    assert.equal(stayTotal(pkg, 2, "sea"), (pkg.pricePerNight + sea.deltaPerNight) * 2);
  });

  it("only applies extras on the nights you actually stay", () => {
    const one = stayTotal(pkg, 1, "garden", { "0": "spa" });
    assert.equal(one, pkg.pricePerNight + 2500);
    const rec = priceWithSwaps(pkg, { "1": "konark" });
    assert.equal(rec, pkg.pricePerNight * pkg.nights + 1800);
  });

  it("clamps nights to the property range", () => {
    assert.equal(clampNights(pkg, 0), 1);
    assert.equal(clampNights(pkg, 99), pkg.nightsMax);
  });
});

describe("stay plan", () => {
  it("collapses a 1-night stay to a single day", () => {
    const pkg = getPackage("mayfair-heritage-puri")!;
    const days = daysForStay(pkg, 1);
    assert.equal(days.length, 1);
    assert.match(days[0]!.title, /Arrive/i);
  });

  it("keeps a depart day when shortening a longer plan", () => {
    const pkg = getPackage("mayfair-heritage-puri")!;
    const days = daysForStay(pkg, 2);
    assert.equal(days.length, 2);
    assert.match(days[1]!.title, /Depart/i);
  });

  it("names a single night correctly", () => {
    assert.equal(nightsPhrase(1), "1 night");
    assert.equal(nightsPhrase(3), "3 nights");
  });
});
