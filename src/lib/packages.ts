export type Vibe = "culture" | "beach" | "relax" | "adventure";
export type Budget = "value" | "mid" | "premium";
export type TravelStyle = "solo" | "couple" | "family" | "friends";

export type DayOption = {
  id: string;
  label: string;
  delta: number;
};

export type DayPlan = {
  title: string;
  base: string;
  options: DayOption[];
};

export type RoomType = {
  id: string;
  name: string;
  summary: string;
  /** Added to `pricePerNight` for this room. Base room is 0. */
  deltaPerNight: number;
  occupancy: number;
  image: string;
};

export type PropertyVideo = {
  videoId: string;
  title: string;
};

export type StayPackage = {
  id: string;
  name: string;
  destination: string;
  country: string;
  /** Recommended stay length — used for matching. */
  nights: number;
  nightsMin: number;
  nightsMax: number;
  /** Per person, per night, for the base room. */
  pricePerNight: number;
  /** Recommended-stay total for the base room (compat). */
  pricePerPerson: number;
  /** From-price: one night in the base room. */
  priceFrom: number;
  trust: number;
  trustScore: number;
  reviews: number;
  budget: Budget;
  vibe: Vibe;
  style: TravelStyle[];
  summary: string;
  image: string;
  images: string[];
  videos: PropertyVideo[];
  rooms: RoomType[];
  neighborhood: string;
  includes: string[];
  days: DayPlan[];
};

export type Brief = {
  vibe: Vibe;
  budget: Budget;
  style: TravelStyle;
  nights: number;
  flexible: boolean;
};

export const DEFAULT_BRIEF: Brief = {
  vibe: "beach",
  budget: "mid",
  style: "couple",
  nights: 3,
  flexible: false,
};

export const BRIEF_KEY = "tripweave-brief";
export const PENDING_KEY = "tripweave-pending";
export const NEXT_KEY = "tripweave-next";

export type PendingBooking = {
  packageId: string;
  swaps: Record<string, string>;
  nights: number;
  roomId: string;
};

export function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function nightsPhrase(n: number) {
  return n === 1 ? "1 night" : `${n} nights`;
}

function photo(id: string, w = 1600) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

const LEISURE_DAY: DayPlan = {
  title: "Leisure day",
  base: "Pool, beach, or a slow walk into town — your call.",
  options: [{ id: "konark", label: "Konark half-day", delta: 1600 }],
};

type RawStay = Omit<StayPackage, "priceFrom" | "trustScore" | "image" | "pricePerPerson">;

const RAW: RawStay[] = [
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
    images: [
      photo("photo-1582719508461-905c673771fd"),
      photo("photo-1578683010236-d716f9a3f461"),
      photo("photo-1540541338287-41700207dee6"),
      photo("photo-1582719478250-c89cae4dc85b"),
      photo("photo-1611892440504-42a792e24d32"),
      photo("photo-1507525428034-b723cf961d3e"),
    ],
    videos: [
      { videoId: "QRg6kAKT4TY", title: "Luxury stay at the new Taj Puri" },
      { videoId: "02dHekawNDk", title: "Honest hotel tour and food" },
      { videoId: "809rJTgHVgI", title: "Room and property tour" },
    ],
    rooms: [
      {
        id: "garden",
        name: "Deluxe Garden View",
        summary: "Quiet garden rooms — the honest base rate.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1611892440504-42a792e24d32"),
      },
      {
        id: "sea",
        name: "Deluxe Sea View",
        summary: "Full water outlook; reviewers say this is the point of Taj.",
        deltaPerNight: 1800,
        occupancy: 2,
        image: photo("photo-1507525428034-b723cf961d3e"),
      },
      {
        id: "plunge",
        name: "Plunge Pool Suite",
        summary: "Private plunge pool. The couple-stay pick in every vlog.",
        deltaPerNight: 4500,
        occupancy: 2,
        image: photo("photo-1540541338287-41700207dee6"),
      },
    ],
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
    images: [
      photo("photo-1566073771259-6a8506099945"),
      photo("photo-1571896349842-33c89424de2d"),
      photo("photo-1445019980597-93fa8acb246c"),
      photo("photo-1566665797739-1674de19a8f4"),
      photo("photo-1590490360182-c33d57733427"),
      photo("photo-1470770903676-69b98201ea1c"),
    ],
    videos: [
      { videoId: "kHI7YcZr-uw", title: "Mayfair Heritage room tour" },
      { videoId: "vqgxX0CC_Us", title: "Heritage stay and Waves food" },
      { videoId: "uquuV9tAlo0", title: "Real staying experience, 2024" },
    ],
    rooms: [
      {
        id: "deluxe",
        name: "Deluxe Room",
        summary: "Main building. Confirm a balcony if the sea is the point.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1445019980597-93fa8acb246c"),
      },
      {
        id: "cottage",
        name: "Garden Cottage",
        summary: "Cottage with a balcony — the room reviewers actually want.",
        deltaPerNight: 1200,
        occupancy: 3,
        image: photo("photo-1566665797739-1674de19a8f4"),
      },
      {
        id: "sea-cottage",
        name: "Sea-facing Cottage",
        summary: "Cottage on the water side. Best Mayfair Heritage view.",
        deltaPerNight: 2200,
        occupancy: 3,
        image: photo("photo-1566073771259-6a8506099945"),
      },
    ],
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
    images: [
      photo("photo-1571896349842-33c89424de2d"),
      photo("photo-1571003123894-1f0594d2b5d9"),
      photo("photo-1564507592333-c60657eea814"),
      photo("photo-1631049307264-da0ec9d70304"),
      photo("photo-1618773928121-c32242e63f39"),
      photo("photo-1519046904884-53103b34b206"),
    ],
    videos: [
      { videoId: "R8_m_xkYSzQ", title: "Is Swosti Premium worth it?" },
      { videoId: "5Gmwnc6B71E", title: "Family vacation walkthrough" },
      { videoId: "G6R5FNirOcY", title: "Sea-facing stay" },
    ],
    rooms: [
      {
        id: "deluxe",
        name: "Deluxe Room",
        summary: "Modern interiors; some look at the pool, not the sea.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1631049307264-da0ec9d70304"),
      },
      {
        id: "sea",
        name: "Sea View Room",
        summary: "The room that makes the infinity-pool photos make sense.",
        deltaPerNight: 900,
        occupancy: 2,
        image: photo("photo-1571003123894-1f0594d2b5d9"),
      },
      {
        id: "suite",
        name: "Suite",
        summary: "Extra space for families. Ask what dinner includes.",
        deltaPerNight: 1800,
        occupancy: 4,
        image: photo("photo-1618773928121-c32242e63f39"),
      },
    ],
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
    images: [
      photo("photo-1551882547-ff40c63fe5fa"),
      photo("photo-1596394516093-50190417d11a"),
      photo("photo-1590381103538-3d447446981d"),
      photo("photo-1501117716987-c8e1ecb2101f"),
      photo("photo-1584132967334-10e028bd69f7"),
      photo("photo-1439066615861-d1af74d74000"),
    ],
    videos: [
      { videoId: "SVbg3HhQLes", title: "Beach-facing walkthrough" },
      { videoId: "nMCyrW5PFWM", title: "Stay review" },
      { videoId: "I5yaD4NyfTo", title: "Rooms and amenities" },
    ],
    rooms: [
      {
        id: "superior",
        name: "Superior Room",
        summary: "Clean and compact. Fine if you are here for the temple.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1596394516093-50190417d11a"),
      },
      {
        id: "sea",
        name: "Sea Facing Room",
        summary: "Pay for a full sea-facing room — partial views disappoint.",
        deltaPerNight: 700,
        occupancy: 2,
        image: photo("photo-1584132967334-10e028bd69f7"),
      },
      {
        id: "family",
        name: "Family Room",
        summary: "Extra bed space. Rooms still run small for a 4-star rate.",
        deltaPerNight: 1100,
        occupancy: 4,
        image: photo("photo-1501117716987-c8e1ecb2101f"),
      },
    ],
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
    images: [
      photo("photo-1499793983690-e29da59ef1c2"),
      photo("photo-1507525428034-b723cf961d3e"),
      photo("photo-1473116763249-2faaef81ccda"),
      photo("photo-1564501049412-61c2a3083791"),
      photo("photo-1520250497591-112f2f40a3f4"),
      photo("photo-1506953823976-52e1fdc0149a"),
    ],
    videos: [
      { videoId: "CeqSkW6Nj5s", title: "Budget luxury on the beach" },
      { videoId: "lRelrKmJ2ME", title: "Sea-facing stay" },
      { videoId: "C_hvR4UIcDQ", title: "Resort and beach, last day" },
    ],
    rooms: [
      {
        id: "garden",
        name: "Garden View",
        summary: "Ground-floor rooms face the lawn, not the sea.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1499793983690-e29da59ef1c2"),
      },
      {
        id: "pool",
        name: "Pool View",
        summary: "Looks at the swimming pool — the reason families pick Hans.",
        deltaPerNight: 400,
        occupancy: 3,
        image: photo("photo-1571896349842-33c89424de2d"),
      },
      {
        id: "sea",
        name: "Sea Facing",
        summary: "Upper floors catch more of the water. Building is older.",
        deltaPerNight: 800,
        occupancy: 2,
        image: photo("photo-1507525428034-b723cf961d3e"),
      },
    ],
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
    images: [
      photo("photo-1564501049412-61c2a3083791"),
      photo("photo-1551882547-ff40c63fe5fa"),
      photo("photo-1590490360182-c33d57733427"),
      photo("photo-1445019980597-93fa8acb246c"),
      photo("photo-1496417263034-38ec4f0d6650"),
    ],
    videos: [
      { videoId: "mTgPxwJLB_c", title: "First day in Puri — Empires" },
      { videoId: "CcgItlhsIPc", title: "Stay footage" },
    ],
    rooms: [
      {
        id: "standard",
        name: "Standard Room",
        summary: "A short-stay base for darshan. Eat out if the kitchen misses.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1445019980597-93fa8acb246c"),
      },
      {
        id: "balcony",
        name: "Deluxe with Balcony",
        summary: "The room walkthroughs actually like. Ask for a high floor.",
        deltaPerNight: 400,
        occupancy: 2,
        image: photo("photo-1590490360182-c33d57733427"),
      },
      {
        id: "family",
        name: "Family Room",
        summary: "More beds, same building. Hygiene reports are mixed.",
        deltaPerNight: 700,
        occupancy: 4,
        image: photo("photo-1501117716987-c8e1ecb2101f"),
      },
    ],
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
  },
  {
    id: "mayfair-waves-puri",
    name: "Mayfair Waves, Puri",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 7,
    pricePerNight: 4200,
    trust: 93,
    reviews: 2210,
    budget: "premium",
    vibe: "beach",
    style: ["couple", "family", "friends"],
    summary: "Mayfair's beach-club sister — pool, buffet, and a louder waterfront.",
    neighborhood: "Chakratirtha beach",
    includes: ["Breakfast", "Beach club access", "Pool", "Temple transfer"],
    images: [
      photo("photo-1540541338287-41700207dee6"),
      photo("photo-1571003123894-1f0594d2b5d9"),
      photo("photo-1564507592333-c60657eea814"),
      photo("photo-1520250497591-112f2f40a3f4"),
      photo("photo-1582719478250-c89cae4dc85b"),
      photo("photo-1519046904884-53103b34b206"),
    ],
    videos: [
      { videoId: "ix-8HWQ8heg", title: "Mayfair Waves Puri walkthrough" },
      { videoId: "ov0TpiWVKGg", title: "Waves rooms, pool and buffet" },
    ],
    rooms: [
      {
        id: "deluxe",
        name: "Deluxe Room",
        summary: "Main block. Fine if you live at the pool, not the window.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1631049307264-da0ec9d70304"),
      },
      {
        id: "sea",
        name: "Sea View Room",
        summary: "Water outlook plus the Waves buffet — the usual booking.",
        deltaPerNight: 1400,
        occupancy: 2,
        image: photo("photo-1571003123894-1f0594d2b5d9"),
      },
      {
        id: "suite",
        name: "Suite",
        summary: "Space and a sitting room. Events on the lawn can run late.",
        deltaPerNight: 2800,
        occupancy: 3,
        image: photo("photo-1618773928121-c32242e63f39"),
      },
    ],
    days: [
      {
        title: "Arrive & pool",
        base: "Check-in, beach-club afternoon, Waves buffet.",
        options: [{ id: "spa", label: "Spa hour", delta: 2000 }],
      },
      {
        title: "Temple morning",
        base: "Early darshan, back for the pool.",
        options: [{ id: "konark", label: "Konark half-day", delta: 1800 }],
      },
      {
        title: "Depart",
        base: "Breakfast and checkout.",
        options: [],
      },
    ],
  },
  {
    id: "toshali-sands-puri",
    name: "Toshali Sands, Puri",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 6,
    pricePerNight: 2800,
    trust: 87,
    reviews: 1740,
    budget: "mid",
    vibe: "adventure",
    style: ["family", "friends", "couple"],
    summary: "Cottage campus on the Konark road — gardens, pool, and day-trip range.",
    neighborhood: "Konark Marine Drive",
    includes: ["Cottage stay", "Breakfast", "Pool", "Parking"],
    images: [
      photo("photo-1499793983690-e29da59ef1c2"),
      photo("photo-1600585154340-be6161a56a0c"),
      photo("photo-1600596542815-ffad4c1539a9"),
      photo("photo-1600607687939-ce8a6c25118c"),
      photo("photo-1470770903676-69b98201ea1c"),
      photo("photo-1469796466635-455ede028aca"),
    ],
    videos: [
      { videoId: "6Hl1vtib7GE", title: "Toshali Sands cottage tour" },
      { videoId: "RahjVg0t6nk", title: "Resort campus and pool" },
      { videoId: "ZOCBaU2Ignk", title: "Family stay at Toshali Sands" },
    ],
    rooms: [
      {
        id: "cottage",
        name: "Deluxe Cottage",
        summary: "Garden cottage. The stay is the campus, not a sea window.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1600585154340-be6161a56a0c"),
      },
      {
        id: "sea-cottage",
        name: "Sea View Cottage",
        summary: "Closer to the dunes. Confirm the actual outlook before paying.",
        deltaPerNight: 900,
        occupancy: 3,
        image: photo("photo-1499793983690-e29da59ef1c2"),
      },
      {
        id: "family",
        name: "Family Cottage",
        summary: "Two rooms, lawn, parking at the door. Best for kids.",
        deltaPerNight: 1400,
        occupancy: 5,
        image: photo("photo-1600596542815-ffad4c1539a9"),
      },
    ],
    days: [
      {
        title: "Cottage check-in",
        base: "Arrive, campus walk, pool.",
        options: [],
      },
      {
        title: "Konark & coast",
        base: "Sun Temple and Chandrabhaga — you are already on the road.",
        options: [{ id: "guide", label: "Private guide", delta: 1200 }],
      },
      {
        title: "Depart",
        base: "Breakfast and checkout.",
        options: [{ id: "temple", label: "Puri temple stop", delta: 700 }],
      },
    ],
  },
  {
    id: "chariot-resort-puri",
    name: "The Chariot Resort & Spa",
    destination: "Puri",
    country: "India",
    nights: 3,
    nightsMin: 1,
    nightsMax: 6,
    pricePerNight: 3000,
    trust: 89,
    reviews: 1880,
    budget: "mid",
    vibe: "relax",
    style: ["couple", "family", "friends"],
    summary: "Beach resort south of town — spa, lawns, and a quieter stretch of sand.",
    neighborhood: "Balukhand, south of town",
    includes: ["Breakfast", "Pool", "Spa credit", "Beach access"],
    images: [
      photo("photo-1520250497591-112f2f40a3f4"),
      photo("photo-1571896349842-33c89424de2d"),
      photo("photo-1540541338287-41700207dee6"),
      photo("photo-1610641818989-c2051b5e2cfd"),
      photo("photo-1566073771259-6a8506099945"),
      photo("photo-1584132915807-fd1f5fbc078f"),
    ],
    videos: [
      { videoId: "pjy6OOe03wk", title: "Chariot Resort Puri tour" },
      { videoId: "6pPT0cJmWuM", title: "Rooms, spa and beach" },
    ],
    rooms: [
      {
        id: "deluxe",
        name: "Deluxe Room",
        summary: "Garden or pool outlook. Solid if you came for the spa.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1610641818989-c2051b5e2cfd"),
      },
      {
        id: "sea",
        name: "Sea View Room",
        summary: "Direct water. This is the Chariot room people film.",
        deltaPerNight: 1000,
        occupancy: 2,
        image: photo("photo-1520250497591-112f2f40a3f4"),
      },
      {
        id: "villa",
        name: "Villa",
        summary: "Separate sitting room and a lawn. Family and group pick.",
        deltaPerNight: 2200,
        occupancy: 4,
        image: photo("photo-1600210492486-724fe5c67fb0"),
      },
    ],
    days: [
      {
        title: "Arrive & spa",
        base: "Check-in, pool, optional treatment.",
        options: [{ id: "spa", label: "Couple spa", delta: 2800 }],
      },
      {
        title: "Beach & temple",
        base: "Slow morning on the sand; evening darshan in town.",
        options: [{ id: "konark", label: "Konark half-day", delta: 1800 }],
      },
      {
        title: "Depart",
        base: "Breakfast and checkout.",
        options: [],
      },
    ],
  },
  {
    id: "chanakya-bnr-puri",
    name: "Chanakya BNR Hotel",
    destination: "Puri",
    country: "India",
    nights: 1,
    nightsMin: 1,
    nightsMax: 4,
    pricePerNight: 2500,
    trust: 86,
    reviews: 1420,
    budget: "value",
    vibe: "culture",
    style: ["solo", "couple", "friends"],
    summary: "Historic railway hotel by the station — character, location, temple-first trips.",
    neighborhood: "Near Puri station",
    includes: ["Breakfast", "Walk to station", "Heritage lobby", "24h desk"],
    images: [
      photo("photo-1542314831-068cd1dbfeeb"),
      photo("photo-1551882547-ff40c63fe5fa"),
      photo("photo-1596394516093-50190417d11a"),
      photo("photo-1564501049412-61c2a3083791"),
      photo("photo-1529290130-4ca0e96b8dd2"),
    ],
    videos: [
      { videoId: "puMmF_hN0Ic", title: "Chanakya BNR heritage stay" },
      { videoId: "hNV9aKYwNto", title: "Rooms and station-side location" },
    ],
    rooms: [
      {
        id: "heritage",
        name: "Heritage Standard",
        summary: "Old-wing charm. The building is the story, not the bathroom.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1596394516093-50190417d11a"),
      },
      {
        id: "deluxe",
        name: "Deluxe Room",
        summary: "Newer block. Quieter AC, less character, better sleep.",
        deltaPerNight: 500,
        occupancy: 2,
        image: photo("photo-1445019980597-93fa8acb246c"),
      },
      {
        id: "suite",
        name: "Suite",
        summary: "Sitting room in a railway hotel. Oddly grand for a 1-night stop.",
        deltaPerNight: 1200,
        occupancy: 3,
        image: photo("photo-1578683010236-d716f9a3f461"),
      },
    ],
    days: [
      {
        title: "Arrive & temple",
        base: "Drop bags, walk to Jagannath, eat on Grand Road.",
        options: [],
      },
      {
        title: "Town & depart",
        base: "Beach hour if you have it, then the station.",
        options: [{ id: "beach", label: "Beach half-day", delta: 400 }],
      },
    ],
  },
  {
    id: "mahodadhi-palace-puri",
    name: "Mahodadhi Palace",
    destination: "Puri",
    country: "India",
    nights: 1,
    nightsMin: 1,
    nightsMax: 4,
    pricePerNight: 5500,
    trust: 92,
    reviews: 1180,
    budget: "premium",
    vibe: "culture",
    style: ["couple", "solo", "friends"],
    summary: "Beachfront palace hotel — heritage rooms, sea lawns, a one-night statement stay.",
    neighborhood: "Sea Beach, palace stretch",
    includes: ["Breakfast", "Palace lawns", "Heritage rooms", "Temple transfer"],
    images: [
      photo("photo-1582719478250-c89cae4dc85b"),
      photo("photo-1542314831-068cd1dbfeeb"),
      photo("photo-1578683010236-d716f9a3f461"),
      photo("photo-1613490493576-7fde63acd811"),
      photo("photo-1582719508461-905c673771fd"),
      photo("photo-1507525428034-b723cf961d3e"),
    ],
    videos: [
      { videoId: "PZW2ibNBPv8", title: "Mahodadhi Palace tour" },
      { videoId: "80-nIH3wnUI", title: "Heritage rooms on the beach" },
      { videoId: "lLhJ_hp3EVQ", title: "Palace stay and sea lawns" },
    ],
    rooms: [
      {
        id: "palace",
        name: "Palace Room",
        summary: "Heritage interiors. Some rooms look at the courtyard, not the sea.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1578683010236-d716f9a3f461"),
      },
      {
        id: "sea",
        name: "Sea View Palace Room",
        summary: "The room the vlogs open on — lawn, then water.",
        deltaPerNight: 1800,
        occupancy: 2,
        image: photo("photo-1582719478250-c89cae4dc85b"),
      },
      {
        id: "suite",
        name: "Palace Suite",
        summary: "Sitting room and period furniture. A one-night splurge.",
        deltaPerNight: 3200,
        occupancy: 3,
        image: photo("photo-1613490493576-7fde63acd811"),
      },
    ],
    days: [
      {
        title: "Palace evening",
        base: "Check-in, lawn sunset, temple after dark if the crowd allows.",
        options: [{ id: "thali", label: "Palace thali", delta: 1400 }],
      },
      {
        title: "Depart",
        base: "Breakfast on the lawn, checkout.",
        options: [],
      },
    ],
  },
  {
    id: "holiday-resort-puri",
    name: "Holiday Resort, Puri",
    destination: "Puri",
    country: "India",
    nights: 2,
    nightsMin: 1,
    nightsMax: 5,
    pricePerNight: 1800,
    trust: 83,
    reviews: 1640,
    budget: "value",
    vibe: "beach",
    style: ["family", "friends", "couple"],
    summary: "Long-running beach resort — lawns, a pool, and prices that still make sense.",
    neighborhood: "Sea Beach Road",
    includes: ["Breakfast", "Pool", "Lawn", "Parking"],
    images: [
      photo("photo-1473116763249-2faaef81ccda"),
      photo("photo-1507525428034-b723cf961d3e"),
      photo("photo-1571896349842-33c89424de2d"),
      photo("photo-1564507592333-c60657eea814"),
      photo("photo-1499793983690-e29da59ef1c2"),
      photo("photo-1506953823976-52e1fdc0149a"),
    ],
    videos: [
      { videoId: "Wfvplc69Yio", title: "Holiday Resort Puri walkthrough" },
      { videoId: "9mjuLwKBDT0", title: "Rooms, lawn and pool" },
      { videoId: "_GCIo7ETCp8", title: "Beach-side stay" },
    ],
    rooms: [
      {
        id: "standard",
        name: "Standard Room",
        summary: "Older wing. Come for the lawn and the pool, not a new bathroom.",
        deltaPerNight: 0,
        occupancy: 2,
        image: photo("photo-1445019980597-93fa8acb246c"),
      },
      {
        id: "sea",
        name: "Sea View Room",
        summary: "Upper floors look at the water. Ask for a renovated bath.",
        deltaPerNight: 500,
        occupancy: 2,
        image: photo("photo-1473116763249-2faaef81ccda"),
      },
      {
        id: "family",
        name: "Family Room",
        summary: "Extra beds and a lawn at the door. The value family pick.",
        deltaPerNight: 800,
        occupancy: 4,
        image: photo("photo-1600596542815-ffad4c1539a9"),
      },
    ],
    days: [
      {
        title: "Beach check-in",
        base: "Lawn, pool, evening sand.",
        options: [{ id: "dinner", label: "Seafood dinner", delta: 700 }],
      },
      {
        title: "Temple & depart",
        base: "Morning darshan if you want it, then checkout.",
        options: [{ id: "konark", label: "Konark shared", delta: 900 }],
      },
    ],
  },
];

export const PACKAGES: StayPackage[] = RAW.map((p) => ({
  ...p,
  image: p.images[0]!,
  pricePerPerson: p.pricePerNight * p.nights,
  priceFrom: p.pricePerNight,
  trustScore: p.trust,
}));

export function getPackage(id: string) {
  return PACKAGES.find((p) => p.id === id);
}

export function getRoom(pkg: StayPackage, roomId?: string | null): RoomType {
  return pkg.rooms.find((r) => r.id === roomId) ?? pkg.rooms[0]!;
}

export function clampNights(pkg: StayPackage, nights: number) {
  const n = Math.round(Number(nights));
  if (!Number.isFinite(n)) return pkg.nightsMin;
  return Math.min(pkg.nightsMax, Math.max(pkg.nightsMin, n));
}

export function daysForStay(pkg: StayPackage, nights: number): DayPlan[] {
  const n = clampNights(pkg, nights);
  const days = pkg.days;
  if (days.length === 0) return [LEISURE_DAY];
  if (n === 1) {
    const first = days[0]!;
    return [
      {
        title: "Arrive & depart next morning",
        base: `${first.base} Checkout the next morning.`,
        options: first.options,
      },
    ];
  }
  if (n === days.length) return days;
  if (n < days.length) {
    const last = days[days.length - 1]!;
    return [...days.slice(0, n - 1), last];
  }
  const head = days[0]!;
  const last = days[days.length - 1]!;
  const middle = days.slice(1, -1);
  const extraCount = n - days.length;
  const extras = Array.from({ length: extraCount }, () => LEISURE_DAY);
  return [head, ...middle, ...extras, last];
}

export function stayTotal(
  pkg: StayPackage,
  nights: number,
  roomId?: string | null,
  swaps: Record<string, string> = {},
) {
  const n = clampNights(pkg, nights);
  const room = getRoom(pkg, roomId);
  let total = (pkg.pricePerNight + room.deltaPerNight) * n;
  daysForStay(pkg, n).forEach((day, i) => {
    const optId = swaps[String(i)] ?? swaps[i as unknown as string];
    if (!optId) return;
    const opt = day.options.find((o) => o.id === optId);
    if (opt) total += opt.delta;
  });
  return total;
}

export function matchPackages(brief: Brief) {
  const scored = PACKAGES.map((p) => {
    let score = 0;
    if (p.vibe === brief.vibe) score += 3;
    if (p.budget === brief.budget) score += 2;
    if (p.style.includes(brief.style)) score += 2;
    if (brief.flexible) {
      score += 1.5;
    } else {
      const wanted = brief.nights || 3;
      const inRange = wanted >= p.nightsMin && wanted <= p.nightsMax;
      if (inRange) {
        const nightDiff = Math.abs(p.nights - wanted);
        score += Math.max(0, 2 - nightDiff / 2);
      }
    }
    return { ...p, matchScore: score };
  });
  return scored
    .sort((a, b) => b.matchScore - a.matchScore || b.trustScore - a.trustScore)
    .slice(0, 3);
}

export function priceWithSwaps(
  pkg: StayPackage,
  swaps: Record<string, string> = {},
  nights?: number,
  roomId?: string | null,
) {
  return stayTotal(pkg, nights ?? pkg.nights, roomId, swaps);
}

export function variantLabel(pkg: StayPackage) {
  if (pkg.budget === "value") return "Value";
  if (pkg.budget === "premium") return "Premium";
  return "Mid-range";
}

export const RANK_LABELS = ["Best match", "Also strong", "Worth a look"] as const;

export function loadBrief(): Brief {
  if (typeof window === "undefined") return DEFAULT_BRIEF;
  try {
    const raw = window.localStorage.getItem(BRIEF_KEY);
    if (!raw) return DEFAULT_BRIEF;
    const parsed = JSON.parse(raw) as Partial<Brief>;
    const nights = Number(parsed.nights);
    return {
      vibe: parsed.vibe ?? DEFAULT_BRIEF.vibe,
      budget: parsed.budget ?? DEFAULT_BRIEF.budget,
      style: parsed.style ?? DEFAULT_BRIEF.style,
      nights: Number.isFinite(nights) && nights >= 1 ? Math.min(14, nights) : DEFAULT_BRIEF.nights,
      flexible: Boolean(parsed.flexible),
    };
  } catch {
    return DEFAULT_BRIEF;
  }
}

export function saveBrief(brief: Brief) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
}

export function savePending(pending: PendingBooking) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function loadPending(): PendingBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingBooking>;
    if (!parsed.packageId) return null;
    const pkg = getPackage(parsed.packageId);
    const nightsRaw = Number(parsed.nights);
    return {
      packageId: parsed.packageId,
      swaps: parsed.swaps && typeof parsed.swaps === "object" ? parsed.swaps : {},
      nights:
        pkg && Number.isFinite(nightsRaw)
          ? clampNights(pkg, nightsRaw)
          : (pkg?.nights ?? DEFAULT_BRIEF.nights),
      roomId: typeof parsed.roomId === "string" && parsed.roomId ? parsed.roomId : (pkg?.rooms[0]?.id ?? ""),
    };
  } catch {
    return null;
  }
}

export function clearPending() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_KEY);
}

export function saveNext(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(NEXT_KEY, path);
}

export function loadNext(): string {
  if (typeof window === "undefined") return "/";
  try {
    const next = window.sessionStorage.getItem(NEXT_KEY);
    if (next && next.startsWith("/") && !next.startsWith("//") && next !== "/login") {
      return next;
    }
    return "/";
  } catch {
    return "/";
  }
}

export function consumeNext(): string {
  const next = loadNext();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(NEXT_KEY);
    } catch {
      /* ignore */
    }
  }
  return next;
}
