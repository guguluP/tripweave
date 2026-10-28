import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { isActiveStayStatus, isCancellableStatus } from "./refund-policy.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("refund line only for cancellable stays (D6)", () => {
  it("knows which statuses can still be cancelled", () => {
    for (const status of ["paid", "held", "confirmed"]) assert.equal(isCancellableStatus(status), true);
    for (const status of ["cancelled", "refunded", "desk_confirmed"]) assert.equal(isCancellableStatus(status), false);
  });
  it("gates the panel and the trips page on isCancellableStatus", () => {
    const panel = read("../components/ask-tripweave.tsx");
    assert.match(panel, /const quoteRefund = !booked \|\| \(isCancellableStatus\(status\) && !refundPending\);/);
    assert.match(panel, /const refund = !quoteRefund/);
    const trips = read("../routes/trips.tsx");
    assert.match(trips, /isCancellableStatus\(b\.status\) \? \(/);
    assert.match(trips, /status=\{b\.status\}/);
    assert.match(read("../routes/voucher.$code.tsx"), /status=\{booking\.status\}/);
  });
});

describe("airport car button (D5)", () => {
  it("is offered only for active stays", () => {
    for (const status of ["paid", "held", "confirmed", "desk_confirmed"]) assert.equal(isActiveStayStatus(status), true);
    for (const status of ["cancelled", "refunded", "refund_pending", undefined]) {
      assert.equal(isActiveStayStatus(status), false);
    }
    assert.match(read("../components/ask-tripweave.tsx"), /booked \? isActiveStayStatus\(status\)/);
  });
  it("checks ownership, status and the daily cap, and reports a failed desk email", () => {
    const action = read("./server/ask-actions.ts");
    const order = [
      "findOwnBookingRowByCode(context.userId",
      "isActiveStayStatus(booking.status)",
      'takeAskSlot(context.userId, "car"',
      "sendBookingMail(",
      "if (!sent)",
      "await saveSwaps(",
    ].map((needle) => action.indexOf(needle));
    for (const at of order) assert.ok(at > 0);
    assert.deepEqual([...order].sort((a, b) => a - b), order);
    assert.match(action, /Could not email the hotel desk/);
  });
});

describe("stream abort (D10)", () => {
  it("aborts an in-flight ask on unmount and ignores AbortError", () => {
    const panel = read("../components/ask-tripweave.tsx");
    assert.match(panel, /useEffect\(\(\) => \(\) => inflight\.current\?\.abort\(\), \[\]\);/);
    assert.match(panel, /err\.name === "AbortError"\)\) return;/);
    assert.equal(/history/.test(panel), false);
  });
});

describe("ask store SQL (D4, D7, D12, D13)", () => {
  for (const file of ["../../supabase/ask_turns.sql", "../../migrations/0014_ask_store.sql"]) {
    const sql = read(file);
    it(`${file}: atomic cap, 90-day expiry, forget triggers, no p_gate`, () => {
      assert.match(sql, /pg_advisory_xact_lock\(hashtext\('tw_ask:' \|\| uid \|\| ':' \|\| v_bucket\)\)/);
      assert.match(sql, /interval '90 days'/);
      assert.match(sql, /create trigger tw_ask_forget_booking/);
      assert.match(sql, /create trigger tw_ask_forget_user/);
      assert.match(sql, /'cancelled', 'refunded'/);
      assert.match(sql, /security definer/);
      assert.equal(/p_gate\s+text/.test(sql), false);
    });
  }
  it("the app calls tw_ask with only p_op and p_payload", () => {
    const store = read("./server/ask-store.ts");
    assert.match(store, /rpc\("tw_ask", \{ p_op: op, p_payload: payload \}\)/);
    assert.equal(store.includes("p_gate"), false);
  });
});

describe("account subject preview (C9)", () => {
  it("compares e-mails with lower(btrim())", () => {
    const sql = read("../../supabase/account_subject.sql");
    const preview = sql.slice(sql.indexOf("-- where lower(btrim"));
    assert.match(preview, /tw_booking_account_email\(b\.swaps\) = lower\(btrim\(s\.email\)\)/);
    assert.equal(/= s\.email\b/.test(sql), false);
  });
});

describe("node version (C10)", () => {
  it("pins Node 22.18 or newer", () => {
    const pkg = JSON.parse(read("../../package.json")) as { engines?: { node?: string } };
    assert.equal(pkg.engines?.node, ">=22.18");
    assert.equal(read("../../.nvmrc").trim(), "22.18");
  });
});
