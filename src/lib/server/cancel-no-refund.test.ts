import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  NO_REFUND_CANCEL_WARNING,
  NO_REFUND_CANCEL_WARNING_CHECKED_IN,
  guestCancelMode,
} from "../refund-policy.ts";
import { stayFactLines } from "../arrival-ask.ts";

test("guest cancel mode: unconfirmed stays refund, hotel-confirmed and checked-in stays cancel with no refund", () => {
  for (const status of ["paid", "held", "confirmed", "refund_pending"]) assert.equal(guestCancelMode(status), "refund", status);
  assert.equal(guestCancelMode("desk_confirmed"), "no_refund");
  assert.equal(guestCancelMode("checked_in"), "no_refund");
  for (const status of ["completed", "cancelled", "refunded", "failed", "pending", "", null, undefined]) {
    assert.equal(guestCancelMode(status), null, String(status));
  }
  assert.match(NO_REFUND_CANCEL_WARNING, /no refund will be issued/);
  assert.match(NO_REFUND_CANCEL_WARNING_CHECKED_IN, /checked in.*no refund will be issued/);
});

test("Ask facts: a hotel-confirmed stay gets no refund quote, a cancelled stay says cancelled", () => {
  const base = { nationalities: ["IN"], packageId: "taj-puri-resort-spa", checkIn: "2099-06-15", amountInr: 10000 };
  const confirmed = stayFactLines({ ...base, status: "desk_confirmed" }).join("\n");
  assert.doesNotMatch(confirmed, /refund if cancelled now/);
  assert.doesNotMatch(confirmed, /Full refund/);
  assert.match(confirmed, /no refund is issued/);
  const checkedIn = stayFactLines({ ...base, status: "checked_in" }).join("\n");
  assert.doesNotMatch(checkedIn, /refund if cancelled now/);
  assert.match(checkedIn, /no refund is issued/);
  const cancelled = stayFactLines({ ...base, status: "cancelled" }).join("\n");
  assert.match(cancelled, /this stay is cancelled/);
  assert.doesNotMatch(cancelled, /refund if cancelled now/);
  const paid = stayFactLines({ ...base, status: "paid" }).join("\n");
  assert.match(paid, /refund if cancelled now: ₹10000/);
  // Before a booking exists there is no status: the policy is still quoted.
  assert.match(stayFactLines({ nationalities: ["IN"], packageId: base.packageId, checkIn: base.checkIn }).join("\n"), /Full refund/);
});

test("no-refund cancel write matches only a desk_confirmed or checked_in row, so two at once change it once", async () => {
  const db = new PGlite();
  await db.exec(`create table bookings (id int primary key, user_id text, status text, swaps text not null default '{}')`);
  await db.query(`insert into bookings values (1, 'u1', 'desk_confirmed', '{}'), (2, 'u1', 'checked_in', '{}')`);
  const cancel = (id: number, user = "u1") =>
    db.query(
      `update bookings set status = 'cancelled', swaps = '{"x":"1"}'
         where id = $1 and user_id = $2 and status in ('desk_confirmed', 'checked_in') returning id`,
      [id, user],
    );
  const [a, b] = await Promise.all([cancel(1), cancel(1)]);
  assert.equal(a.rows.length + b.rows.length, 1);
  const [c, d] = await Promise.all([cancel(2), cancel(2)]);
  assert.equal(c.rows.length + d.rows.length, 1, "checked-in stay is cancelled once");
  await db.query(`insert into bookings values (4, 'u1', 'completed', '{}'), (5, 'u1', 'paid', '{}')`);
  assert.equal((await cancel(4)).rows.length, 0, "completed stay is not cancelled");
  assert.equal((await cancel(5)).rows.length, 0, "paid stay never takes the no-refund write");
  await db.query(`insert into bookings values (3, 'u2', 'desk_confirmed', '{}')`);
  assert.equal((await cancel(3, "u1")).rows.length, 0, "another guest's stay is not cancelled");
  await db.close();
});

const bookings = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
const cancelSrc = bookings.slice(bookings.indexOf("export const cancelBooking = "), bookings.indexOf("export { methodLabel }"));
const noRefundSrc = bookings.slice(
  bookings.indexOf("async function cancelConfirmedNoRefund("),
  bookings.indexOf("export type CancelResult"),
);

test("cancelBooking: the no-refund branch needs explicit consent and never reaches the gateway", () => {
  const branch = cancelSrc.indexOf('if (mode === "no_refund")');
  assert.ok(branch > 0);
  assert.ok(branch < cancelSrc.indexOf("refundPolicyFor(target.checkIn)"), "before the time-based policy");
  assert.ok(branch < cancelSrc.indexOf("persistRefundIntent("), "before any refund intent");
  assert.ok(branch < cancelSrc.indexOf("refundRazorpayPayment(ref, amount)"), "before the gateway");
  assert.match(cancelSrc, /if \(!acceptNoRefund\) return \{ ok: false, message: NO_REFUND_CANCEL_NEEDS_CONFIRM \}/);
  assert.ok(noRefundSrc.length > 0);
  assert.doesNotMatch(noRefundSrc, /razorpay|persistRefundIntent/i);
  assert.match(noRefundSrc, /status in \('desk_confirmed', 'checked_in'\)/);
  assert.match(noRefundSrc, /refundAmount: 0/);
  assert.match(noRefundSrc, /cancelNoRefund: true/);
});

const trips = readFileSync(new URL("../../routes/trips.tsx", import.meta.url), "utf8");
const voucher = readFileSync(new URL("../../routes/voucher.$code.tsx", import.meta.url), "utf8");

test("My trips: hotel-confirmed stays get 'Cancel (no refund)' and a warning step before the cancel", () => {
  assert.match(trips, /Cancel \(no refund\)/);
  const warn = trips.indexOf("NO_REFUND_CANCEL_WARNING_CHECKED_IN : NO_REFUND_CANCEL_WARNING}");
  const send = trips.indexOf("acceptNoRefund: true");
  assert.ok(warn > 0 && send > warn, "the no-refund cancel is sent only from the warning box");
  assert.match(trips, /Yes, cancel without refund/);
  assert.match(trips, /"Checked in" : "Hotel confirmed"\}: you can still cancel, but no refund is issued\./);
  assert.match(trips, /Keep my stay/);
  assert.match(trips, /No refund was issued/);
  assert.match(voucher, /voucherClosedState\(booking.status, meta\)/);
});
