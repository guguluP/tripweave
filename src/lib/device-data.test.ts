import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEVICE_OWNER_KEY, claimDeviceData, clearPersonalDeviceData } from "./device-data.ts";
import { devCodeAllowed } from "./group/otp.ts";

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  keys() {
    return [...this.map.keys()].sort();
  }
}

function filled() {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  local.setItem("tripweave-brief", '{"vibe":"beach"}');
  local.setItem("tripweave-travelers", '[{"fullName":"Asha","phone":"+919876543210"}]');
  local.setItem("tripweave-profile", '{"displayName":"Asha"}');
  local.setItem("tripweave-pending", '{"packageId":"taj-puri-resort-spa"}');
  local.setItem("tripweave-wallet-passes", "[]");
  local.setItem("tripweave-travel-draft", '{"carrierRef":"6E 123"}');
  local.setItem("tripweave-saved", '["taj-puri-resort-spa"]');
  local.setItem("tripweave-likes-synced:user-a", "1");
  session.setItem("tw-last-booking", "TW-ABC123");
  session.setItem("tripweave-next", "/checkout");
  return { local, session };
}

describe("device data on a shared browser", () => {
  it("sign-out wipes guests, cart, codes and per-account flags, but keeps search prefs", () => {
    const { local, session } = filled();
    clearPersonalDeviceData(local, session);
    assert.deepEqual(local.keys(), ["tripweave-brief"]);
    assert.deepEqual(session.keys(), []);
  });

  it("a guest's draft is adopted by the first account that signs in", () => {
    const { local, session } = filled();
    assert.equal(claimDeviceData("user-a", local, session), false);
    assert.equal(local.getItem(DEVICE_OWNER_KEY), "user-a");
    assert.ok(local.getItem("tripweave-travelers"));
  });

  it("the same account signing in again keeps its data", () => {
    const { local, session } = filled();
    claimDeviceData("user-a", local, session);
    assert.equal(claimDeviceData("user-a", local, session), false);
    assert.ok(local.getItem("tripweave-travelers"));
  });

  it("another account signing in (no sign-out ran) does not see the first account's guests", () => {
    const { local, session } = filled();
    claimDeviceData("user-a", local, session);
    assert.equal(claimDeviceData("user-b", local, session), true);
    assert.equal(local.getItem("tripweave-travelers"), null);
    assert.equal(local.getItem("tripweave-pending"), null);
    assert.equal(session.getItem("tw-last-booking"), null);
    assert.equal(local.getItem(DEVICE_OWNER_KEY), "user-b");
    assert.ok(local.getItem("tripweave-brief"));
  });

  it("tolerates missing storage", () => {
    clearPersonalDeviceData(null, null);
    assert.equal(claimDeviceData("user-a", null, null), false);
  });
});

describe("group join code is never shown on a deployed site", () => {
  it("only a local dev server may show an unsent code", () => {
    assert.equal(devCodeAllowed({ NODE_ENV: "development" } as NodeJS.ProcessEnv), true);
    assert.equal(devCodeAllowed({ VERCEL: "1", NODE_ENV: "development" } as NodeJS.ProcessEnv), false);
    assert.equal(devCodeAllowed({ NODE_ENV: "production" } as NodeJS.ProcessEnv), false);
  });
});
