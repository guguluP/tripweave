import type { CuratedVideo } from "./types.ts";

/**
 * Manually curated review videos per stay. Highest-signal vlogs first —
 * no Shorts, no ads, no hotel promo reels when a real stay-review exists.
 *
 * Adding a package later: append an entry here and a matching seed in
 * `seed.ts`. The seed sources and the saved-row cache key both read this map.
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
      title: "Is Swosti Premium Puri REALLY Worth New Year 2026? Shocking Truth!",
      channel: "Sanky & Swee Vlogs",
    },
    {
      videoId: "5Gmwnc6B71E",
      title: "Vacation with family at this Luxury Resort In Puri | Swosti Premium Beach Resort",
      channel: "Dipfreeze",
    },
    {
      videoId: "G6R5FNirOcY",
      title: "পুরীর সেরা রিসোর্ট। Swosti Premium Beach Resort Puri. best sea facing hotel in puri.",
      channel: "Katus Lifestyle",
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
      title: "first day in Puri Empires Hotel Puri Review",
      channel: "richa kishu vlogs",
    },
    {
      videoId: "6SvH9Hv32DU",
      title: "Experience LUXURY at Affordable Prices in Puri's Empires Hotel",
      channel: "Manoj Hela Vlogs",
    },
    {
      videoId: "k8rcWt78lJc",
      title: "Hotel Empires Puri My Full review",
      channel: "Journeys with Dwivid",
    },
  ],
  "mayfair-waves-puri": [
    {
      videoId: "ix-8HWQ8heg",
      title: "MAYFAIR Waves | Sea facing Luxury 5-Star Hotels in Puri",
      channel: "Review Wala",
    },
    {
      videoId: "ov0TpiWVKGg",
      title: "Mayfair waves resort, Puri, Odisha : Room tour",
      channel: "Monica Explains",
    },
  ],
  "toshali-sands-puri": [
    {
      videoId: "6Hl1vtib7GE",
      title: "TOSHALI SANDS PURI | Hotel Tour | PURI HOTELS | Odisha | Mustaq Sharif",
      channel: "MUSTAQ SHARIF",
    },
    {
      videoId: "RahjVg0t6nk",
      title: "Toshali Sands Puri private beach | Short visit to Puri | Day 4",
      channel: "Travel With TAGS",
    },
    {
      videoId: "ZOCBaU2Ignk",
      title: "TOSHALI SANDS RESORT// Cottage tour// Resort tour//puri resort",
      channel: "Create world vlogs",
    },
  ],
  "chariot-resort-puri": [
    {
      videoId: "pjy6OOe03wk",
      title: "A day in a Luxurious Hotel Near Sea Beach || The Chariot Resort & Spa",
      channel: "MOinsideHIT",
    },
    {
      videoId: "6pPT0cJmWuM",
      title: "A day in a Luxurious Hotel Near Sea Beach || The Chariot Resort & Spa Puri",
      channel: "Model Soumya Odia Vlogs",
    },
  ],
  "chanakya-bnr-puri": [
    {
      videoId: "puMmF_hN0Ic",
      title: "The Chanakya BNR Hotel Puri: India’s Most Iconic Heritage Luxury Stay!",
      channel: "Bong Passionate Traveller",
    },
    {
      videoId: "BZYN7wUZe8w",
      title: "Relaxing stay in Chanakya BNR Hotel Puri — Best Railway Heritage Hotel",
      channel: "Aalsee Riders",
    },
    {
      videoId: "zDBoax8k2qU",
      title: "Chanakya BNR Hotel Puri 2024 | The only Railway Theme Hotel in India",
      channel: "Embrace D'ordinaire",
    },
  ],
  "mahodadhi-palace-puri": [
    {
      videoId: "PZW2ibNBPv8",
      title: "Mahodadhi Palace Tour | Best Heritage Hotel In Puri",
      channel: "Backpacking With My Lens",
    },
    {
      videoId: "cYaF0LtwZ4k",
      title: "Stay at Mahodadhi Palace and Patrapada Chingudi",
      channel: "Food Drifter",
    },
  ],
  "holiday-resort-puri": [
    {
      videoId: "Wfvplc69Yio",
      title: "Budget Friendly Luxury Staycation in Puri | Hotel Holiday Resort Full Tour + Room Review",
      channel: "Food Travel Camp",
    },
    {
      videoId: "_GCIo7ETCp8",
      title: "Holiday Resorts, Puri - Room Tour & Review | Beachside Stay in Odisha!",
      channel: "Monica Explains",
    },
  ],
  "niladri-premium-puri": [
    {
      videoId: "K9fnbagwvtU",
      title: "Puri's Best Sea view hotel Niladri Premium honest review 2026",
      channel: "AB from Kutch",
    },
    {
      videoId: "yHdbPDHo6F8",
      title: "Expert Traveler Reveals BEST Budget Hotel In Puri | Hotel NILADRI PREMIUM Puri",
      channel: "Manoj Hela Vlogs",
    },
    {
      videoId: "VN5k5TuWatI",
      title: "Budget hotel in Puri || Hotel Niladri Premium Price || Room tour || Food",
      channel: "Sudipta's World",
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
