import type { CuratedVideo } from "./types.ts";

/**
 * Manually curated review videos per stay. Highest-signal vlogs first —
 * no Shorts, no ads, no hotel promo reels when a real stay-review exists.
 *
 * Adding a package later: append an entry here. The seed cache and the
 * live pipeline both read this map. `discover.ts` adds more stay-review
 * videos from the YouTube Data API when YOUTUBE_API_KEY is set. This list
 * stays the quality override and is never replaced by search.
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
  "mayfair-waves-puri": [
    {
      videoId: "ix-8HWQ8heg",
      title: "Mayfair Waves Puri — resort walkthrough",
      channel: "Stay vlog",
    },
    {
      videoId: "ov0TpiWVKGg",
      title: "Mayfair Waves — rooms, pool and buffet",
      channel: "Puri stay review",
    },
  ],
  "toshali-sands-puri": [
    {
      videoId: "6Hl1vtib7GE",
      title: "Toshali Sands Puri — cottage tour",
      channel: "Stay vlog",
    },
    {
      videoId: "RahjVg0t6nk",
      title: "Toshali Sands — campus, pool and beach",
      channel: "Family travel",
    },
    {
      videoId: "ZOCBaU2Ignk",
      title: "Family stay at Toshali Sands Puri",
      channel: "Guest vlog",
    },
  ],
  "chariot-resort-puri": [
    {
      videoId: "pjy6OOe03wk",
      title: "The Chariot Resort & Spa Puri — property tour",
      channel: "Stay vlog",
    },
    {
      videoId: "6pPT0cJmWuM",
      title: "Chariot Resort — rooms, spa and beach",
      channel: "Puri hotels",
    },
  ],
  "chanakya-bnr-puri": [
    {
      videoId: "puMmF_hN0Ic",
      title: "Chanakya BNR Hotel Puri — heritage stay",
      channel: "Stay vlog",
    },
    {
      videoId: "hNV9aKYwNto",
      title: "Chanakya BNR — rooms and station-side location",
      channel: "Puri hotels",
    },
  ],
  "mahodadhi-palace-puri": [
    {
      videoId: "PZW2ibNBPv8",
      title: "Mahodadhi Palace Puri — palace tour",
      channel: "Heritage stays",
    },
    {
      videoId: "80-nIH3wnUI",
      title: "Mahodadhi Palace — heritage rooms on the beach",
      channel: "Stay vlog",
    },
    {
      videoId: "lLhJ_hp3EVQ",
      title: "Palace stay and sea lawns",
      channel: "Puri travel",
    },
  ],
  "holiday-resort-puri": [
    {
      videoId: "Wfvplc69Yio",
      title: "Holiday Resort Puri — walkthrough",
      channel: "Stay vlog",
    },
    {
      videoId: "9mjuLwKBDT0",
      title: "Holiday Resort — rooms, lawn and pool",
      channel: "Family travel",
    },
    {
      videoId: "_GCIo7ETCp8",
      title: "Beach-side stay at Holiday Resort Puri",
      channel: "Puri hotels",
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
