import type { RoomType, StayPackage } from "./packages.ts";
import { MAYFAIR_WAVES_PURI_ROOMS } from "./official-rooms/mayfair-waves-puri.ts";
import { CHARIOT_RESORT_PURI_ROOMS } from "./official-rooms/chariot-resort-puri.ts";
import { CHANAKYA_BNR_PURI_ROOMS } from "./official-rooms/chanakya-bnr-puri.ts";
import { MAHODADHI_PALACE_PURI_ROOMS } from "./official-rooms/mahodadhi-palace-puri.ts";
import { HOLIDAY_RESORT_PURI_ROOMS } from "./official-rooms/holiday-resort-puri.ts";
import { TOSHALI_SANDS_PURI_ROOMS } from "./official-rooms/toshali-sands-puri.ts";


type RawRoom = Omit<RoomType, "image">;

/** Catalog rows omit images — media is derived from each stay's curated YouTube videos. */
export type RawStay = Omit<
  StayPackage,
  "priceFrom" | "trustScore" | "image" | "pricePerPerson" | "images" | "rooms"
> & {
  rooms: RawRoom[];
};

export const RAW_B: RawStay[] = [{
    id: "mayfair-waves-puri",
    name: "Mayfair Waves, Puri",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 7,
    pricePerNight: 4200,
    trust: 93,
    reviews: 2210,
    budget: "premium",
    vibe: "beach",
    style: ["couple", "family", "friends"],
    summary: "Mayfair's beach-club sister — pool, buffet, and a louder waterfront.",
    neighborhood: "Chakratirtha beach",
    includes: ["Breakfast", "Beach club access", "Pool", "Temple transfer"],
    videos: [
      { videoId: "ix-8HWQ8heg", title: "Mayfair Waves Puri walkthrough" },
      { videoId: "ov0TpiWVKGg", title: "Waves rooms, pool and buffet" },
    ],
    rooms: MAYFAIR_WAVES_PURI_ROOMS,
    days: [
      {
        title: "Arrive & pool",
        base: "Check-in, beach-club afternoon, Waves buffet.",
        options: [{ id: "spa", label: "Spa hour", delta: 2000 }],
      },
      {
        title: "Temple morning",
        base: "Early darshan, back for the pool.",
        options: [{ id: "konark", label: "Konark half-day", delta: 1800 }],
      },
      {
        title: "Depart",
        base: "Breakfast and checkout.",
        options: [],
      },
    ],
  },
  {
    id: "toshali-sands-puri",
    name: "Toshali Sands, Puri",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 6,
    pricePerNight: 2800,
    trust: 87,
    reviews: 1740,
    budget: "mid",
    vibe: "adventure",
    style: ["family", "friends", "couple"],
    summary: "Cottage campus on the Konark road — gardens, pool, and day-trip range.",
    neighborhood: "Konark Marine Drive",
    includes: ["Cottage stay", "Breakfast", "Pool", "Parking"],
    videos: [
      { videoId: "6Hl1vtib7GE", title: "Toshali Sands cottage tour" },
      { videoId: "RahjVg0t6nk", title: "Resort campus and pool" },
      { videoId: "ZOCBaU2Ignk", title: "Family stay at Toshali Sands" },
    ],
    rooms: TOSHALI_SANDS_PURI_ROOMS,
    days: [
      {
        title: "Cottage check-in",
        base: "Arrive, campus walk, pool.",
        options: [],
      },
      {
        title: "Konark & coast",
        base: "Sun Temple and Chandrabhaga — you are already on the road.",
        options: [{ id: "guide", label: "Private guide", delta: 1200 }],
      },
      {
        title: "Depart",
        base: "Breakfast and checkout.",
        options: [{ id: "temple", label: "Puri temple stop", delta: 700 }],
      },
    ],
  },
  {
    id: "chariot-resort-puri",
    name: "The Chariot Resort & Spa",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 6,
    pricePerNight: 3000,
    trust: 89,
    reviews: 1880,
    budget: "mid",
    vibe: "relax",
    style: ["couple", "family", "friends"],
    summary: "Beach resort south of town — spa, lawns, and a quieter stretch of sand.",
    neighborhood: "Balukhand, south of town",
    includes: ["Breakfast", "Pool", "Spa credit", "Beach access"],
    videos: [
      { videoId: "pjy6OOe03wk", title: "Chariot Resort Puri tour" },
      { videoId: "6pPT0cJmWuM", title: "Rooms, spa and beach" },
    ],
    rooms: CHARIOT_RESORT_PURI_ROOMS,
    days: [
      {
        title: "Arrive & spa",
        base: "Check-in, pool, optional treatment.",
        options: [{ id: "spa", label: "Couple spa", delta: 2800 }],
      },
      {
        title: "Beach & temple",
        base: "Slow morning on the sand; evening darshan in town.",
        options: [{ id: "konark", label: "Konark half-day", delta: 1800 }],
      },
      {
        title: "Depart",
        base: "Breakfast and checkout.",
        options: [],
      },
    ],
  },
  {
    id: "chanakya-bnr-puri",
    name: "Chanakya BNR Hotel",
    destination: "Puri",
    country: "India",
    nights: 1,
    nightsMin: 1,
    nightsMax: 4,
    pricePerNight: 2500,
    trust: 86,
    reviews: 1420,
    budget: "value",
    vibe: "culture",
    style: ["solo", "couple", "friends"],
    summary: "Historic railway hotel by the station — character, location, temple-first trips.",
    neighborhood: "Near Puri station",
    includes: ["Breakfast", "Walk to station", "Heritage lobby", "24h desk"],
    videos: [
      { videoId: "puMmF_hN0Ic", title: "Chanakya BNR heritage stay" },
      { videoId: "hNV9aKYwNto", title: "Rooms and station-side location" },
    ],
    rooms: CHANAKYA_BNR_PURI_ROOMS,
    days: [
      {
        title: "Arrive & temple",
        base: "Drop bags, walk to Jagannath, eat on Grand Road.",
        options: [],
      },
      {
        title: "Town & depart",
        base: "Beach hour if you have it, then the station.",
        options: [{ id: "beach", label: "Beach half-day", delta: 400 }],
      },
    ],
  },
  {
    id: "mahodadhi-palace-puri",
    name: "Mahodadhi Palace",
    destination: "Puri",
    country: "India",
    nights: 1,
    nightsMin: 1,
    nightsMax: 4,
    pricePerNight: 5500,
    trust: 92,
    reviews: 1180,
    budget: "premium",
    vibe: "culture",
    style: ["couple", "solo", "friends"],
    summary: "Beachfront palace hotel — heritage rooms, sea lawns, a one-night statement stay.",
    neighborhood: "Sea Beach, palace stretch",
    includes: ["Breakfast", "Palace lawns", "Heritage rooms", "Temple transfer"],
    videos: [
      { videoId: "PZW2ibNBPv8", title: "Mahodadhi Palace tour" },
      { videoId: "80-nIH3wnUI", title: "Heritage rooms on the beach" },
      { videoId: "lLhJ_hp3EVQ", title: "Palace stay and sea lawns" },
    ],
    rooms: MAHODADHI_PALACE_PURI_ROOMS,
    days: [
      {
        title: "Palace evening",
        base: "Check-in, lawn sunset, temple after dark if the crowd allows.",
        options: [{ id: "thali", label: "Palace thali", delta: 1400 }],
      },
      {
        title: "Depart",
        base: "Breakfast on the lawn, checkout.",
        options: [],
      },
    ],
  },
  {
    id: "holiday-resort-puri",
    name: "Holiday Resort, Puri",
    destination: "Puri",
    country: "India",
    nights: 2,
    nightsMin: 1,
    nightsMax: 5,
    pricePerNight: 1800,
    trust: 83,
    reviews: 1640,
    budget: "value",
    vibe: "beach",
    style: ["family", "friends", "couple"],
    summary: "Long-running beach resort — lawns, a pool, and prices that still make sense.",
    neighborhood: "Sea Beach Road",
    includes: ["Breakfast", "Pool", "Lawn", "Parking"],
    videos: [
      { videoId: "Wfvplc69Yio", title: "Holiday Resort Puri walkthrough" },
      { videoId: "9mjuLwKBDT0", title: "Rooms, lawn and pool" },
      { videoId: "_GCIo7ETCp8", title: "Beach-side stay" },
    ],
    rooms: HOLIDAY_RESORT_PURI_ROOMS,
    days: [
      {
        title: "Beach check-in",
        base: "Lawn, pool, evening sand.",
        options: [{ id: "dinner", label: "Seafood dinner", delta: 700 }],
      },
      {
        title: "Temple & depart",
        base: "Morning darshan if you want it, then checkout.",
        options: [{ id: "konark", label: "Konark shared", delta: 900 }],
      },
    ],
  }
];
