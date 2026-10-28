import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicHoldId, publicHoldIds } from "../hold-id.ts";
import { quoteStay, replacePaidHolds, roomUnits } from "../inventory.ts";
import { getPackage } from "../packages.ts";

describe("publicHoldId", () => {
  it("is the first 24 hex chars of sha256", async () => {
    assert.equal(await publicHoldId("x"), "2d711642b726b04401627ca9");
    assert.equal((await publicHoldId("x")).length, 24);
  });

  it("changes when the raw id changes", async () => {
    assert.notEqual(await publicHoldId("a"), await publicHoldId("b"));
  });
});

describe("publicHoldIds", () => {
  it("returns plain strings in order, not promises", async () => {
    const ids = await publicHoldIds(["x", "a"]);
    assert.deepEqual(ids, [await publicHoldId("x"), await publicHoldId("a")]);
    for (const id of ids) assert.equal(typeof id, "string");
  });

  it("lets a guest's own hashed hold free the last room for them", async () => {
    const pkg = getPackage("taj-puri-resort-spa")!;
    const room = pkg.rooms[0]!;
    const units = roomUnits(pkg, room.id);
    const checkIn = "2027-01-20";
    const raws = Array.from({ length: units }, (_, i) => (i === 0 ? "pending:me:hold" : `TW-OTHER${i}`));
    const hashed = await publicHoldIds(raws);
    replacePaidHolds(
      hashed.map((holdId, i) => ({
        holdId,
        packageId: pkg.id,
        roomId: room.id,
        checkIn,
        nights: 1,
        status: i === 0 ? "held" : "paid",
        expiresAt: i === 0 ? new Date(Date.now() + 15 * 60_000).toISOString() : undefined,
      })),
    );
    const base = { packageId: pkg.id, roomId: room.id, checkIn, nights: 1 };
    assert.equal(quoteStay(base)?.available, false);
    const mine = await publicHoldIds(["pending:me:hold"]);
    assert.equal(quoteStay({ ...base, ignoreHoldIds: mine })?.available, true);
    replacePaidHolds([]);
  });
});
