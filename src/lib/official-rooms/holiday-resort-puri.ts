import type { RoomType } from "../packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official rooms from hotel-site scrape for `holiday-resort-puri`. */
export const HOLIDAY_RESORT_PURI_ROOMS: RawRoom[] = [
  {
    id: "standard-double",
    name: "Standard Double Bed Room",
    summary: "14.86 sqm standard double with sofa option.",
    deltaPerNight: 0,
    occupancy: 2,
  },
  {
    id: "deluxe-double",
    name: "Deluxe Double Bed Room",
    summary: "14.86 sqm deluxe double with sofa option.",
    deltaPerNight: 350,
    occupancy: 2,
  },
  {
    id: "deluxe-pool-view",
    name: "Deluxe Double Bed Pool View",
    summary: "14.86 sqm deluxe with pool outlook.",
    deltaPerNight: 700,
    occupancy: 2,
  },
  {
    id: "family",
    name: "Family Room",
    summary: "19.51 sqm — two queen beds plus sofa.",
    deltaPerNight: 1050,
    occupancy: 4,
  },
  {
    id: "standard-family",
    name: "Standard Family Room",
    summary: "19.51 sqm standard family layout.",
    deltaPerNight: 1400,
    occupancy: 4,
  },
  {
    id: "cottage",
    name: "Cottage",
    summary: "23.23 sqm cottage with king bed and sofa.",
    deltaPerNight: 1750,
    occupancy: 2,
  },
  {
    id: "standard-cottage",
    name: "Standard Cottage",
    summary: "23.23 sqm standard cottage category.",
    deltaPerNight: 2100,
    occupancy: 2,
  },
  {
    id: "royal-suite",
    name: "Royal Suite",
    summary: "27.87 sqm royal suite with king bed and sofa.",
    deltaPerNight: 2450,
    occupancy: 2,
  },
  {
    id: "presidential-suite",
    name: "Presidential Suite",
    summary: "37.16 sqm presidential suite.",
    deltaPerNight: 2800,
    occupancy: 2,
  },
];
