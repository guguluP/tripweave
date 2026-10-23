import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  MISMATCH_MESSAGE,
  MISMATCH_REFUND,
  decideMismatchRefund,
  isMismatchRefundJob,
  refundQueuedMessage,
} from "./mismatch-refund.ts";

const captured = { status: "captured", amountPaise: 1_250_000, amountRefundedPaise: 0 };
const base = {
  userId: "user_a",
  paymentId: "pay_abc",
  notesUserId: "user_a",
  bookedAlready: false,
  prior: null,
  payment: captured,
};

test("own captured payment on a mismatched order is refunded in full", () => {
  assert.deepEqual(decideMismatchRefund(base), { action: "refund", amountInr: 12_500 });
});

test("partly refunded payment only sends back what is left", () => {
  const d = decideMismatchRefund({ ...base, payment: { ...captured, amountRefundedPaise: 250_000 } });
  assert.deepEqual(d, { action: "refund", amountInr: 10_000 });
});

test("another guest's order or missing notes is never refunded", () => {
  assert.equal(decideMismatchRefund({ ...base, notesUserId: "user_b" }).action, "refuse");
  assert.equal(decideMismatchRefund({ ...base, notesUserId: undefined }).action, "refuse");
  assert.deepEqual(decideMismatchRefund({ ...base, notesUserId: "user_b" }), {
    action: "refuse",
    message: MISMATCH_MESSAGE,
  });
});

test("a replayed payment that already has a stay is refused, not refunded or rebooked", () => {
  const d = decideMismatchRefund({ ...base, bookedAlready: true });
  assert.equal(d.action, "refuse");
  const done = decideMismatchRefund({ ...base, prior: { state: "done" } });
  assert.equal(done.action, "refuse");
});

test("a payment being booked by the webhook is not refunded under it", () => {
  const d = decideMismatchRefund({ ...base, prior: { state: "queued", lastError: "verify_failed" } });
  assert.equal(d.action, "refuse");
});

test("replay after the refund was sent does not refund twice", () => {
  const d = decideMismatchRefund({ ...base, prior: { state: "refunded", lastError: MISMATCH_REFUND } });
  assert.equal(d.action, "already_refunded");
  const empty = decideMismatchRefund({ ...base, payment: { ...captured, amountRefundedPaise: 1_250_000 } });
  assert.equal(empty.action, "already_refunded");
});

test("queued refund job is retried, gateway outage queues instead of erroring", () => {
  const prior = { state: "queued", lastError: MISMATCH_REFUND };
  assert.deepEqual(decideMismatchRefund({ ...base, prior }), { action: "refund", amountInr: 12_500 });
  assert.deepEqual(decideMismatchRefund({ ...base, payment: null }), {
    action: "retry",
    message: refundQueuedMessage("pay_abc"),
  });
});

test("uncaptured or non-Razorpay payments are refused", () => {
  assert.equal(decideMismatchRefund({ ...base, payment: { ...captured, status: "authorized" } }).action, "refuse");
  assert.equal(decideMismatchRefund({ ...base, paymentId: "sandbox_1" }).action, "refuse");
});

test("isMismatchRefundJob only matches refund-only jobs", () => {
  assert.equal(isMismatchRefundJob({ state: "queued", lastError: MISMATCH_REFUND }), true);
  assert.equal(isMismatchRefundJob({ state: "queued", lastError: "verify_failed" }), false);
  assert.equal(isMismatchRefundJob(null), false);
});

test("bookings.ts wires the refund into the cold path and never books a refund job", () => {
  const src = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
  const cold = src.slice(src.indexOf("const remote = await fetchRazorpayOrder"), src.indexOf("consumeOrder(data.razorpayOrderId"));
  assert.ok(!cold.includes("Start checkout again."), "cold path must not keep the charge with a bare error");
  assert.match(cold, /return mismatchRefund\(\);/);
  assert.match(cold, /const refunded = await mismatchRefund\(\);/);
  const run = src.slice(src.indexOf("async function runReconcileJob"), src.indexOf("async function runReconcileJob") + 400);
  assert.match(run, /isMismatchRefundJob\(job\)\) return null/);
  const queue = src.slice(src.indexOf("async function queueCaptureReconcile"), src.indexOf("async function queueCaptureReconcile") + 500);
  assert.match(queue, /isMismatchRefundJob\(earlier\)/);
  assert.match(src, /if \(isMismatchRefundJob\(job\)\) \{\s*await sendMismatchRefund\(job\);/);
});
