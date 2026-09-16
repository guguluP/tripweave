import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `toshali-sands-puri`. */
export const TOSHALI_SANDS_PURI_ROOMS: RawRoom[] = [
  {
    id: "standard-deluxe",
    name: "Standard Deluxe Room With Garden View",
    summary: "12.17 sqm standard deluxe with garden view.",
    deltaPerNight: 0,
    occupancy: 2,
  },
  {
    id: "deluxe-balcony",
    name: "Deluxe Room With Balcony & Garden View",
    summary: "Deluxe with balcony and garden view.",
    deltaPerNight: 400,
    occupancy: 2,
  },
  {
    id: "premium-balcony",
    name: "Premium Room With Balcony & Garden View",
    summary: "Premium with balcony and garden view.",
    deltaPerNight: 800,
    occupancy: 2,
  },
  {
    id: "executive-suite",
    name: "Executive Suite With Two Bed Room & Garden View",
    summary: "Two-bedroom executive suite with garden view.",
    deltaPerNight: 1200,
    occupancy: 4,
  },
  {
    id: "cottage",
    name: "Cottage with Garden View",
    summary: "17.09 sqm cottage — king/twin with sofa cum bed.",
    deltaPerNight: 1600,
    occupancy: 3,
  },
  {
    id: "villa",
    name: "Villa with Garden View",
    summary: "29.17 sqm villa — king/twin with sofa cum bed.",
    deltaPerNight: 2000,
    occupancy: 4,
  },
];
