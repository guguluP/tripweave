export type HotelDesk = {
  packageId: string;
  email: string;
  phone?: string;
  note: string;
};

export const HOTEL_DESKS: Record<string, HotelDesk> = {
  "taj-puri-resort-spa": {
    packageId: "taj-puri-resort-spa",
    email: "reservations.puri@tajhotels.com",
    note: "IHCL reservations desk",
  },
  "mayfair-heritage-puri": {
    packageId: "mayfair-heritage-puri",
    email: "reservations@mayfairhotels.com",
    note: "Mayfair reservations",
  },
  "mayfair-waves-puri": {
    packageId: "mayfair-waves-puri",
    email: "reservations@mayfairhotels.com",
    note: "Mayfair reservations",
  },
  "swosti-premium-beach-resort": {
    packageId: "swosti-premium-beach-resort",
    email: "sales@swostihotels.com",
    note: "Swosti sales desk",
  },
  "regenta-central-puri": {
    packageId: "regenta-central-puri",
    email: "centralpuri@royalorchidhotels.com",
    note: "Regenta / Royal Orchid desk",
  },
  "hans-coco-palms": {
    packageId: "hans-coco-palms",
    email: "coco@hanshotels.com",
    note: "Hans Coco Palms desk",
  },
  "empires-hotel-puri": {
    packageId: "empires-hotel-puri",
    email: "info@empireshotel.com",
    note: "Empires front office",
  },
  "toshali-sands-puri": {
    packageId: "toshali-sands-puri",
    email: "reservations@toshaligroup.com",
    note: "Toshali reservations",
  },
  "chariot-resort-puri": {
    packageId: "chariot-resort-puri",
    email: "info@thechariotresortpuri.com",
    note: "Chariot reservations",
  },
  "chanakya-bnr-puri": {
    packageId: "chanakya-bnr-puri",
    email: "reservation@thechanakyabnrpuri.com",
    note: "Chanakya BNR desk",
  },
  "mahodadhi-palace-puri": {
    packageId: "mahodadhi-palace-puri",
    email: "reservations@mayfairhotels.com",
    note: "Mayfair Mahodadhi desk",
  },
  "holiday-resort-puri": {
    packageId: "holiday-resort-puri",
    email: "info@holidayresortpuri.com",
    note: "Holiday Resort desk",
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
