import type { PackageReviewConsensus } from "./types.ts";
import { youtubeUrl } from "./types.ts";
import { PACKAGE_VIDEOS } from "./videos.ts";
import { SEED_ROOM_NOTES } from "./seed-room-notes.ts";

/**
 * Curated consensus for demo / offline mode.
 * Written from the actual stay-review videos mapped in `videos.ts`
 * (plus corroborating public guest notes). A saved `reviewer_consensus`
 * row for the same videos takes precedence; otherwise this is what shows.
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
    sources: sources("empires-hotel-puri", ["hi", "hi", "en"]),
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
    sources: sources("chanakya-bnr-puri", ["bn", "en", "en"]),
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
    sources: sources("mahodadhi-palace-puri", ["en", "en"]),
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
    sources: sources("holiday-resort-puri", ["en", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["holiday-resort-puri"],
  },
  "niladri-premium-puri": {
    packageId: "niladri-premium-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Independent reviews tour the sea-view and deluxe rooms on New Marine Drive in Baliapanda",
      "Official tariff includes breakfast for two in both Deluxe and Premium rooms",
      "Beach is immediately across the road; the official site and reviews both flag a swimming pool",
    ],
    keyNegatives: [
      "Guests quoted on the official site say some rooms run small compared with other hotels",
      "An official-site guest note says the beach side is still being developed and the swimming beach is not highly suitable",
    ],
    caveats: [
      "Official Deluxe is ₹6,000 and Premium ₹7,000, breakfast for two — confirm the view and GST when you book",
      "The official page itself publishes mixed guest notes on room size and the beach",
    ],
    consensusSummary:
      "Independent 2026 stay reviews treat Hotel Niladri Premium as a sea-facing New Marine Drive hotel, with room tours, breakfast, and a published official tariff. The official site also posts guest notes that some rooms are small and that the beach in front is still being developed. Book a sea-view room if the water is the point, and treat the official Deluxe rate as the catalog base.",
    sources: sources("niladri-premium-puri", ["hi", "hi", "bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["niladri-premium-puri"],
  },
  "blue-lily-puri": {
    packageId: "blue-lily-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Large, clean rooms, many with kitchenettes (sink, fridge, kettle)",
      "Big pool with a dolphin mosaic and a large separate lawn",
      "Varied room options: standard, suite, and two-bedroom family suite",
      "Well-kept courtyard",
    ],
    keyNegatives: [
      "No sea-view rooms shown — balconies face the courtyard, and one family-suite window looks onto an electrical transformer",
      "Food and breakfast were not shown in any video",
      "Pool water looked cloudy in one video",
    ],
    caveats: [
      "On-screen prices in Manoj Hela's video: standard ₹5,000 + tax, ground-floor room ₹7,000 + tax, family suite ₹10,000 + tax",
      "One video shows only corridors and the pool, so it is weak evidence",
      "Location on the videos: New Marine Drive Road, Baliapanda",
    ],
    consensusSummary:
      "Reviewers present Blue Lily as a positive stay with large, clean rooms (many with kitchenettes), a big pool and lawn, and a well-kept courtyard on New Marine Drive in Baliapanda. No sea-view rooms were shown — balconies face the courtyard — and food and breakfast do not appear in the videos. Pool water looked cloudy in one video. On-screen rates were ₹5,000 + tax for a standard room, ₹7,000 + tax for a ground-floor room, and ₹10,000 + tax for a family suite.",
    sources: sources("blue-lily-puri", ["hi", "hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["blue-lily-puri"],
  },
  "camellia-puri": {
    packageId: "camellia-puri",
    overallSentiment: "positive",
    keyPositives: [
      "On Marine Drive, directly across the road from the beach",
      "Clean, modern rooms with geyser, hair dryer, tea/coffee and minibar",
      "Swimming pool, billiards, terrace and garden with a night bonfire",
      "In-house restaurant (Zaika) with room service, and a welcome drink at check-in",
    ],
    keyNegatives: [
      "The pool is overlooked from the upper corridors — one reviewer felt uncomfortable using it",
      "The pool is unheated and cold in December, and synthetic swimwear is mandatory",
      "Restaurant food is a bit costly",
      "One room's window view was partly blocked by bamboo scaffolding",
    ],
    caveats: [
      "Vloggers quoted side sea view at ₹4,000–4,500, front sea view at ₹5,000–6,000, a suite at ₹8,000 + GST, and an extra bed at ₹1,000",
      "One overview video with a price list reads as promotional and should be given less weight",
    ],
    consensusSummary:
      "Reviewers treat Camellia as a positive Marine Drive stay directly across the road from the beach, with clean modern rooms, a pool, billiards, a terrace and garden, and an in-house restaurant (Zaika). Caveats are a pool overlooked from upper corridors and cold in December, mandatory synthetic swimwear, rather costly restaurant food, and one window partly blocked by scaffolding. Quoted rates were about ₹4,000–4,500 for side sea view, ₹5,000–6,000 for front sea view, and ₹8,000 + GST for a suite.",
    sources: sources("camellia-puri", ["hi", "hi", "bn", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["camellia-puri"],
  },
  "dreamland-puri": {
    packageId: "dreamland-puri",
    overallSentiment: "positive",
    keyPositives: [
      "On New Marine Drive near the lighthouse, across the road from a clean, quieter stretch of beach",
      "Front rooms have an unobstructed sea view from the balcony",
      "Modern, clean rooms with a smart TV, fridge and kettle",
      "Bay View in-house restaurant — one video says the Bengali lunch was good and reasonably priced, another says the food is good but costly",
    ],
    keyNegatives: [
      "Back and some side rooms look onto a construction site, and their upkeep is weaker than the front rooms'",
      "Bathrooms are compact, and rooms are a bit smaller than at Sonar Bangla next door",
      "On-screen text in one video says checkout is 7:00 AM and parking needs work",
      "One reviewer warns about fake hotel phone numbers on Google",
    ],
    caveats: [
      "Sentiment is positive if you book a front sea-facing room",
      "Tariff board shown in the videos: ₹2,000 to ₹6,000 + 12% GST by room type; room 603 (front sea view) was ₹5,600 for 2 adults with breakfast",
    ],
    consensusSummary:
      "Reviewers are positive on Hotel Dreamland when you book a front sea-facing room: it sits on New Marine Drive near the lighthouse, across a cleaner, quieter stretch of beach, with modern rooms and an unobstructed balcony sea view. Back and some side rooms look onto a construction site and are less well kept; bathrooms are compact. A tariff board showed ₹2,000 to ₹6,000 + 12% GST, and room 603 (front sea view) was ₹5,600 for two adults with breakfast. One reviewer warns about fake hotel phone numbers on Google.",
    sources: sources("dreamland-puri", ["hi", "hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["dreamland-puri"],
  },
  "fortune-beachfront-puri": {
    packageId: "fortune-beachfront-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Unobstructed sea views from sea-front rooms, the infinity pool and the rooftop",
      "New, clean white-and-blue rooms",
      "Good food and a wide breakfast buffet at Zodiac",
      "Gym, souvenir shop, and evening Odissi dance and aarti on the lawn",
      "A solo woman traveller felt safe and well looked after",
    ],
    keyNegatives: [
      "Expensive rooms and restaurants",
      "The breakfast restaurant gets crowded",
      "The minibar, including water, is chargeable",
      "The bathroom is compact",
    ],
    caveats: [
      "Sea-front rooms were about ₹11,000+ plus GST with breakfast; a 3-person room listed at ₹13,000+ was booked for about ₹10,000 on discount",
      "On Baliapanda, across the road from the beach, near the lighthouse",
    ],
    consensusSummary:
      "The genuine guest videos are positive on Fortune Beachfront: unobstructed sea views from sea-front rooms, the infinity pool and the rooftop; new clean rooms; a wide breakfast buffet at Zodiac; and a gym, souvenir shop, and evening Odissi dance and aarti on the lawn. A solo woman traveller felt safe. The stay is expensive — sea-front about ₹11,000+ plus GST with breakfast — the breakfast room gets crowded, the minibar including water is chargeable, and bathrooms are compact. It sits in Baliapanda, across the road from the beach near the lighthouse.",
    sources: sources("fortune-beachfront-puri", ["hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["fortune-beachfront-puri"],
  },
  "golden-dust-puri": {
    packageId: "golden-dust-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Marine Drive, across the road from a quiet beach, 3–4 km from crowded Swargadwar",
      "Polite staff",
      "Sea-view dining hall and rooftop terrace",
      "Free Wi-Fi and CCTV",
    ],
    keyNegatives: [
      "Frequent power cuts, and backup runs only one fan and one light — no AC or geyser",
      "Very weak Jio signal inside",
      "In-house food is costly",
      "Room A-2 had visible damp and peeling paint by the bed, and there is extension construction on site",
      "No lift, alcohol is prohibited, and the cheaper room's balcony faces a wall or at best a partial side sea view",
      "Autos to town add cost",
    ],
    caveats: [
      "Mixed, leaning positive for budget travellers — one reviewer scored rooms 3/5, location 5/5, staff 5/5",
      "A guest said AC rooms run ₹1,500–2,000; menu tea ₹20, coffee ₹30",
    ],
    consensusSummary:
      "Independent reviews of Golden Dust are mixed, leaning positive for budget travellers. Location and staff score well — Marine Drive across a quiet beach, 3–4 km from Swargadwar, with a sea-view dining hall and rooftop — but rooms had damp and peeling paint in one case, power cuts leave only a fan and a light on backup, Jio signal is very weak inside, and in-house food is costly. A guest said AC rooms run ₹1,500–2,000. One reviewer scored rooms 3/5, location 5/5 and staff 5/5.",
    sources: sources("golden-dust-puri", ["hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["golden-dust-puri"],
  },
  "golden-tree-puri": {
    packageId: "golden-tree-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Swargadwar Road, right across from the beach and night market",
      "Balconies with sea views — front in premium rooms, side in super deluxe — and a sea-facing common terrace",
      "Free buffet breakfast at Surfer's Restaurant with a wide spread, plus free snacks and RO water in glass bottles",
      "Staff praised as prompt and polite",
    ],
    keyNegatives: [
      "Super deluxe rooms are small for over ₹5,000",
      "One guest found the bathroom dirty at check-in and the exhaust fan broken; another called the bathroom decent, nothing special",
      "Glass balcony doors make the room bright during the day",
      "The front section of the rooftop was locked for maintenance",
      "In-house food is pricey with GST",
    ],
    caveats: [
      "Guests quoted ₹5,040/night direct for super deluxe (MMT showed about ₹6,200), ₹6,390 for premium room 404, and about ₹7,500/day for room 305",
      "Staff rates in a promo video: super deluxe ₹5,500, premium ₹6,500, Golden Blue front sea view ₹7,400 + GST",
    ],
    consensusSummary:
      "Guest reviews of Hotel Golden Tree are positive, with caveats on room size and bathrooms. It sits on Swargadwar Road across from the beach and night market, with sea-view balconies, a free breakfast buffet at Surfer's Restaurant, and staff described as prompt and polite. Super deluxe rooms feel small for over ₹5,000, and bathrooms drew complaints of dirt at check-in, a broken exhaust, or being merely decent. Guests quoted about ₹5,040 direct for super deluxe, ₹6,390 for premium room 404, and about ₹7,500/day for room 305.",
    sources: sources("golden-tree-puri", ["hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["golden-tree-puri"],
  },
  "hotel-bishnu-bhaban": {
    packageId: "hotel-bishnu-bhaban",
    overallSentiment: "positive",
    keyPositives: [
      "Directly opposite the Jagannath Temple western gate, with the temple visible from the entrance",
      "Clean basic rooms and bathrooms with a western toilet and shower",
      "Large, freshly painted building with wide, lit corridors",
      "Affordable for families — the Bengali reviewer said double non-AC from ₹1,200 and 4-bed non-AC ₹1,500",
    ],
    keyNegatives: [
      "Not near the beach, and there is no sea view",
      "The approach is through narrow, congested market lanes",
      "Basic budget rooms with no frills",
      "Food, breakfast and staff were not shown",
    ],
    caveats: [
      "A simple, affordable temple-side stay, not a beach hotel",
    ],
    consensusSummary:
      "Two guest videos treat Hotel Bishnu Bhaban as a positive, affordable stay directly opposite the Jagannath Temple western gate, with clean basic rooms and a large, freshly painted building. It is not near the beach, the approach is through narrow congested market lanes, and food, breakfast and staff were not shown. The Bengali reviewer cited double non-AC from ₹1,200 and 4-bed non-AC at ₹1,500.",
    sources: sources("hotel-bishnu-bhaban", ["hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-bishnu-bhaban"],
  },
  "hotel-golden-palace-puri": {
    packageId: "hotel-golden-palace-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "VIP Road, with its own gate onto the Blue Flag beach (₹20 entry)",
      "3rd-floor sea-facing rooms with big balconies and an unobstructed sea view",
      "Good restaurant food at fair prices, and a wide breakfast buffet",
      "Pool and kids' play area",
      "Staff moved one guest to a better-view room and stored luggage before check-in",
    ],
    keyNegatives: [
      "One family's room (2016) flooded through the balcony windows in a storm, staff ignored repeated calls for paid extra bedding, and a ₹20 MRP water bottle was charged ₹41",
      "The pool was poorly maintained or closed, and the jacuzzi was off",
      "Bathrooms feel cramped, and breakfast luchi was cold",
      "Reviewers warn about fake booking numbers online and advise booking direct",
    ],
    caveats: [
      "Two reviews were positive and one was strongly negative",
      "A guest quoted pool-facing ₹5,000 + GST, sea-facing ₹7,000 + GST, suite ₹9,500, and breakfast buffet ₹295/person for non-inclusive bookings",
    ],
    consensusSummary:
      "Reviews of Hotel Golden Palace are mixed: two positive and one strongly negative. Strengths are a gate onto the Blue Flag beach, 3rd-floor sea-facing rooms with big balconies, good restaurant food and a wide breakfast buffet, plus a pool and kids' play area. The negative stay described a flood through balcony windows, ignored calls for paid extra bedding, and a marked-up water bottle; the pool was poorly maintained or closed. Quoted rates were pool-facing ₹5,000 + GST, sea-facing ₹7,000 + GST and suite ₹9,500. Reviewers warn about fake booking numbers and advise booking direct.",
    sources: sources("hotel-golden-palace-puri", ["hi", "hi", "bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-golden-palace-puri"],
  },
  "hotel-konark-puri": {
    packageId: "hotel-konark-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Swargadwar Road next to the Kakatua sweet shop, a short walk (about 50–150 m) to the beach",
      "Spacious, clean, airy rooms (2/3/4-bed, AC and non-AC, AC suite) with TV, fridge, mosquito nets and jet-spray WCs",
      "Gated parking for cars and bikes, and a big rooftop",
      "Very low prices",
    ],
    keyNegatives: [
      "No sea views — balconies face the street or neighbours and are grilled against monkeys",
      "Non-AC rooms have no geyser; hot water comes in buckets on request",
      "No lift yet (being installed)",
      "The in-house restaurant was closed in the off-season due to staff shortage",
      "7 AM checkout and 8 AM check-in; food and service were not shown",
    ],
    caveats: [
      "Positive for budget and family travel",
      "Official tariff cards seen (off-season / season): non-AC double ₹990–1,000 / ₹1,450–1,600; three-bed ₹1,300 / ₹1,800–2,000; four-bed ₹1,700 / ₹2,400–2,600; AC double ₹1,700 / ₹2,350–2,600; AC three-bed ₹2,000 / ₹2,700–3,000; AC suite ₹2,300 / ₹3,000–3,300; extra person ₹200. A guest paid ₹1,680 incl. GST for a non-AC 4-bed room",
    ],
    consensusSummary:
      "Guest videos are positive on Hotel Konark, Puri as a budget and family stay: Swargadwar Road, a short walk to the beach, with spacious clean rooms at very low prices and gated parking. There are no sea views, non-AC rooms have no geyser, there is no lift yet, and the in-house restaurant was closed in the off-season. Checkout is 7 AM. A guest paid ₹1,680 incl. GST for a non-AC 4-bed room; official cards showed non-AC doubles from about ₹990–1,000 off-season and AC doubles from about ₹1,700.",
    sources: sources("hotel-konark-puri", ["bn", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-konark-puri"],
  },
  "hotel-new-sea-hawk": {
    packageId: "hotel-new-sea-hawk",
    overallSentiment: "mixed",
    keyPositives: [
      "Marine Drive directly opposite the beach on the Swargadwar / lighthouse side",
      "Well-kept front garden with a Buddha statue and Odia wall art",
      "4-bed family AC rooms with sea or side sea-view balconies, and a rooftop with sea views",
      "Two guests found the rooms clean and staff behaviour very good, with a 24-hour geyser",
    ],
    keyNegatives: [
      "One family showed serious upkeep problems: water dripping from the ceiling/AC, damp and peeling walls, a rusted leaking bathroom with a clogged drain, ants, dirty sheets, and a garbage dump behind the hotel",
      "Wi-Fi on 1-hour slips that keeps dropping, and no AC waiting area after checkout",
      "Salty tap water since a cyclone",
      "Heavy traffic noise on sea-facing balconies",
      "7 AM checkout and 8 AM check-in",
    ],
    caveats: [
      "Tariff boards in the videos (some boards show different family/four-bed figures): deluxe ground floor ₹1,800; AC luxury double ₹3,250; AC super luxury double ₹3,850; AC four-bed ₹3,650–4,350; family ₹3,950–4,500; Maharani ₹4,700; Maharaja ₹4,950; extra person AC ₹200. A guest paid about ₹4,500 for a 4-bed room",
    ],
    consensusSummary:
      "Reviews of Hotel New Sea Hawk are mixed. It sits on Marine Drive directly opposite the beach, with a well-kept front garden, 4-bed family AC rooms with sea or side sea-view balconies, and two guests who found rooms clean and staff very good. Another family showed dripping ceilings, damp peeling walls, a rusted leaking bathroom, ants, dirty sheets and a garbage dump behind the hotel, plus unreliable Wi-Fi and salty tap water. A guest paid about ₹4,500 for a 4-bed room. Checkout is 7 AM.",
    sources: sources("hotel-new-sea-hawk", ["bn", "hi", "bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-new-sea-hawk"],
  },
  "hotel-prabhupada-puri": {
    packageId: "hotel-prabhupada-puri",
    overallSentiment: "positive",
    keyPositives: [
      "New Marine Drive next to the lighthouse, with the beach across the road",
      "Clean, daily-serviced rooms",
      "Good free breakfast buffet (omelette station, idli, luchi, fruit, rasgulla), with food praised for taste and hygiene",
      "Staff professional and welcoming — one called ahead to prepare the room",
      "Small pool, spa on the 3rd floor, and a lift",
    ],
    keyNegatives: [
      "Standard doubles are small or congested and felt overpriced at about ₹5,000",
      "Some side-sea-view balconies look mostly onto the next building",
      "Pool water looked unclean to one guest",
      "No gym, and no drive-in so cars park on the street",
      "A missing desk drawer and peeling film on the shower glass",
      "2.5 km from the temple",
    ],
    caveats: [
      "Positive with caveats — one reviewer rates it 3/5",
      "Guests quoted about ₹4,100/night for two with breakfast (side sea view) and about ₹5,000/night for a sea-view double",
    ],
    consensusSummary:
      "Guest reviews of Hotel Prabhupada are positive with caveats (one reviewer rates it 3/5). It sits on New Marine Drive next to the lighthouse with the beach across the road, clean daily-serviced rooms, a good free breakfast buffet, and professional staff. Standard doubles are small and felt overpriced at about ₹5,000, some side-sea-view balconies look mostly onto the next building, and one guest found the pool water unclean. Guests quoted about ₹4,100/night for two with breakfast (side sea view) and about ₹5,000/night for a sea-view double.",
    sources: sources("hotel-prabhupada-puri", ["hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-prabhupada-puri"],
  },
  "hotel-pulin-puri": {
    packageId: "hotel-pulin-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Swargadwar Road directly opposite the beach, with sea-facing balconies on front rooms and a 360-degree rooftop sea view",
      "Clean rooms with AC, TV, kettle and a lift",
      "In-house Song of Bengal restaurant with homely Bengali food, praised by two guests",
      "One guest calls staff very cooperative",
    ],
    keyNegatives: [
      "Rooms are small, and backside rooms and bathrooms are cramped with no view",
      "One family found the room so cramped there was barely space to stand, had no Wi-Fi or mobile signal, waited 2–3 hours for a wrong food order, and says never stay",
      "Strong mustard-oil cooking and dim lighting",
      "Reviewers warn about online booking scams for Puri hotels",
    ],
    caveats: [
      "Three reviews were positive and one was strongly negative",
      "No prices were stated in the videos",
    ],
    consensusSummary:
      "Reviews of Hotel Pulin are mixed: three positive and one strongly negative. Strengths are Swargadwar Road directly opposite the beach, sea-facing front balconies, a 360-degree rooftop sea view, clean rooms, and homely Bengali food at Song of Bengal praised by two guests. Rooms are small; backside rooms and bathrooms are cramped with no view. One family had barely space to stand, no Wi-Fi or mobile signal, a 2–3 hour wait for a wrong food order, and says never stay. No prices were stated in the videos.",
    sources: sources("hotel-pulin-puri", ["bn", "hi", "hi", "bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-pulin-puri"],
  },
  "hotel-shakuntala-palace": {
    packageId: "hotel-shakuntala-palace",
    overallSentiment: "positive",
    keyPositives: [
      "Gopal Ballav Road, about a 1–2 minute walk to the sea beach",
      "Spacious, well-kept double and 4-bed AC rooms with TV, wardrobe, sofa and intercom",
      "Clean bathrooms with a 24-hour geyser",
      "Parking, 24x7 security, and a polite front desk",
    ],
    keyNegatives: [
      "No sea view — balconies face neighbouring buildings",
      "The restaurant keeps no ready food, so meals must be ordered about 30 minutes ahead",
      "Food and service quality were not shown",
    ],
    caveats: [
      "Positive for a clean mid-budget room, but this is a single genuine source and the evidence is thin",
      "Front desk off-season discounted prices: Double Bed AC ₹2,520; 4 Bed AC ₹4,500; season double quoted at ₹3,584 with GST",
    ],
    consensusSummary:
      "The one genuine guest video is positive on Hotel Shakuntala Palace as a clean mid-budget stay on Gopal Ballav Road, about a 1–2 minute walk to the beach, with spacious well-kept AC rooms, clean bathrooms, parking and a polite front desk. There is no sea view, and meals must be ordered about 30 minutes ahead because the restaurant keeps no ready food. Front desk off-season rates were ₹2,520 for a double-bed AC and ₹4,500 for a 4-bed AC. Evidence is thin because only one genuine review remains.",
    sources: sources("hotel-shakuntala-palace", ["hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-shakuntala-palace"],
  },
  "hotel-shreehari-puri": {
    packageId: "hotel-shreehari-puri",
    overallSentiment: "positive",
    keyPositives: [
      "New Marine Drive near the lighthouse, with the beach directly across the road",
      "Clean, well-decorated rooms with AC, fridge, kettle, complimentary snacks and a dehumidifier, and clean bathrooms",
      "Front and side sea-view balconies",
      "Large free breakfast buffet with a live omelette counter, and restaurant food highly praised (crab masala, pomfret tandoori)",
      "Own parking lot, which matters because road parking is restricted",
    ],
    keyNegatives: [
      "One guest found the pool dirty, smelly and unusable — another swam in it when it was clear",
      "A bit away from Swargadwar (₹200 auto from the station)",
      "Reviewers warn of fake booking sites and say to book through authentic numbers",
    ],
    caveats: [
      "On-screen tariff: Deluxe (side sea view) ₹5,000/night, Super Deluxe (front sea view) ₹6,000/night; a guest paid ₹5,000 + 12% GST",
    ],
    consensusSummary:
      "Guest videos are positive on Hotel Shreehari: New Marine Drive near the lighthouse with the beach directly across the road, clean well-decorated rooms, sea-view balconies, a large free breakfast buffet, and restaurant food that was highly praised. One guest found the pool dirty and unusable, though another swam in it when it was clear. On-screen tariff was Deluxe (side sea view) ₹5,000/night and Super Deluxe (front sea view) ₹6,000/night; a guest paid ₹5,000 + 12% GST. Reviewers warn of fake booking sites.",
    sources: sources("hotel-shreehari-puri", ["bn", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-shreehari-puri"],
  },
  "hotel-sonar-bangla-puri": {
    packageId: "hotel-sonar-bangla-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Marine Drive next to the lighthouse, with the beach just across the road",
      "Well-decorated, clean sea-facing Platinum rooms with balconies, and spacious 4-bed Platinum and Premium 4-bed rooms for families",
      "Wide breakfast buffet (idli, sambar, eggs, puri, fruit, juice, custard)",
      "Rooftop Sundowner cafe/bar with sea views, kids' play zone, games room, small gym and secured parking",
      "Helpful staff — water refills, and help for a repeat guest with a problem",
    ],
    keyNegatives: [
      "The Platinum bathroom is very small, like a flight bathroom",
      "No swimming pool",
      "Food is pricey (one guest estimated about ₹2,000/day for two); some dishes were too spicy, poha was undercooked, and one guest felt breakfast could be better",
      "The 4-bed room is tight on walking space",
      "A little far from Swargadwar (toto/auto needed), and not pet-friendly",
    ],
    caveats: [
      "Website ground-floor about ₹4,500 + GST; Platinum about ₹6,300 incl. GST; one guest paid under ₹15,000 for 3 nights on ClearTrip; a family paid ₹10,000/day in a 4-bed Platinum (₹2,500 per head incl. breakfast, MakeMyTrip); an on-screen FAQ said ₹5,000–8,500",
    ],
    consensusSummary:
      "Guest reviews of Hotel Sonar Bangla are positive, with caveats about a very small Platinum bathroom and pricey food. It sits on Marine Drive next to the lighthouse with the beach across the road, clean sea-facing Platinum rooms, a wide breakfast buffet, a rooftop cafe with sea views, and helpful staff. There is no pool, food was estimated at about ₹2,000/day for two, and the 4-bed room is tight to walk around. Platinum was about ₹6,300 incl. GST; a family paid ₹10,000/day for a 4-bed Platinum.",
    sources: sources("hotel-sonar-bangla-puri", ["hi", "hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-sonar-bangla-puri"],
  },
  "hotel-vijoya-international": {
    packageId: "hotel-vijoya-international",
    overallSentiment: "positive",
    keyPositives: [
      "Quiet beach reached straight from the back garden gate, along a short sandy path or through Niladree Park",
      "Clean, spacious rooms with semi-circular sea-facing balconies over the garden and pool",
      "Swimming pool with a small waterfall, lawn and kids' play area",
      "Welcome drinks, a breakfast buffet (puri, upma, idli, fruit, juice) and buffet dinner",
      "Staff seen serving attentively",
    ],
    keyNegatives: [
      "The AC outdoor unit sits on the balcony and is a bit noisy",
      "The bathroom was shown only once",
      "It is a quieter stretch away from the main crowded beach and lighthouse area",
    ],
    caveats: [
      "A guest showed ₹8,000/day for the room; on-screen Executive Room ₹6,500+ tax",
      "A manager interview (facts only, not used for sentiment) quoted deluxe ₹5,500 + tax, discounted to ₹4,500 + tax, and executive ₹6,000 + tax after discount; an entrance banner showed buffet breakfast at ₹199",
    ],
    consensusSummary:
      "Guest reviews of Hotel Vijoya International are positive: a quiet beach reached from the back garden gate, clean spacious rooms with semi-circular sea-facing balconies over the garden and pool, a pool with a small waterfall, and breakfast and dinner buffets, with staff seen serving attentively. The AC outdoor unit on the balcony is a bit noisy, and the hotel sits on a quieter stretch away from the main crowded beach. A guest showed ₹8,000/day for the room; an on-screen executive rate was ₹6,500+ tax.",
    sources: sources("hotel-vijoya-international", ["hi", "hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["hotel-vijoya-international"],
  },
  "jeevan-sandhya-puri": {
    packageId: "jeevan-sandhya-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Far end of Marine Drive, with a very quiet beach right across the road",
      "Sea-facing room 310 (1 BHK) was clean, with a balcony and geyser, and bathrooms were clean and spacious",
      "Free breakfast buffet (idli, vada, upma, eggs) in a neat restaurant",
      "Staff behaviour and service praised by all three genuine reviews, with tasty, hygienic food",
    ],
    keyNegatives: [
      "Far from Swargadwar and the centre (₹150–200 auto each way; an own vehicle helps)",
      "A deluxe room (215) had dim lighting, a too-low table, flies and mosquitoes, and a balcony facing a neighbouring hotel's kitchen with cooking smells",
      "Dark corridor, and a salt-fogged window",
      "Room-service food is very costly — rice ₹100, dal ₹100, fish ₹250, chicken ₹220; one meal ₹1,370",
    ],
    caveats: [
      "Mixed — pick a sea-facing room",
      "AC deluxe ₹2,500 with GST per night",
    ],
    consensusSummary:
      "Reviews of Hotel Jeevan Sandhya are mixed: pick a sea-facing room. The hotel sits at the far end of Marine Drive with a very quiet beach across the road; sea-facing room 310 was clean with a balcony, breakfast was a free buffet, and all three genuine reviews praised the staff. A deluxe room (215) had dim lighting, flies and mosquitoes, and a balcony facing a neighbouring kitchen with cooking smells. It is far from Swargadwar (₹150–200 auto each way). AC deluxe was ₹2,500 with GST per night, and room-service meals are costly.",
    sources: sources("jeevan-sandhya-puri", ["bn", "bn", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["jeevan-sandhya-puri"],
  },
  "lotus-eco-resort": {
    packageId: "lotus-eco-resort",
    overallSentiment: "positive",
    keyPositives: [
      "Green riverside grounds where the Kushabhadra meets the sea, with a private gate to Ramchandi beach and boat rides from the jetty to the river mouth",
      "Clean wooden AC cottages with hairdryer, geyser and toiletries",
      "Pool, spa, gym, games room and kids' area",
      "Large free breakfast buffet with a live egg counter",
      "Waterfront Grill Cafe with good tandoori, seafood and snacks",
    ],
    keyNegatives: [
      "Forest/tree cottages are small and dimly lit, and not sea-facing",
      "One guest found service very slow and a lizard in the room",
      "Chilli chicken was too sweet, and plain rice/veg meals were not worth it",
      "The beach gate is open only 6 AM–5 PM, no outside food is allowed, and it is not pet-friendly",
    ],
    caveats: [
      "Positive for setting and breakfast, with small-room and slow-service caveats",
      "Forest cottages ₹5,000 to ₹7,000 by season; rates from ₹5,700 + GST; a Tree Cottage was paid at ₹7,500 + GST; a diner quoted ₹6,500/night; lunch for two ₹750 + GST, snacks ₹650 + GST",
    ],
    consensusSummary:
      "Guest videos are positive on Lotus Eco Resort for its setting and breakfast: green riverside grounds where the Kushabhadra meets the sea, a private gate to Ramchandi beach, clean wooden AC cottages, a pool and a large free breakfast buffet, plus good tandoori and seafood at the Waterfront Grill. Forest and tree cottages are small, dim and not sea-facing; one guest found service very slow and a lizard in the room. Forest cottages were quoted at ₹5,000–7,000 by season, and a Tree Cottage was paid at ₹7,500 + GST.",
    sources: sources("lotus-eco-resort", ["hi", "hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["lotus-eco-resort"],
  },
  "lucky-india-puri": {
    packageId: "lucky-india-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Newer hotel (opened June 2023, 41 rooms) on Marine Drive opposite the sea",
      "Clean, modern rooms with glass-shower bathrooms; sea-view rooms and the suite have direct sea views",
      "Good breakfast buffet variety; continental food and chicken pakora were praised",
      "A sea-bath area and foot-wash tap for beach sand, plus a large lawn, rooftop sea views, parking and a travel desk",
    ],
    keyNegatives: [
      "The breakfast room has only 4–5 tables, so guests waited 10–15 minutes for a seat",
      "No mini-fridge in a sea-view room despite the price",
      "No swimming pool, and standard rooms have no sea view",
    ],
    caveats: [
      "Positive, with a cramped-breakfast caveat",
      "On-screen ₹7,000 + GST for sea-view room 212; suite ₹8,000 + GST with complementary breakfast (manager: ₹8,000 plus 18% GST)",
      "Booking by phone in advance or off-season is said to be cheaper",
    ],
    consensusSummary:
      "Guest reviews of Lucky India are positive, with a cramped-breakfast caveat. It is a newer Marine Drive hotel opposite the sea, with clean modern rooms, direct sea views in sea-view rooms and the suite, a varied breakfast buffet, and a sea-bath area for sandy feet. The breakfast room has only 4–5 tables, so guests waited 10–15 minutes for a seat; there is no pool, and standard rooms have no sea view. On-screen rates were ₹7,000 + GST for sea-view room 212 and ₹8,000 + GST for the suite with breakfast.",
    sources: sources("lucky-india-puri", ["hi", "bn", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["lucky-india-puri"],
  },
  "nrs-royal-palace-puri": {
    packageId: "nrs-royal-palace-puri",
    overallSentiment: "positive",
    keyPositives: [
      "New Marine Drive, with the beach directly across the road, and a palace-style grand lobby",
      "Very clean, spacious wooden-panelled rooms with king beds, sofa, fridge and tea kit, and large clean bathrooms",
      "Premium sea-view rooms have big balconies with direct sea views; even non-view rooms get a partial side sea view",
      "Clean swimming pool, rooftop gazebos, and a wide breakfast buffet (7:30–10:30) that was praised",
      "Polite, helpful staff (one later checkout was allowed), free shaded chairs/tent on the beach for guests, and own parking",
    ],
    keyNegatives: [
      "Early 8 AM checkout",
      "Restaurant food is pricey with modest portions (rice ₹160, dal ₹220, mutton ₹480, katla ₹360; one lunch ₹1,805), and the mutton was a bit tough",
      "Poor mobile signal on the ground floor/basement",
      "Strict swimwear rule at the pool",
      "Non-view rooms only get a side view",
    ],
    caveats: [
      "About ₹6,000 incl. breakfast and GST for a premium sea-view room; ₹7,238 for three people in a sea-facing room; a quote of ₹6,200 + GST for two",
    ],
    consensusSummary:
      "Guest reviews of NRS Royal Palace are positive: New Marine Drive with the beach directly across the road, a grand lobby, very clean spacious rooms, premium sea-view balconies, a clean pool, a praised breakfast buffet, helpful staff and free shaded beach chairs for guests. Checkout is early at 8 AM, restaurant food is pricey with modest portions, and mobile signal is poor on the ground floor. A premium sea-view room was about ₹6,000 incl. breakfast and GST.",
    sources: sources("nrs-royal-palace-puri", ["hi", "hi", "bn", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["nrs-royal-palace-puri"],
  },
  "nuanai-nature-camp": {
    packageId: "nuanai-nature-camp",
    overallSentiment: "positive",
    keyPositives: [
      "Inside the Balukhanda-Konark wildlife sanctuary, a quiet forest setting with spotted deer roaming the camp day and night",
      "Clean AC Swiss-tent cottages with fenced verandas and clean attached bathrooms, plus 3-storey cottage rooms with a balcony view of the river meeting the sea",
      "All meals included (fish lunch, pakora snacks, chicken dinner, puri breakfast) in an open dining pavilion",
      "Golf-cart ride to a clean, empty Balukhanda beach, kayaking and motorboat rides on the Nuanai river, and bicycle and nature trails to the river mouth",
      "Kids' play area and parking",
    ],
    keyNegatives: [
      "2 km inside the sanctuary gate with no public transport — reserve a vehicle; auto from Puri ₹400–500, car about ₹1,000",
      "Cottage doors had no locks, and no toothbrush or paste was provided",
      "Plastic litter at the river mouth, and the trail bridge was broken so you wade at high tide",
      "Park entry fee ₹40 per person per day",
    ],
    caveats: [
      "Positive for a nature stay",
      "Tent for two ₹4,480 per day + ₹472 transaction charge = ₹4,952 per night with all meals; another guest: tent ₹4,000 + GST for two with four meals, cottage ₹5,500 + GST for two with four meals",
    ],
    consensusSummary:
      "Guest videos are positive on Nuanai Nature Camp as a nature stay inside the Balukhanda-Konark sanctuary, with spotted deer on the grounds, clean AC Swiss-tent cottages, all meals included, and activities such as a golf-cart ride to an empty beach and boat rides on the Nuanai. It is 2 km inside the gate with no public transport, cottage doors had no locks, and the trail bridge was broken. A tent for two was ₹4,480 per day plus a ₹472 transaction charge (₹4,952 with all meals); another guest cited a cottage at ₹5,500 + GST for two with four meals.",
    sources: sources("nuanai-nature-camp", ["hi", "hi", "bn", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["nuanai-nature-camp"],
  },
  "rivera-puri": {
    packageId: "rivera-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Marine Drive near the lighthouse (next to Dreamland), with the beach across the road",
      "Spacious, clean rooms with a king bed, safe and TV",
      "Large clean pool with a kids' pool, and a big first-floor terrace over the lawn",
      "Big free breakfast buffet, and very good room-service Chinese (prawns, fried rice, honey lemon chicken)",
      "On-site cafe, 24x7 dhaba, and parking",
    ],
    keyNegatives: [
      "The side sea view from deluxe rooms looks over a vacant lot and a big construction site next door — guests called it terrible",
      "The bathroom is quite small",
      "Bengali food was not good, and hotel lunch is not ready before 1 PM",
      "Complimentary drinking water was not enough",
      "The whole hotel is often booked for weddings, so book early; front sea-facing rooms cost more",
    ],
    caveats: [
      "Positive for the facilities, with a poor side-view caveat",
      "Deluxe side sea view ₹4,200 plus GST incl. breakfast (two guests)",
      "All three guests stayed in room 303",
    ],
    consensusSummary:
      "Guest reviews of Hotel Rivera are positive on the facilities, with a poor side-view caveat. It sits on Marine Drive near the lighthouse with the beach across the road, spacious clean rooms, a large clean pool, a big free breakfast buffet, and very good room-service Chinese. The deluxe 'side sea view' from room 303 looks over a vacant lot and a construction site — guests called it terrible — and the bathroom is quite small. Two guests paid ₹4,200 plus GST incl. breakfast for deluxe side sea view. Book early, as the hotel is often taken for weddings.",
    sources: sources("rivera-puri", ["bn", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["rivera-puri"],
  },
  "samudra-hotel-puri": {
    packageId: "samudra-hotel-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Large, beautifully kept flower garden with a gate straight onto the beach",
      "Quieter than crowded Swargadwar (auto about ₹100)",
      "Basic but tidy AC rooms with kettle and toiletries; upper-floor rooms get a clear sea view",
      "Breakfast buffet (fruit, bread, puri sabzi, upma, eggs, juice) and home-style lunches",
      "Polite reception that helped arrange a sightseeing car",
    ],
    keyNegatives: [
      "Rooms and bathrooms are basic — plastic chairs, and a moderately clean bath",
      "Lower rooms get only a partial sea view between wings, and courtyard rooms have none",
    ],
    caveats: [
      "Positive for a peaceful, garden-side budget stay",
      "No room prices were shown in the matching videos",
    ],
    consensusSummary:
      "The two videos that actually show this Samudra Hotel on Chakratirtha Road are positive for a peaceful, garden-side budget stay: a large well-kept flower garden with a gate onto the beach, quieter than Swargadwar, basic but tidy AC rooms, a breakfast buffet and home-style lunches, and a polite reception. Rooms and bathrooms are basic; lower and courtyard rooms have only a partial sea view or none, while a 3rd-floor room had a clear sea view. No room prices were shown.",
    sources: sources("samudra-hotel-puri", ["hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["samudra-hotel-puri"],
  },
  "santana-puri": {
    packageId: "santana-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Palatial white building on CT Road with a well-kept courtyard garden, library and aquarium",
      "Very clean, well-decorated rooms; AC deluxe rooms and suites have bathtubs",
      "Sea views from upper corridors and the rooftop, and suites have a sea view from the bed",
      "Restaurant food fresh, tasty and in big portions (one guest), and good room-service tea",
      "Free parking, pet-friendly, a spa, and quiet",
    ],
    keyNegatives: [
      "Not on the beach — 1–1.5 km to Swargadwar, toto ₹60–80",
      "Ground-floor non-AC rooms have no TV, no AC and no view",
      "Food must be ordered about 45 minutes ahead",
      "One reviewer found the veg thali average apart from the rotis",
    ],
    caveats: [
      "Positive, strong value",
      "On-screen: non-AC rooms ₹1,000/day, standard AC ₹1,500/day, double-bed with bathtub AC ₹2,000/day, 4-bed AC ₹3,000/day (food extra); reception: AC from ₹2,000, non-AC from ₹1,200, suites ₹4,500–5,000; guests paid about ₹1,000; veg thali ₹150",
    ],
    consensusSummary:
      "Guest reviews of Santana (New Santana) are positive and treat it as strong value: a palatial building on CT Road with a courtyard garden, very clean rooms, bathtubs in AC deluxe rooms and suites, sea views from upper corridors, the rooftop and from suite beds, and generally tasty food in big portions. It is 1–1.5 km from the beach. Ground-floor non-AC rooms have no TV, AC or view, and food must be ordered about 45 minutes ahead. On-screen rates included non-AC ₹1,000/day and standard AC ₹1,500/day; reception quoted suites at ₹4,500–5,000.",
    sources: sources("santana-puri", ["hi", "hi", "hi", "bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["santana-puri"],
  },
  "shakti-horizon-puri": {
    packageId: "shakti-horizon-puri",
    overallSentiment: "positive",
    keyPositives: [
      "New Marine Drive, directly opposite the beach",
      "Very clean, modern rooms with balconies, including front sea-facing Super Deluxe and side sea-view Deluxe rooms",
      "Clean tiled bathrooms with geysers",
      "Swimming pool, lift, parking and polite staff",
    ],
    keyNegatives: [
      "No in-house restaurant and no complimentary breakfast, though outside food is allowed",
      "One guest family room looked over buildings, not the sea",
      "Very early times — check-in 9 AM, check-out 8 AM",
      "No pets",
    ],
    caveats: [
      "Positive for clean rooms, but the videos are room-only and the evidence is thin",
      "Reception prices: Super Deluxe front sea-facing ₹5,000 plus tax, Deluxe side sea-view ₹5,000 plus tax, Standard back view ₹4,500 plus tax",
    ],
    consensusSummary:
      "The two guest videos are positive on Shakti Horizon for clean modern rooms directly opposite the beach on New Marine Drive, with front sea-facing Super Deluxe and side sea-view Deluxe rooms, a pool, lift and polite staff. There is no in-house restaurant and no complimentary breakfast, checkout is 8 AM, and one family room looked over buildings rather than the sea. Evidence is thin and room-only. Reception quoted Super Deluxe and Deluxe at ₹5,000 plus tax and Standard back view at ₹4,500 plus tax.",
    sources: sources("shakti-horizon-puri", ["hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["shakti-horizon-puri"],
  },
  "sterling-puri": {
    packageId: "sterling-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "Large resort with a big wavy pool, gardens, a terrace with distant sea views, gym, spa, kids' playroom and an Odia restaurant",
      "Clean, modern rooms (king bed, kitchenette counter, fridge, kettle) and clean bathrooms with glass showers and hairdryers",
      "Large complimentary breakfast buffet, dinner enjoyed, and welcome drinks",
      "Pet-friendly, for a fee",
    ],
    keyNegatives: [
      "At the far end of Marine Drive with the last 200 m unpaved, isolated from town and temple (auto to the station ₹300)",
      "No direct open-sea beach — the beach opposite is fenced off, and the gate (closes 5:30 PM) leads to an estuary",
      "Pool water was dirty for one guest, and a balcony was left uncleaned",
      "Service slightly slow, and a la carte very overpriced (3 lime sodas ₹892, buffet lunch ₹850 + tax per head); breakfast has no live counter",
      "Pet fee ₹2,000 per pet per night",
    ],
    caveats: [
      "Mixed — a polished resort let down by location and value",
      "A guest paid ₹5,100 for a basic garden-view room (normally '9000 something', from ₹7,500–8,000); base tariffs ₹5,500, ₹6,000 up to ₹10,000, ₹12,000, ₹15,000; pet-friendly rooms from about ₹8,000–9,000; a duplex premium room about ₹17,000 per day",
    ],
    consensusSummary:
      "Reviews of Sterling Puri are mixed: a polished resort let down by location and value. The campus has a big pool, gardens, clean modern rooms, a large complimentary breakfast buffet and paid pet stays, but it sits at the far end of Marine Drive with the last 200 m unpaved, and there is no direct open-sea beach — the opposite beach is fenced and the gate leads to an estuary. One guest found the pool dirty, and a la carte was very overpriced. A guest paid ₹5,100 for a basic garden-view room that was said to be normally around ₹7,500–9,000.",
    sources: sources("sterling-puri", ["hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["sterling-puri"],
  },
  "the-bay-suites-puri": {
    packageId: "the-bay-suites-puri",
    overallSentiment: "mixed",
    keyPositives: [
      "New Marine Drive, 200–300 m past the lighthouse, with a quiet beach right across the road",
      "Rooftop infinity pool with sea views",
      "Rooms with safe, fridge, kettle and sofa, and spacious, clean bathrooms with glass showers and hairdryers",
      "Complimentary breakfast buffet (idli, dosa, upma), parking, a travel desk and temple darshan help",
      "One guest found the room better than expected",
    ],
    keyNegatives: [
      "Damp, peeling paint in corridors and rooms, wallpaper taped up, dull towels, and a broken bathroom door lock — one guest rejected the first room offered",
      "A big building going up next door will block the side sea view",
      "The lift doesn't run on backup power",
      "Lunch and dinner are a la carte, and checkout is very early at 8 AM",
      "Check the QR code name when paying",
    ],
    caveats: [
      "Mixed — good location and rooftop pool, but maintenance issues",
      "A guest booked a Deluxe room for ₹3,500; a manager quoted side sea-facing from ₹4,500, rack ₹6,000–7,000, and front sea-facing ₹5,000–7,000 after discount",
      "Promo videos (not used for sentiment) quoted Super Deluxe ₹6,000 + tax (₹4,500–5,500 off-season) and Premium ₹7,000–8,000 + tax (₹5,700–6,500 off-season)",
    ],
    consensusSummary:
      "The two genuine guest reviews of The Bay Suites are mixed: good location and rooftop pool, but maintenance issues. It sits on New Marine Drive 200–300 m past the lighthouse with a quiet beach across the road, a rooftop infinity pool, and a complimentary breakfast buffet. Guests also reported damp peeling paint, taped wallpaper, dull towels, a broken bathroom lock, and a new building next door that will block the side sea view. A guest booked a Deluxe room for ₹3,500. Checkout is 8 AM.",
    sources: sources("the-bay-suites-puri", ["hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["the-bay-suites-puri"],
  },
  "treebo-siddharth-puri": {
    packageId: "treebo-siddharth-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Baliapanda, very close to the beach ('two steps'), with a wash area for after the sea bath",
      "Spacious, clean room (bed, TV, AC, kettle, wardrobe) and a clean bathroom with hot/cold shower and Treebo toiletries",
      "Complimentary breakfast buffet (poha, puri sabzi, papaya, eggs); lunch and dinner on pre-order",
      "Small indoor kids' play area, parking and a garden",
    ],
    keyNegatives: [
      "No sea view — the balcony corridor faces the street",
      "No locker in the wardrobe, and a rusty balcony swing",
      "A bit far from the Jagannath Temple",
    ],
    caveats: [
      "Positive for a simple budget stay, but the evidence is thin",
      "Room categories (maple, oak, mahogany) were not named in the videos, and no prices were shown",
    ],
    consensusSummary:
      "The two guest videos are positive on Treebo Siddharth International as a simple budget stay in Baliapanda, very close to the beach, with a spacious clean room, a clean bathroom, a complimentary breakfast buffet, and a small indoor kids' play area. There is no sea view, no locker in the wardrobe, and a rusty balcony swing. Evidence is thin: room categories were not named and no prices were shown.",
    sources: sources("treebo-siddharth-puri", ["hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["treebo-siddharth-puri"],
  },
  "yatrinivas-konark": {
    packageId: "yatrinivas-konark",
    overallSentiment: "positive",
    keyPositives: [
      "About 750 m from the Konark Sun Temple and 4.2 km from Chandrabhaga beach",
      "Large, well-kept garden campus with sculptures, ducks on the lawns, a children's play area and big parking",
      "Polite, quick, smiling staff and a helpful reception",
      "Complimentary breakfast (puri sabji, upma, idli, eggs); one family praised the restaurant's Indian and Chinese food",
      "Standard AC double rooms are simple, clean and tidy, with a TV and a geyser; the Premium Cottage is spacious and quiet, with a kettle, a dining table and a large clean bathroom",
    ],
    keyNegatives: [
      "One family said the Executive rooms weren't cozy, the AC didn't cool properly and the bathrooms weren't very clean",
      "Another family found the lunch and breakfast only average, and one guest found the lunch fish curry over-fried",
      "The cottages are spread far apart",
      "The restaurant takes UPI or card only, no cash",
      "Rooms run short in peak season",
    ],
    caveats: [
      "Mostly positive — excellent location, staff and grounds, but basic rooms",
      "Two of the videos (CMR04tHeyao and fftDwKsgMIU) are near-identical tours of the same room 302 and should be counted as one source",
      "Reception quoted Deluxe ₹1,568, Executive ₹2,576, Premium ₹3,920 (one guest paid this, including GST and breakfast) and a suite at about ₹6,800; another guest's on-screen tariff showed the Executive room at ₹2,352",
    ],
    consensusSummary:
      "Guest videos of Hotel Yatrinivas, Konark are mostly positive: excellent location, staff and grounds, but basic rooms. It is about 750 m from the Sun Temple, with a large well-kept garden campus, polite staff, complimentary breakfast, and simple clean standard AC doubles; the Premium Cottage is spacious and quiet. One family said Executive rooms weren't cozy, the AC didn't cool properly and bathrooms weren't very clean, and food opinions were mixed. Reception quoted Deluxe ₹1,568, Executive ₹2,576 and Premium ₹3,920 including GST and breakfast. Two of the four videos are near-identical tours of the same room and count as one source.",
    sources: sources("yatrinivas-konark", ["hi", "hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
    roomNotes: SEED_ROOM_NOTES["yatrinivas-konark"],
  },
  "new-shankar-international": {
    packageId: "new-shankar-international",
    overallSentiment: "mixed",
    keyPositives: [
      "Sea is visible from the flower-filled terrace in the guest clips",
      "Open lawn and courtyard where guests sit out in the evening",
      "The one room corner glimpsed looks plain but uncluttered",
    ],
    keyNegatives: [
      "None of the three linked videos shows a full room, bed or bathroom",
      "No reviewer in any linked video states a verdict, price or rating",
    ],
    caveats: [
      "All three linked videos are silent music montages — this consensus rests on visual evidence only",
    ],
    consensusSummary:
      "The three guest clips linked here are silent montages, not spoken reviews: they show the courtyard, a terrace with a sea view, and a glimpse of one plain room corner. They prove the hotel is near the beach and has outdoor space, but no reviewer verdict exists in them, so this consensus stays deliberately cautious.",
    sources: sources("new-shankar-international", ["hi", "hi", "hi"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "panthanivas-satapada": {
    packageId: "panthanivas-satapada",
    overallSentiment: "positive",
    keyPositives: [
      "Balcony view over Chilika Lake is the highlight in every stay vlog",
      "Reviewers call the room very comfortable and spacious",
      "On-site restaurant under the rooms; breakfast gets a healthy thumbs-up",
      "The natural base for Satapada boat trips to the sea mouth and Rajhans Island",
    ],
    keyNegatives: [
      "Room entrance and fittings look worn — peeling paint at the door in one vlog",
      "Two of the four linked videos barely show the room at all",
    ],
    caveats: [
      "No linked video states a price or shows the bathroom — judge it as a view-led stay",
    ],
    consensusSummary:
      "Guests who actually stayed here are happy: the Yatri Nivas sells itself on the balcony over Chilika, and reviewers call the rooms comfortable and spacious, with an easy restaurant downstairs. The evidence is view-led — bathrooms and tariffs go unshown — and the building's edges look worn.",
    sources: sources("panthanivas-satapada", ["bn", "bn", "bn", "en"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "panthanivas-konark": {
    packageId: "panthanivas-konark",
    overallSentiment: "mixed",
    keyPositives: [
      "Reviewers put the tariff at about ₹1,600 a night and call it the best budget option in Konark",
      "Furnished rooms: big beds, TV, wardrobe, dressing table; one bathroom praised as neat and clean",
      "Helpful staff and generous food portions in the longest stay vlog",
      "Large grounds with parking, minutes from the Sun Temple and Chandrabhaga Beach",
    ],
    keyNegatives: [
      "One reviewer says renovation is terribly needed — peeling paint and damp at the wall bases",
      "Rooms are basic and dated: old window AC, exposed wiring in places",
      "Wi-Fi works in the lobby, not in the rooms; the main gate closes at 11 pm",
    ],
    caveats: [
      "Book for value and location, not polish — this is a tired government property",
    ],
    consensusSummary:
      "Konark's Yatri Nivas is the value pick reviewers keep returning to: roughly ₹1,600 a night for a big, furnished room, willing staff and a temple-side location. The same vlogs are blunt about upkeep — peeling paint, damp patches and a renovation long overdue — so the praise is for price and place, not condition.",
    sources: sources("panthanivas-konark", ["hi", "hi", "bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "om-leisure-satapada": {
    packageId: "om-leisure-satapada",
    overallSentiment: "mixed",
    keyPositives: [
      "Spacious room in the linked tour, with a TV unit, desk and kettle",
      "Attached bathroom with blue tiling glimpsed from the room",
      "Distinctive, well-kept entrance and garden on the Satapada jetty side",
    ],
    keyNegatives: [
      "The single linked vlog states no price, rating or recommendation",
      "No bed, food or boat-access detail is shown",
    ],
    caveats: [
      "One casual Odia room tour is the whole evidence base — comfort and value are unproven",
    ],
    consensusSummary:
      "The only linked video is a friendly Odia room tour: a big, plainly furnished room, a kettle on the desk, and a smart entrance with a boat sculpture. The reviewer sounds pleased with the room's size, but with no price, food or comfort detail on record, this consensus stays middle-of-the-road.",
    sources: sources("om-leisure-satapada", ["or"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
  "white-sands-puri": {
    packageId: "white-sands-puri",
    overallSentiment: "positive",
    keyPositives: [
      "Rooftop pool and terrace overlooking the sea and Marine Drive",
      "Spacious, well-designed room with generous storage and a mini-fridge",
      "Reviewer praises the staff as very helpful; welcome drink at check-in",
      "Large first-floor restaurant; marble bathroom with hair dryer and toiletries",
    ],
    keyNegatives: [
      "Shower-area floor is gappy, so water spreads while bathing",
      "Hot water failed once during the stay (staff fixed it when asked)",
    ],
    caveats: [
      "New rooms and floors were still being built during the review",
    ],
    consensusSummary:
      "A modern sea-facing stay the reviewer clearly enjoyed: rooftop pool, a big restaurant, and a room she calls well designed, with staff who sort problems out. Her two complaints are specific — a shower floor that lets water spread, and one hot-water failure — in an otherwise complaint-free stay.",
    sources: sources("white-sands-puri", ["bn"]),
    updatedAt: SEEDED_AT,
    origin: "seed",
  },
};

