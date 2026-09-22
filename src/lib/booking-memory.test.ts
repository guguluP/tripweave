import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  memoryBookingsFor,
  memoryInsertBooking,
  mergeRefundIntents,
  putRefundIntent,
  refundIntentFor,
} from "./booking-memory.ts";
import type { RefundIntent } from "./booking-memory.ts";
import type { BookingRow } from "./server/bookings.ts";

function row(userId: string, code: string): Omit<BookingRow, "id" | "createdAt"> {
  return {
    userId,
    packageId: "taj-puri-resort-spa",
    packageName: "Taj",
    nights: 1,
    travelers: 2,
    checkIn: "2026-08-12",
    amountInr: 1000,
    swaps: {},
    status: "paid",
    cardLast4: "4242",
    cardBrand: "Visa",
    payerName: userId,
    confirmationCode: code,
    paymentMethod: "razorpay",
    paymentRef: `pay_${code}`,
    upiHandle: null,
    bankName: null,
  };
}

describe("booking memory isolation", () => {
  it("keeps each user in their own bucket", () => {
    memoryInsertBooking(row("user-a", "TW-AAAAAA"));
    memoryInsertBooking(row("user-b", "TW-BBBBBB"));
    const a = memoryBookingsFor("user-a");
    const b = memoryBookingsFor("user-b");
    assert.equal(a.length, 1);
    assert.equal(b.length, 1);
    assert.equal(a[0]!.confirmationCode, "TW-AAAAAA");
    assert.equal(b[0]!.payerName, "user-b");
    assert.ok(!a.some((booking) => booking.userId === "user-b"));
  });

  it("keeps a newer refund intent when an older database row arrives", () => {
    const base: RefundIntent = {
      id: "refund_user-c_1",
      userId: "user-c",
      bookingId: 1,
      paymentRef: "pay_c",
      amountInr: 500,
      status: "gateway_done",
      createdAt: "2026-09-22T10:00:00.000Z",
      updatedAt: "2026-09-22T12:00:00.000Z",
    };
    putRefundIntent(base);
    mergeRefundIntents([{ ...base, status: "pending", updatedAt: "2026-09-22T11:00:00.000Z" }]);
    assert.equal(refundIntentFor("user-c", 1)?.status, "gateway_done");
    mergeRefundIntents([{ ...base, status: "applied", updatedAt: "2026-09-22T13:00:00.000Z" }]);
    assert.equal(refundIntentFor("user-c", 1)?.status, "applied");
  });
});
