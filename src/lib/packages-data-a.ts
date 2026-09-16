import { TAJ_PURI_ROOMS } from "./taj-puri-rooms.ts";
import type { RoomType, StayPackage } from "./packages.ts";
import { MAYFAIR_HERITAGE_PURI_ROOMS } from "./official-rooms/mayfair-heritage-puri.ts";
import { SWOSTI_PREMIUM_BEACH_RESORT_ROOMS } from "./official-rooms/swosti-premium-beach-resort.ts";
import { REGENTA_CENTRAL_PURI_ROOMS } from "./official-rooms/regenta-central-puri.ts";
import { HANS_COCO_PALMS_ROOMS } from "./official-rooms/hans-coco-palms.ts";
import { EMPIRES_HOTEL_PURI_ROOMS } from "./official-rooms/empires-hotel-puri.ts";


type RawRoom = Omit<RoomType, "image">;

/** Catalog rows omit images — media is derived from each stay's curated YouTube videos. */
export type RawStay = Omit<
  StayPackage,
  "priceFrom" | "trustScore" | "image" | "pricePerPerson" | "images" | "rooms"
> & {
  rooms: RawRoom[];
};

export const RAW_A: RawStay[] = [
  {
    id: "taj-puri-resort-spa",
    name: "Taj Puri Resort & Spa",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 7,
    pricePerNight: 6200,
    trust: 96,
    reviews: 3120,
    budget: "premium",
    vibe: "relax",
    style: ["couple", "family", "friends"],
    summary: "Puri's flagship 5-star: private beach, real spa, Odia thalis.",
    neighborhood: "Balukhand beachfront",
    includes: ["Private beach access", "Breakfast", "Airport transfer", "Spa credit"],
    videos: [
      { videoId: "QRg6kAKT4TY", title: "Luxury stay at the new Taj Puri" },
      { videoId: "02dHekawNDk", title: "Honest hotel tour and food" },
      { videoId: "809rJTgHVgI", title: "Room and property tour" },
    ],
    rooms: TAJ_PURI_ROOMS,
    days: [
      {
        title: "Arrive & settle",
        base: "Check-in, welcome drink, pool or beach.",
        options: [{ id: "spa", label: "Spa session", delta: 2500 }],
      },
      {
        title: "Temple & town",
        base: "Jagannath Temple; evening Odia thali.",
        options: [{ id: "konark", label: "Konark half-day", delta: 1800 }],
      },
      {
        title: "Depart",
        base: "Beach breakfast, checkout, transfer.",
        options: [],
      },
    ],
  },
  {
    id: "mayfair-heritage-puri",
    name: "Mayfair Heritage, Puri",
    destination: "Puri",
    country: "India",
    nights: 4,
    nightsMin: 1,
    nightsMax: 7,
    pricePerNight: 3800,
    trust: 94,
    reviews: 2680,
    budget: "premium",
    vibe: "culture",
    style: ["family", "couple", "friends"],
    summary: "Heritage beachfront resort with gardens and Ayurveda spa.",
    neighborhood: "Chakratirtha Road",
    includes: ["Garden rooms", "Breakfast", "Ayurveda consult", "Temple transfer"],
    videos: [
      { videoId: "kHI7YcZr-uw", title: "Mayfair Heritage room tour" },
      { videoId: "vqgxX0CC_Us", title: "Heritage stay and Waves food" },
      { videoId: "uquuV9tAlo0", title: "Real staying experience, 2024" },
    ],
    rooms: MAYFAIR_HERITAGE_PURI_ROOMS,
    days: [
      {
        title: "Arrival",
        base: "Check-in, garden walk, beachfront dinner.",
        options: [],
      },
      {
        title: "Puri classics",
        base: "Jagannath Temple, Gundicha, market.",
        options: [{ id: "guide", label: "Private guide", delta: 1200 }],
      },
      {
        title: "Konark day",
        base: "Sun Temple + Chandrabhaga Beach.",
        options: [{ id: "ayur", label: "Extra Ayurveda", delta: 1500 }],
      },
      {
        title: "Departure",
        base: "Leisure breakfast and checkout.",
        options: [],
      },
    ],
  },
  {
    id: "swosti-premium-beach-resort",
    name: "Swosti Premium Beach Resort",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 6,
    pricePerNight: 3300,
    trust: 90,
    reviews: 1940,
    budget: "mid",
    vibe: "beach",
    style: ["couple", "family", "friends"],
    summary: "Solid 4-star on the beach road — pool, multi-cuisine, temple access.",
    neighborhood: "Marine Drive",
    includes: ["Pool", "Breakfast", "Beach chairs", "Wi-Fi"],
    videos: [
      { videoId: "R8_m_xkYSzQ", title: "Is Swosti Premium worth it?" },
      { videoId: "5Gmwnc6B71E", title: "Family vacation walkthrough" },
      { videoId: "G6R5FNirOcY", title: "Sea-facing stay" },
    ],
    rooms: SWOSTI_PREMIUM_BEACH_RESORT_ROOMS,
    days: [
      {
        title: "Check-in & beach",
        base: "Arrive, pool, evening beach walk.",
        options: [{ id: "dinner", label: "Seafood dinner", delta: 900 }],
      },
      {
        title: "Temple morning",
        base: "Early darshan, market, rest.",
        options: [],
      },
      {
        title: "Depart",
        base: "Breakfast and checkout.",
        options: [],
      },
    ],
  },
  {
    id: "regenta-central-puri",
    name: "Regenta Central Puri Odisha",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 5,
    pricePerNight: 2400,
    trust: 88,
    reviews: 1560,
    budget: "mid",
    vibe: "culture",
    style: ["couple", "solo", "friends"],
    summary: "Central 4-star near the temple — clean, reliable, honest mid-range.",
    neighborhood: "Near Jagannath Temple",
    includes: ["Breakfast", "AC rooms", "Temple walk map", "Late checkout on request"],
    videos: [
      { videoId: "SVbg3HhQLes", title: "Beach-facing walkthrough" },
      { videoId: "nMCyrW5PFWM", title: "Stay review" },
      { videoId: "I5yaD4NyfTo", title: "Rooms and amenities" },
    ],
    rooms: REGENTA_CENTRAL_PURI_ROOMS,
    days: [
      {
        title: "Arrive central",
        base: "Check-in, short walk to beach.",
        options: [],
      },
      {
        title: "Temple & town",
        base: "Jagannath darshan, local sweets.",
        options: [{ id: "konark", label: "Konark trip", delta: 1600 }],
      },
      {
        title: "Depart",
        base: "Checkout.",
        options: [],
      },
    ],
  },
  {
    id: "hans-coco-palms",
    name: "Hans Coco Palms",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 5,
    pricePerNight: 2200,
    trust: 85,
    reviews: 1320,
    budget: "value",
    vibe: "beach",
    style: ["couple", "friends", "solo"],
    summary: "Beach-side 3-star with coconut palms — honest value near the water.",
    neighborhood: "Sea Beach Road",
    includes: ["Palm garden", "Breakfast", "Beach access", "Parking"],
    videos: [
      { videoId: "CeqSkW6Nj5s", title: "Budget luxury on the beach" },
      { videoId: "lRelrKmJ2ME", title: "Sea-facing stay" },
      { videoId: "C_hvR4UIcDQ", title: "Resort and beach, last day" },
    ],
    rooms: HANS_COCO_PALMS_ROOMS,
    days: [
      {
        title: "Beach check-in",
        base: "Settle, evening walk.",
        options: [],
      },
      {
        title: "Temple morning",
        base: "Darshan and local food.",
        options: [{ id: "konark", label: "Konark shared", delta: 900 }],
      },
      {
        title: "Depart",
        base: "Checkout.",
        options: [],
      },
    ],
  },
  {
    id: "empires-hotel-puri",
    name: "Hotel Empires Puri",
    destination: "Puri",
    country: "India",
    nights: 1,
    nightsMin: 1,
    nightsMax: 4,
    pricePerNight: 2100,
    trust: 84,
    reviews: 980,
    budget: "value",
    vibe: "culture",
    style: ["solo", "couple", "friends"],
    summary: "Compact city hotel near the temple — clean, budget-friendly, walkable.",
    neighborhood: "Grand Road",
    includes: ["Walk to temple", "Breakfast", "AC rooms", "24h desk"],
    videos: [
      { videoId: "mTgPxwJLB_c", title: "First day in Puri — Empires" },
      { videoId: "CcgItlhsIPc", title: "Stay footage" },
    ],
    rooms: EMPIRES_HOTEL_PURI_ROOMS,
    days: [
      {
        title: "Arrive & temple",
        base: "Check-in, evening darshan.",
        options: [],
      },
      {
        title: "Town & depart",
        base: "Market, checkout.",
        options: [{ id: "beach", label: "Beach half-day", delta: 400 }],
      },
    ],
  }
];
