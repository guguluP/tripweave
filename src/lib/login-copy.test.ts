import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialMode, nextCopy } from "./login-copy.ts";

describe("login booking copy", () => {
  it("describes the stay on checkout and travellers", () => {
    assert.equal(
      nextCopy("/checkout", { name: "Swosti Premium", nights: 3 }),
      "Create an account to book Swosti Premium · 3 nights. Your room is held once you continue.",
    );
    assert.match(nextCopy("/travelers", { name: "Taj Puri", nights: 2 }), /Taj Puri · 2 nights/);
    assert.equal(nextCopy("/trips"), "Sign in to see your trips.");
  });

  it("defaults to sign up until an account flag exists", () => {
    assert.equal(initialMode(false), "up");
    assert.equal(initialMode(true), "in");
  });
});
