import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";

// This-process store only (no Supabase, DATABASE_URL marked dead), so the claim rule runs in memory.
process.env.SUPABASE_DISABLED = "1";
process.env.DATABASE_URL = "postgresql://test@127.0.0.1:1/none";
(globalThis as { __twDurableDbFailed__?: boolean }).__twDurableDbFailed__ = true;
register("../../../scripts/test-alias-hooks.mjs", import.meta.url);

const { claimReconcileJob } = await import("./payment-ops.ts");
const { listReconcileJobs } = await import("../booking-memory.ts");
const { MISMATCH_REFUND } = await import("./mismatch-refund.ts");

function job(paymentId: string, kind: "booking" | "refund", state = "queued") {
  const now = new Date().toISOString();
  return {
    id: `rec_${paymentId}`,
    userId: "claim-user",
    paymentId,
    orderId: null,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    state: state as "queued",
    lastError: kind === "refund" ? MISMATCH_REFUND : undefined,
    payloadJson: kind === "refund" ? '{"refundOnly":true}' : '{"packageId":"x"}',
  };
}

test("first claim wins; a refund marker cannot overwrite a booking job", async () => {
  assert.equal((await claimReconcileJob(job("pay_c1", "booking"), listReconcileJobs)).status, "won");
  const lost = await claimReconcileJob(job("pay_c1", "refund"), listReconcileJobs);
  assert.equal(lost.status, "lost");
  assert.equal(lost.status === "lost" && lost.existing.lastError, undefined);
  assert.equal(listReconcileJobs().find((row) => row.id === "rec_pay_c1")?.lastError, undefined);
});

test("a booking job cannot overwrite a refund marker", async () => {
  assert.equal((await claimReconcileJob(job("pay_c2", "refund"), listReconcileJobs)).status, "won");
  const lost = await claimReconcileJob(job("pay_c2", "booking"), listReconcileJobs);
  assert.equal(lost.status === "lost" && lost.existing.lastError, MISMATCH_REFUND);
});

test("a refund marker may replace a booking job that failed for good", async () => {
  assert.equal((await claimReconcileJob(job("pay_c3", "booking", "failed"), listReconcileJobs)).status, "won");
  assert.equal((await claimReconcileJob(job("pay_c3", "refund"), listReconcileJobs)).status, "won");
  const row = listReconcileJobs().find((item) => item.id === "rec_pay_c3");
  assert.equal(row?.lastError, MISMATCH_REFUND);
  assert.equal(row?.state, "queued");
});
