import type { RoomType } from "./packages.ts";

type RawRoom = Omit<RoomType, "image">;

/** Official Taj Puri rooms from IHCL rooms-and-suites scrape. */
export const TAJ_PURI_ROOMS: RawRoom[] = [
  {
    id: "superior-king-balcony",
    name: "Superior King with Balcony",
    summary: "48.6 sqm king — balcony base room.",
    deltaPerNight: 0,
    occupancy: 4,
  },
  {
    id: "superior-twin-balcony",
    name: "Superior Twin with Balcony",
    summary: "48.6 sqm twin beds — balcony base twin.",
    deltaPerNight: 0,
    occupancy: 4,
  },
  {
    id: "superior-sea-king",
    name: "Superior Sea View King",
    summary: "48 sqm king — sea view with balcony.",
    deltaPerNight: 1500,
    occupancy: 3,
  },
  {
    id: "superior-sea-twin",
    name: "Superior Sea View Twin",
    summary: "48.6 sqm twin — sea view with balcony.",
    deltaPerNight: 1500,
    occupancy: 4,
  },
  {
    id: "deluxe-sea-king",
    name: "Deluxe Sea View King",
    summary: "51.6 sqm king — sea view with balcony.",
    deltaPerNight: 2500,
    occupancy: 3,
  },
  {
    id: "deluxe-sea-twin",
    name: "Deluxe Sea View Twin",
    summary: "51.6 sqm twin — sea view with balcony.",
    deltaPerNight: 2500,
    occupancy: 4,
  },
  {
    id: "luxury-sea-king",
    name: "Luxury Sea View King",
    summary: "57.6 sqm king — larger sea-view balcony room.",
    deltaPerNight: 3500,
    occupancy: 3,
  },
  {
    id: "grand-plunge-king",
    name: "Grand Luxury King with Plunge Pool",
    summary: "65.1 sqm king — private plunge pool.",
    deltaPerNight: 5000,
    occupancy: 3,
  },
  {
    id: "grand-plunge-twin",
    name: "Grand Luxury Twin with Plunge Pool",
    summary: "65.1 sqm twin — private plunge pool.",
    deltaPerNight: 5000,
    occupancy: 4,
  },
  {
    id: "executive-sea-suite",
    name: "Executive Sea View Suite",
    summary: "96.9 sqm suite — sea view with balcony.",
    deltaPerNight: 7500,
    occupancy: 3,
  },
  {
    id: "luxury-sea-suite",
    name: "Luxury Sea View Suite",
    summary: "111.7 sqm suite — sea view with balcony.",
    deltaPerNight: 9500,
    occupancy: 3,
  },
  {
    id: "presidential-sea-pool",
    name: "Presidential Sea View Suite with Private Pool",
    summary: "235.1 sqm presidential — sea view and private pool.",
    deltaPerNight: 18000,
    occupancy: 6,
  },
];
