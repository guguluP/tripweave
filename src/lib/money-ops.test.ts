import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  memoryFindByPaymentRef,
  memoryInsertBooking,
  memoryBookingsFor,
} from "./booking-memory.ts";
import { writeMeta } from "./booking-meta.ts";
import { buildGstInvoicePdf, invoiceSeller, invoiceLines } from "./server/gst-invoice.ts";
import { unauthorizedCron } from "./server/cron-auth.ts";
import type { BookingRow } from "./server/bookings.ts";

function paid(userId: string, code: string, paymentRef: string, orderId?: string): Omit<BookingRow, "id" | "createdAt"> {
  return {
    userId,
    packageId: "taj-puri-resort-spa",
    packageName: "Taj",
    nights: 2,
    travelers: 2,
    checkIn: "2026-10-12",
    amountInr: 11200,
    swaps: writeMeta({}, { roomId: "superior", razorpayOrderId: orderId, invoiceReady: true }),
    status: "paid",
    cardLast4: "4242",
    cardBrand: "Razorpay",
    payerName: "Guest",
    confirmationCode: code,
    paymentMethod: "razorpay",
    paymentRef,
    upiHandle: null,
    bankName: null,
  };
}

describe("money ops idempotency", () => {
  it("does not create a second TW- booking for the same payment_ref", () => {
    const first = memoryInsertBooking(paid("user-money-a", "TW-IDEM01", "pay_idem_1", "order_idem_1"));
    const second = memoryInsertBooking(paid("user-money-a", "TW-IDEM99", "pay_idem_1", "order_idem_1"));
    assert.equal(first.id, second.id);
    assert.equal(first.confirmationCode, "TW-IDEM01");
    assert.equal(memoryBookingsFor("user-money-a").filter((b) => b.paymentRef === "pay_idem_1").length, 1);
    assert.equal(memoryFindByPaymentRef("pay_idem_1")?.confirmationCode, "TW-IDEM01");
  });

  it("does not create a second booking for the same razorpay order id", () => {
    const first = memoryInsertBooking(paid("user-money-b", "TW-ORD001", "pay_ord_1", "order_shared"));
    const second = memoryInsertBooking(paid("user-money-b", "TW-ORD002", "pay_ord_2", "order_shared"));
    assert.equal(first.confirmationCode, second.confirmationCode);
  });
});

describe("GST invoice PDF", () => {
  it("builds a PDF without inventing a GSTIN when unset", () => {
    const prev = {
      name: process.env.TW_LEGAL_NAME,
      gstin: process.env.TW_GSTIN,
      rate: process.env.TW_GST_RATE,
    };
    delete process.env.TW_GSTIN;
    process.env.TW_LEGAL_NAME = "TripWeave Test Seller";
    process.env.TW_GST_RATE = "12";
    try {
      const seller = invoiceSeller();
      assert.equal(seller.gstinConfigured, false);
      assert.equal(seller.gstin, null);
      const booking = {
        ...paid("user-inv", "TW-INV001", "pay_inv_1"),
        id: 1,
        createdAt: new Date().toISOString(),
      };
      const lines = invoiceLines(booking);
      assert.equal(lines.totalInr, 11200);
      assert.equal(lines.taxableInr + lines.gstInr, 11200);
      const pdf = buildGstInvoicePdf(booking);
      const asText = Buffer.from(pdf).toString("latin1");
      assert.ok(asText.startsWith("%PDF-1.4"));
      assert.ok(asText.includes("not configured"));
      assert.ok(!asText.includes("FAKEGSTIN"));
    } finally {
      if (prev.name === undefined) delete process.env.TW_LEGAL_NAME;
      else process.env.TW_LEGAL_NAME = prev.name;
      if (prev.gstin === undefined) delete process.env.TW_GSTIN;
      else process.env.TW_GSTIN = prev.gstin;
      if (prev.rate === undefined) delete process.env.TW_GST_RATE;
      else process.env.TW_GST_RATE = prev.rate;
    }
  });
});

describe("cron auth", () => {
  it("rejects production requests without CRON_SECRET", () => {
    const prev = { secret: process.env.CRON_SECRET, vercel: process.env.VERCEL };
    delete process.env.CRON_SECRET;
    process.env.VERCEL = "1";
    try {
      const denied = unauthorizedCron(new Request("https://example.com/api/cron/refund-retry"));
      assert.ok(denied);
      assert.equal(denied!.status, 401);
    } finally {
      if (prev.secret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prev.secret;
      if (prev.vercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prev.vercel;
    }
  });

  it("accepts Bearer CRON_SECRET", () => {
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-cron-secret";
    try {
      const ok = unauthorizedCron(
        new Request("https://example.com/api/cron/refund-retry", {
          headers: { authorization: "Bearer test-cron-secret" },
        }),
      );
      assert.equal(ok, null);
      const bad = unauthorizedCron(
        new Request("https://example.com/api/cron/refund-retry", {
          headers: { authorization: "Bearer wrong" },
        }),
      );
      assert.equal(bad?.status, 401);
    } finally {
      if (prev === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prev;
    }
  });
});
