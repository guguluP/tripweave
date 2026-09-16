import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `mahodadhi-palace-puri`. */
export const MAHODADHI_PALACE_PURI_ROOMS: RawRoom[] = [
  {
    id: "heritage-deluxe-sea",
    name: "Heritage Deluxe Sea Room",
    summary: "Heritage deluxe sea room in the palace wing.",
    deltaPerNight: 0,
    occupancy: 2,
  },
  {
    id: "day-use",
    name: "Day Use Room",
    summary: "Short-stay / day-use category from the hotel site.",
    deltaPerNight: 500,
    occupancy: 2,
  },
];
