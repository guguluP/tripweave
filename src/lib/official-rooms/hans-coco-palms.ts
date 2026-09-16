import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `hans-coco-palms`. */
export const HANS_COCO_PALMS_ROOMS: RawRoom[] = [
  {
    id: "pool-garden",
    name: "Deluxe Room — Pool or Garden View",
    summary: "28 sqm twin — pool or garden outlook.",
    deltaPerNight: 0,
    occupancy: 3,
  },
  {
    id: "partial-ocean",
    name: "Deluxe Balcony Room — Partial Ocean View",
    summary: "25 sqm king — balcony with partial ocean view.",
    deltaPerNight: 500,
    occupancy: 2,
  },
  {
    id: "ocean-suite",
    name: "Deluxe Suite — Ocean View",
    summary: "66 sqm king suite with ocean view.",
    deltaPerNight: 1000,
    occupancy: 2,
  },
];
