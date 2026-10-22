import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyTraveler, validateTraveler, validateTravelers } from "./travelers.ts";

const lead = emptyTraveler(
  {
    fullName: "Priya Sharma",
    phone: "9876543210",
    email: "priya@example.com",
    dateOfBirth: "1990-01-15",
    nationality: "IN",
    idType: "aadhaar",
    idNumber: "4321",
    role: "lead",
  },
  0,
);

describe("validateTravelers", () => {
  it("accepts a lead plus companions who only give a name and age band", () => {
    const result = validateTravelers(
      [
        lead,
        emptyTraveler({ fullName: "Arjun Mehta", ageBand: "adult", role: "companion", nationality: "IN" }, 1),
        emptyTraveler({ fullName: "Mini Mehta", ageBand: "child_5_11", role: "companion", nationality: "IN" }, 2),
      ],
      "lead_only",
    );
    assert.equal(result.ok, true);
  });

  it("still validates a legacy full object as the lead", () => {
    const legacy = emptyTraveler({
      fullName: "Priya Sharma",
      phone: "9876543210",
      email: "priya@example.com",
      dateOfBirth: "1990-01-15",
      nationality: "IN",
      idType: "passport",
      idNumber: "J8123456",
    });
    assert.deepEqual(validateTraveler(legacy), {});
  });

  it("requires a passport when a companion is not Indian", () => {
    const result = validateTravelers(
      [
        lead,
        emptyTraveler({ fullName: "Sam Lee", ageBand: "adult", role: "companion", nationality: "GB" }, 1),
      ],
      "lead_only",
    );
    assert.equal(result.ok, false);
    assert.ok(result.errors[1]?.idNumber || result.errors[1]?.dateOfBirth);
  });
});
