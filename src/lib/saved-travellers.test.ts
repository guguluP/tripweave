import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSavedPurgeDue, savedIdLast4, savedInsertAllowed } from "./saved-travellers.ts";

describe("saved travellers", () => {
  it("caps a user at 20 rows", () => {
    assert.equal(savedInsertAllowed(19), true);
    assert.equal(savedInsertAllowed(20), false);
  });

  it("purges a row 12 months after it was last used", () => {
    const now = new Date("2026-10-22T00:00:00Z");
    assert.equal(isSavedPurgeDue("2025-10-21T00:00:00Z", now), true);
    assert.equal(isSavedPurgeDue("2025-10-23T00:00:00Z", now), false);
    assert.equal(isSavedPurgeDue("2026-01-01T00:00:00Z", now), false);
  });

  it("keeps only the last 4 characters of an ID", () => {
    assert.equal(savedIdLast4("L898902C3"), "9023");
    assert.ok(savedIdLast4("L898902C3").length <= 4);
    assert.equal(savedIdLast4("123456789012").includes("123456789012"), false);
  });
});
