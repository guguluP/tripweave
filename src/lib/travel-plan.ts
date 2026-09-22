/**
 * Door-to-door travel quotes on top of last-mile notes in transport.ts.
 * Stay matching stays in packages.ts — this file ranks last-mile, prices hotel
 * pickup, and holds the guest's travel draft until checkout.
 */
import { inboundFor, type ArriveBy } from "./origins.ts";
import {
  BUS_GUIDE,
  getTransportForPackage,
  lastMileOptions,
  type TransportLeg,
} from "./transport.ts";
import { getPackage, originPlace, type Brief } from "./packages.ts";

export type TravelPlan = {
  lastMileId: string;
  includePickup: boolean;
  carrierRef: string;
  arrivalTime: string;
  arriveBy: ArriveBy;
  origin: string;
};

export type LastMileBucket = "hotel" | "cab" | "auto_bus" | "other";

export type RankedLastMile = {
  id: string;
  leg: TransportLeg;
  bucket: LastMileBucket;
  score: number;
  cheapest: boolean;
  safest: boolean;
  recommended: boolean;
  badge: string | null;
};

export type BookingLink = { label: string; href: string };

export type PickupQuote = {
  available: boolean;
  included: boolean;
  price: number;
  label: string;
  duration: string;
};

export type TravelQuote = {
  packageId: string;
  originLabel: string;
  inbound: ReturnType<typeof inboundFor>;
  lastMile: TransportLeg;
  options: RankedLastMile[];
  recommendedId: string;
  lastMileRange: { min: number; max: number };
  inboundRange: { min: number; max: number };
  costLine: string;
  bestLine: string;
  pickup: PickupQuote;
  bookingLinks: BookingLink[];
  lastMileLinks: BookingLink[];
  why: string;
  mapEmbedUrl: string;
  mapDirectionsUrl: string;
};

export type TravelDraft = {
  lastMileByPackage: Record<string, string>;
  includePickupByPackage: Record<string, boolean>;
  carrierRef: string;
  arrivalTime: string;
};

const DRAFT_KEY = "tripweave-travel-draft";

export const EMPTY_TRAVEL: TravelPlan = {
  lastMileId: "",
  includePickup: false,
  carrierRef: "",
  arrivalTime: "",
  arriveBy: "fly",
  origin: "kolkata",
};

export const EMPTY_DRAFT: TravelDraft = {
  lastMileByPackage: {},
  includePickupByPackage: {},
  carrierRef: "",
  arrivalTime: "",
};

export function parseInrRange(hint: string): { min: number; max: number; included: boolean } {
  const included = /included/i.test(hint);
  const toNum = (s: string) => Number(s.replace(/,/g, ""));
  const ranged = hint.match(/₹\s*([\d,]+)\s*[–-]\s*₹?\s*([\d,]+)/);
  if (ranged) {
    const a = toNum(ranged[1]!);
    const b = toNum(ranged[2]!);
    return { min: Math.min(a, b), max: Math.max(a, b), included };
  }
  const nums = [...hint.matchAll(/₹\s*([\d,]+)/g)].map((m) => toNum(m[1]!));
  if (nums.length === 0) return { min: 0, max: 0, included };
  return { min: Math.min(...nums), max: Math.max(...nums), included };
}

export function formatInrRange(min: number, max: number): string {
  const fmt = (n: number) => n.toLocaleString("en-IN");
  if (min === max) return `₹${fmt(min)}`;
  return `₹${fmt(min)}–${fmt(max)}`;
}

export function lastMileId(leg: TransportLeg): string {
  const slug = leg.mode
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${leg.rank}-${slug}`;
}

export function parseTravelPlan(raw: unknown): TravelPlan {
  if (!raw || typeof raw !== "object") return { ...EMPTY_TRAVEL };
  const t = raw as Record<string, unknown>;
  const arriveBy = t.arriveBy;
  return {
    lastMileId: typeof t.lastMileId === "string" ? t.lastMileId : "",
    includePickup: Boolean(t.includePickup),
    carrierRef: typeof t.carrierRef === "string" ? t.carrierRef : "",
    arrivalTime: typeof t.arrivalTime === "string" ? t.arrivalTime : "",
    arriveBy: arriveBy === "train" || arriveBy === "bus" || arriveBy === "road" || arriveBy === "fly" ? arriveBy : "fly",
    origin: typeof t.origin === "string" && t.origin ? t.origin : "kolkata",
  };
}

export function bucketOf(leg: TransportLeg): LastMileBucket {
  const m = leg.mode.toLowerCase();
  if (/hotel|transfer|private/.test(m)) return "hotel";
  if ((/app cab|ola|uber|pre-booked cab|private cab/.test(m) || /\bcab\b/.test(m)) && !/bus/.test(m)) {
    return "cab";
  }
  if (/auto|bus|ama|osrtc|walk/.test(m)) return "auto_bus";
  return "other";
}

function scoreLeg(leg: TransportLeg, brief: Brief): number {
  const bucket = bucketOf(leg);
  let score = (5 - leg.rank) * 3;
  if (leg.luggage === "easy") score += 2;
  if (leg.luggage === "hard") score -= 4;
  const blob = `${leg.mode} ${leg.why} ${leg.tips ?? ""}`;

  if (brief.style === "family") {
    if (bucket === "hotel") score += 8;
    if (bucket === "cab") score += 5;
    if (bucket === "auto_bus") score -= 2;
    if (leg.luggage === "easy") score += 3;
  } else if (brief.style === "solo") {
    if (bucket === "auto_bus") score += 6;
    if (bucket === "cab") score += 1;
    if (bucket === "hotel") score -= 1;
    const { min } = parseInrRange(leg.costHint);
    if (min > 0 && min <= 300) score += 4;
  } else if (brief.style === "friends") {
    if (bucket === "cab") score += 5;
    if (bucket === "auto_bus") score += 3;
  } else {
    if (bucket === "hotel") score += 5;
    if (bucket === "cab") score += 4;
  }

  if (brief.vibe === "beach" && /marine|beach|baliapanda|sand|coast/i.test(blob)) score += 4;
  if (brief.vibe === "culture" && /station|auto|grand road|temple|mandira|jagannath|walk/i.test(blob)) {
    score += 4;
  }
  if (brief.vibe === "culture" && brief.arriveBy === "train" && bucket === "auto_bus") score += 3;
  if (brief.vibe === "relax" && (bucket === "hotel" || bucket === "cab")) score += 3;
  if (brief.budget === "value" && bucket === "auto_bus") score += 4;
  if (brief.budget === "premium" && bucket === "hotel") score += 4;
  return score;
}

function gatewayLabel(arriveBy: ArriveBy): string {
  if (arriveBy === "fly") return "BBI";
  if (arriveBy === "train") return "Puri station";
  if (arriveBy === "bus") return "Puri Bus Stand";
  return "the highway";
}

function shortMode(leg: TransportLeg): string {
  const bucket = bucketOf(leg);
  if (bucket === "hotel") return "hotel transfer";
  if (bucket === "cab") return "cab";
  if (/auto/.test(leg.mode.toLowerCase()) && /bus|ama|osrtc/.test(leg.mode.toLowerCase())) {
    return "bus + auto";
  }
  if (/auto/.test(leg.mode.toLowerCase())) return "auto";
  if (/bus|ama|osrtc/.test(leg.mode.toLowerCase())) return "bus";
  return leg.mode.split("/")[0]!.trim().toLowerCase();
}

function bestReason(leg: TransportLeg, brief: Brief): string {
  const bits: string[] = [];
  if (leg.luggage === "easy") bits.push("easier with bags");
  if (brief.style === "family" && bucketOf(leg) === "hotel") bits.push("private car for the group");
  if (brief.vibe === "beach" && /marine|beach|baliapanda/i.test(`${leg.mode} ${leg.why}`)) {
    bits.push("Marine Drive drop");
  }
  if (brief.vibe === "culture" && /temple|grand road|station|mandira|walk|auto/i.test(`${leg.mode} ${leg.why}`)) {
    bits.push("closer to the temple streets");
  }
  if (brief.style === "solo" && parseInrRange(leg.costHint).min <= 300) bits.push("cheapest door-to-door");
  if (bits.length === 0) bits.push(leg.why.split(".")[0] ?? "fits this brief");
  return bits.slice(0, 2).join(" · ");
}

export function travelBookingLinks(arriveBy: ArriveBy, from = ""): BookingLink[] {
  if (arriveBy === "fly") {
    const q = from ? `Flights from ${from} to BBI` : "Flights to BBI";
    return [
      { label: "Google Flights", href: `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}` },
      { label: "Book cab from BBI", href: "https://www.olacabs.com" },
    ];
  }
  if (arriveBy === "train") {
    return [{ label: "Book on IRCTC", href: "https://www.irctc.co.in/nget/train-search" }];
  }
  if (arriveBy === "bus") {
    return [
      { label: "Book OSRTC", href: BUS_GUIDE.osrtc.book },
      { label: "Ama Bus app", href: BUS_GUIDE.ama.android },
    ];
  }
  return [
    { label: "Ola", href: "https://www.olacabs.com" },
    { label: "Uber", href: "https://m.uber.com/ul/" },
  ];
}

export function lastMileBookingLinks(leg: TransportLeg): BookingLink[] {
  const m = leg.mode.toLowerCase();
  if (bucketOf(leg) === "hotel") return [];
  if (bucketOf(leg) === "cab") {
    return [
      { label: "Book Ola", href: "https://www.olacabs.com" },
      { label: "Book Uber", href: "https://m.uber.com/ul/" },
    ];
  }
  if (/osrtc|ama|bus/.test(m)) {
    return [
      { label: "Book OSRTC", href: BUS_GUIDE.osrtc.book },
      { label: "Ama Bus", href: BUS_GUIDE.ama.android },
    ];
  }
  if (/auto/.test(m)) {
    return [{ label: "Book Ola", href: "https://www.olacabs.com" }];
  }
  return [];
}

const PURI = { lat: 19.8135, lon: 85.8312 };
const BBI = { lat: 20.2538, lon: 85.8173 };
const STATION = { lat: 19.8076, lon: 85.8375 };
const BUS = { lat: 19.8139, lon: 85.8319 };

function gatewayCoords(arriveBy: ArriveBy) {
  if (arriveBy === "fly" || arriveBy === "road") return BBI;
  if (arriveBy === "train") return STATION;
  return BUS;
}

export function mapEmbedUrl(arriveBy: ArriveBy): string {
  const p = gatewayCoords(arriveBy);
  const minLon = Math.min(p.lon, PURI.lon) - 0.12;
  const minLat = Math.min(p.lat, PURI.lat) - 0.12;
  const maxLon = Math.max(p.lon, PURI.lon) + 0.12;
  const maxLat = Math.max(p.lat, PURI.lat) + 0.12;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${p.lat}%2C${p.lon}`;
}

export function mapDirectionsUrl(hotelName: string, arriveBy: ArriveBy): string {
  const origin =
    arriveBy === "fly" || arriveBy === "road"
      ? "Biju Patnaik International Airport Bhubaneswar"
      : arriveBy === "train"
        ? "Puri Railway Station"
        : "Puri Bus Stand";
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(`${hotelName} Puri`)}`;
}

function stayIncludesAirportTransfer(packageId: string): boolean {
  const pkg = getPackage(packageId);
  return Boolean(pkg?.includes.some((item) => /airport transfer|hotel transfer|pickup/i.test(item)));
}

function hotelTransferLeg(packageId: string, arriveBy: ArriveBy): TransportLeg | null {
  const options = lastMileOptions(packageId, arriveBy);
  const local = options.find((l) => bucketOf(l) === "hotel");
  if (local) return local;
  const air = getTransportForPackage(packageId).fromAirport.find((l) => bucketOf(l) === "hotel");
  if (air) return air;
  return getTransportForPackage("typical").fromAirport.find((l) => bucketOf(l) === "hotel") ?? null;
}

export function pickupQuoteFor(packageId: string, arriveBy: ArriveBy): PickupQuote {
  const hotel = hotelTransferLeg(packageId, arriveBy);
  if (!hotel) {
    return { available: false, included: false, price: 0, label: "Hotel pickup", duration: "" };
  }
  const included = stayIncludesAirportTransfer(packageId) && (arriveBy === "fly" || arriveBy === "road");
  const range = parseInrRange(hotel.costHint);
  const price = included ? 0 : range.min > 0 ? range.min : 1800;
  return {
    available: true,
    included,
    price,
    label: included ? "Included hotel transfer" : "Hotel pickup",
    duration: hotel.duration,
  };
}

export function pickupChargeInr(packageId: string, plan: TravelPlan): number {
  if (!plan.includePickup) return 0;
  const quote = pickupQuoteFor(packageId, plan.arriveBy);
  if (!quote.available || quote.included) return 0;
  return quote.price;
}

export function rankLastMiles(packageId: string, brief: Brief): RankedLastMile[] {
  const legs = lastMileOptions(packageId, brief.arriveBy);
  if (legs.length === 0) return [];
  const scored = legs.map((leg) => ({
    id: lastMileId(leg),
    leg,
    bucket: bucketOf(leg),
    score: scoreLeg(leg, brief),
    cheapest: false,
    safest: false,
    recommended: false,
    badge: null as string | null,
  }));
  const cheapestId = scored.reduce((best, cur) => {
    const a = parseInrRange(best.leg.costHint).min;
    const b = parseInrRange(cur.leg.costHint).min;
    return b < a ? cur : best;
  }).id;
  const safestId = scored.reduce((best, cur) => {
    const rank = (row: typeof scored[number]) => {
      if (row.bucket === "hotel") return 3;
      if (row.bucket === "cab" && row.leg.luggage === "easy") return 2;
      if (row.leg.luggage === "easy") return 1;
      return 0;
    };
    return rank(cur) > rank(best) ? cur : best;
  }).id;
  const recommendedId = scored.reduce((best, cur) => (cur.score > best.score ? cur : best)).id;
  return scored
    .map((row) => {
      const cheapest = row.id === cheapestId;
      const safest = row.id === safestId;
      const recommended = row.id === recommendedId;
      let badge: string | null = null;
      if (recommended) {
        badge =
          brief.style === "family"
            ? "Best for family"
            : brief.style === "solo"
              ? "Best for solo"
              : brief.vibe === "beach"
                ? "Best for a beach stay"
                : brief.vibe === "culture"
                  ? "Best for temple streets"
                  : "Best for you";
      } else if (cheapest) badge = "Cheapest";
      else if (safest) badge = "Easiest with bags";
      return { ...row, cheapest, safest, recommended, badge };
    })
    .sort((a, b) => b.score - a.score);
}

export function quoteTravel(packageId: string, brief: Brief, plan?: Partial<TravelPlan>): TravelQuote {
  const inbound = inboundFor(brief.origin, brief.arriveBy);
  const options = rankLastMiles(packageId, brief);
  const recommendedId = options.find((o) => o.recommended)?.id ?? options[0]?.id ?? "";
  const selectedId = plan?.lastMileId && options.some((o) => o.id === plan.lastMileId) ? plan.lastMileId : recommendedId;
  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const lastMile = selected?.leg ?? lastMileOptions(packageId, brief.arriveBy)[0]!;
  const lastMileRange = parseInrRange(lastMile.costHint);
  const inboundRange = parseInrRange(inbound.costHint);
  const pickup = pickupQuoteFor(packageId, brief.arriveBy);
  const pkg = getPackage(packageId);
  const hotelName = pkg?.name ?? "Puri";
  const costLine = `${formatInrRange(lastMileRange.min, lastMileRange.max)} from ${gatewayLabel(brief.arriveBy)} via ${shortMode(lastMile)}`;
  const best = options.find((o) => o.recommended);
  const bestLine = best
    ? `${best.leg.mode.split(" / ")[0]} recommended — ${bestReason(best.leg, brief)}`
    : lastMile.why;
  return {
    packageId,
    originLabel: originPlace(brief),
    inbound,
    lastMile,
    options,
    recommendedId,
    lastMileRange: { min: lastMileRange.min, max: lastMileRange.max },
    inboundRange: { min: inboundRange.min, max: inboundRange.max },
    costLine,
    bestLine,
    pickup,
    bookingLinks: travelBookingLinks(brief.arriveBy, originPlace(brief)),
    lastMileLinks: lastMileBookingLinks(lastMile),
    why: lastMile.why,
    mapEmbedUrl: mapEmbedUrl(brief.arriveBy),
    mapDirectionsUrl: mapDirectionsUrl(hotelName, brief.arriveBy),
  };
}

export function inboundPreview(brief: Brief): TravelQuote {
  const quote = quoteTravel("mayfair-heritage-puri", brief);
  const city = originPlace(brief);
  const named =
    brief.origin === "other" && brief.originCity?.trim()
      ? `${city} · ${quote.inbound.label}`
      : quote.inbound.label;
  return {
    ...quote,
    costLine: quote.inbound.costHint,
    bestLine: quote.inbound.why,
    inbound: { ...quote.inbound, label: named },
  };
}

function defaultIncludePickup(brief: Brief, pickup: PickupQuote): boolean {
  if (!pickup.available) return false;
  if (pickup.included) return true;
  if (brief.style === "solo" || brief.budget === "value") return false;
  return brief.style === "family" || brief.style === "couple";
}

export function defaultTravelPlan(packageId: string, brief: Brief, stored?: Partial<TravelPlan>): TravelPlan {
  const draft = loadTravelDraft();
  const quote = quoteTravel(packageId, brief, stored);
  const lastMileId =
    stored?.lastMileId ||
    draft.lastMileByPackage[packageId] ||
    quote.recommendedId;
  const includePickup =
    stored?.includePickup ??
    draft.includePickupByPackage[packageId] ??
    defaultIncludePickup(brief, quote.pickup);
  return {
    lastMileId,
    includePickup,
    carrierRef: stored?.carrierRef ?? draft.carrierRef ?? "",
    arrivalTime: stored?.arrivalTime ?? draft.arrivalTime ?? "",
    arriveBy: stored?.arriveBy ?? brief.arriveBy,
    origin: stored?.origin ?? brief.origin,
  };
}

export function pickupAmountFor(packageId: string, brief: Brief, plan: TravelPlan): number {
  return pickupChargeInr(packageId, { ...plan, arriveBy: plan.arriveBy || brief.arriveBy });
}

export function loadTravelDraft(): TravelDraft {
  if (typeof window === "undefined") return { ...EMPTY_DRAFT, lastMileByPackage: {}, includePickupByPackage: {} };
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return { ...EMPTY_DRAFT, lastMileByPackage: {}, includePickupByPackage: {} };
    const parsed = JSON.parse(raw) as Partial<TravelDraft>;
    return {
      lastMileByPackage:
        parsed.lastMileByPackage && typeof parsed.lastMileByPackage === "object" ? parsed.lastMileByPackage : {},
      includePickupByPackage:
        parsed.includePickupByPackage && typeof parsed.includePickupByPackage === "object"
          ? parsed.includePickupByPackage
          : {},
      carrierRef: typeof parsed.carrierRef === "string" ? parsed.carrierRef : "",
      arrivalTime: typeof parsed.arrivalTime === "string" ? parsed.arrivalTime : "",
    };
  } catch {
    return { ...EMPTY_DRAFT, lastMileByPackage: {}, includePickupByPackage: {} };
  }
}

export function saveTravelDraft(draft: TravelDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function patchTravelDraft(packageId: string, patch: Partial<TravelPlan>): TravelDraft {
  const prev = loadTravelDraft();
  const next: TravelDraft = {
    lastMileByPackage: { ...prev.lastMileByPackage },
    includePickupByPackage: { ...prev.includePickupByPackage },
    carrierRef: patch.carrierRef ?? prev.carrierRef,
    arrivalTime: patch.arrivalTime ?? prev.arrivalTime,
  };
  if (patch.lastMileId) next.lastMileByPackage[packageId] = patch.lastMileId;
  if (typeof patch.includePickup === "boolean") {
    next.includePickupByPackage[packageId] = patch.includePickup;
  }
  saveTravelDraft(next);
  return next;
}

export function travelSummaryLine(quote: TravelQuote, plan: TravelPlan): string {
  const bits = [quote.costLine, quote.lastMile.duration];
  if (plan.carrierRef.trim()) bits.push(plan.carrierRef.trim());
  if (plan.arrivalTime.trim()) bits.push(`ETA ${plan.arrivalTime.trim()}`);
  if (plan.includePickup && quote.pickup.available) {
    bits.push(quote.pickup.included ? "hotel car included" : `pickup ${formatInrRange(quote.pickup.price, quote.pickup.price)}`);
  }
  return bits.join(" · ");
}

export function travelShareText(input: {
  confirmationCode?: string;
  hotelName: string;
  checkIn?: string;
  quote: TravelQuote;
  plan: TravelPlan;
  guests?: number;
}): string {
  const lines = [
    input.confirmationCode ? `TripWeave stay ${input.confirmationCode}` : "TripWeave travel plan",
    input.hotelName,
    input.checkIn ? `Check-in ${input.checkIn}` : "",
    `Arrival: ${input.quote.inbound.label}`,
    `Last mile: ${input.quote.lastMile.mode} (${input.quote.lastMile.duration}, ${input.quote.lastMile.costHint})`,
    input.plan.carrierRef.trim()
      ? `Flight / train / bus: ${input.plan.carrierRef.trim()}`
      : "Flight / train / bus: TBC",
    input.plan.arrivalTime.trim() ? `ETA: ${input.plan.arrivalTime.trim()}` : "ETA: TBC",
    input.plan.includePickup && input.quote.pickup.available
      ? input.quote.pickup.included
        ? "Pickup: please send the included hotel car"
        : `Pickup: hotel car paid on TripWeave (${formatInrRange(input.quote.pickup.price, input.quote.pickup.price)})`
      : "Pickup: guest making own way",
    input.guests ? `Guests: ${input.guests}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export function whatsappShareHref(text: string, phone?: string): string {
  const n = phone?.replace(/\D/g, "");
  const base = n ? `https://wa.me/${n}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function arrivalPinLabel(arriveBy: ArriveBy): string {
  if (arriveBy === "fly") return "Land at BBI";
  if (arriveBy === "train") return "Puri station";
  if (arriveBy === "bus") return "Puri Bus Stand";
  return "Arrive by road";
}
