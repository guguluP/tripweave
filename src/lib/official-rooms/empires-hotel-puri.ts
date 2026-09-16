import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `empires-hotel-puri`. */
export const EMPIRES_HOTEL_PURI_ROOMS: RawRoom[] = [
  {
    id: "executive",
    name: "Executive Room",
    summary: "21.83 sqm — twin or king bed.",
    deltaPerNight: 0,
    occupancy: 2,
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    summary: "51.1 sqm deluxe with king bed.",
    deltaPerNight: 500,
    occupancy: 2,
  },
  {
    id: "corporate",
    name: "Corporate Room",
    summary: "144.33 sqm corporate room — king bed.",
    deltaPerNight: 1000,
    occupancy: 2,
  },
  {
    id: "premium",
    name: "Premium Room",
    summary: "146.2 sqm premium room — king bed.",
    deltaPerNight: 1500,
    occupancy: 2,
  },
];
