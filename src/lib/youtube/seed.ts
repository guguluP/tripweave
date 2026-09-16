import type { PackageReviewConsensus } from "./types.ts";
import { youtubeUrl } from "./types.ts";
import { PACKAGE_VIDEOS } from "./videos.ts";
import { SEED_ROOM_NOTES } from "./seed-room-notes.ts";

/**
 * Curated consensus for demo / offline mode.
 * Written from the actual stay-review videos mapped in `videos.ts`
 * (plus corroborating public guest notes). Live rebuilds overwrite
 * this in memory / Supabase when transcripts and the LLM succeed.
 */
const SEEDED_AT = "2026-09-15T06:00:00.000Z";

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
    roomNotes: SEED_ROOM_NOTES["taj-puri-resort-spa"],
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
    roomNotes: SEED_ROOM_NOTES["mayfair-heritage-puri"],
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
    roomNotes: SEED_ROOM_NOTES["swosti-premium-beach-resort"],
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
    roomNotes: SEED_ROOM_NOTES["regenta-central-puri"],
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
    roomNotes: SEED_ROOM_NOTES["hans-coco-palms"],
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
    roomNotes: SEED_ROOM_NOTES["empires-hotel-puri"],
  },
  "mayfair-waves-puri": {
    packageId: "mayfair-waves-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Beach-club energy: pool, buffet, and a louder waterfront than Heritage",
      "Waves kitchen is the food people already praise next door",
      "Staff warmth carries over from the Mayfair family",
      "Easy for a 3-night beach stay without going into town much",
    ],
    keyNegatives: [
      "Louder than Heritage — events and the club pool carry",
      "Deluxe rooms without a sea view feel like a different hotel",
    ],
    caveats: [
      "Pick Waves for the pool and buffet, Heritage for gardens and quiet",
      "Ask about functions on your dates",
    ],
    consensusSummary:
      "Mayfair Waves is the beach-club sister: same kitchen and staff notes as Heritage, more pool and less garden. Reviewers who want a quieter campus send you next door. Book a sea-view room and it holds up as a premium Puri beach stay.",
    sources: sources("mayfair-waves-puri", ["hi", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["mayfair-waves-puri"],
  },
  "toshali-sands-puri": {
    packageId: "toshali-sands-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Cottage campus — lawns, pool, and parking at the door",
      "Already on the Konark road, so the Sun Temple is a short hop",
      "Family vlogs like the space and the kids’ pool time",
      "Honest mid-range: you are paying for campus, not marble",
    ],
    keyNegatives: [
      "Not a sea-window hotel; some ‘sea view’ cottages look at dunes",
      "Service stretches when the campus is full",
      "A cab into temple-town Puri is part of the stay",
    ],
    caveats: [
      "Book it for gardens and Konark, not for a Marine Drive sea room",
      "Confirm the cottage outlook if a water view is why you clicked",
    ],
    consensusSummary:
      "Toshali Sands is the stay reviewers pick for a cottage campus and a Konark day, not for a classic Puri sea-window. Families like the lawns and the pool. Confirm what ‘sea view’ actually means, and budget a cab when you want Jagannath.",
    sources: sources("toshali-sands-puri", ["hi", "hi", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["toshali-sands-puri"],
  },
  "chariot-resort-puri": {
    packageId: "chariot-resort-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Quieter stretch of Balukhand sand than the main beach road",
      "Spa and lawns get warmer notes than the restaurant",
      "Sea-view rooms are the ones people actually film",
      "Good 3-night slow stay if you do not need to be in town",
    ],
    keyNegatives: [
      "A ride into the temple, not a walk",
      "Food is fine, not a reason to pick Chariot over Mayfair",
    ],
    caveats: [
      "Book sea view if the beach is why you came south of town",
      "Plan temple time as a trip, not a stroll",
    ],
    consensusSummary:
      "Chariot sits south of the crush — spa, lawns, and a quieter beach. Reviewers who want Jagannath at the door pick town hotels instead. Pay for a sea-view room, keep the restaurant expectations mid, and it works as a slow Puri stay.",
    sources: sources("chariot-resort-puri", ["hi", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["chariot-resort-puri"],
  },
  "chanakya-bnr-puri": {
    packageId: "chanakya-bnr-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Historic railway hotel — the building is the reason to stay",
      "Station and temple are both a short hop",
      "A clean-enough one-night base for darshan and an early train",
      "Heritage lobby and old-wing rooms photograph well",
    ],
    keyNegatives: [
      "Old wing bathrooms and AC are the usual complaints",
      "Not a beach holiday — sand is a ride or a long walk",
      "Food is railway-hotel, not a destination kitchen",
    ],
    caveats: [
      "Book the newer deluxe if you care about sleep more than character",
      "One night is the stay reviewers actually recommend",
    ],
    consensusSummary:
      "Chanakya BNR is a heritage railway hotel, not a beach resort. Reviewers who want character and a temple-first night are warmer than people who expected a renovated 4-star. One night in a deluxe room, walk to Jagannath, catch the train — that is the use case.",
    sources: sources("chanakya-bnr-puri", ["hi", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["chanakya-bnr-puri"],
  },
  "mahodadhi-palace-puri": {
    packageId: "mahodadhi-palace-puri",
    overallSentiment: "positive",
    keyPositives: [
      "A real palace on the beach — lawns, period rooms, sea air",
      "One-night statement stay that reviewers actually film",
      "Heritage interiors without leaving the waterfront",
      "Temple is a short ride; the lawns stay calmer than Grand Road",
    ],
    keyNegatives: [
      "Some palace rooms look at the courtyard, not the sea",
      "Heritage means quirks — plumbing and AC are not Taj-new",
      "Tariff is premium for a short stay",
    ],
    caveats: [
      "Pay for a sea-view palace room if the lawn-and-water shot is why you booked",
      "Treat it as one special night, not a week-long resort",
    ],
    consensusSummary:
      "Mahodadhi Palace is the heritage one-night stay on the sand. Vlogs open on the lawns and the period rooms. Book a sea-view palace room, eat on the lawn, and leave before the quirks of an old building become the stay. Reviewers who wanted a modern 5-star send you to Taj instead.",
    sources: sources("mahodadhi-palace-puri", ["hi", "en", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["mahodadhi-palace-puri"],
  },
  "holiday-resort-puri": {
    packageId: "holiday-resort-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Long-running beach resort — lawns, a pool, and prices that still make sense",
      "Families like the lawn and the fact the beach is right there",
      "Staff who have been around; not a new-build experiment",
      "Honest value if you pick a renovated sea-view room",
    ],
    keyNegatives: [
      "Older wing rooms and bathrooms show their age",
      "Food is cafeteria-beach, not a reason to stay in",
      "Busy on holidays — the lawn fills up",
    ],
    caveats: [
      "Ask for a renovated sea-view room; skip the cheapest old wing",
      "Come for sand and a pool, not for a boutique interior",
    ],
    consensusSummary:
      "Holiday Resort is the old Puri beach hotel people still book because the lawn, the pool, and the price hold up. Reviewers who land in an unrenovated standard room are cooler than people who paid for sea view. Two nights, swim, walk the sand, eat out.",
    sources: sources("holiday-resort-puri", ["hi", "hi", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["holiday-resort-puri"],
  },
};
