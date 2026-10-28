import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { voucherClosedState } from "./refund-policy.ts";

test("voucher: live stays are not marked closed", () => {
  for (const status of ["paid", "held", "confirmed", "desk_confirmed", "checked_in", "completed"]) {
    assert.equal(voucherClosedState(status, {}), null, status);
  }
});

test("voucher: a stay cancelled after the hotel confirmed says no refund", () => {
  const s = voucherClosedState("cancelled", { cancelNoRefund: true, refundAmount: 0 });
  assert.ok(s);
  assert.match(s.notice, /no refund was issued/);
  assert.match(s.notice, /Do not use this voucher at the hotel/);
  assert.match(s.refundLine ?? "", /^None/);
});

test("voucher: refunded and refund-pending stays show the refund, never a bare Paid", () => {
  const r = voucherClosedState("refunded", { refundAmount: 1234567 });
  assert.ok(r);
  assert.equal(r.refundLine, "\u20b912,34,567 to the original payment");
  assert.match(r.notice, /Cancelled and refunded/);
  assert.equal(voucherClosedState("refunded", {})?.refundLine, "Refunded to the original payment");
  const p = voucherClosedState("refund_pending", { refundAmount: 7316 });
  assert.ok(p);
  assert.equal(p.refundLine, "\u20b97,316, pending");
  assert.match(p.notice, /Do not use this voucher at the hotel/);
  const c = voucherClosedState("cancelled", {});
  assert.ok(c);
  assert.equal(c.refundLine, null);
});

test("voucher page: a closed stay hides the desk slip, pass and print, and shows the notice on top", () => {
  const src = readFileSync(new URL("../routes/voucher.$code.tsx", import.meta.url), "utf8");
  const top = src.indexOf('data-testid="voucher-closed"');
  assert.ok(top > 0 && top < src.indexOf("Hotel desk copy"), "notice is above the code");
  const slip = src.indexOf('lang="hi"');
  assert.ok(src.lastIndexOf("{closedState ? null : (", slip) > src.lastIndexOf(")}", slip), "desk slip is hidden");
  const wallet = src.indexOf("<AddToWallet booking={booking} />");
  assert.ok(src.lastIndexOf("{closedState ? null : (", wallet) > src.lastIndexOf(")}", wallet), "pass is hidden");
  assert.match(src, /\{closedState \? null : \(\s*<Button[^>]*onClick=\{\(\) => window\.print\(\)\}>\s*Print pass/, "print is hidden");
});
