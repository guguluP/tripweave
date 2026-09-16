import type { RoomReviewNotes } from "./types.ts";

/** Seeded room notes aligned to official Taj Puri room ids. */
export const TAJ_PURI_ROOM_NOTES: Record<string, RoomReviewNotes> = {
  "superior-king-balcony": {
    summary: "Honest Taj base — new finish and a balcony, without the sea premium.",
    positives: ["Genuinely new rooms and bathrooms", "Balcony without the sea-view tariff"],
    watchouts: ["No sea outlook — skip if water is why you booked Taj"],
  },
  "superior-twin-balcony": {
    summary: "Same superior base as the king, twin beds for sharing.",
    positives: ["Twin layout for friends or kids", "Balcony on the base rate"],
    watchouts: ["Still garden/resort facing, not sea"],
  },
  "superior-sea-king": {
    summary: "Entry sea-view king — the first room that feels like Taj Puri.",
    positives: ["Sea outlook with balcony", "Same new-build finish as superior"],
    watchouts: ["Private beach is more scenic than swimmable"],
  },
  "superior-sea-twin": {
    summary: "Sea-view twin for families who want water without a suite.",
    positives: ["Sea balcony", "Twin beds for sharing"],
    watchouts: ["Still a standard room size, not a suite"],
  },
  "deluxe-sea-king": {
    summary: "The deluxe sea king is what reviewers mean when they say Taj Puri.",
    positives: ["Fuller sea outlook", "Slightly larger than superior sea"],
    watchouts: ["Premium over superior sea — worth it if the view is the point"],
  },
  "deluxe-sea-twin": {
    summary: "Deluxe sea twin — same outlook, twin beds for groups.",
    positives: ["Sea balcony at deluxe size", "Twin layout"],
    watchouts: ["Confirm twin if you need separate beds"],
  },
  "luxury-sea-king": {
    summary: "Larger sea-view king — more room to linger than deluxe.",
    positives: ["~58 sqm sea-view space", "Balcony with water outlook"],
    watchouts: ["Still a room, not a suite living area"],
  },
  "grand-plunge-king": {
    summary: "The couple-stay pick. Vlogs linger on the private plunge pool.",
    positives: ["Private plunge pool", "The spa-and-suite combo everyone films"],
    watchouts: ["Premium tariff — book only if the pool is the point"],
  },
  "grand-plunge-twin": {
    summary: "Plunge-pool grand luxury with twin beds for sharing.",
    positives: ["Private plunge pool", "Twin layout at the grand tier"],
    watchouts: ["Plunge rooms sell out on peak weekends"],
  },
  "executive-sea-suite": {
    summary: "Proper suite space with sea balcony — step up from rooms.",
    positives: ["~97 sqm suite", "Sea view with balcony"],
    watchouts: ["Suite rate; confirm living area layout on booking"],
  },
  "luxury-sea-suite": {
    summary: "Larger sea suite — more living space than executive.",
    positives: ["~112 sqm", "Sea balcony suite"],
    watchouts: ["Premium over executive — check what you gain in layout"],
  },
  "presidential-sea-pool": {
    summary: "Top-tier presidential with private pool and sea outlook.",
    positives: ["235 sqm footprint", "Private pool plus sea view"],
    watchouts: ["Highest tariff on property — for celebrations, not a casual stay"],
  },
};
