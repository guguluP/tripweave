/**
 * Apple Wallet (PassKit) support for TripWeave hotel bookings.
 *
 * Real .pkpass install requires:
 *  - Apple Developer Program ($99/yr)
 *  - Pass Type ID + signing certificate
 *  - WWDR intermediate cert
 * Env (server only, never VITE_):
 *  APPLE_PASS_TYPE_ID=pass.com.yourorg.tripweave
 *  APPLE_TEAM_ID=XXXXXXXXXX
 *  APPLE_PASS_SIGNER_CERT_PEM=...
 *  APPLE_PASS_SIGNER_KEY_PEM=...
 *  APPLE_PASS_SIGNER_KEY_PASSPHRASE=...
 *  APPLE_WWDR_CERT_PEM=...
 *
 * Without certs we still offer offline convenience: QR, .ics calendar, HTML pass card.
 */

import type { BookingRow } from "@/lib/server/bookings";
import { getPackage } from "@/lib/packages";

export type WalletPassPayload = {
  confirmationCode: string;
  packageName: string;
  packageId: string;
  neighborhood: string;
  destination: string;
  checkIn: string;
  nights: number;
  travelers: number;
  payerName: string;
  amountInr: number;
  paymentRef: string | null;
  status: string;
};

export function bookingToWalletPayload(booking: BookingRow): WalletPassPayload {
  const pkg = getPackage(booking.packageId);
  return {
    confirmationCode: booking.confirmationCode,
    packageName: booking.packageName,
    packageId: booking.packageId,
    neighborhood: pkg?.neighborhood ?? "Puri",
    destination: pkg?.destination ?? "Puri",
    checkIn: booking.checkIn,
    nights: booking.nights,
    travelers: booking.travelers,
    payerName: booking.payerName,
    amountInr: booking.amountInr,
    paymentRef: booking.paymentRef,
    status: booking.status,
  };
}

/** Apple PassKit pass.json (unsigned until certs are configured on the server). */
export function buildPassJson(
  payload: WalletPassPayload,
  opts?: {
    passTypeIdentifier?: string;
    teamIdentifier?: string;
    webServiceURL?: string;
  },
) {
  const passTypeIdentifier =
    opts?.passTypeIdentifier ||
    (typeof process !== "undefined" ? process.env.APPLE_PASS_TYPE_ID : undefined) ||
    "pass.com.tripweave.booking";
  const teamIdentifier =
    opts?.teamIdentifier ||
    (typeof process !== "undefined" ? process.env.APPLE_TEAM_ID : undefined) ||
    "TEAMID0000";

  const checkOut = addDays(payload.checkIn, payload.nights);

  return {
    formatVersion: 1,
    passTypeIdentifier,
    serialNumber: payload.confirmationCode,
    teamIdentifier,
    organizationName: "TripWeave",
    description: `Stay at ${payload.packageName}`,
    logoText: "TripWeave",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(30, 88, 83)",
    labelColor: "rgb(200, 230, 225)",
    generic: {
      primaryFields: [
        {
          key: "hotel",
          label: "STAY",
          value: payload.packageName,
        },
      ],
      secondaryFields: [
        {
          key: "checkin",
          label: "CHECK-IN",
          value: payload.checkIn,
        },
        {
          key: "nights",
          label: "NIGHTS",
          value: String(payload.nights),
        },
      ],
      auxiliaryFields: [
        {
          key: "guests",
          label: "GUESTS",
          value: String(payload.travelers),
        },
        {
          key: "code",
          label: "CONFIRMATION",
          value: payload.confirmationCode,
        },
      ],
      backFields: [
        {
          key: "guest",
          label: "Guest name",
          value: payload.payerName,
        },
        {
          key: "location",
          label: "Location",
          value: `${payload.neighborhood}, ${payload.destination}`,
        },
        {
          key: "checkout",
          label: "Check-out",
          value: checkOut,
        },
        {
          key: "ref",
          label: "Payment reference",
          value: payload.paymentRef || "—",
        },
        {
          key: "status",
          label: "Status",
          value: payload.status,
        },
        {
          key: "help",
          label: "Support",
          value:
            "Show this pass at the hotel desk. Confirmation must match the booking name.",
        },
      ],
    },
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: payload.confirmationCode,
        messageEncoding: "iso-8859-1",
        altText: payload.confirmationCode,
      },
    ],
    relevantDate: `${payload.checkIn}T14:00:00+05:30`,
    expirationDate: `${checkOut}T12:00:00+05:30`,
  };
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function appleWalletConfigured(): boolean {
  if (typeof process === "undefined") return false;
  return Boolean(
    process.env.APPLE_PASS_TYPE_ID?.trim() &&
      process.env.APPLE_TEAM_ID?.trim() &&
      process.env.APPLE_PASS_SIGNER_CERT_PEM?.trim() &&
      process.env.APPLE_PASS_SIGNER_KEY_PEM?.trim() &&
      process.env.APPLE_WWDR_CERT_PEM?.trim(),
  );
}

/** Calendar event for offline reminder (works without Apple certs). */
export function buildBookingIcs(payload: WalletPassPayload): string {
  const uid = `${payload.confirmationCode}@tripweave`;
  const dtStart = payload.checkIn.replace(/-/g, "");
  const dtEnd = addDays(payload.checkIn, payload.nights).replace(/-/g, "");
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const summary = `TripWeave · ${payload.packageName}`;
  const desc = [
    `Confirmation: ${payload.confirmationCode}`,
    `Guest: ${payload.payerName}`,
    `Guests: ${payload.travelers}`,
    `Nights: ${payload.nights}`,
    payload.paymentRef ? `Payment ref: ${payload.paymentRef}` : "",
  ]
    .filter(Boolean)
    .join("\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TripWeave//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(desc)}`,
    `LOCATION:${escapeIcs(`${payload.neighborhood}, ${payload.destination}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Self-contained offline HTML pass card (open/save on phone without Wallet certs). */
export function buildOfflinePassHtml(payload: WalletPassPayload): string {
  const checkOut = addDays(payload.checkIn, payload.nights);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload.confirmationCode)}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<title>TripWeave · ${payload.confirmationCode}</title>
<style>
  body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0f1f1d;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
  .card{background:#1e5853;border-radius:16px;padding:24px;max-width:360px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.35)}
  .eyebrow{font-size:11px;letter-spacing:.12em;opacity:.75;text-transform:uppercase}
  h1{font-size:22px;margin:8px 0 4px;font-weight:600}
  .code{font-size:28px;letter-spacing:.08em;font-variant-numeric:tabular-nums;margin:16px 0}
  .row{display:flex;justify-content:space-between;gap:12px;font-size:14px;margin:6px 0;opacity:.95}
  .label{opacity:.7}
  .qr{display:block;margin:20px auto 8px;background:#fff;padding:10px;border-radius:12px}
  .hint{font-size:12px;opacity:.7;text-align:center;margin-top:12px}
</style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">TripWeave · hotel stay</div>
    <h1>${escapeHtml(payload.packageName)}</h1>
    <div class="row"><span class="label">Confirmation</span></div>
    <div class="code">${escapeHtml(payload.confirmationCode)}</div>
    <div class="row"><span class="label">Guest</span><span>${escapeHtml(payload.payerName)}</span></div>
    <div class="row"><span class="label">Check-in</span><span>${escapeHtml(payload.checkIn)}</span></div>
    <div class="row"><span class="label">Check-out</span><span>${escapeHtml(checkOut)}</span></div>
    <div class="row"><span class="label">Guests</span><span>${payload.travelers}</span></div>
    <div class="row"><span class="label">Location</span><span>${escapeHtml(payload.neighborhood)}</span></div>
    <img class="qr" width="180" height="180" alt="QR ${escapeHtml(payload.confirmationCode)}" src="${qrUrl}"/>
    <p class="hint">Save this page or screenshot for offline check-in. Show at the hotel desk.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
