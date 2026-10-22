import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { firstErrorField, guestErrorBanner } from "./focus-first-error.ts";

describe("firstErrorField", () => {
  it("orders guest 1 fields before later guests", () => {
    assert.equal(
      firstErrorField([
        { id: "guest-1-fullName", guestIndex: 1, field: "fullName" },
        { id: "guest-0-dateOfBirth", guestIndex: 0, field: "dateOfBirth" },
        { id: "guest-0-fullName", guestIndex: 0, field: "fullName" },
      ]),
      "guest-0-fullName",
    );
  });

  it("names the first field and counts the rest", () => {
    assert.equal(
      guestErrorBanner([
        { guestIndex: 0, label: "date of birth" },
        { guestIndex: 0, label: "ID number" },
        { guestIndex: 1, label: "full name" },
      ]),
      "Guest 1: date of birth is required (+2 more)",
    );
  });
});
