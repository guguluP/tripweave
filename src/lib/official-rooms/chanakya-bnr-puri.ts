import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `chanakya-bnr-puri`. */
export const CHANAKYA_BNR_PURI_ROOMS: RawRoom[] = [
  {
    id: "deluxe",
    name: "Deluxe Room",
    summary: "Heritage hotel deluxe category.",
    deltaPerNight: 0,
    occupancy: 2,
  },
  {
    id: "superior",
    name: "Superior Room",
    summary: "King or twin beds — superior wing.",
    deltaPerNight: 500,
    occupancy: 3,
  },
  {
    id: "heritage-suite",
    name: "Heritage Suite",
    summary: "Heritage suite in the railway hotel.",
    deltaPerNight: 1000,
    occupancy: 3,
  },
];
