import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `mayfair-waves-puri`. */
export const MAYFAIR_WAVES_PURI_ROOMS: RawRoom[] = [
  {
    id: "premium",
    name: "Premium Room",
    summary: "49 sqm premium room — up to 2 adults and 1 child.",
    deltaPerNight: 0,
    occupancy: 3,
  },
  {
    id: "premium-sea-view",
    name: "Premium Sea View Room",
    summary: "49 sqm sea-view premium room.",
    deltaPerNight: 500,
    occupancy: 3,
  },
  {
    id: "premium-suite",
    name: "Premium Suite",
    summary: "114 sqm suite — up to 2 adults and 2 children.",
    deltaPerNight: 1000,
    occupancy: 4,
  },
];
