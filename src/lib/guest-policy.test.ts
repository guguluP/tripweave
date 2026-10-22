import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { requiredFields } from "./guest-policy.ts";

describe("requiredFields", () => {
  it("asks the lead for contact and ID", () => {
    assert.deepEqual(requiredFields("lead", "lead_only", "IN", false), [
      "fullName",
      "phone",
      "email",
      "dateOfBirth",
      "nationality",
      "idType",
      "idNumber",
    ]);
  });

  it("asks an Indian companion for a name and age band only", () => {
    assert.deepEqual(requiredFields("companion", "lead_only", "IN", false), ["fullName", "ageBand"]);
    assert.deepEqual(requiredFields("companion", "lead_only", "IN", true), ["fullName", "ageBand"]);
  });

  it("asks adult companions for an ID when the hotel requires it", () => {
    assert.deepEqual(requiredFields("companion", "all_adults_id", "IN", false), [
      "fullName",
      "ageBand",
      "idType",
      "idNumber",
    ]);
    assert.deepEqual(requiredFields("companion", "all_adults_id", "IN", true), ["fullName", "ageBand"]);
  });

  it("still requires a passport for a non-Indian companion", () => {
    assert.deepEqual(requiredFields("companion", "lead_only", "GB", false), [
      "fullName",
      "nationality",
      "idType",
      "idNumber",
      "dateOfBirth",
    ]);
    const lead = requiredFields("lead", "lead_only", "GB", false);
    assert.ok(lead.includes("dateOfBirth"));
    assert.ok(lead.includes("idNumber"));
    assert.ok(lead.includes("phone"));
  });
});
