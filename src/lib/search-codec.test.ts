import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSearchParams, stringifySearchParams } from "./search-codec.ts";

describe("search codec", () => {
  it("writes nights as a bare number", () => {
    const query = stringifySearchParams({ nights: "3", checkIn: "2026-06-26" });
    assert.equal(query, "?nights=3&checkIn=2026-06-26");
  });

  it("reads a legacy JSON-quoted nights value", () => {
    const parsed = parseSearchParams("?nights=%223%22&checkIn=%222026-06-26%22");
    assert.equal(parsed.nights, "3");
    assert.equal(parsed.checkIn, "2026-06-26");
  });
});
