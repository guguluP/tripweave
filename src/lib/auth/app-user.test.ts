import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appUserFromKey, appUserKey } from "./app-user.ts";

describe("app user identity", () => {
  it("gives two session objects with the same fields the same key", () => {
    const a = { id: "u1", name: "Test Guest", email: "g@example.test", image: null, emailVerified: false };
    const b = { ...a, updatedAt: new Date() };
    assert.notEqual(a, b);
    assert.equal(appUserKey(a), appUserKey(b));
  });

  it("changes the key when a shown field changes", () => {
    const base = { id: "u1", name: "Test Guest", email: "g@example.test", image: null };
    const keys = new Set([
      appUserKey(base),
      appUserKey({ ...base, id: "u2" }),
      appUserKey({ ...base, name: "Other" }),
      appUserKey({ ...base, email: "h@example.test" }),
      appUserKey({ ...base, image: "https://example.test/a.png" }),
    ]);
    assert.equal(keys.size, 5);
  });

  it("maps the key back to the AppUser shape", () => {
    assert.deepEqual(appUserFromKey(appUserKey({ id: "u1", name: "Test Guest", email: "g@example.test" })), {
      id: "u1",
      displayName: "Test Guest",
      primaryEmail: "g@example.test",
      profileImageUrl: null,
      isDevFallback: false,
    });
  });

  it("treats no session as signed out", () => {
    assert.equal(appUserKey(null), "");
    assert.equal(appUserKey(undefined), "");
    assert.equal(appUserFromKey(""), null);
  });
});
