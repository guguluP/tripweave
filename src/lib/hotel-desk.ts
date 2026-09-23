export type HotelDesk = {
  packageId: string;
  email: string;
  phone?: string;
  note: string;
  /** Public GSTIN of the operating entity, when known. */
  gstin?: string;
  legalName?: string;
};

export const HOTEL_DESKS: Record<string, HotelDesk> = {
  "taj-puri-resort-spa": {
    packageId: "taj-puri-resort-spa",
    email: "reservations.puri@tajhotels.com",
    note: "IHCL reservations desk",
    legalName: "The Indian Hotels Company Limited",
    // Odisha GSTIN for the 2024 Puri property is not yet listed on public GST directories.
    // PAN of the operator: AAACT3957G — ask the desk for the invoice GSTIN.
  },
  "mayfair-heritage-puri": {
    packageId: "mayfair-heritage-puri",
    email: "reservations@mayfairhotels.com",
    note: "Mayfair reservations",
    legalName: "Mayfair Hotels and Resorts Limited",
    gstin: "21AAECM6873E1ZL",
  },
  "mayfair-waves-puri": {
    packageId: "mayfair-waves-puri",
    email: "reservations@mayfairhotels.com",
    note: "Mayfair reservations",
    legalName: "Mayfair Hotels and Resorts Limited",
    gstin: "21AAECM6873E1ZL",
  },
  "swosti-premium-beach-resort": {
    packageId: "swosti-premium-beach-resort",
    email: "sales@swostihotels.com",
    note: "Swosti sales desk",
    legalName: "Swosti Premium Limited",
    gstin: "21AADCS8693K1ZX",
  },
  "regenta-central-puri": {
    packageId: "regenta-central-puri",
    email: "centralpuri@royalorchidhotels.com",
    note: "Regenta / Royal Orchid desk",
    legalName: "Royal Orchid Hotels Limited",
    // Managed property; Karnataka HQ GSTIN 29AABCR0111M1ZJ. Odisha GSTIN not published.
  },
  "hans-coco-palms": {
    packageId: "hans-coco-palms",
    email: "coco@hanshotels.com",
    note: "Hans Coco Palms desk",
    legalName: "Hotel Hans Private Limited",
    gstin: "07AAACH0043H1Z4",
  },
  "empires-hotel-puri": {
    packageId: "empires-hotel-puri",
    email: "info@empireshotel.com",
    note: "Empires front office",
    legalName: "Empires Hotels (OSL Group)",
  },
  "toshali-sands-puri": {
    packageId: "toshali-sands-puri",
    email: "reservations@toshaligroup.com",
    note: "Toshali reservations",
    legalName: "TK International Limited",
    gstin: "21AABCT2236P1ZD",
  },
  "chariot-resort-puri": {
    packageId: "chariot-resort-puri",
    email: "info@thechariotresortpuri.com",
    note: "Chariot reservations",
    legalName: "The Chariot Resort & Spa",
  },
  "chanakya-bnr-puri": {
    packageId: "chanakya-bnr-puri",
    email: "reservation@thechanakyabnrpuri.com",
    note: "Chanakya BNR desk",
    legalName: "Chanakya BNR Hotel",
  },
  "mahodadhi-palace-puri": {
    packageId: "mahodadhi-palace-puri",
    email: "reservations@mayfairhotels.com",
    note: "Mayfair Mahodadhi desk",
    legalName: "Mayfair Hotels and Resorts Limited",
    gstin: "21AAECM6873E1ZL",
  },
  "holiday-resort-puri": {
    packageId: "holiday-resort-puri",
    email: "info@holidayresortpuri.com",
    note: "Holiday Resort desk",
    legalName: "Hotel Holiday Resort Pvt Ltd",
    gstin: "21AABCH0424K1Z5",
  },
};

export function deskFor(packageId: string): HotelDesk {
  return (
    HOTEL_DESKS[packageId] ?? {
      packageId,
      email: "desk@tripweave.app",
      note: "TripWeave will forward this to the hotel",
    }
  );
}

export function hotelMailto(input: {
  packageId: string;
  packageName: string;
  confirmationCode: string;
  checkIn: string;
  nights: number;
  travelers: number;
  payerName: string;
  amountInr: number;
  roomName?: string;
  travelSummary?: string;
}): string {
  const desk = deskFor(input.packageId);
  const subject = `New stay ${input.confirmationCode} — ${input.packageName}`;
  const body = [
    `Dear ${desk.note},`,
    "",
    "A guest has paid on TripWeave. Please hold the room.",
    "",
    `Confirmation: ${input.confirmationCode}`,
    `Stay: ${input.packageName}`,
    desk.legalName ? `Legal name: ${desk.legalName}` : "",
    desk.gstin ? `GSTIN: ${desk.gstin}` : "",
    input.roomName ? `Room: ${input.roomName}` : "",
    `Check-in: ${input.checkIn}`,
    `Nights: ${input.nights}`,
    `Guests: ${input.travelers}`,
    `Guest name: ${input.payerName}`,
    `Amount paid: ₹${input.amountInr.toLocaleString("en-IN")}`,
    ...(input.travelSummary ? ["", "Travel", input.travelSummary] : []),
    "",
    "Please reply to the guest to confirm the hold.",
  ]
    .filter(Boolean)
    .join("\n");
  return `mailto:${desk.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
