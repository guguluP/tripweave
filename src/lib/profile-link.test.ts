import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Pure helpers for the profiles-by-email model.
 * DB RPC is integration-tested via SQL apply; this covers the email normalizer
 * used by claim/link call sites.
 */
export function normalizeVerifiedEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

export function profileOwnsEmail(
  profileEmail: string | null | undefined,
  verifiedEmail: string,
): boolean {
  const a = normalizeVerifiedEmail(profileEmail);
  const b = normalizeVerifiedEmail(verifiedEmail);
  return Boolean(a && b && a === b);
}

describe("profile email link helpers", () => {
  it("normalizes verified email", () => {
    assert.equal(normalizeVerifiedEmail("  Ada@Example.COM "), "ada@example.com");
    assert.equal(normalizeVerifiedEmail(null), "");
  });

  it("matches profile email to verified sign-in", () => {
    assert.equal(profileOwnsEmail("ADA@example.com", "ada@example.com"), true);
    assert.equal(profileOwnsEmail("other@example.com", "ada@example.com"), false);
    assert.equal(profileOwnsEmail("", "ada@example.com"), false);
  });
});
