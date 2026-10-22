import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { devToolsEnabled, showDigiLocker } from "./digilocker.ts";

describe("showDigiLocker", () => {
  it("hides the sandbox unless a sample flag or dev tools are set", () => {
    assert.equal(showDigiLocker({ live: false }, {}), false);
    assert.equal(showDigiLocker({ live: false }, { sample: true }), true);
    assert.equal(showDigiLocker({ live: false }, { devTools: true }), true);
    assert.equal(showDigiLocker({ live: true }, {}), true);
    assert.equal(devToolsEnabled(null), false);
    assert.equal(devToolsEnabled("1"), true);
    assert.equal(devToolsEnabled("false"), false);
  });
});
