import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPackage } from "./packages.ts";
import {
  isBaseRoom,
  isFamilyRoom,
  isSeaViewRoom,
  recommendRoomIds,
  recommendRooms,
} from "./recommend-rooms.ts";
import type { RoomType } from "./packages.ts";

const sample: RoomType[] = [
  { id: "base", name: "Deluxe", summary: "Solid base", deltaPerNight: 0, occupancy: 2, image: "/x.jpg" },
  { id: "sea", name: "Sea View", summary: "Front sea view", deltaPerNight: 800, occupancy: 2, image: "/x.jpg" },
  { id: "family", name: "Family Suite", summary: "Two beds", deltaPerNight: 1500, occupancy: 4, image: "/x.jpg" },
  { id: "suite", name: "Premium Suite", summary: "Extra space", deltaPerNight: 2000, occupancy: 3, image: "/x.jpg" },
];

describe("recommendRooms", () => {
  it("classifies base / sea / family from metadata", () => {
    assert.equal(isBaseRoom(sample[0]!), true);
    assert.equal(isSeaViewRoom(sample[1]!), true);
    assert.equal(isFamilyRoom(sample[2]!), true);
    assert.equal(isSeaViewRoom(sample[3]!), false);
  });

  it("returns at most three and always includes the base room", () => {
    const picks = recommendRooms(sample);
    assert.ok(picks.length >= 2 && picks.length <= 3);
    assert.equal(picks[0]!.id, "base");
    assert.ok(picks.some((r) => r.id === "sea"));
    assert.ok(picks.some((r) => r.id === "family"));
  });

  it("prefers family earlier for a family brief style", () => {
    const ids = recommendRoomIds(sample, "family");
    assert.equal(ids[0], "base");
    assert.equal(ids[1], "family");
  });

  it("does not invent rooms — returns the full short list when few exist", () => {
    const two = sample.slice(0, 2);
    assert.deepEqual(
      recommendRooms(two).map((r) => r.id),
      ["base", "sea"],
    );
  });

  it("works on a real catalog stay with many official rooms", () => {
    const pkg = getPackage("mayfair-heritage-puri");
    assert.ok(pkg);
    const picks = recommendRooms(pkg.rooms, "couple");
    assert.ok(picks.length >= 2 && picks.length <= 3);
    assert.equal(picks[0]!.deltaPerNight, 0);
    assert.ok(picks.every((r) => pkg.rooms.some((x) => x.id === r.id)));
  });
});
