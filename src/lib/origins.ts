/**
 * How guests actually reach Puri.
 * Last-mile to each hotel lives in `transport.ts`. This file is the inbound leg
 * from a home city — fly into BBI, train into Puri, or drive.
 */

export type ArriveBy = "fly" | "train" | "road" | "bus";

export type OriginId =
  | "kolkata"
  | "delhi"
  | "mumbai"
  | "hyderabad"
  | "bengaluru"
  | "chennai"
  | "visakhapatnam"
  | "cuttack"
  | "khordha"
  | "bhubaneswar"
  | "puri"
  | "other";

export type InboundLeg = {
  mode: ArriveBy;
  label: string;
  duration: string;
  costHint: string;
  why: string;
  tips?: string;
  gateway: "BBI" | "PURI" | "ROAD" | "BUS";
};

export type OriginCity = {
  id: OriginId;
  label: string;
  hint: string;
  defaultArriveBy: ArriveBy;
  inbound: InboundLeg[];
};

export const ORIGINS: OriginCity[] = [
  {
    id: "kolkata",
    label: "Kolkata",
    hint: "Flights + overnight trains",
    defaultArriveBy: "fly",
    inbound: [
      {
        mode: "fly",
        label: "Fly CCU → Bhubaneswar (BBI)",
        duration: "1 hr 10 min air + last mile",
        costHint: "₹3,500–7,500 one way",
        why: "Several daily hops. Best if you want the afternoon in Puri.",
        tips: "Morning IndiGo/Air India gets you to the hotel by lunch.",
        gateway: "BBI",
      },
      {
        mode: "train",
        label: "Howrah → Puri (Purushottam / Sri Jagannath)",
        duration: "7–9 hr overnight",
        costHint: "₹500–2,200 in 3A/2A",
        why: "The classic pilgrim overnight. You wake up in Puri station.",
        tips: "Book 3A early on festival weeks. Station autos are right outside.",
        gateway: "PURI",
      },
      {
        mode: "road",
        label: "Drive NH16 via Balasore / Bhadrak",
        duration: "8–10 hr",
        costHint: "Toll + fuel ~₹4,000–6,000",
        why: "Only if you want the car in Puri for Konark and Chilika.",
        gateway: "ROAD",
      },
      {
        mode: "bus",
        label: "OSRTC Shree Jagannath Express (Kolkata → Puri)",
        duration: "9.5–11 hr overnight",
        costHint: "₹1,150–1,800 Volvo · from ~₹700 ordinary",
        why: "Official state bus from Babughat / Esplanade. You sleep on the Volvo and wake at Puri Bus Stand.",
        tips: "Book at booking.osrtc.org. Overnight services leave Kolkata around 19:00–21:30.",
        gateway: "BUS",
      },
    ],
  },
  {
    id: "delhi",
    label: "Delhi",
    hint: "Direct flights, long trains",
    defaultArriveBy: "fly",
    inbound: [
      {
        mode: "fly",
        label: "Fly DEL → BBI",
        duration: "2 hr air + last mile",
        costHint: "₹5,500–12,000 one way",
        why: "The only sane same-day arrival from the north.",
        tips: "Avoid the last BBI arrival after 21:00 if you have kids — the road is dark.",
        gateway: "BBI",
      },
      {
        mode: "train",
        label: "Nizamuddin / Anand Vihar → Puri or Bhubaneswar",
        duration: "21–26 hr",
        costHint: "₹1,400–4,500 in 3A/2A",
        why: "Purushottam and Rajdhani work if you like the berth more than the airport.",
        gateway: "PURI",
      },
    ],
  },
  {
    id: "mumbai",
    label: "Mumbai",
    hint: "Direct flights",
    defaultArriveBy: "fly",
    inbound: [
      {
        mode: "fly",
        label: "Fly BOM → BBI",
        duration: "2 hr air + last mile",
        costHint: "₹5,000–11,000 one way",
        why: "Daily nonstop. Train is a day and a night — skip it unless you prefer rail.",
        gateway: "BBI",
      },
      {
        mode: "train",
        label: "CSMT / LTT → Bhubaneswar or Puri",
        duration: "26–32 hr",
        costHint: "₹1,600–4,800",
        why: "Konark Express and similar. Fine if the berth is the point.",
        gateway: "BBI",
      },
    ],
  },
  {
    id: "hyderabad",
    label: "Hyderabad",
    hint: "Short hop to BBI",
    defaultArriveBy: "fly",
    inbound: [
      {
        mode: "fly",
        label: "Fly HYD → BBI",
        duration: "1 hr 20 min air + last mile",
        costHint: "₹4,000–8,500 one way",
        why: "The default. Trains from Secunderabad are a long overnight.",
        gateway: "BBI",
      },
      {
        mode: "train",
        label: "Secunderabad → Bhubaneswar",
        duration: "18–22 hr",
        costHint: "₹1,200–3,500",
        why: "Only if you are already on a rail pass.",
        gateway: "BBI",
      },
    ],
  },
  {
    id: "bengaluru",
    label: "Bengaluru",
    hint: "Direct flights",
    defaultArriveBy: "fly",
    inbound: [
      {
        mode: "fly",
        label: "Fly BLR → BBI",
        duration: "1 hr 50 min air + last mile",
        costHint: "₹4,500–10,000 one way",
        why: "Daily nonstop. Do not take the train unless you have two spare days.",
        gateway: "BBI",
      },
      {
        mode: "bus",
        label: "OSRTC Puri ↔ Bengaluru",
        duration: "Overnight via Berhampur, Vizag, Tirupati",
        costHint: "₹1,800–3,200",
        why: "Direct state bus if you want to skip the airport. Long road — pack light.",
        tips: "Book at booking.osrtc.org. Drops at Puri Bus Stand.",
        gateway: "BUS",
      },
    ],
  },
  {
    id: "chennai",
    label: "Chennai",
    hint: "Flights or Coromandel",
    defaultArriveBy: "fly",
    inbound: [
      {
        mode: "fly",
        label: "Fly MAA → BBI",
        duration: "1 hr 30 min air + last mile",
        costHint: "₹4,000–9,000 one way",
        why: "Fastest. Same-day darshan is realistic on a morning flight.",
        gateway: "BBI",
      },
      {
        mode: "train",
        label: "Chennai → Bhubaneswar (Coromandel / East Coast)",
        duration: "16–20 hr",
        costHint: "₹1,100–3,400",
        why: "A proper overnight if you want to skip the airport.",
        gateway: "BBI",
      },
    ],
  },
  {
    id: "visakhapatnam",
    label: "Visakhapatnam",
    hint: "Train or a short hop",
    defaultArriveBy: "train",
    inbound: [
      {
        mode: "train",
        label: "Vizag → Puri / Bhubaneswar",
        duration: "6–8 hr",
        costHint: "₹250–1,400",
        why: "The East Coast line is the natural path. Morning trains put you in by afternoon.",
        gateway: "PURI",
      },
      {
        mode: "fly",
        label: "Fly VTZ → BBI",
        duration: "50 min air + last mile",
        costHint: "₹3,500–7,000",
        why: "Only worth it if you are tight on time.",
        gateway: "BBI",
      },
      {
        mode: "road",
        label: "Drive NH16",
        duration: "7–9 hr",
        costHint: "Fuel + toll ~₹3,500–5,000",
        why: "Useful if you want the car for Konark.",
        gateway: "ROAD",
      },
      {
        mode: "bus",
        label: "OSRTC Vizag → Bhubaneswar / Puri",
        duration: "8–10 hr",
        costHint: "₹400–1,000",
        why: "The East Coast road is the natural bus path. Prefer a day service if you have bags.",
        tips: "Book OSRTC. Last mile from Puri Bus Stand is a short auto.",
        gateway: "BUS",
      },
    ],
  },
  {
    id: "cuttack",
    label: "Cuttack",
    hint: "OSRTC or Ama Bus",
    defaultArriveBy: "bus",
    inbound: [
      {
        mode: "bus",
        label: "OSRTC / Ama Bus Cuttack → Puri",
        duration: "1.5–2.5 hr",
        costHint: "₹80–180",
        why: "OSRTC from Badambadi / CNBT. Ama Bus 58 and 59 also run Jagatpur / Mahanadi Vihar to Puri Bus Stand.",
        tips: "Book OSRTC at booking.osrtc.org. Track Ama Bus in the CRUT app.",
        gateway: "BUS",
      },
      {
        mode: "train",
        label: "CTC → Puri",
        duration: "1.5–2.5 hr door to door",
        costHint: "₹20–120",
        why: "Fine if you are already at Cuttack station with light bags.",
        gateway: "PURI",
      },
      {
        mode: "road",
        label: "Cab Cuttack → Puri",
        duration: "1 hr 20 min – 2 hr",
        costHint: "₹1,400–2,200",
        why: "Faster with luggage than the bus on a festival weekend.",
        gateway: "ROAD",
      },
    ],
  },
  {
    id: "khordha",
    label: "Khordha / Jatani",
    hint: "Ama Bus 56 via Pipili",
    defaultArriveBy: "bus",
    inbound: [
      {
        mode: "bus",
        label: "Ama Bus 56 / 56E → Puri Bus Stand",
        duration: "1.5–2.5 hr",
        costHint: "₹30–80",
        why: "CRUT Ama Bus 56 from Khordha New Bus Stand and 56E from Khordha Road station run via Jatani and Pipili.",
        tips: "Live-track and pay in the Ama Bus app. Festival weeks add 56E extras.",
        gateway: "BUS",
      },
      {
        mode: "road",
        label: "Cab via Pipili / NH316",
        duration: "1 hr – 1 hr 40 min",
        costHint: "₹1,200–2,000",
        why: "The fast option with bags. Same road the Ama Bus uses.",
        gateway: "ROAD",
      },
    ],
  },
  {
    id: "bhubaneswar",
    label: "Bhubaneswar",
    hint: "OSRTC + Ama Bus",
    defaultArriveBy: "bus",
    inbound: [
      {
        mode: "bus",
        label: "OSRTC Baramunda or Ama Bus 50 / 51 / DD1",
        duration: "1–2 hr",
        costHint: "₹40–150",
        why: "OSRTC from Baramunda ISBT to Puri Bus Stand all day from about ₹81. Ama 50 (BBS station) and 51 (Baramunda) are the city-branded hop. DD1 is the airport double-decker to Mandira Parking.",
        tips: "OSRTC: booking.osrtc.org. Ama Bus: CRUT app or WhatsApp +91 9078050218.",
        gateway: "BUS",
      },
      {
        mode: "road",
        label: "Cab or self-drive Bhubaneswar → Puri",
        duration: "1 hr 15 min – 1 hr 50 min",
        costHint: "₹1,500–2,500 one way",
        why: "Faster with luggage than the bus. NH316 is the usual road.",
        tips: "Leave before 8am or after 7pm to miss the temple-weekend crawl.",
        gateway: "ROAD",
      },
      {
        mode: "train",
        label: "BBS → Puri local / express",
        duration: "1.5–2.5 hr door to door",
        costHint: "₹20–150",
        why: "Cheap if you are already at the station with light bags.",
        gateway: "PURI",
      },
    ],
  },
  {
    id: "puri",
    label: "Already in Puri",
    hint: "Ama Bus around town",
    defaultArriveBy: "bus",
    inbound: [
      {
        mode: "bus",
        label: "Ama Bus around Puri",
        duration: "10–40 min",
        costHint: "₹10–50 with a digital ticket",
        why: "CRUT Ama Bus is the city network. Route 52 runs Puri Bus Stand via the railway station, Beach Road and Baliapanda.",
        tips: "Track and pay in the Ama Bus app, or WhatsApp +91 9078050218. Women get a digital fare cut.",
        gateway: "BUS",
      },
      {
        mode: "road",
        label: "Local cab / auto to the stay",
        duration: "10–40 min",
        costHint: "₹100–700",
        why: "Faster with luggage than waiting for the next Ama Bus.",
        gateway: "ROAD",
      },
    ],
  },
  {
    id: "other",
    label: "Somewhere else",
    hint: "Fly, train, or OSRTC",
    defaultArriveBy: "fly",
    inbound: [
      {
        mode: "fly",
        label: "Fly into Bhubaneswar (BBI)",
        duration: "Then 75–110 min by road",
        costHint: "Last mile ₹1,500–2,500",
        why: "BBI is the air gateway for Puri. There is no Puri airport.",
        gateway: "BBI",
      },
      {
        mode: "train",
        label: "Train into Puri station",
        duration: "Station is in town",
        costHint: "Then ₹100–400 auto / cab",
        why: "Puri is a railhead. If your city has a direct, take it.",
        gateway: "PURI",
      },
      {
        mode: "bus",
        label: "OSRTC into Puri Bus Stand",
        duration: "Depends on your city",
        costHint: "From ~₹80 inside Odisha",
        why: "If you are already in the state — Cuttack, Berhampur, Rourkela, Sambalpur — OSRTC is the official intercity bus.",
        tips: "Book at osrtc.org. Ama Bus is the city layer once you are in Puri.",
        gateway: "BUS",
      },
    ],
  },
];

export const ARRIVE_BY: { id: ArriveBy; label: string; hint: string }[] = [
  { id: "fly", label: "Fly", hint: "Into Bhubaneswar (BBI)" },
  { id: "train", label: "Train", hint: "Into Puri or BBS" },
  { id: "bus", label: "Bus", hint: "OSRTC & Ama Bus" },
  { id: "road", label: "Road", hint: "Cab or self-drive" },
];

export function getOrigin(id: OriginId | string | undefined): OriginCity {
  return ORIGINS.find((o) => o.id === id) ?? ORIGINS.find((o) => o.id === "other")!;
}

export function inboundFor(originId: OriginId | string | undefined, arriveBy: ArriveBy): InboundLeg {
  const origin = getOrigin(originId);
  return origin.inbound.find((l) => l.mode === arriveBy) ?? origin.inbound[0]!;
}

export function arriveOptionsFor(originId: OriginId | string | undefined): ArriveBy[] {
  const origin = getOrigin(originId);
  return origin.inbound.map((l) => l.mode);
}
