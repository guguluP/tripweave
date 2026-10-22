import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutReady } from "./checkout-ready.ts";
import { emptyTraveler, type Traveler } from "./travelers.ts";

const future = "2026-12-01";

function lead(patch: Partial<Traveler> = {}): Traveler {
  return emptyTraveler(
    {
      fullName: "Priya Sharma",
      phone: "9876543210",
      email: "priya@example.com",
      dateOfBirth: "1990-01-15",
      nationality: "IN",
      idType: "aadhaar",
      idNumber: "4321",
      role: "lead",
      ...patch,
    },
    0,
  );
}

const openInventory = { known: true, failed: false, released: true, available: true, occupancy: 3 };

describe("checkoutReady", () => {
  it("blocks a stale check-in", () => {
    const block = checkoutReady({
      pending: { packageId: "taj-puri-resort-spa", checkIn: "2020-01-01" },
      guests: [lead()],
      policy: "lead_only",
      inventory: openInventory,
      payerName: "Priya Sharma",
    });
    assert.equal(block?.fieldId, "checkIn");
    assert.match(block?.message ?? "", /passed/i);
  });

  it("blocks a room that is too small", () => {
    const block = checkoutReady({
      pending: { packageId: "taj-puri-resort-spa", checkIn: future, travelers: 4 },
      guests: [lead(), emptyTraveler({ fullName: "A Guest", ageBand: "adult", role: "companion" }, 1), emptyTraveler({ fullName: "B Guest", ageBand: "adult" }, 2), emptyTraveler({ fullName: "C Guest", ageBand: "child_5_11" }, 3)],
      policy: "lead_only",
      inventory: { ...openInventory, occupancy: 3 },
      payerName: "Priya Sharma",
    });
    assert.equal(block?.fieldId, "room");
    assert.match(block?.message ?? "", /sleeps 3/i);
  });

  it("blocks a missing lead ID", () => {
    const block = checkoutReady({
      pending: { packageId: "taj-puri-resort-spa", checkIn: future, travelers: 1 },
      guests: [lead({ idNumber: "" })],
      policy: "lead_only",
      inventory: openInventory,
      payerName: "Priya Sharma",
    });
    assert.equal(block?.fieldId, "guest-0-idNumber");
    assert.match(block?.message ?? "", /Guest 1: ID number is required/);
  });

  it("blocks a sold-out stay", () => {
    const block = checkoutReady({
      pending: { packageId: "taj-puri-resort-spa", checkIn: future, travelers: 1 },
      guests: [lead()],
      policy: "lead_only",
      inventory: { ...openInventory, available: false },
      payerName: "Priya Sharma",
    });
    assert.equal(block?.fieldId, "checkIn");
    assert.match(block?.message ?? "", /sold out/i);
  });
});
