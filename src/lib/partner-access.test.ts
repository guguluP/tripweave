import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBannedPartnerWildcard, packageIdsForPartner } from "./partner-access.ts";

describe("PARTNER_EMAILS wildcard ban", () => {
  it("flags email:* and bare email as banned", () => {
    assert.equal(isBannedPartnerWildcard("ops@example.com:*"), true);
    assert.equal(isBannedPartnerWildcard("ops@example.com"), true);
    assert.equal(isBannedPartnerWildcard("ops@example.com:taj-puri-resort-spa"), false);
  });

  it("does not grant every hotel for email:*", () => {
    const prev = process.env.PARTNER_EMAILS;
    process.env.PARTNER_EMAILS = "wild@example.com:*";
    try {
      assert.deepEqual(packageIdsForPartner("wild@example.com"), []);
    } finally {
      if (prev === undefined) delete process.env.PARTNER_EMAILS;
      else process.env.PARTNER_EMAILS = prev;
    }
  });
});
