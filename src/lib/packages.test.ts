import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  PACKAGES,
  clampNights,
  daysForStay,
  formatMoney,
  getPackage,
  getRoom,
  guestsPhrase,
  nightsPhrase,
  safeNextPath,
  priceWithSwaps,
  stayTotal,
} from "./packages.ts";
import { getSeededConsensus } from "./youtube/get-seeded.ts";
import { SEED_ROOM_NOTES } from "./youtube/seed-room-notes.ts";
import { stayPin } from "./places.ts";
import { STAYS_NEEDING_USER_FILES, stayNeedsUserFiles, STAY_MEDIA } from "./property-media.ts";
import { INCLUDE_ICON } from "./include-icons.ts";

/** The twelve stays that shipped with official room photos and reviewer videos. */
const SEEDED_STAYS = [
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

describe("catalog", () => {
  it("lists sixty-two stays in and near Puri, with rooms and 1-night stays", () => {
    assert.equal(PACKAGES.length, 62);
    for (const pkg of PACKAGES) {
      assert.equal(pkg.nightsMin, 1, pkg.id);
      assert.ok(pkg.nightsMax >= pkg.nightsMin, pkg.id);
      assert.ok(pkg.rooms.length >= 2, pkg.id);
      assert.equal(pkg.priceFrom, pkg.pricePerNight);
      assert.equal(pkg.rooms[0]!.deltaPerNight, 0, pkg.id);
      const spec = STAY_MEDIA[pkg.id];
      if (!spec) {
        assert.equal(pkg.images.length, 0, pkg.id);
        assert.equal(pkg.image, "", pkg.id);
        assert.ok(
          pkg.videos.length === 0 || (pkg.videos.length >= 2 && pkg.videos.length <= 4),
          pkg.id,
        );
        for (const video of pkg.videos) {
          assert.match(video.videoId, /^[a-zA-Z0-9_-]{11}$/, video.videoId);
        }
        continue;
      }
      assert.equal(pkg.image, pkg.images[0]);
      assert.ok(pkg.images[0]!.includes("/property-1.jpg"), `${pkg.id} leads with property photo`);
      assert.ok(!pkg.image.includes("unsplash"), pkg.id);
      assert.ok(!pkg.image.includes("i.ytimg.com"), pkg.id);
      for (const src of pkg.images) {
        assert.ok(!src.includes("unsplash"), `${pkg.id} gallery unsplash`);
        assert.ok(!src.includes("i.ytimg.com"), `${pkg.id} gallery ytimg`);
      }
      if (SEEDED_STAYS.includes(pkg.id)) {
        assert.ok(pkg.images.length >= 4, pkg.id);
        assert.ok(pkg.videos.length >= 2, pkg.id);
        for (const video of pkg.videos) {
          assert.match(video.videoId, /^[a-zA-Z0-9_-]{11}$/, video.videoId);
        }
        const roomImages = new Set<string>();
        for (const room of pkg.rooms) {
          assert.ok(room.image, `${pkg.id}:${room.id}`);
          assert.ok(!room.image.includes("unsplash"), `${pkg.id}:${room.id}`);
          assert.ok(!room.image.includes("i.ytimg.com"), `${pkg.id}:${room.id}`);
          roomImages.add(room.image);
        }
        assert.equal(roomImages.size, pkg.rooms.length, `${pkg.id} unique room images`);
        continue;
      }
      assert.ok(pkg.images.length >= 1, pkg.id);
      assert.ok(
        pkg.videos.length === 0 || (pkg.videos.length >= 2 && pkg.videos.length <= 4),
        pkg.id,
      );
      for (const video of pkg.videos) {
        assert.match(video.videoId, /^[a-zA-Z0-9_-]{11}$/, video.videoId);
      }
      const officialIds = Object.keys(spec.rooms);
      if (officialIds.length === 0) {
        for (const room of pkg.rooms) {
          assert.equal(room.image, "", `${pkg.id}:${room.id}`);
          assert.deepEqual(room.images, [], `${pkg.id}:${room.id}`);
        }
        continue;
      }
      assert.deepEqual(
        pkg.rooms.map((room) => room.id),
        officialIds,
        `${pkg.id} official room ids`,
      );
      const roomImages = new Set<string>();
      for (const room of pkg.rooms) {
        assert.ok(room.image, `${pkg.id}:${room.id}`);
        assert.ok(room.image.includes("/rooms/"), `${pkg.id}:${room.id}`);
        assert.ok(!room.image.includes("unsplash"), `${pkg.id}:${room.id}`);
        roomImages.add(room.image);
      }
      assert.equal(roomImages.size, pkg.rooms.length, `${pkg.id} unique room images`);
    }
  });

  it("does not repeat the same photograph in property or room galleries", () => {
    const photoHash = (src: string) => {
      const file = path.join(process.cwd(), "public", src.replace(/^\//, ""));
      return createHash("md5").update(readFileSync(file)).digest("hex");
    };
    for (const [id, spec] of Object.entries(STAY_MEDIA)) {
      const property = spec.images.map(photoHash);
      assert.equal(new Set(property).size, property.length, `${id} property photos`);
      const roomHashes: string[] = [];
      for (const [roomId, listed] of Object.entries(spec.rooms)) {
        const frames = (Array.isArray(listed) ? listed : [listed]).map(photoHash);
        assert.equal(new Set(frames).size, frames.length, `${id}:${roomId}`);
        roomHashes.push(...frames);
      }
      assert.equal(new Set(roomHashes).size, roomHashes.length, `${id} room photos`);
      const overlap = property.filter((hash) => roomHashes.includes(hash));
      assert.deepEqual(overlap, [], `${id} shared property and room photo`);
    }
  });

  it("uses vendored local /stays paths for catalog media", () => {
    for (const pkg of PACKAGES) {
      if (!STAY_MEDIA[pkg.id]) continue;
      assert.match(pkg.image, new RegExp(`^/stays/${pkg.id}/property-1\\.jpg$`), pkg.id);
      for (const src of pkg.images) {
        assert.match(src, new RegExp(`^/stays/${pkg.id}/`), `${pkg.id} gallery`);
      }
      for (const room of pkg.rooms) {
        if (!room.image) {
          assert.deepEqual(room.images, [], `${pkg.id}:${room.id}`);
          continue;
        }
        assert.match(room.image, new RegExp(`^/stays/${pkg.id}/`), `${pkg.id}:${room.id}`);
      }
    }
  });

  it("flags stays that still need user-supplied photo files", () => {
    assert.deepEqual([...STAYS_NEEDING_USER_FILES].sort(), []);
    assert.equal(stayNeedsUserFiles("hans-coco-palms"), false);
    assert.equal(stayNeedsUserFiles("toshali-sands-puri"), false);
    assert.equal(stayNeedsUserFiles("taj-puri-resort-spa"), false);
  });

  it("pins every stay, including the fifty added around Puri", () => {
    const added = PACKAGES.filter((pkg) => !SEEDED_STAYS.includes(pkg.id));
    assert.equal(added.length, 50);
    for (const pkg of PACKAGES) {
      assert.ok(stayPin(pkg.id, pkg.name), pkg.id);
    }
    for (const pkg of added) {
      const pin = stayPin(pkg.id, pkg.name);
      assert.ok(pin, pkg.id);
      assert.ok(pin!.lat > 19.6 && pin!.lat < 20, pkg.id);
      assert.ok(pin!.lng > 85.4 && pin!.lng < 86.2, pkg.id);
      assert.ok(pkg.pricePerNight >= 1000, pkg.id);
      assert.equal(pkg.hasAirportTransfer, false, pkg.id);
    }
    assert.ok(getPackage("fortune-beachfront-puri"));
    assert.ok(getPackage("panthanivas-konark"));
    assert.equal(getPackage("panthanivas-konark")!.destination, "Konark");
    assert.equal(getPackage("om-leisure-satapada")!.area, "chilika");
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

  it("has reviewer notes for every official room id", () => {
    for (const pkg of PACKAGES) {
      if (!SEEDED_STAYS.includes(pkg.id)) continue;
      const seed = getSeededConsensus(pkg.id);
      assert.ok(seed, pkg.id);
      const notes = SEED_ROOM_NOTES[pkg.id];
      assert.ok(notes, `seed notes ${pkg.id}`);
      const roomIds = pkg.rooms.map((r) => r.id).sort();
      assert.deepEqual(Object.keys(notes).sort(), roomIds, `seed note keys ${pkg.id}`);
      for (const room of pkg.rooms) {
        assert.ok(seed!.roomNotes?.[room.id], `${pkg.id}:${room.id}`);
      }
    }
  });
});

describe("stay pricing", () => {
  const pkg = getPackage("taj-puri-resort-spa")!;

  it("charges one night at the base room rate", () => {
    assert.equal(stayTotal(pkg, 1, "superior-king-balcony"), pkg.pricePerNight);
  });

  it("adds the room delta per night", () => {
    const sea = getRoom(pkg, "deluxe-sea-king");
    assert.equal(stayTotal(pkg, 2, "deluxe-sea-king"), (pkg.pricePerNight + sea.deltaPerNight) * 2);
  });

  it("only applies extras on the nights you actually stay", () => {
    const one = stayTotal(pkg, 1, "superior-king-balcony", { "0": "spa" });
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

  it("gives every stay include its own icon", () => {
    const labels = new Set(PACKAGES.flatMap((pkg) => pkg.includes));
    for (const label of labels) {
      assert.ok(label in INCLUDE_ICON, label);
    }
    assert.equal(labels.size, Object.keys(INCLUDE_ICON).length);
  });

  it("names a single guest correctly", () => {
    assert.equal(guestsPhrase(1), "1 guest");
    assert.equal(guestsPhrase(2), "2 guests");
  });

  it("voucher stay line uses the singular for one guest", () => {
    const voucher = readFileSync(path.join(process.cwd(), "src/routes/voucher.$code.tsx"), "utf8");
    assert.ok(!voucher.includes("{booking.travelers} guests"), "\"1 guests\" for a solo stay");
    assert.ok(voucher.includes("{nightsPhrase(booking.nights)} · {guestsPhrase(booking.travelers)}"));
  });
});

describe("login next path", () => {
  it("keeps same-origin app paths and rejects open redirects or login loops", () => {
    assert.equal(safeNextPath("/checkout"), "/checkout");
    assert.equal(safeNextPath("/trip/taj-puri-resort-spa?x=1"), "/trip/taj-puri-resort-spa?x=1");
    assert.equal(safeNextPath("//evil.example"), null);
    assert.equal(safeNextPath("https://evil.example"), null);
    assert.equal(safeNextPath("/\\evil.example"), null);
    assert.equal(safeNextPath("/login"), null);
    assert.equal(safeNextPath("/login?next=/checkout"), null);
    assert.equal(safeNextPath(undefined), null);
  });
});

describe("formatMoney", () => {
  it("groups rupees the Indian way with no paise", () => {
    assert.equal(formatMoney(14632), "₹14,632");
    assert.equal(formatMoney(1234567), "₹12,34,567");
    assert.equal(formatMoney(0), "₹0");
  });

  it("is used for the voucher's paid amount", () => {
    const voucher = readFileSync(path.join(process.cwd(), "src/routes/voucher.$code.tsx"), "utf8");
    assert.ok(!voucher.includes("₹{booking.amountInr}"), "raw ₹{booking.amountInr} skips digit grouping");
    assert.ok(voucher.includes('<dd className="tabular-nums">{formatMoney(booking.amountInr)}</dd>'));
  });
});
