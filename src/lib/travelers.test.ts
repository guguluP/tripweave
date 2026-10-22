import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceTraveler, defaultIdType, emptyTraveler, validateTraveler, validateTravelers } from "./travelers.ts";

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

  it("accepts an international number and normalises a legacy Indian mobile", () => {
    const uk = validateTraveler(
      emptyTraveler({ ...lead, phone: "+447911123456", nationality: "GB", idType: "passport", idNumber: "123456789" }),
    );
    assert.equal(uk.phone, undefined);
    const us = validateTraveler(
      emptyTraveler({
        ...lead,
        phone: "+12025550123",
        nationality: "US",
        idType: "passport",
        idNumber: "123456789",
      }),
    );
    assert.equal(us.phone, undefined);
    assert.equal(coerceTraveler({ phone: "9876543210", nationality: "IN" })?.phone, "+919876543210");
    const rejected = validateTraveler(emptyTraveler({ ...lead, phone: "+915876543210" }));
    assert.match(rejected.phone ?? "", /10-digit Indian/);
  });

  it("checks the emergency phone only when it is filled", () => {
    assert.equal(validateTraveler(lead).emergencyPhone, undefined);
    const bad = validateTraveler(emptyTraveler({ ...lead, emergencyPhone: "12345" }));
    assert.ok(bad.emergencyPhone);
  });

  it("rejects UK and accepts GB", () => {
    const uk = validateTraveler(emptyTraveler({ ...lead, nationality: "UK" }));
    assert.match(uk.nationality ?? "", /list/);
    const gb = validateTraveler(
      emptyTraveler({ ...lead, nationality: "GB", idType: "passport", idNumber: "123456789", phone: "+447911123456" }),
    );
    assert.equal(gb.nationality, undefined);
  });

  it("defaults a non-Indian guest to a passport", () => {
    assert.equal(defaultIdType("US"), "passport");
    assert.equal(defaultIdType("IN"), "aadhaar");
  });
});
