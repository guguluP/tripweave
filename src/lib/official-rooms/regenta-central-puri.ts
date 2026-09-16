import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `regenta-central-puri`. */
export const REGENTA_CENTRAL_PURI_ROOMS: RawRoom[] = [
  {
    id: "deluxe-double-sea",
    name: "Deluxe Double with Balcony Sea View",
    summary: "22 sqm double — balcony sea view.",
    deltaPerNight: 0,
    occupancy: 2,
  },
  {
    id: "deluxe-twin-sea",
    name: "Deluxe Twin with Balcony Sea View",
    summary: "22 sqm twin beds — balcony sea view.",
    deltaPerNight: 500,
    occupancy: 3,
  },
  {
    id: "executive-double-sea",
    name: "Executive Double with Balcony Sea View",
    summary: "26 sqm executive double — balcony sea view.",
    deltaPerNight: 1000,
    occupancy: 2,
  },
  {
    id: "executive-twin-sea",
    name: "Executive Twin with Balcony Sea View",
    summary: "26 sqm executive twin — balcony sea view.",
    deltaPerNight: 1500,
    occupancy: 3,
  },
  {
    id: "premium-sea",
    name: "Premium Room with Balcony Sea View",
    summary: "38 sqm premium — balcony sea view.",
    deltaPerNight: 2000,
    occupancy: 2,
  },
];
