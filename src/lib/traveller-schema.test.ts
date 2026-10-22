import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { travelerInputSchema } from "./traveller-schema.ts";

const base = {
  fullName: "Priya Sharma",
  email: "priya@example.com",
  dateOfBirth: "1990-01-15",
  idType: "aadhaar",
  idNumber: "4321",
};

describe("travelerInputSchema", () => {
  it("turns a legacy Indian mobile into E.164", () => {
    const parsed = travelerInputSchema.parse({ ...base, phone: "9876543210", nationality: "IN" });
    assert.equal(parsed.phone, "+919876543210");
    assert.equal(parsed.emergencyPhone, "");
  });

  it("rejects a bad E.164 and a bad nationality", () => {
    assert.equal(travelerInputSchema.safeParse({ ...base, phone: "+915876543210", nationality: "IN" }).success, false);
    assert.equal(travelerInputSchema.safeParse({ ...base, phone: "+447911123456", nationality: "UK" }).success, false);
    assert.equal(travelerInputSchema.safeParse({ ...base, phone: "+447911123456", nationality: "gb", idType: "passport" }).success, true);
  });

  it("allows an empty emergency phone and rejects a bad one", () => {
    assert.equal(
      travelerInputSchema.safeParse({ ...base, phone: "9876543210", nationality: "IN", emergencyPhone: "" }).success,
      true,
    );
    assert.equal(
      travelerInputSchema.safeParse({ ...base, phone: "9876543210", nationality: "IN", emergencyPhone: "123" }).success,
      false,
    );
  });
});
