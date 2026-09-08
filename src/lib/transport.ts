/**
 * Practical last-mile guidance for Puri stays.
 * Nearest major airport: Bhubaneswar (BBI) ~60–70 km.
 * Rail: Puri station is in town.
 */

export type TransportLeg = {
  mode: string;
  duration: string;
  costHint: string;
  why: string;
  tips?: string;
  luggage: "easy" | "ok" | "hard";
  rank: number;
};

export type PropertyTransport = {
  packageId: string;
  neighborhood: string;
  fromAirport: TransportLeg[];
  fromStation: TransportLeg[];
  /** Single best overall recommendation for most guests. */
  best: TransportLeg;
  localNote: string;
};

const BY_ID: Record<string, Omit<PropertyTransport, "packageId">> = {
  "taj-puri-resort-spa": {
    neighborhood: "Balukhand beachfront",
    best: {
      mode: "Hotel private transfer",
      duration: "1 hr 15 min – 1 hr 45 min from BBI",
      costHint: "Usually included or ₹1,800–2,500 one way",
      why: "Beachfront access roads and luggage — pre-booked transfer is the smoothest.",
      tips: "Share flight number with the hotel; they track delays.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "Hotel private transfer",
        duration: "75–105 min",
        costHint: "Included / ₹1,800–2,500",
        why: "Best for families and late arrivals.",
        luggage: "easy",
        rank: 1,
      },
      {
        mode: "App cab (Ola / Uber intercity)",
        duration: "70–100 min",
        costHint: "₹1,600–2,200",
        why: "Flexible if you already use the apps.",
        luggage: "easy",
        rank: 2,
      },
      {
        mode: "Train BBS → Puri + auto",
        duration: "2–3 hr door to door",
        costHint: "₹50–150 + auto",
        why: "Budget option; more transfers.",
        luggage: "hard",
        rank: 3,
      },
    ],
    fromStation: [
      {
        mode: "Hotel pickup / app cab",
        duration: "15–25 min",
        costHint: "₹250–450",
        why: "Station is central; beach road is short.",
        luggage: "easy",
        rank: 1,
      },
      {
        mode: "Auto rickshaw",
        duration: "20–30 min",
        costHint: "₹180–280",
        why: "Fine in daylight with light bags.",
        luggage: "ok",
        rank: 2,
      },
    ],
    localNote: "Balukhand is south of the main beach stretch — avoid walking with bags after dark.",
  },
  "mayfair-heritage-puri": {
    neighborhood: "Chakratirtha Road",
    best: {
      mode: "Hotel transfer from BBI",
      duration: "1 hr 10 min – 1 hr 40 min",
      costHint: "₹1,500–2,200",
      why: "Heritage property handles luggage and temple-road traffic best.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "Hotel transfer",
        duration: "70–100 min",
        costHint: "₹1,500–2,200",
        why: "Recommended default.",
        luggage: "easy",
        rank: 1,
      },
      {
        mode: "App cab",
        duration: "70–95 min",
        costHint: "₹1,500–2,000",
        why: "Good daytime option.",
        luggage: "easy",
        rank: 2,
      },
    ],
    fromStation: [
      {
        mode: "Auto / cab",
        duration: "10–20 min",
        costHint: "₹150–350",
        why: "Close to station and temple side.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Handy for Jagannath Temple visits — ask hotel for early-morning darshan timings.",
  },
  "swosti-premium-beach-resort": {
    neighborhood: "Marine Drive",
    best: {
      mode: "App cab or hotel transfer from BBI",
      duration: "1 hr 15 min – 1 hr 45 min",
      costHint: "₹1,500–2,200",
      why: "Marine Drive is easy for cabs; transfer still wins with luggage.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "App cab / hotel transfer",
        duration: "75–105 min",
        costHint: "₹1,500–2,200",
        why: "Straightforward coastal road access.",
        luggage: "easy",
        rank: 1,
      },
      {
        mode: "OSRTC bus + auto",
        duration: "2–3 hr",
        costHint: "₹150–400",
        why: "Cheapest; more effort with bags.",
        luggage: "hard",
        rank: 2,
      },
    ],
    fromStation: [
      {
        mode: "Auto",
        duration: "10–18 min",
        costHint: "₹120–280",
        why: "Short hop to the beach road.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Marine Drive is walkable to the main beach in good weather.",
  },
};

const DEFAULT: Omit<PropertyTransport, "packageId"> = {
  neighborhood: "Puri",
  best: {
    mode: "Pre-booked cab from Bhubaneswar Airport (BBI)",
    duration: "1 hr 15 min – 1 hr 50 min",
    costHint: "₹1,500–2,500",
    why: "BBI is the practical air gateway; road is the only sensible last mile.",
    tips: "Avoid unmarked taxis at arrivals — use hotel desk or app cabs.",
    luggage: "easy",
    rank: 1,
  },
  fromAirport: [
    {
      mode: "Private cab / hotel transfer",
      duration: "75–110 min",
      costHint: "₹1,500–2,500",
      why: "Fastest door-to-door.",
      luggage: "easy",
      rank: 1,
    },
    {
      mode: "Bus (OSRTC / private) + auto",
      duration: "2–3.5 hr",
      costHint: "₹150–400 total",
      why: "Cheapest; more effort with bags.",
      luggage: "hard",
      rank: 2,
    },
  ],
  fromStation: [
    {
      mode: "Auto / cab",
      duration: "10–25 min",
      costHint: "₹100–400",
      why: "Puri station is in town.",
      luggage: "ok",
      rank: 1,
    },
  ],
  localNote:
    "Fly into Bhubaneswar (BBI). Direct trains to Puri work well if you prefer rail from major cities.",
};

export function getTransportForPackage(packageId: string): PropertyTransport {
  const base = BY_ID[packageId] ?? DEFAULT;
  return { packageId, ...base };
}

export const DIGIYATRA_GUIDE = {
  airportCode: "BBI",
  airportName: "Biju Patnaik International Airport, Bhubaneswar",
  summary:
    "DigiYatra is India’s facial-biometric airport flow. It is for airport checkpoints only (entry, security, boarding) — not hotel check-in.",
  steps: [
    "Install the official DigiYatra app (Android / iOS).",
    "Register with Aadhaar and complete face enrolment.",
    "After airline web check-in, add or scan your boarding pass in the app.",
    "Tap Share with airport so BBI can recognise you at e-gates.",
    "At the airport, follow DigiYatra lanes — your face is the token.",
  ],
  note: "Name on Aadhaar, ticket, and boarding pass must match. DigiYatra has no public hotel API today.",
  appLinks: {
    android: "https://play.google.com/store/apps/details?id=org.digiyatra.org",
    ios: "https://apps.apple.com/in/app/digi-yatra/id6479873321",
  },
};
