import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicHoldId } from "../hold-id.ts";

describe("publicHoldId", () => {
  it("is the first 24 hex chars of sha256", async () => {
    assert.equal(await publicHoldId("x"), "2d711642b726b04401627ca9");
    assert.equal((await publicHoldId("x")).length, 24);
  });

  it("changes when the raw id changes", async () => {
    assert.notEqual(await publicHoldId("a"), await publicHoldId("b"));
  });
});
