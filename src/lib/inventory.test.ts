import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_BRIEF, getPackage, matchPackages, originFitReason, originFitScore } from "./packages.ts";
import { leftoverForRooms, quoteStay, recordHold, releaseHoldById, roomUnits, seasonFor, travelersFitRoom } from "./inventory.ts";
import { refundAmountInr, refundPolicyFor } from "./refund-policy.ts";

describe("dated rates", () => {
  it("says the festival calendar has ended after June 2027", () => {
    const s = seasonFor("2027-07-08");
    assert.match(s.label, /festival calendar ends Jun 2027/);
    assert.notEqual(s.kind, "festival");
  });

  it("counts two guests on the same dates as two holds", () => {
    const pkg = getPackage("taj-puri-resort-spa")!;
    const roomId = "superior-king-balcony";
    const units = roomUnits(pkg, roomId);
    const before = quoteStay({ packageId: pkg.id, roomId, checkIn: "2026-08-12", nights: 1 });
    recordHold({
      holdId: "guest-a",
      packageId: pkg.id,
      roomId,
      checkIn: "2026-08-12",
      nights: 1,
      status: "paid",
    });
    recordHold({
      holdId: "guest-b",
      packageId: pkg.id,
      roomId,
      checkIn: "2026-08-12",
      nights: 1,
      status: "paid",
    });
    const after = quoteStay({ packageId: pkg.id, roomId, checkIn: "2026-08-12", nights: 1 });
    assert.ok(before && after);
    assert.equal(after!.remaining, Math.max(0, before!.remaining - 2));
    assert.ok(after!.remaining <= units - 2 || before!.remaining < 2);
    releaseHoldById("guest-a");
    releaseHoldById("guest-b");
  });

  it("marks Rath Yatra nights as festival", () => {
    const s = seasonFor("2026-06-28");
    assert.equal(s.kind, "festival");
    assert.ok(s.multiplier > 1.2);
  });

  it("quotes a higher per-person total on a festival night than a quiet midweek", () => {
    const quiet = quoteStay({
      packageId: "taj-puri-resort-spa",
      roomId: "superior-king-balcony",
      checkIn: "2026-07-15",
      nights: 1,
    });
    const fest = quoteStay({
      packageId: "taj-puri-resort-spa",
      roomId: "superior-king-balcony",
      checkIn: "2026-06-28",
      nights: 1,
    });
    assert.ok(quiet && fest);
    assert.ok(fest!.perPerson > quiet!.perPerson);
    assert.equal(quiet!.occupancy, 4);
  });

  it("exposes leftover rooms against a finite inventory", () => {
    const pkg = getPackage("chanakya-bnr-puri")!;
    const units = roomUnits(pkg, pkg.rooms[0]!.id);
    assert.ok(units >= 2 && units <= 8);
    const q = quoteStay({
      packageId: pkg.id,
      roomId: pkg.rooms[0]!.id,
      checkIn: "2026-08-12",
      nights: 2,
    });
    assert.ok(q);
    assert.ok(q!.remaining <= units);
    const leftover = leftoverForRooms(pkg.id, "2026-08-12", 2);
    assert.ok(leftover[pkg.rooms[0]!.id]);
    assert.equal(leftover[pkg.rooms[0]!.id]!.occupancy, pkg.rooms[0]!.occupancy);
  });
});

describe("occupancy cap", () => {
  it("rejects more guests than the room sleeps", () => {
    assert.equal(travelersFitRoom(2, 2), true);
    assert.equal(travelersFitRoom(2, 3), false);
    assert.equal(travelersFitRoom(4, 1), true);
  });
});

describe("refund policy", () => {
  it("is full when check-in is more than 48 hours out", () => {
    const now = new Date("2026-09-18T08:00:00");
    const policy = refundPolicyFor("2026-09-22", now);
    assert.equal(policy.fraction, 1);
    assert.equal(refundAmountInr(10000, "2026-09-22", now), 10000);
  });

  it("is half inside 48 hours", () => {
    const now = new Date("2026-09-21T10:00:00");
    assert.equal(refundPolicyFor("2026-09-22", now).fraction, 0.5);
  });

  it("is none after check-in noon", () => {
    const now = new Date("2026-09-22T15:00:00");
    assert.equal(refundPolicyFor("2026-09-22", now).fraction, 0);
  });
});

describe("origin ranking", () => {
  it("prefers temple-side stays for train arrivals", () => {
    const brief = { ...DEFAULT_BRIEF, origin: "kolkata" as const, arriveBy: "train" as const, vibe: "culture" as const };
    const chanakya = getPackage("chanakya-bnr-puri")!;
    const toshali = getPackage("toshali-sands-puri")!;
    assert.ok(originFitScore(chanakya, brief) > originFitScore(toshali, brief));
    const top = matchPackages(brief).map((p) => p.id);
    assert.ok(top.length === 3);
  });

  it("lifts airport-transfer hotels for flyers", () => {
    const brief = { ...DEFAULT_BRIEF, origin: "delhi" as const, arriveBy: "fly" as const, budget: "premium" as const };
    const taj = getPackage("taj-puri-resort-spa")!;
    assert.ok(originFitScore(taj, brief) > 0);
  });

  it("keeps Jatani bus guests closer to town than Konark", () => {
    const brief = { ...DEFAULT_BRIEF, origin: "khordha" as const, arriveBy: "bus" as const };
    const town = originFitScore(getPackage("empires-hotel-puri")!, brief);
    const far = originFitScore(getPackage("toshali-sands-puri")!, brief);
    assert.ok(town > far);
  });

  it("uses explicit place flags instead of the hotel name", () => {
    const waves = getPackage("mayfair-waves-puri")!;
    const regenta = getPackage("regenta-central-puri")!;
    const toshali = getPackage("toshali-sands-puri")!;
    const chanakya = getPackage("chanakya-bnr-puri")!;
    assert.equal(waves.area, "marine");
    assert.equal(regenta.area, "grand-road");
    assert.equal(regenta.nearStation, false);
    assert.equal(toshali.area, "konark");
    assert.equal(chanakya.nearStation, true);
    assert.equal(getPackage("taj-puri-resort-spa")!.hasAirportTransfer, true);
  });

  it("lifts nearStation stays for train and bus arrivals", () => {
    const brief = { ...DEFAULT_BRIEF, origin: "kolkata" as const, arriveBy: "train" as const };
    const near = getPackage("chanakya-bnr-puri")!;
    const farMarine = getPackage("mayfair-heritage-puri")!;
    assert.equal(near.nearStation, true);
    assert.equal(farMarine.nearStation, false);
    assert.ok(originFitScore(near, brief) > originFitScore(farMarine, brief));
    assert.match(originFitReason(near, brief), /Near the station/i);
  });

  it("marks a low score as a weak match", () => {
    const brief = {
      ...DEFAULT_BRIEF,
      vibe: "adventure" as const,
      budget: "value" as const,
      style: "solo" as const,
      flexible: true,
      origin: "kolkata" as const,
      arriveBy: "road" as const,
    };
    const matches = matchPackages(brief);
    assert.equal(matches.length, 3);
    for (const stay of matches) {
      assert.equal(stay.weakMatch, stay.matchScore < 4);
    }
  });

  it("explains why a train arrival prefers Chanakya", () => {
    const brief = { ...DEFAULT_BRIEF, origin: "kolkata" as const, arriveBy: "train" as const };
    const why = originFitReason(getPackage("chanakya-bnr-puri")!, brief);
    assert.match(why, /station|temple/i);
  });
});
