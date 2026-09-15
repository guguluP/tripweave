import type { PackageReviewConsensus } from "./types.ts";
import { youtubeUrl } from "./types.ts";
import { PACKAGE_VIDEOS } from "./videos.ts";

/**
 * Curated consensus for demo / offline mode.
 * Written from the actual stay-review videos mapped in `videos.ts`
 * (plus corroborating public guest notes). Live rebuilds overwrite
 * this in memory / Supabase when transcripts and the LLM succeed.
 */
const SEEDED_AT = "2026-09-14T06:00:00.000Z";

function sources(
  packageId: string,
  langs: string[],
): PackageReviewConsensus["sources"] {
  return (PACKAGE_VIDEOS[packageId] ?? []).map((v, i) => ({
    videoId: v.videoId,
    title: v.title,
    url: youtubeUrl(v.videoId),
    language: langs[i] ?? "hi",
    isGenerated: true,
  }));
}

export const SEED_CONSENSUS: Record<string, PackageReviewConsensus> = {
  "taj-puri-resort-spa": {
    packageId: "taj-puri-resort-spa",
    overallSentiment: "positive",
    keyPositives: [
      "Newest 5-star in Puri — rooms and suites feel genuinely new",
      "Warm Taj service; named staff keep coming up in vlogs",
      "Odia thali, high tea, and evening Samudra aarti on the lawn",
      "Spa and plunge-pool rooms are the highlight for couples",
      "Quieter stretch of Balukhand, away from the town crush",
    ],
    keyNegatives: [
      "Breakfast meat options are thin for the rate",
      "Private beach is more scenic than swimmable",
    ],
    caveats: [
      "Still a new property — some edges of service are settling in",
      "Premium tariff; book a sea-facing or plunge-pool room if that is the point",
    ],
    consensusSummary:
      "Reviewers treat Taj Puri as the new flagship stay in town. The vlogs dwell on rooms, spa, food, and the cultural hour on the lawn more than the beach itself. Most would book again for a quiet, full-service 5-star — not for a classic Puri sea-swim holiday.",
    sources: sources("taj-puri-resort-spa", ["hi", "bn", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "mayfair-heritage-puri": {
    packageId: "mayfair-heritage-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Garden campus and beachfront chairs — the reason people pick Mayfair",
      "Staff warmth is the most repeated line in stay vlogs",
      "Waves buffet and Odia-Bengali plates get honest praise",
      "Cottage rooms with a balcony beat deluxe rooms for the view",
      "Temple is a short ride; the resort itself stays calmer than town",
    ],
    keyNegatives: [
      "Deluxe rooms can skip the balcony even when labelled sea-view",
      "Restaurant service slows when the house is full",
      "Wedding functions by the pool can run loud into the evening",
    ],
    caveats: [
      "Book the cottage, not the cheapest deluxe, if the sea is the point",
      "Ask about events on your dates — heritage lawns host weddings",
    ],
    consensusSummary:
      "Mayfair Heritage is the stay reviewers recommend when they want gardens, a quieter beach, and old-school hospitality. Food and staff carry the score. The watch-outs are specific: skip a no-balcony deluxe, and check the events diary before you pay peak rates.",
    sources: sources("mayfair-heritage-puri", ["hi", "en", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "swosti-premium-beach-resort": {
    packageId: "swosti-premium-beach-resort",
    overallSentiment: "mixed",
    keyPositives: [
      "Sea-facing rooms and an infinity pool that actually looks at the water",
      "Modern interiors; family vlogs like the space and the beach access",
      "Location on Marine Drive is easy for temple and beach both",
    ],
    keyNegatives: [
      "Peak-date pricing (New Year especially) does not always match the service",
      "Buffet gaps and slow service show up in honest reviews",
      "5-star marketing vs a still-new operation",
    ],
    caveats: [
      "Strong pick for a sea-view room off-peak; haggle or skip festival weekends",
      "Ask what is included — breakfast-only vs buffet dinner changes the value",
    ],
    consensusSummary:
      "Reviewers like how Swosti looks — pool, rooms, beach — more than how it runs on busy nights. Family vlogs are warmer than the ‘is it worth it?’ videos. Book it for the view on a normal weekend; do not expect Taj-level service at festival rates.",
    sources: sources("swosti-premium-beach-resort", ["hi", "hi", "bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "regenta-central-puri": {
    packageId: "regenta-central-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Beach-facing on New Marine Drive, a short walk to Golden Beach",
      "Clean rooms and a breakfast buffet that reviewers actually finish",
      "Odia kitchen (dalma, santula) gets named praise",
      "Staff are willing even when the house is new",
    ],
    keyNegatives: [
      "Rooms run small for a 4-star rate, especially with extra beds",
      "Some vloggers clock it as a polished 3-star, not a full resort",
      "Front desk and phones can be slow to answer",
    ],
    caveats: [
      "Pay for a full sea-facing room — partial views disappoint at this price",
      "Fine for a clean beach night; not a sprawling resort stay",
    ],
    consensusSummary:
      "Regenta Central is the honest mid-range beach hotel in the set: clean, close to the water, decent Odia food. Reviewers split on whether the rate matches the room size. Book sea-facing, keep expectations at a compact 4-star, and it works.",
    sources: sources("regenta-central-puri", ["bn", "hi", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "hans-coco-palms": {
    packageId: "hans-coco-palms",
    overallSentiment: "positive",
    keyPositives: [
      "Palm garden, a proper swimming pool, and a back gate onto the beach",
      "Staff and room service get warmer notes than the building itself",
      "Honest value — reviewers call it budget-luxury, not 5-star",
      "Easy for families: parking, lawn, and the beach without a cab",
    ],
    keyNegatives: [
      "Rooms and bathrooms need a refresh; some feel dated",
      "Public-area AC and Wi-Fi are the usual complaints",
      "Breakfast spread is fine, not a reason to stay",
    ],
    caveats: [
      "Come for garden + beach + pool, not for a new-build room",
      "Upper floors catch more of the sea; ground-floor rooms face the lawn",
    ],
    consensusSummary:
      "Hans Coco Palms is the stay reviewers pick when they want a garden and a pool without Mayfair money. The building is older; the location and the team carry it. Fair if you want value on the sand — skip it if you need a renovated bathroom.",
    sources: sources("hans-coco-palms", ["hi", "en", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "empires-hotel-puri": {
    packageId: "empires-hotel-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Walkable for a temple-first trip; desk is 24 hours",
      "Some guests like the room size and the balcony",
      "Price is the point — a short stay, not a holiday resort",
    ],
    keyNegatives: [
      "Hygiene and food quality are inconsistent across vlogs",
      "4-star tagging does not match several stay reports",
      "Basic in-room kit (dryer, slippers) is hit or miss",
    ],
    caveats: [
      "Use it as a clean-enough base for darshan, not as the holiday",
      "Eat out if the in-house kitchen does not land on day one",
    ],
    consensusSummary:
      "Empires splits reviewers. A few walkthroughs show a decent room and a balcony; longer stay reports flag smell, washrooms, and food. For a one-night temple trip at a value rate it can work. For a beach week, look at the Marine Drive stays instead.",
    sources: sources("empires-hotel-puri", ["hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
};

export function getSeededConsensus(
  packageId: string,
): PackageReviewConsensus | null {
  return SEED_CONSENSUS[packageId] ?? null;
}

export function listSeededPackageIds() {
  return Object.keys(SEED_CONSENSUS);
}
