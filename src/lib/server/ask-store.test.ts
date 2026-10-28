import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { describe, it } from "node:test";

// Memory backend: no Supabase, and a DATABASE_URL marked dead so nothing connects.
process.env.SUPABASE_DISABLED = "1";
process.env.DATABASE_URL = "postgresql://test@127.0.0.1:1/none";
(globalThis as { __twDurableDbFailed__?: boolean }).__twDurableDbFailed__ = true;
register("../../../scripts/test-alias-hooks.mjs", import.meta.url);

const store = await import("./ask-store.ts");
const { REDACTED_QUESTION } = await import("../arrival-ask.ts");

describe("ask store (memory)", () => {
  it("uses memory when no durable store is set", () => {
    assert.equal(store.askStoreBackend(), "memory");
  });

  it("caps typed asks at 10 an hour and keeps suggestion taps separate", async () => {
    for (let i = 0; i < 10; i += 1) assert.equal(await store.takeAskSlot("cap-user", "typed"), "ok");
    assert.equal(await store.takeAskSlot("cap-user", "typed"), "limited");
    assert.equal(await store.takeAskSlot("cap-user", "suggest"), "ok");
  });

  it("caps airport-car requests at 3 per booking per day", async () => {
    for (let i = 0; i < 3; i += 1) assert.equal(await store.takeAskSlot("car-user", "car", "TW-AAA"), "ok");
    assert.equal(await store.takeAskSlot("car-user", "car", "TW-AAA"), "limited");
    assert.equal(await store.takeAskSlot("car-user", "car", "TW-BBB"), "ok");
    assert.equal(store.ASK_SLOT_LIMITS.car.limit, 3);
    assert.equal(store.ASK_SLOT_LIMITS.car.windowMs, 24 * 60 * 60_000);
  });

  it("never stores a document-like question, only the placeholder", async () => {
    assert.equal(store.storableQuestion("my passport is K12A34B56C78"), REDACTED_QUESTION);
    assert.equal(store.storableQuestion("Is breakfast on 2027-06-15 included?"), "Is breakfast on 2027-06-15 included?");
    await store.appendAskTurn("doc-user", "TW-DOC", "passport K12A34B56C78 ok?", "Leave out passport and visa numbers.");
    const turns = await store.listAskTurns("doc-user", "TW-DOC");
    assert.equal(turns.length, 1);
    assert.equal(turns[0].question, REDACTED_QUESTION);
    assert.equal(JSON.stringify(turns).includes("K12A34B56C78"), false);
  });

  it("keeps the last 20 turns and scopes them per user and code", async () => {
    for (let i = 0; i < 25; i += 1) await store.appendAskTurn("n-user", "TW-N", `question ${i}`, `answer ${i}`);
    const turns = await store.listAskTurns("n-user", "TW-N");
    assert.equal(turns.length, 20);
    assert.equal(turns[19].question, "question 24");
    assert.deepEqual(await store.listAskTurns("other-user", "TW-N"), []);
  });

  it("expires memory turns after 90 days", async () => {
    await store.appendAskTurn("old-user", "TW-OLD", "Is breakfast included?", "TripWeave: ...");
    assert.equal((await store.listAskTurns("old-user", "TW-OLD")).length, 1);
    store.pruneMemoryTurns(Date.now() + store.TURN_TTL_MS + 1000);
    assert.deepEqual(await store.listAskTurns("old-user", "TW-OLD"), []);
  });

  it("forgets one booking thread, or every thread for a deleted account", async () => {
    await store.appendAskTurn("f-user", "TW-1", "Is breakfast included?", "a");
    await store.appendAskTurn("f-user", "TW-2", "Is breakfast included?", "b");
    await store.forgetAskThread("f-user", "TW-1");
    assert.deepEqual(await store.listAskTurns("f-user", "TW-1"), []);
    assert.equal((await store.listAskTurns("f-user", "TW-2")).length, 1);
    await store.forgetAskUser("f-user");
    assert.deepEqual(await store.listAskTurns("f-user", "TW-2"), []);
  });
});

describe("ask store (durable)", () => {
  const src = readFileSync(new URL("./ask-store.ts", import.meta.url), "utf8");
  it("fails closed when Supabase or local Postgres errors", () => {
    const take = src.slice(src.indexOf("export async function takeAskSlot"), src.indexOf("export async function listAskTurns"));
    assert.match(take, /return "error";/);
    assert.equal(/takeQuota[\s\S]*catch/.test(take.slice(0, take.indexOf("catch"))), false, "no memory fallback inside the durable branch");
  });
  it("calls tw_ask(p_op, p_payload) with no p_gate", () => {
    assert.match(src, /rpc\("tw_ask", \{ p_op: op, p_payload: payload \}\)/);
    assert.equal(src.includes("p_gate"), false);
    assert.match(src, /select tw_ask\(\$1, \$2::jsonb\)/);
  });
});

describe("ask store (Supabase down)", () => {
  it("denies the ask and returns no thread instead of using memory", async () => {
    delete process.env.SUPABASE_DISABLED;
    process.env.SUPABASE_URL = "http://127.0.0.1:9";
    process.env.SUPABASE_ANON_KEY = "test-anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJ.test-only.not-a-key";
    const logged = console.error;
    console.error = () => undefined;
    try {
      assert.equal(store.askStoreBackend(), "supabase");
      assert.equal(await store.takeAskSlot("down-user", "typed"), "error");
      assert.equal(await store.takeAskSlot("down-user", "car", "TW-DOWN"), "error");
      assert.deepEqual(await store.listAskTurns("doc-user", "TW-DOC"), []);
      assert.equal(await store.appendAskTurn("down-user", "TW-DOWN", "Is breakfast included?", "a"), false);
    } finally {
      console.error = logged;
      process.env.SUPABASE_DISABLED = "1";
    }
  });
});
