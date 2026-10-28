import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { readMeta, writeMeta } from "../booking-meta.ts";
import { CANCEL_CLAIM_TTL_MS, claimedSwaps, hasFreshCancelClaim, owedRefundInr } from "./cancel-claim.ts";

const NOW = Date.parse("2026-10-28T05:00:00.000Z");

test("a new claim is fresh, an old one has expired, a missing or bad one is no claim", () => {
  const claimed = claimedSwaps({ travel: "{}" }, NOW);
  assert.equal(readMeta(claimed).cancelClaimAt, new Date(NOW).toISOString());
  assert.equal(claimed.travel, "{}");
  assert.equal(hasFreshCancelClaim(claimed, NOW + 1000), true);
  assert.equal(hasFreshCancelClaim(claimed, NOW + CANCEL_CLAIM_TTL_MS + 1), false);
  assert.equal(hasFreshCancelClaim({}, NOW), false);
  assert.equal(hasFreshCancelClaim(null, NOW), false);
  assert.equal(hasFreshCancelClaim(writeMeta({}, { cancelClaimAt: "not a date" }), NOW), false);
});

test("the finished cancel clears the claim from meta", () => {
  const claimed = claimedSwaps(writeMeta({}, { roomId: "r1" }), NOW);
  const done = writeMeta(claimed, { refundId: "rfnd_1", cancelClaimAt: undefined });
  assert.equal(readMeta(done).cancelClaimAt, undefined);
  assert.equal(readMeta(done).roomId, "r1");
  assert.equal(hasFreshCancelClaim(done, NOW), false);
});

test("compare-and-swap claim: two servers on one database, only one may refund", async () => {
  const db = new PGlite();
  await db.exec(`create table bookings (id int primary key, user_id text, status text, swaps text not null default '{}')`);
  await db.query(`insert into bookings values (1, 'u1', 'paid', $1)`, [JSON.stringify(writeMeta({}, { roomId: "r1" }))]);
  // Both servers read the same row before either writes.
  const read = (await db.query<{ swaps: string }>(`select swaps from bookings where id = 1`)).rows[0].swaps;
  const claim = (fromText: string) =>
    db.query(
      `update bookings set swaps = $1 where id = 1 and user_id = 'u1'
         and status in ('paid', 'held', 'confirmed', 'refund_pending') and swaps = $2 returning id`,
      [JSON.stringify(claimedSwaps(JSON.parse(fromText), NOW)), fromText],
    );
  const [a, b] = await Promise.all([claim(read), claim(read)]);
  assert.equal(a.rows.length + b.rows.length, 1, "exactly one claim wins");
  // A third request that reads after the claim sees a fresh claim and stops before the gateway.
  const after = (await db.query<{ swaps: string }>(`select swaps from bookings where id = 1`)).rows[0].swaps;
  assert.equal(hasFreshCancelClaim(JSON.parse(after), NOW + 5000), true);
  await db.close();
});

const bookings = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
const cancelSrc = bookings.slice(
  bookings.indexOf("export const cancelBooking = "),
  bookings.indexOf("export { methodLabel }"),
);

test("cancelBooking claims the stay in SQL before any refund and gives the claim back on failure", () => {
  const claimAt = cancelSrc.indexOf("and swaps = ${fromText}");
  assert.ok(claimAt > 0, "claim uses compare-and-swap on the stored swaps");
  assert.ok(claimAt < cancelSrc.indexOf("refundRazorpayPayment(ref, amount)"), "claim comes before the refund");
  assert.ok(claimAt < cancelSrc.indexOf("persistRefundIntent("), "claim comes before the refund intent");
  assert.match(cancelSrc, /if \(!refunded\.ok\) return giveUp\(/);
  assert.match(cancelSrc, /cancelClaimAt: undefined/);
});

test("owedRefundInr: a refund_pending stay finishes the amount already owed", () => {
  assert.equal(owedRefundInr("refund_pending", { status: "pending", amountInr: 7316 }), 7316);
  assert.equal(owedRefundInr("refund_pending", { status: "gateway_done", amountInr: 7316 }), 7316);
  assert.equal(owedRefundInr("refund_pending", { status: "applied", amountInr: 7316 }), null);
  assert.equal(owedRefundInr("refund_pending", null), null);
  assert.equal(owedRefundInr("refund_pending", { status: "pending", amountInr: 0 }), null);
  assert.equal(owedRefundInr("paid", { status: "pending", amountInr: 7316 }), null, "an open stay uses today's policy");
});

test("guest cancel prices a refund_pending stay from its open intent, before the 48-hour policy", () => {
  const bookings = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
  const cancel = bookings.slice(bookings.indexOf("const owedInr = owedRefundInr(target.status, prior)"));
  assert.ok(cancel.length > 0);
  assert.match(cancel, /const amount = owedInr \?\? refundAmountInr\(target\.amountInr, target\.checkIn\);/);
  assert.match(cancel, /if \(owedInr == null && policy\.fraction <= 0\)/);
});
