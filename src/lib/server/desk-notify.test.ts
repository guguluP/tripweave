import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { writeMeta } from "../booking-meta.ts";
import { EMPTY_TRAVEL } from "../travel-plan.ts";
import { airportCarLine, deskMessageLines, guestPaidLines, type DeskNoticeCore } from "../desk-notice.ts";

const base: DeskNoticeCore = {
  bookingId: 1,
  packageId: "taj-puri-resort-spa",
  packageName: "Taj Puri",
  confirmationCode: "TW-TEST",
  checkIn: "2026-11-02",
  nights: 3,
  travelers: 3,
  amountInr: 14000,
  payerName: "Priya Sharma",
  roomName: "Deluxe",
};

describe("desk notify copy", () => {
  it("adds the airport car line when the guest requested one", () => {
    const swaps = writeMeta({}, {
      travel: { ...EMPTY_TRAVEL, includePickup: true, arrivalTime: "14:30", lastMileId: "hotel" },
    });
    assert.equal(airportCarLine({ swaps }), "Airport car requested · arriving 14:30");
    const lines = deskMessageLines({ ...base, swaps });
    assert.ok(lines.some((line) => line === "Airport car requested · arriving 14:30"));
    const guest = guestPaidLines({ ...base, guestEmail: "a@b.co", swaps });
    assert.ok(guest.some((line) => line === "Airport car requested · arriving 14:30"));
  });

  it("says the arrival time was not given", () => {
    const swaps = writeMeta({}, {
      travel: { ...EMPTY_TRAVEL, includePickup: true, arrivalTime: "", lastMileId: "hotel" },
    });
    assert.equal(airportCarLine({ swaps }), "Airport car requested · arriving time not given");
  });

  it("names the lead and companions", () => {
    const lines = deskMessageLines({
      ...base,
      guests: [
        { fullName: "Priya Sharma", phone: "9876543210", role: "lead", isLead: true },
        { fullName: "Arjun Mehta", role: "companion", ageBand: "adult" },
        { fullName: "Mini Mehta", role: "companion", ageBand: "child_5_11" },
      ],
    });
    assert.ok(lines.includes("Lead: Priya Sharma (+91 9876543210)"));
    assert.ok(lines.includes("Arjun Mehta · adult"));
    assert.ok(lines.includes("Mini Mehta · child 5–11"));
  });
});
