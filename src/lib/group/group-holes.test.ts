import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyEngine, type EngineResult, type GroupDoc } from "./engine.ts";
import { groupPaymentFromWebhook } from "./webhook.ts";

const NOW = new Date("2026-11-10T10:00:00Z");

function ok(result: EngineResult): GroupDoc {
  assert.equal(result.ok, true, result.ok ? "" : result.error);
  return (result as { doc: GroupDoc }).doc;
}

function baseDoc(): GroupDoc {
  const doc = ok(
    applyEngine(null, "create", {
      token_hash: "h".repeat(64),
      organiser_user_id: "user-org",
      organiser_name: "Org",
      check_in: "2026-12-20",
      nights: 2,
      adults: 4,
      shortlist: [],
    }, NOW),
  );
  doc.trip.status = "voting";
  return doc;
}

function withOtp(doc: GroupDoc) {
  doc.otps.push({
    id: "otp1",
    phoneHash: "phone",
    codeHash: "right",
    expiresAt: new Date(NOW.getTime() + 10 * 60 * 1000).toISOString(),
    attempts: 0,
    sentAt: NOW.toISOString(),
    ipHash: "ip",
  });
  return doc;
}

function verify(doc: GroupDoc, codeHash: string) {
  return applyEngine(doc, "verify_member", { phone_hash: "phone", code_hash: codeHash, display_name: "Mem" }, NOW);
}

describe("group OTP guesses", () => {
  it("returns a wrong guess with the counted attempt so the store saves it", () => {
    const doc = withOtp(baseDoc());
    const result = verify(doc, "wrong");
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.error, "otp_mismatch");
    assert.equal(!result.ok && result.persist, true);
    assert.equal(!result.ok && result.doc?.otps[0]?.attempts, 1);
  });

  it("refuses the right code after five saved wrong guesses", () => {
    let doc = withOtp(baseDoc());
    for (let i = 0; i < 5; i += 1) {
      const result = verify(doc, `wrong-${i}`);
      assert.equal(result.ok, false);
      doc = (result as { doc: GroupDoc }).doc;
    }
    const last = verify(doc, "right");
    assert.equal(last.ok, false);
    assert.equal(!last.ok && last.error, "otp_limited");
  });

  it("uses a code once", () => {
    const doc = withOtp(baseDoc());
    const joined = ok(verify(doc, "right"));
    assert.equal(joined.members.length, 2);
    const again = verify(joined, "right");
    assert.equal(!again.ok && again.error, "otp_expired");
  });
});

function collectingDoc(): GroupDoc {
  const doc = baseDoc();
  doc.trip.status = "collecting";
  doc.trip.requiredInr = 2000;
  doc.trip.totalInr = 2000;
  doc.members.push({ ...doc.members[0]!, id: "m2", isOrganiser: false, displayName: "Two" });
  doc.shares = [
    { id: "s1", memberId: doc.members[0]!.id, amountInr: 1000, status: "open", razorpayLinkId: "plink_1", razorpayShortUrl: null, familyLabel: null },
    { id: "s2", memberId: "m2", amountInr: 1000, status: "open", razorpayLinkId: "plink_2", razorpayShortUrl: null, familyLabel: null },
  ];
  return doc;
}

describe("group payments", () => {
  it("refunds a second payment on a share that is already paid", () => {
    let doc = ok(applyEngine(collectingDoc(), "apply_payment", { razorpay_payment_id: "pay_1", share_id: "s1", amount_inr: 1000 }, NOW));
    doc = ok(applyEngine(doc, "apply_payment", { razorpay_payment_id: "pay_2", share_id: "s1", amount_inr: 1000 }, NOW));
    assert.equal(doc.trip.status, "collecting");
    const second = doc.payments.find((row) => row.razorpayPaymentId === "pay_2");
    assert.equal(second?.late, true);
    assert.deepEqual(
      doc.refunds.map((row) => [row.razorpayPaymentId, row.reason, row.amountInr]),
      [["pay_2", "duplicate", 1000]],
    );
  });

  it("marks a refund applied through a versioned op", () => {
    let doc = ok(applyEngine(collectingDoc(), "apply_payment", { razorpay_payment_id: "pay_9", share_id: "s9", amount_inr: 500 }, NOW));
    const refund = doc.refunds[0]!;
    const version = doc.trip.version;
    doc = ok(applyEngine(doc, "mark_refund", { refund_id: refund.id, status: "applied", expected_version: version }, NOW));
    assert.equal(doc.refunds[0]?.status, "applied");
    assert.equal(doc.trip.version, version + 1);
    const again = applyEngine(doc, "mark_refund", { refund_id: refund.id, status: "applied" }, NOW);
    assert.equal(again.ok && again.noop, true);
  });
});

describe("organiser cancel", () => {
  it("releases every room booking, also after the hotel confirmed", () => {
    const doc = collectingDoc();
    doc.trip.status = "hotel_confirmed";
    doc.bookings = [
      { roomId: "r1", confirmationCode: "TW-A", amountInr: 1000, travelers: 2, status: "desk_confirmed" },
      { roomId: "r1", confirmationCode: "TW-B", amountInr: 1000, travelers: 2, status: "desk_confirmed" },
    ];
    const next = ok(applyEngine(doc, "cancel", { organiser_user_id: "user-org" }, NOW));
    assert.equal(next.trip.status, "cancelled");
    assert.deepEqual(next.bookings.map((row) => row.status), ["cancelled", "cancelled"]);
  });
});

describe("group webhook events", () => {
  const notes = { kind: "group_share", gt: "trip-1", gs: "s1", gm: "m1", v: "1" };
  const payment = (status: string) => ({ entity: { id: "pay_X", amount: 100000, method: "upi", status, notes } });

  it("applies a captured link payment", () => {
    const paid = groupPaymentFromWebhook("payment_link.paid", { payment_link: { entity: { notes } }, payment: payment("captured") });
    assert.deepEqual(paid, { tripId: "trip-1", shareId: "s1", memberId: "m1", paymentId: "pay_X", amountInr: 1000, method: "upi" });
    assert.ok(groupPaymentFromWebhook("payment.captured", { payment: payment("captured") }));
  });

  it("ignores failed and authorized-only payments that carry share notes", () => {
    assert.equal(groupPaymentFromWebhook("payment.failed", { payment: payment("failed") }), null);
    assert.equal(groupPaymentFromWebhook("payment.authorized", { payment: payment("authorized") }), null);
    assert.equal(groupPaymentFromWebhook("payment.captured", { payment: payment("failed") }), null);
    assert.equal(groupPaymentFromWebhook("payment_link.expired", { payment_link: { entity: { notes } } }), null);
  });
});
