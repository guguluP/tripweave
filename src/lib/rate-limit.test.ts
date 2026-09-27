import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { consumeRateLimit, resetRateLimitStore } from "./rate-limit.ts";

describe("consumeRateLimit", () => {
  it("allows up to the limit then blocks until the window resets", () => {
    resetRateLimitStore();
    const key = "test:occ";
    const t0 = 1_000_000;
    assert.equal(consumeRateLimit(key, { limit: 2, windowMs: 60_000, now: t0 }).ok, true);
    assert.equal(consumeRateLimit(key, { limit: 2, windowMs: 60_000, now: t0 + 1 }).ok, true);
    const blocked = consumeRateLimit(key, { limit: 2, windowMs: 60_000, now: t0 + 2 });
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfterSec >= 1);
    const after = consumeRateLimit(key, { limit: 2, windowMs: 60_000, now: t0 + 60_000 });
    assert.equal(after.ok, true);
  });
});
