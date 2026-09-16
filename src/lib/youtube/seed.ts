import type { PackageReviewConsensus, RoomReviewNotes } from "./types.ts";
import { youtubeUrl } from "./types.ts";
import { PACKAGE_VIDEOS } from "./videos.ts";

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

function rooms(notes: Record<string, RoomReviewNotes>) {
  return notes;
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
    roomNotes: rooms({
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
    }),
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
    roomNotes: rooms({
      deluxe: {
        summary: "The watch-out room. Confirm a balcony before you pay a sea-view rate.",
        positives: ["Main-building convenience", "Same Mayfair staff as the cottages"],
        watchouts: ["Deluxe can skip the balcony even when labelled sea-view"],
      },
      cottage: {
        summary: "Cottage with a balcony — the room reviewers actually want.",
        positives: ["Balcony and garden", "Quieter than the main block"],
        watchouts: ["Weddings on the lawns can still reach the cottages"],
      },
      "sea-cottage": {
        summary: "Sea-facing cottage is the Heritage stay the vlogs open on.",
        positives: ["Water outlook plus cottage space", "Beach chairs are a short walk"],
        watchouts: ["Peak-weekend rates; check the events diary"],
      },
    }),
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
    roomNotes: rooms({
      deluxe: {
        summary: "Modern interiors; some deluxe rooms look at the pool, not the sea.",
        positives: ["New-feeling rooms", "Easy for the infinity pool"],
        watchouts: ["You came for a sea hotel — confirm the outlook"],
      },
      sea: {
        summary: "Sea view is the room that makes the pool photos make sense.",
        positives: ["Water outlook", "Family vlogs like the space"],
        watchouts: ["Peak-date pricing still does not always match service"],
      },
      suite: {
        summary: "Extra space for families. Ask what dinner includes.",
        positives: ["Room to spread out", "Same beach access as the rest of the house"],
        watchouts: ["Breakfast-only vs buffet dinner changes the value a lot"],
      },
    }),
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
    roomNotes: rooms({
      superior: {
        summary: "Clean and compact. Fine if you are here for the temple, not the window.",
        positives: ["Breakfast buffet that people finish", "Walkable to town"],
        watchouts: ["Small for a 4-star rate"],
      },
      sea: {
        summary: "Pay for a full sea-facing room — partial views disappoint at this price.",
        positives: ["Beach-facing on New Marine Drive", "Same Odia kitchen as the rest"],
        watchouts: ["Still a compact hotel, not a resort"],
      },
      family: {
        summary: "Extra bed space, same small footprint. Fine for a short stay.",
        positives: ["Sleeps more without a second room", "Clean bathrooms"],
        watchouts: ["Extra beds make an already small room feel tighter"],
      },
    }),
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
    roomNotes: rooms({
      garden: {
        summary: "Ground-floor rooms face the lawn, not the sea. Come for the palms.",
        positives: ["Garden at the door", "Easy with bags and kids"],
        watchouts: ["No water outlook — that is the upper floors"],
      },
      pool: {
        summary: "Looks at the swimming pool — the reason families pick Hans.",
        positives: ["Pool view", "Same back-gate beach access"],
        watchouts: ["Bathrooms still need a refresh"],
      },
      sea: {
        summary: "Upper floors catch more of the water. Building is older.",
        positives: ["Best Hans outlook", "Palm garden still at your feet"],
        watchouts: ["Dated rooms; Wi-Fi and public AC are the usual complaints"],
      },
    }),
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
    roomNotes: rooms({
      standard: {
        summary: "A short-stay base for darshan. Eat out if the kitchen misses.",
        positives: ["Walk to the temple", "24-hour desk"],
        watchouts: ["Hygiene reports are mixed — keep it to one night"],
      },
      balcony: {
        summary: "The room walkthroughs actually like. Ask for a high floor.",
        positives: ["Balcony", "More air than the standard rooms"],
        watchouts: ["Food quality is still hit or miss"],
      },
      family: {
        summary: "More beds, same building. Hygiene reports are mixed.",
        positives: ["Sleeps a small family without two rooms"],
        watchouts: ["Not a holiday resort — one-night temple math only"],
      },
    }),
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
    roomNotes: rooms({
      deluxe: {
        summary: "Fine if you live at the pool. The window is not the stay.",
        positives: ["Same Waves buffet access", "Close to the club pool"],
        watchouts: ["Without a sea view it feels like a different hotel"],
      },
      sea: {
        summary: "Water outlook plus the Waves buffet — the usual booking.",
        positives: ["Sea view", "The food reviewers already know from Heritage"],
        watchouts: ["Club pool and events can run loud"],
      },
      suite: {
        summary: "Space and a sitting room. Check the lawn diary for functions.",
        positives: ["Room to sit", "Best Waves layout for a longer stay"],
        watchouts: ["Events on the lawn can run late"],
      },
    }),
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
    roomNotes: rooms({
      cottage: {
        summary: "Garden cottage. The stay is the campus, not a sea window.",
        positives: ["Lawn at the door", "Quiet at night compared with town hotels"],
        watchouts: ["You will cab into Puri for the temple"],
      },
      "sea-cottage": {
        summary: "Closer to the dunes. Confirm the actual outlook before paying.",
        positives: ["More breeze than the inner cottages", "Same campus pool"],
        watchouts: ["Some sea-view labels look at sand, not water"],
      },
      family: {
        summary: "Two rooms, lawn, parking at the door. Best for kids.",
        positives: ["Space to spread out", "Pool and lawn without a corridor"],
        watchouts: ["Service stretches when the campus is full"],
      },
    }),
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
    roomNotes: rooms({
      deluxe: {
        summary: "Garden or pool outlook. Solid if you came for the spa.",
        positives: ["Quiet wing", "Easy for the pool and treatment rooms"],
        watchouts: ["You came south for the beach — the window may not show it"],
      },
      sea: {
        summary: "Direct water. This is the Chariot room people film.",
        positives: ["Sea outlook", "Quieter sand than Marine Drive"],
        watchouts: ["Temple is a ride, not a walk"],
      },
      villa: {
        summary: "Separate sitting room and a lawn. Family and group pick.",
        positives: ["Space", "Lawn at the door"],
        watchouts: ["Food is still mid — eat for convenience, not for the kitchen"],
      },
    }),
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
    roomNotes: rooms({
      heritage: {
        summary: "Old-wing charm. The building is the story, not the bathroom.",
        positives: ["Character", "Photogenic lobby and corridors"],
        watchouts: ["AC and bathrooms are the usual complaints"],
      },
      deluxe: {
        summary: "Newer block. Quieter AC, less character, better sleep.",
        positives: ["Sleeps better than the old wing", "Same station-side location"],
        watchouts: ["You lose some of the heritage feeling"],
      },
      suite: {
        summary: "Sitting room in a railway hotel. Oddly grand for a 1-night stop.",
        positives: ["Space to sit after darshan", "The most comfortable BNR layout"],
        watchouts: ["Still not a beach stay — sand is a trip"],
      },
    }),
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
    roomNotes: rooms({
      palace: {
        summary: "Heritage interiors. Some rooms look at the courtyard, not the sea.",
        positives: ["Period rooms", "Palace lawns at breakfast"],
        watchouts: ["Confirm the outlook — courtyard is not the water"],
      },
      sea: {
        summary: "The room the vlogs open on — lawn, then water.",
        positives: ["Sea outlook", "The statement Mahodadhi stay"],
        watchouts: ["Heritage plumbing is not Taj-new"],
      },
      suite: {
        summary: "Sitting room and period furniture. A one-night splurge.",
        positives: ["Space and furniture with a story", "Best palace layout"],
        watchouts: ["Premium tariff for a short stay"],
      },
    }),
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
    roomNotes: rooms({
      standard: {
        summary: "Older wing. Come for the lawn and the pool, not a new bathroom.",
        positives: ["Lowest rate on the sand", "Same pool and lawn as the rest"],
        watchouts: ["Bathrooms show their age — skip if you can pay for sea view"],
      },
      sea: {
        summary: "Upper floors look at the water. Ask for a renovated bath.",
        positives: ["Sea outlook", "The room that makes the rate feel fair"],
        watchouts: ["Confirm a renovated bathroom before you arrive"],
      },
      family: {
        summary: "Extra beds and a lawn at the door. The value family pick.",
        positives: ["Space for kids", "Lawn access without a corridor"],
        watchouts: ["Holiday crowds fill the lawn — book mid-week if you can"],
      },
    }),
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
