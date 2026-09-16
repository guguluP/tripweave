import type { RoomReviewNotes } from "./types.ts";

/** Room-level reviewer notes keyed by official catalog room ids. */
export const SEED_ROOM_NOTES: Record<string, Record<string, RoomReviewNotes>> = {
  "taj-puri-resort-spa": {
      garden: {
        summary: "Quiet and new, but you are paying Taj money to look at trees.",
        positives: ["Genuinely new rooms and bathrooms", "Quieter than the sea-facing wing"],
        watchouts: ["Skip this if a water outlook is why you picked Taj"],
      },
      sea: {
        summary: "The deluxe sea view is the room reviewers mean when they say Taj Puri.",
        positives: ["Full water outlook", "Same new-build finish as the garden rooms"],
        watchouts: ["The private beach is more scenic than swimmable"],
      },
      plunge: {
        summary: "The couple-stay pick. Vlogs linger on the private plunge pool.",
        positives: ["Private plunge pool", "The spa-and-suite combo everyone films"],
        watchouts: ["Premium tariff — book it only if the pool is the point"],
      },
    },
  "mayfair-heritage-puri": {
      deluxe: {
        summary: "42 sqm heritage deluxe — solid base room.",
        positives: ["42 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "heritage-premium": {
        summary: "49 sqm heritage premium category.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-cottage": {
        summary: "42 sqm garden cottage.",
        positives: ["42 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "sea-view-cottage": {
        summary: "49 sqm cottage with sea outlook.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-suite": {
        summary: "53 sqm suite — more space than deluxe.",
        positives: ["53 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "family-suite": {
        summary: "76 sqm suite with two king beds.",
        positives: ["76 sqm", "two king-size beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "swosti-premium-beach-resort": {
      premium: {
        summary: "31.96 sqm premium room — up to 3 guests.",
        positives: ["31.96 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "sea-view-side": {
        summary: "31.96 sqm side sea view — up to 4.",
        positives: ["31.96 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "sea-view-front": {
        summary: "31.96 sqm front sea view — king bed.",
        positives: ["31.96 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      interconnecting: {
        summary: "Connecting rooms for families and groups.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "oasis-suite": {
        summary: "86.4 sqm suite — up to 3 guests.",
        positives: ["86.4 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "intimate-escape-suite": {
        summary: "86.4 sqm suite — up to 4 guests.",
        positives: ["86.4 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "imperial-suite": {
        summary: "110.55 sqm imperial suite — up to 4.",
        positives: ["110.55 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "royal-ambassador-suite": {
        summary: "179.4 sqm flagship suite — king bed.",
        positives: ["179.4 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "regenta-central-puri": {
      "deluxe-double-sea": {
        summary: "22 sqm double — balcony sea view.",
        positives: ["22 sqm", "double bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-twin-sea": {
        summary: "22 sqm twin beds — balcony sea view.",
        positives: ["22 sqm", "twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "executive-double-sea": {
        summary: "26 sqm executive double — balcony sea view.",
        positives: ["26 sqm", "double bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "executive-twin-sea": {
        summary: "26 sqm executive twin — balcony sea view.",
        positives: ["26 sqm", "twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-sea": {
        summary: "38 sqm premium — balcony sea view.",
        positives: ["38 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "hans-coco-palms": {
      "pool-garden": {
        summary: "28 sqm twin — pool or garden outlook.",
        positives: ["28 sqm", "twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "partial-ocean": {
        summary: "25 sqm king — balcony with partial ocean view.",
        positives: ["25 sqm", "king bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "ocean-suite": {
        summary: "66 sqm king suite with ocean view.",
        positives: ["66 sqm", "king bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "empires-hotel-puri": {
      executive: {
        summary: "21.83 sqm — twin or king bed.",
        positives: ["21.83 sqm", "twin / king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      deluxe: {
        summary: "51.1 sqm deluxe with king bed.",
        positives: ["51.1 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      corporate: {
        summary: "144.33 sqm corporate room — king bed.",
        positives: ["144.33 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      premium: {
        summary: "146.2 sqm premium room — king bed.",
        positives: ["146.2 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "mayfair-waves-puri": {
      premium: {
        summary: "49 sqm premium room — up to 2 adults and 1 child.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-sea-view": {
        summary: "49 sqm sea-view premium room.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-suite": {
        summary: "114 sqm suite — up to 2 adults and 2 children.",
        positives: ["114 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "toshali-sands-puri": {
      "standard-deluxe": {
        summary: "12.17 sqm standard deluxe with garden view.",
        positives: ["12.17 sqm", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-balcony": {
        summary: "Deluxe with balcony and garden view.",
        positives: ["Balcony", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-balcony": {
        summary: "Premium with balcony and garden view.",
        positives: ["Balcony", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "executive-suite": {
        summary: "Two-bedroom executive suite with garden view.",
        positives: ["Two bedrooms", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      cottage: {
        summary: "17.09 sqm cottage — king/twin with sofa cum bed.",
        positives: ["17.09 sqm", "Sofa cum bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      villa: {
        summary: "29.17 sqm villa — king/twin with sofa cum bed.",
        positives: ["29.17 sqm", "Sofa cum bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "chariot-resort-puri": {
      deluxe: {
        summary: "Deluxe category at The Chariot.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      executive: {
        summary: "Two queen-size beds — executive category.",
        positives: ["two queen-size beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      premium: {
        summary: "King-size bed — premium category.",
        positives: ["king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "platinum-suite": {
        summary: "Platinum suite — top Chariot category.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "chanakya-bnr-puri": {
      deluxe: {
        summary: "Heritage hotel deluxe category.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      superior: {
        summary: "King or twin beds — superior wing.",
        positives: ["king-size / twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "heritage-suite": {
        summary: "Heritage suite in the railway hotel.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "mahodadhi-palace-puri": {
      "heritage-deluxe-sea": {
        summary: "Heritage deluxe sea room in the palace wing.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "day-use": {
        summary: "Short-stay / day-use category from the hotel site.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "holiday-resort-puri": {
      "standard-double": {
        summary: "14.86 sqm standard double with sofa option.",
        positives: ["14.86 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-double": {
        summary: "14.86 sqm deluxe double with sofa option.",
        positives: ["14.86 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-pool-view": {
        summary: "14.86 sqm deluxe with pool outlook.",
        positives: ["14.86 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      family: {
        summary: "19.51 sqm — two queen beds plus sofa.",
        positives: ["19.51 sqm", "two queen-size beds plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "standard-family": {
        summary: "19.51 sqm standard family layout.",
        positives: ["19.51 sqm", "two queen-size beds plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      cottage: {
        summary: "23.23 sqm cottage with king bed and sofa.",
        positives: ["23.23 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "standard-cottage": {
        summary: "23.23 sqm standard cottage category.",
        positives: ["23.23 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "royal-suite": {
        summary: "27.87 sqm royal suite with king bed and sofa.",
        positives: ["27.87 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "presidential-suite": {
        summary: "37.16 sqm presidential suite.",
        positives: ["37.16 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
};
