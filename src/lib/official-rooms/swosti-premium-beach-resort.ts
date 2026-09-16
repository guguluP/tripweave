import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `swosti-premium-beach-resort`. */
export const SWOSTI_PREMIUM_BEACH_RESORT_ROOMS: RawRoom[] = [
  {
    id: "premium",
    name: "Premium Room",
    summary: "31.96 sqm premium room — up to 3 guests.",
    deltaPerNight: 0,
    occupancy: 3,
  },
  {
    id: "sea-view-side",
    name: "Sea View Room (Side View)",
    summary: "31.96 sqm side sea view — up to 4.",
    deltaPerNight: 350,
    occupancy: 4,
  },
  {
    id: "sea-view-front",
    name: "Sea View Room (Front View)",
    summary: "31.96 sqm front sea view — king bed.",
    deltaPerNight: 700,
    occupancy: 5,
  },
  {
    id: "interconnecting",
    name: "Interconnecting Room",
    summary: "Connecting rooms for families and groups.",
    deltaPerNight: 1050,
    occupancy: 4,
  },
  {
    id: "oasis-suite",
    name: "Oasis Suite",
    summary: "86.4 sqm suite — up to 3 guests.",
    deltaPerNight: 1400,
    occupancy: 3,
  },
  {
    id: "intimate-escape-suite",
    name: "Intimate Escape Suite",
    summary: "86.4 sqm suite — up to 4 guests.",
    deltaPerNight: 1750,
    occupancy: 4,
  },
  {
    id: "imperial-suite",
    name: "Imperial Suite",
    summary: "110.55 sqm imperial suite — up to 4.",
    deltaPerNight: 2100,
    occupancy: 4,
  },
  {
    id: "royal-ambassador-suite",
    name: "Royal Ambassador Suite",
    summary: "179.4 sqm flagship suite — king bed.",
    deltaPerNight: 2450,
    occupancy: 4,
  },
];
