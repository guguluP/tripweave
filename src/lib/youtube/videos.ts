import type { CuratedVideo } from "./types.ts";

/**
 * Manually curated review videos per stay. Highest-signal vlogs first —
 * no Shorts, no ads, no hotel promo reels when a real stay-review exists.
 *
 * Adding a package later: append an entry here. The seed cache and the
 * live pipeline both read this map.
 *
 * Later (not v1): a `discover.ts` helper can fill gaps with YouTube Data
 * API v3 search (~100 free search calls/day) filtered by views, recency,
 * and no Shorts. Keep this manual map as the quality override.
 */
export const PACKAGE_VIDEOS: Record<string, CuratedVideo[]> = {
  "taj-puri-resort-spa": [
    {
      videoId: "QRg6kAKT4TY",
      title: "My Luxury Stay at New Taj Puri Resort & Spa",
      channel: "MOinsideHIT",
    },
    {
      videoId: "02dHekawNDk",
      title: "Taj Puri Resort & Spa — honest hotel tour & food review",
      channel: "Bong Passionate Traveller",
    },
    {
      videoId: "809rJTgHVgI",
      title: "Room and property tour of Taj Puri Resort and Spa",
      channel: "Priyassha Bose",
    },
  ],
  "mayfair-heritage-puri": [
    {
      videoId: "kHI7YcZr-uw",
      title: "Mayfair Heritage Puri — room tour, best resort in Puri",
      channel: "Ridhima's Diary",
    },
    {
      videoId: "vqgxX0CC_Us",
      title: "Mayfair Heritage Puri + Mayfair Waves food",
      channel: "AviLini Diaries",
    },
    {
      videoId: "uquuV9tAlo0",
      title: "Mayfair Heritage Puri 2024 — real staying experience",
      channel: "SEN'S NEST",
    },
  ],
  "swosti-premium-beach-resort": [
    {
      videoId: "R8_m_xkYSzQ",
      title: "Is Swosti Premium Puri really worth it? Honest review",
      channel: "Sanky & Swee Vlogs",
    },
    {
      videoId: "5Gmwnc6B71E",
      title: "Family vacation at Swosti Premium Beach Resort",
      channel: "Dipfreeze",
    },
    {
      videoId: "G6R5FNirOcY",
      title: "Swosti Premium Beach Resort Puri — sea-facing stay",
      channel: "Travel vlog",
    },
  ],
  "regenta-central-puri": [
    {
      videoId: "SVbg3HhQLes",
      title: "Regenta Central Puri — beach-facing hotel walkthrough",
      channel: "Bristikatha",
    },
    {
      videoId: "nMCyrW5PFWM",
      title: "Hotel Regenta Central, Puri — stay review",
      channel: "Koeli Vlogs 2.0",
    },
    {
      videoId: "I5yaD4NyfTo",
      title: "Regenta Central Puri Odisha — rooms and amenities",
      channel: "Travel With Priya",
    },
  ],
  "hans-coco-palms": [
    {
      videoId: "CeqSkW6Nj5s",
      title: "Best budget luxury hotel in Puri — Hans Coco Palms",
      channel: "Manoj Hela Vlogs",
    },
    {
      videoId: "lRelrKmJ2ME",
      title: "The Hans Coco Palms Beach Resort Puri — sea-facing stay",
      channel: "New Beginnings Pallavi",
    },
    {
      videoId: "C_hvR4UIcDQ",
      title: "Last day at Puri — Hans Coco Palms resort and beach",
      channel: "Mr and Mrs Purohit",
    },
  ],
  "empires-hotel-puri": [
    {
      videoId: "mTgPxwJLB_c",
      title: "First day in Puri — Empires Hotel review",
      channel: "richa kishu vlogs",
    },
    {
      videoId: "CcgItlhsIPc",
      title: "Hotel Empires Puri — stay footage",
      channel: "Guest vlog",
    },
  ],
};

export function videosForPackage(packageId: string): CuratedVideo[] {
  return PACKAGE_VIDEOS[packageId] ?? [];
}

export function videoHash(packageId: string): string {
  const ids = videosForPackage(packageId)
    .map((v) => v.videoId)
    .join(",");
  return `${packageId}:${ids}`;
}
