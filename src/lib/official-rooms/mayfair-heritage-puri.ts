import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `mayfair-heritage-puri`. */
export const MAYFAIR_HERITAGE_PURI_ROOMS: RawRoom[] = [
  {
    id: "deluxe",
    name: "Deluxe Room",
    summary: "42 sqm heritage deluxe — solid base room.",
    deltaPerNight: 0,
    occupancy: 3,
  },
  {
    id: "heritage-premium",
    name: "Heritage Premium Room",
    summary: "49 sqm heritage premium category.",
    deltaPerNight: 400,
    occupancy: 3,
  },
  {
    id: "deluxe-cottage",
    name: "Deluxe Cottage",
    summary: "42 sqm garden cottage.",
    deltaPerNight: 800,
    occupancy: 3,
  },
  {
    id: "sea-view-cottage",
    name: "Sea View Cottage",
    summary: "49 sqm cottage with sea outlook.",
    deltaPerNight: 1200,
    occupancy: 3,
  },
  {
    id: "deluxe-suite",
    name: "Deluxe Suite",
    summary: "53 sqm suite — more space than deluxe.",
    deltaPerNight: 1600,
    occupancy: 3,
  },
  {
    id: "family-suite",
    name: "Family Suite",
    summary: "76 sqm suite with two king beds.",
    deltaPerNight: 2000,
    occupancy: 4,
  },
];
