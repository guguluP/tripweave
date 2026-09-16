import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `chariot-resort-puri`. */
export const CHARIOT_RESORT_PURI_ROOMS: RawRoom[] = [
  {
    id: "deluxe",
    name: "Deluxe Room",
    summary: "Deluxe category at The Chariot.",
    deltaPerNight: 0,
    occupancy: 2,
  },
  {
    id: "executive",
    name: "Executive Room",
    summary: "Two queen-size beds — executive category.",
    deltaPerNight: 500,
    occupancy: 3,
  },
  {
    id: "premium",
    name: "Premium Room",
    summary: "King-size bed — premium category.",
    deltaPerNight: 1000,
    occupancy: 2,
  },
  {
    id: "platinum-suite",
    name: "Platinum Suite",
    summary: "Platinum suite — top Chariot category.",
    deltaPerNight: 1500,
    occupancy: 3,
  },
];
