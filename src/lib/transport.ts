/**
 * Practical last-mile guidance for Puri stays.
 * Nearest major airport: Bhubaneswar (BBI) ~60–70 km.
 * Rail: Puri station is in town.
 */
import type { ArriveBy, OriginId } from "./origins.ts";
import { inboundFor } from "./origins.ts";

export type TransportLeg = {
  mode: string;
  duration: string;
  costHint: string;
  why: string;
  tips?: string;
  luggage: "easy" | "ok" | "hard";
  rank: number;
};

function amaFromBus(
  kind: "beach" | "temple" | "baliapanda" | "konark" | "station",
): TransportLeg[] {
  if (kind === "temple") {
    return [
      {
        mode: "Walk / auto from Puri Bus Stand",
        duration: "8–15 min",
        costHint: "₹0–180",
        why: "OSRTC and Ama 50/51 drop at Puri Bus Stand. Ama 74 runs station → Jagannath via the stand.",
        luggage: "ok",
        rank: 1,
      },
    ];
  }
  if (kind === "station") {
    return [
      {
        mode: "Ama Bus 52 or walk from Puri Bus Stand",
        duration: "5–12 min",
        costHint: "₹0–80",
        why: "Route 52 stops at Puri Railway Station. The bus stand is next door.",
        luggage: "ok",
        rank: 1,
      },
    ];
  }
  if (kind === "baliapanda") {
    return [
      {
        mode: "Ama Bus 52 to Baliapanda",
        duration: "15–25 min",
        costHint: "₹10–40",
        why: "Route 52 is Puri Bus Stand → Mangalahata via Railway Station, Beach Road and Baliapanda.",
        luggage: "ok",
        rank: 1,
      },
    ];
  }
  if (kind === "konark") {
    return [
      {
        mode: "Ama Bus 57 toward Konark, or a cab from the bus stand",
        duration: "25–45 min",
        costHint: "₹20–700",
        why: "Route 57 runs Puri Bus Stand along Marine Drive to Konark. With luggage, a cab from the stand is kinder.",
        luggage: "ok",
        rank: 1,
      },
    ];
  }
  return [
    {
      mode: "Ama Bus 52 (Beach Road) or auto from Puri Bus Stand",
      duration: "15–30 min",
      costHint: "₹10–250",
      why: "Route 52 covers Railway Station, Beach Road and Baliapanda. An auto is faster with bags.",
      luggage: "ok",
      rank: 1,
    },
  ];
}

export type PropertyTransport = {
  packageId: string;
  neighborhood: string;
  fromAirport: TransportLeg[];
  fromStation: TransportLeg[];
  fromBus?: TransportLeg[];
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
  "mayfair-waves-puri": {
    neighborhood: "Chakratirtha Road",
    best: {
      mode: "Hotel transfer from BBI",
      duration: "1 hr 10 min – 1 hr 40 min",
      costHint: "₹1,500–2,200",
      why: "Same campus as Heritage — transfer handles luggage and temple-road traffic.",
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
        why: "Fine in daylight.",
        luggage: "easy",
        rank: 2,
      },
    ],
    fromStation: [
      {
        mode: "Auto / cab",
        duration: "10–20 min",
        costHint: "₹150–350",
        why: "Close to the temple side of town.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Waves sits next to Heritage — confirm which gate the driver uses.",
  },
  "toshali-sands-puri": {
    neighborhood: "Konark Marine Drive",
    best: {
      mode: "Hotel transfer from BBI",
      duration: "1 hr 20 min – 1 hr 50 min",
      costHint: "₹1,800–2,400",
      why: "The campus is south of town on the Konark road — a pre-booked car is simpler than two autos.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "Hotel transfer / private cab",
        duration: "80–110 min",
        costHint: "₹1,800–2,400",
        why: "Direct to the gate; skip the town crush.",
        luggage: "easy",
        rank: 1,
      },
    ],
    fromStation: [
      {
        mode: "Pre-booked cab",
        duration: "25–40 min",
        costHint: "₹400–700",
        why: "Not a short auto hop — the resort sits outside the main beach strip.",
        luggage: "easy",
        rank: 1,
      },
    ],
    localNote: "Ask the desk for the Konark timing — you are already on that road.",
  },
  "chariot-resort-puri": {
    neighborhood: "Baliapanda beach",
    best: {
      mode: "Hotel transfer or app cab from BBI",
      duration: "1 hr 15 min – 1 hr 45 min",
      costHint: "₹1,600–2,300",
      why: "Beach-road access is easy; transfer still wins with luggage.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "Hotel transfer / app cab",
        duration: "75–105 min",
        costHint: "₹1,600–2,300",
        why: "Straightforward coastal road.",
        luggage: "easy",
        rank: 1,
      },
    ],
    fromStation: [
      {
        mode: "Auto / cab",
        duration: "15–25 min",
        costHint: "₹200–400",
        why: "South of the main stretch; still a short ride.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Quieter sand than the Grand Road crush — fine for a walk after check-in.",
  },
  "chanakya-bnr-puri": {
    neighborhood: "Near Puri railway station",
    best: {
      mode: "Train to Puri + short walk or auto",
      duration: "5–10 min from the station",
      costHint: "₹0–80",
      why: "This is a railway hotel. If you arrive by train, you are already there.",
      luggage: "ok",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "App cab",
        duration: "70–100 min",
        costHint: "₹1,400–2,000",
        why: "Direct to the station side of town.",
        luggage: "easy",
        rank: 1,
      },
      {
        mode: "Train BBS → Puri",
        duration: "2–3 hr door to door",
        costHint: "₹50–150",
        why: "The hotel is built for rail arrivals.",
        luggage: "ok",
        rank: 2,
      },
    ],
    fromStation: [
      {
        mode: "Walk / auto",
        duration: "5–10 min",
        costHint: "₹0–80",
        why: "You can see the building from the station approach.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Best as a temple-night base. Grand Road and Jagannath are a short ride, not a beach walk.",
  },
  "mahodadhi-palace-puri": {
    neighborhood: "Sea Beach Road",
    best: {
      mode: "Hotel transfer from BBI",
      duration: "1 hr 15 min – 1 hr 45 min",
      costHint: "₹1,800–2,400",
      why: "A palace on the main beach — let the desk handle bags and the last-mile crush.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "Hotel transfer",
        duration: "75–105 min",
        costHint: "₹1,800–2,400",
        why: "Heritage property, heritage arrival.",
        luggage: "easy",
        rank: 1,
      },
    ],
    fromStation: [
      {
        mode: "Cab / auto",
        duration: "10–18 min",
        costHint: "₹150–300",
        why: "Short hop to the beach road.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "On the sand, close to town. One-night palace stays work if you want the building, not a resort week.",
  },
  "holiday-resort-puri": {
    neighborhood: "Sea Beach Road",
    best: {
      mode: "App cab from BBI",
      duration: "1 hr 15 min – 1 hr 45 min",
      costHint: "₹1,500–2,100",
      why: "On the main beach stretch — cabs find it easily.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "App cab / hotel transfer",
        duration: "75–105 min",
        costHint: "₹1,500–2,100",
        why: "Straightforward beach-road drop.",
        luggage: "easy",
        rank: 1,
      },
    ],
    fromStation: [
      {
        mode: "Auto",
        duration: "10–18 min",
        costHint: "₹120–250",
        why: "Short hop to the lawn and the sand.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Classic Puri beach hotel. Peak weekends fill the lawn — mid-week is calmer.",
  },
  "regenta-central-puri": {
    neighborhood: "Near Jagannath Temple",
    best: {
      mode: "Train to Puri + auto, or cab from BBI",
      duration: "10–15 min from the station · 70–100 min from BBI",
      costHint: "₹120–250 auto · ₹1,400–2,000 cab",
      why: "Temple-side 4-star. Rail arrivals win; flyers take a cab straight to Grand Road.",
      luggage: "ok",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "App cab",
        duration: "70–100 min",
        costHint: "₹1,400–2,000",
        why: "Drop on the temple side of town — skip the beach loop.",
        luggage: "easy",
        rank: 1,
      },
    ],
    fromStation: [
      {
        mode: "Auto / walk",
        duration: "8–15 min",
        costHint: "₹80–180",
        why: "Short ride toward Jagannath. Fine with a cabin bag.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Ask the desk for a quiet darshan window. Festival nights the road closes.",
  },
  "hans-coco-palms": {
    neighborhood: "Sea Beach Road",
    best: {
      mode: "App cab from BBI",
      duration: "1 hr 15 min – 1 hr 45 min",
      costHint: "₹1,500–2,100",
      why: "On the beach road with the palms — cabs pin it without fuss.",
      luggage: "easy",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "App cab / hotel transfer",
        duration: "75–105 min",
        costHint: "₹1,500–2,100",
        why: "Direct to the garden gate.",
        luggage: "easy",
        rank: 1,
      },
    ],
    fromStation: [
      {
        mode: "Auto",
        duration: "10–18 min",
        costHint: "₹120–250",
        why: "Short hop to the sand.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Beach-side value stay. Evening walk on the sand is the point.",
  },
  "empires-hotel-puri": {
    neighborhood: "Grand Road",
    best: {
      mode: "Train to Puri + auto",
      duration: "8–15 min from the station",
      costHint: "₹80–180",
      why: "Temple-night hotel on Grand Road. Rail is the natural arrival.",
      luggage: "ok",
      rank: 1,
    },
    fromAirport: [
      {
        mode: "App cab",
        duration: "70–100 min",
        costHint: "₹1,400–2,000",
        why: "Ask for Grand Road / temple side, not the marine drive hotels.",
        luggage: "easy",
        rank: 1,
      },
    ],
    fromStation: [
      {
        mode: "Auto",
        duration: "8–15 min",
        costHint: "₹80–180",
        why: "The walk is possible; an auto is kinder with bags.",
        luggage: "ok",
        rank: 1,
      },
    ],
    localNote: "Built for a darshan night, not a beach week. Grand Road closes on big festival evenings.",
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
      mode: "OSRTC Baramunda or Ama Bus 50 / 51 / DD1 + auto",
      duration: "90–150 min",
      costHint: "₹40–200",
      why: "Official buses. DD1 is the airport double-decker to Mandira Parking; 50/51 run station or Baramunda to Puri Bus Stand.",
      luggage: "ok",
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
  fromBus: amaFromBus("beach"),
  localNote:
    "Fly into Bhubaneswar (BBI), take OSRTC or Ama Bus into Puri Bus Stand, or train to Puri station.",
};

function inferFromBus(packageId: string, neighborhood: string): TransportLeg[] {
  if (/toshali/i.test(packageId) || /Konark/i.test(neighborhood)) return amaFromBus("konark");
  if (/chanakya/i.test(packageId)) return amaFromBus("station");
  if (/chariot/i.test(packageId) || /Baliapanda/i.test(neighborhood)) return amaFromBus("baliapanda");
  if (
    /empires|regenta/i.test(packageId) ||
    /Grand Road|Jagannath/i.test(neighborhood)
  ) {
    return amaFromBus("temple");
  }
  return amaFromBus("beach");
}

export function getTransportForPackage(packageId: string): PropertyTransport {
  const base = BY_ID[packageId] ?? DEFAULT;
  return {
    packageId,
    ...base,
    fromBus: base.fromBus?.length ? base.fromBus : inferFromBus(packageId, base.neighborhood),
  };
}

export type Journey = {
  packageId: string;
  originId: OriginId | string;
  arriveBy: ArriveBy;
  inbound: ReturnType<typeof inboundFor>;
  lastMile: TransportLeg;
  localNote: string;
  neighborhood: string;
  showDigiYatra: boolean;
  showBusGuide: boolean;
};

export function busStandLastMile(packageId: string): TransportLeg {
  const t = getTransportForPackage(packageId);
  return t.fromBus?.[0] ?? inferFromBus(packageId, t.neighborhood)[0]!;
}

export function lastMileOptions(packageId: string, arriveBy: ArriveBy): TransportLeg[] {
  const t = getTransportForPackage(packageId);
  let legs: TransportLeg[];
  if (arriveBy === "bus") {
    legs = t.fromBus?.length ? t.fromBus : [busStandLastMile(packageId)];
  } else if (arriveBy === "train") {
    legs = t.fromStation.length ? t.fromStation : [t.best];
  } else {
    legs = t.fromAirport.length ? t.fromAirport : [t.best];
  }
  const seen = new Set<string>();
  const unique: TransportLeg[] = [];
  for (const leg of legs) {
    const key = `${leg.rank}:${leg.mode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(leg);
  }
  return unique;
}

export function lastMileForArrival(packageId: string, arriveBy: ArriveBy): TransportLeg {
  return lastMileOptions(packageId, arriveBy)[0] ?? getTransportForPackage(packageId).best;
}

export function getJourney(
  packageId: string,
  originId: OriginId | string | undefined,
  arriveBy: ArriveBy,
): Journey {
  const t = getTransportForPackage(packageId);
  const inbound = inboundFor(originId, arriveBy);
  return {
    packageId,
    originId: originId || "other",
    arriveBy,
    inbound,
    lastMile: lastMileForArrival(packageId, arriveBy),
    localNote: t.localNote,
    neighborhood: t.neighborhood,
    showDigiYatra: inbound.gateway === "BBI",
    showBusGuide: true,
  };
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

export const BUS_GUIDE = {
  osrtc: {
    name: "OSRTC",
    summary:
      "Odisha State Road Transport — the official intercity bus. Baramunda (Bhubaneswar) to Puri Bus Stand runs through the day from about ₹80, first services around 05:15.",
    book: "https://booking.osrtc.org",
    android: "https://play.google.com/store/apps/details?id=com.apps.osrtc",
    ios: "https://apps.apple.com/in/app/osrtc-bus-booking/id6711344311",
    drop: "Puri Bus Stand, next to the station side of town. From Baramunda ISBT the hop is about 1–2 hr from ₹81.",
    routes: [
      "Baramunda (Bhubaneswar) → Puri Bus Stand, all day from ~05:15",
      "Kolkata Babughat → Puri (Shree Jagannath Express Volvo, overnight)",
      "Cuttack Badambadi / CNBT → Puri",
      "Puri ↔ Bengaluru via Berhampur, Vizag, Tirupati",
    ],
  },
  ama: {
    name: "Ama Bus",
    summary:
      "CRUT city buses across Bhubaneswar, Cuttack, Khordha and Puri. Live track, QR tickets, NCMC and WhatsApp booking.",
    site: "https://capitalregiontransport.in/transit-services/ama-bus",
    android: "https://play.google.com/store/apps/details?id=com.chalo.crut",
    whatsapp: "https://wa.me/919078050218",
    routes: [
      "50 / 51 — Bhubaneswar station or Baramunda → Puri Bus Stand",
      "DD1 — Airport / Master Canteen → Shree Mandira Parking (double-decker)",
      "52 — Puri Bus Stand via Railway, Beach Road, Baliapanda",
      "56 / 56E — Khordha / Jatani via Pipili → Puri",
      "57 — Puri → Konark / Astaranga on Marine Drive",
      "58 / 59 — Cuttack (Jagatpur / Mahanadi Vihar) → Puri",
      "74 — Puri Railway → Jagannath Temple via the bus stand",
    ],
  },
};


