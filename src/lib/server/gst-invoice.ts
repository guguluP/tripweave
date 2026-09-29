import { deskFor } from "../hotel-desk.ts";
import { readMeta } from "../booking-meta.ts";
import type { BookingRow } from "@/lib/server/bookings";

export type InvoiceSeller = {
  legalName: string;
  gstin: string | null;
  address: string;
  gstinConfigured: boolean;
};

export type InvoiceLines = {
  description: string;
  nights: number;
  taxableInr: number;
  gstInr: number;
  gstRatePct: number;
  totalInr: number;
  gstAssumedInclusive: boolean;
};

/** Seller identity for TripWeave invoices. Never invent a GSTIN. */
export function invoiceSeller(): InvoiceSeller {
  const legalName =
    process.env.TW_LEGAL_NAME?.trim() || "TripWeave Hospitality (GSTIN not configured)";
  const gstin = process.env.TW_GSTIN?.trim() || null;
  const address =
    process.env.TW_SELLER_ADDRESS?.trim() ||
    "TripWeave — seller address not set (TW_SELLER_ADDRESS)";
  return {
    legalName,
    gstin,
    address,
    gstinConfigured: Boolean(gstin),
  };
}

/**
 * Split total paid into taxable + GST when TW_GST_RATE is set (e.g. 12).
 * Otherwise the full amount is shown as the total with GST not itemised.
 */
export function invoiceLines(booking: BookingRow): InvoiceLines {
  const rateRaw = Number(process.env.TW_GST_RATE?.trim() || "");
  const gstRatePct = Number.isFinite(rateRaw) && rateRaw > 0 && rateRaw < 50 ? rateRaw : 0;
  const totalInr = Math.max(0, Math.round(booking.amountInr));
  const meta = readMeta(booking.swaps);
  const roomHint = meta.roomId ? ` · room ${meta.roomId}` : "";
  const description = `Hotel stay — ${booking.packageName}${roomHint} · check-in ${booking.checkIn} · ${booking.nights} night${booking.nights === 1 ? "" : "s"} · ${booking.travelers} guest${booking.travelers === 1 ? "" : "s"}`;

  if (!gstRatePct) {
    return {
      description,
      nights: booking.nights,
      taxableInr: totalInr,
      gstInr: 0,
      gstRatePct: 0,
      totalInr,
      gstAssumedInclusive: false,
    };
  }

  const taxableInr = Math.round(totalInr / (1 + gstRatePct / 100));
  const gstInr = totalInr - taxableInr;
  return {
    description,
    nights: booking.nights,
    taxableInr,
    gstInr,
    gstRatePct,
    totalInr,
    gstAssumedInclusive: true,
  };
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Minimal single-page PDF (Helvetica). No external PDF dependency. */
export function buildGstInvoicePdf(booking: BookingRow): Uint8Array {
  const seller = invoiceSeller();
  const lines = invoiceLines(booking);
  const desk = deskFor(booking.packageId);
  const issued = new Date().toISOString().slice(0, 10);
  const invoiceNo = `TW-INV-${booking.confirmationCode.replace(/^TW-/, "")}`;

  const rows: string[] = [
    "Tax Invoice",
    `Invoice no. ${invoiceNo}`,
    `Date ${issued}`,
    "",
    "Seller",
    seller.legalName,
    seller.gstinConfigured && seller.gstin
      ? `GSTIN ${seller.gstin}`
      : "GSTIN not configured — set TW_GSTIN on the server",
    seller.address,
    "",
    "Bill to",
    booking.payerName,
    `Confirmation ${booking.confirmationCode}`,
    `Payment ref ${booking.paymentRef ?? "—"}`,
    "",
    "Stay",
    lines.description,
    desk.legalName ? `Property operator ${desk.legalName}` : "",
    desk.gstin ? `Property GSTIN ${desk.gstin}` : "Property GSTIN not published — ask the desk",
    "",
    lines.gstRatePct
      ? `Taxable value INR ${lines.taxableInr.toLocaleString("en-IN")}`
      : `Amount INR ${lines.totalInr.toLocaleString("en-IN")}`,
    lines.gstRatePct
      ? `GST @ ${lines.gstRatePct}% INR ${lines.gstInr.toLocaleString("en-IN")} (assumed inclusive of total paid)`
      : "GST not itemised — set TW_GST_RATE to split taxable value",
    `Total paid INR ${lines.totalInr.toLocaleString("en-IN")}`,
    "",
    "This is a TripWeave payment receipt for the stay recorded above.",
    "It is GST-compliant only when TW_GSTIN and TW_GST_RATE are configured.",
  ].filter((line) => line !== undefined);

  const contentLines: string[] = ["BT", "/F1 11 Tf", "50 780 Td", "14 TL"];
  let first = true;
  for (const row of rows) {
    const text = pdfEscape(row || " ");
    if (first) {
      contentLines.push(`(${text}) Tj`);
      first = false;
    } else {
      contentLines.push(`T* (${text}) Tj`);
    }
  }
  contentLines.push("ET");
  const stream = contentLines.join("\n");
  const streamBytes = Buffer.from(stream, "utf8");

  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n",
  );
  objects.push(
    `4 0 obj<< /Length ${streamBytes.length} >>stream\n${stream}\nendstream\nendobj\n`,
  );
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += obj;
  }
  const xrefAt = Buffer.byteLength(body, "utf8");
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(body, "utf8"));
}

export function invoiceFilename(booking: BookingRow): string {
  return `tripweave-invoice-${booking.confirmationCode}.pdf`;
}
