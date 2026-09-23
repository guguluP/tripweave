import { trustScoreForPackage } from "./trust-score.ts";
import { overlayFor } from "./catalog-store.ts";
import { attachPropertyMedia } from "./property-media.ts";
import { RAW } from "./packages-data.ts";
import { getOrigin, type ArriveBy, type OriginId } from "./origins.ts";

export type Vibe = "culture" | "beach" | "relax" | "adventure";
export type StayArea = "konark" | "marine" | "grand-road";
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
  /** Extra frames for the open room card. The first photo stays `image`. */
  images?: string[];
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
  /** Legacy editorial weight; prefer `trustScore` from the formula. */
  trust: number;
  /** Transparent 0–100 Trust Score (see `trust-score.ts`). */
  trustScore: number;
  /** @deprecated Not shown in UI — was a fake “verified” count. Prefer video count. */
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
  /** Explicit place flags. Ranking must not infer these from the hotel name. */
  area: StayArea;
  nearStation: boolean;
  hasAirportTransfer: boolean;
  includes: string[];
  days: DayPlan[];
};

export type Brief = {
  vibe: Vibe;
  budget: Budget;
  style: TravelStyle;
  nights: number;
  flexible: boolean;
  origin: OriginId;
  /** Free-text city when origin is "other". Listed cities leave this empty. */
  originCity?: string;
  arriveBy: ArriveBy;
};

export const DEFAULT_BRIEF: Brief = {
  vibe: "beach",
  budget: "mid",
  style: "couple",
  nights: 3,
  flexible: false,
  origin: "kolkata",
  arriveBy: "fly",
};

export const BRIEF_KEY = "tripweave-brief";
export const PENDING_KEY = "tripweave-pending";
export const NEXT_KEY = "tripweave-next";

export type PendingTravel = {
  lastMileId: string;
  includePickup: boolean;
  carrierRef: string;
  arrivalTime: string;
  arriveBy: ArriveBy;
  origin: OriginId;
};

export type PendingBooking = {
  packageId: string;
  swaps: Record<string, string>;
  nights: number;
  roomId: string;
  checkIn?: string;
  travel?: PendingTravel;
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


const LEISURE_DAY: DayPlan = {
  title: "Leisure day",
  base: "Pool, beach, or a slow walk into town — your call.",
  options: [{ id: "konark", label: "Konark half-day", delta: 1600 }],
};

/**
 * Place flags are written here, not guessed from the name.
 * "Waves" is marine because it sits on Chakratirtha, not because of the word.
 * "Regenta" is grand-road because it is beside the temple, not because of the brand.
 */
const STAY_PLACES: Record<string, { area: StayArea; nearStation: boolean; hasAirportTransfer: boolean }> = {
  "taj-puri-resort-spa": { area: "marine", nearStation: false, hasAirportTransfer: true },
  "mayfair-heritage-puri": { area: "marine", nearStation: false, hasAirportTransfer: false },
  "swosti-premium-beach-resort": { area: "marine", nearStation: false, hasAirportTransfer: false },
  "regenta-central-puri": { area: "grand-road", nearStation: false, hasAirportTransfer: false },
  "hans-coco-palms": { area: "marine", nearStation: false, hasAirportTransfer: false },
  "empires-hotel-puri": { area: "grand-road", nearStation: false, hasAirportTransfer: false },
  "mayfair-waves-puri": { area: "marine", nearStation: false, hasAirportTransfer: false },
  "toshali-sands-puri": { area: "konark", nearStation: false, hasAirportTransfer: false },
  "chariot-resort-puri": { area: "marine", nearStation: false, hasAirportTransfer: false },
  "chanakya-bnr-puri": { area: "grand-road", nearStation: true, hasAirportTransfer: false },
  "mahodadhi-palace-puri": { area: "marine", nearStation: false, hasAirportTransfer: false },
  "holiday-resort-puri": { area: "marine", nearStation: false, hasAirportTransfer: false },
};

const liveTrustScores = new Map<string, number>();

/** After a YouTube rebuild, list and detail meters share this score for the session. */
export function rememberLiveTrustScore(packageId: string, score: number) {
  liveTrustScores.set(packageId, score);
}

export const PACKAGES: StayPackage[] = RAW.map((p) => {
  const place = STAY_PLACES[p.id];
  if (!place) throw new Error(`Missing place flags for ${p.id}`);
  // Media is property-owned and vendored under /stays — not YouTube thumbs.
  const media = attachPropertyMedia(p);
  const base = {
    ...p,
    ...place,
    ...media,
    pricePerPerson: p.pricePerNight * p.nights,
    priceFrom: p.pricePerNight,
    /** Placeholder; overwritten below from the Trust Score formula. */
    trustScore: 0,
  };
  return {
    ...base,
    // Transparent 0–100 from YouTube consensus + review depth + property completeness.
    trustScore: trustScoreForPackage(base),
  };
});

function withCatalog(pkg: StayPackage): StayPackage {
  const overlay = overlayFor(pkg.id);
  let next = pkg;
  if (!overlay) {
    const liveOnly = liveTrustScores.get(pkg.id);
    return liveOnly == null ? pkg : { ...pkg, trustScore: liveOnly };
  }
  if (overlay.pricePerNight && overlay.pricePerNight > 0) {
    next = {
      ...next,
      pricePerNight: overlay.pricePerNight,
      priceFrom: overlay.pricePerNight,
      pricePerPerson: overlay.pricePerNight * next.nights,
    };
  }
  if (overlay.image) {
    next = { ...next, image: overlay.image, images: [overlay.image, ...next.images.filter((src) => src !== overlay.image)] };
  }
  if (overlay.extras && overlay.extras.length > 0) {
    const prices = new Map(overlay.extras.map((extra) => [extra.optionId, extra]));
    next = {
      ...next,
      days: next.days.map((day) => ({
        ...day,
        options: day.options.map((option) => {
          const edited = prices.get(option.id);
          return edited ? { ...option, delta: edited.delta, label: edited.label || option.label } : option;
        }),
      })),
    };
  }
  const live = liveTrustScores.get(pkg.id);
  if (live != null) next = { ...next, trustScore: live };
  return next;
}

export function listPackages() {
  return PACKAGES.map(withCatalog);
}

export function getPackage(id: string) {
  const pkg = PACKAGES.find((p) => p.id === id);
  return pkg ? withCatalog(pkg) : undefined;
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

export function originTraits(pkg: StayPackage) {
  return {
    temple: pkg.area === "grand-road",
    beach: pkg.area === "marine",
    far: pkg.area === "konark",
    airportTransfer: pkg.hasAirportTransfer,
    nearStation: pkg.nearStation,
  };
}

export function originFitScore(pkg: StayPackage, brief: Brief): number {
  const { temple, beach, far, airportTransfer } = originTraits(pkg);
  const local =
    brief.origin === "bhubaneswar" ||
    brief.origin === "cuttack" ||
    brief.origin === "khordha" ||
    brief.origin === "puri";
  let score = 0;
  if (brief.arriveBy === "train" || brief.arriveBy === "bus") {
    if (temple) score += 2.2;
    if (far) score -= 1.6;
    if (beach && !temple) score += 0.4;
  }
  if (brief.arriveBy === "fly") {
    if (airportTransfer) score += 1.8;
    if (beach) score += 0.8;
    if (temple && !airportTransfer) score -= 0.3;
  }
  if (brief.arriveBy === "road" && !far) score += 0.6;
  if (local && !far) score += 1.3;
  if (local && far) score -= 1.1;
  if (brief.origin === "puri" && temple) score += 1.4;
  return score;
}

export function originFitReason(pkg: StayPackage, brief: Brief): string {
  const { temple, beach, far, airportTransfer } = originTraits(pkg);
  const city = originPlace(brief);
  if (brief.arriveBy === "train" || brief.arriveBy === "bus") {
    if (temple) {
      return `Temple / station side — shorter last mile after a ${brief.arriveBy} from ${city}.`;
    }
    if (far) {
      return `Out toward Konark — longer hop after a ${brief.arriveBy} from ${city}.`;
    }
  }
  if (brief.arriveBy === "fly" && airportTransfer) {
    return `Airport transfer included — useful flying in from ${city}.`;
  }
  const local =
    brief.origin === "bhubaneswar" ||
    brief.origin === "cuttack" ||
    brief.origin === "khordha" ||
    brief.origin === "puri";
  if (local && !far) return `Closer to town — a short hop from ${city}.`;
  if (brief.arriveBy === "fly" && beach) return `Beach stay after a flight from ${city}.`;
  return `Ranked for a ${brief.arriveBy} trip from ${city}.`;
}

export function originPlace(brief: Brief) {
  const typed = brief.origin === "other" ? brief.originCity?.trim() : "";
  return typed || getOrigin(brief.origin).label;
}

const RELATED_VIBE: Record<Vibe, Vibe> = {
  beach: "relax",
  relax: "beach",
  culture: "adventure",
  adventure: "culture",
};

export function rankingBlurb(brief: Brief): string {
  const city = originPlace(brief);
  if (brief.arriveBy === "train" || brief.arriveBy === "bus") {
    return `Temple-side stays rank higher than Konark for a ${brief.arriveBy} from ${city}.`;
  }
  if (brief.arriveBy === "fly") {
    return `Airport-transfer hotels lift for a flight from ${city}.`;
  }
  if (
    brief.origin === "khordha" ||
    brief.origin === "bhubaneswar" ||
    brief.origin === "cuttack" ||
    brief.origin === "puri"
  ) {
    return `Town stays rank above far-out Konark for a trip from ${city}.`;
  }
  return `Ranked for a ${brief.arriveBy} trip from ${city}.`;
}

/** Below this, the short list still returns three stays but labels them weak. */
export const WEAK_MATCH_BELOW = 4;

export type MatchedStay = StayPackage & { matchScore: number; weakMatch: boolean };

export function matchPackages(brief: Brief): MatchedStay[] {
  const scored = listPackages().map((p) => {
    let score = 0;
    if (p.vibe === brief.vibe) score += 4;
    else if (p.vibe === RELATED_VIBE[brief.vibe]) score += 1.5;
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
    score += originFitScore(p, brief);
    return { ...p, matchScore: score, weakMatch: score < WEAK_MATCH_BELOW };
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
    const origin = getOrigin(parsed.origin as string | undefined).id;
    const allowed = getOrigin(origin).inbound.map((l) => l.mode);
    const arriveBy = allowed.includes(parsed.arriveBy as ArriveBy)
      ? (parsed.arriveBy as ArriveBy)
      : getOrigin(origin).defaultArriveBy;
    return {
      vibe: parsed.vibe ?? DEFAULT_BRIEF.vibe,
      budget: parsed.budget ?? DEFAULT_BRIEF.budget,
      style: parsed.style ?? DEFAULT_BRIEF.style,
      nights: Number.isFinite(nights) && nights >= 1 ? Math.min(14, nights) : DEFAULT_BRIEF.nights,
      flexible: Boolean(parsed.flexible),
      origin,
      originCity: typeof parsed.originCity === "string" ? parsed.originCity.slice(0, 60) : undefined,
      arriveBy,
    };
  } catch {
    return DEFAULT_BRIEF;
  }
}

export function saveBrief(brief: Brief) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
}

function asArriveBy(value: unknown): ArriveBy {
  return value === "train" || value === "bus" || value === "road" || value === "fly" ? value : "fly";
}

function asPendingTravel(raw: unknown): PendingTravel | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const t = raw as Record<string, unknown>;
  if (typeof t.lastMileId !== "string" || !t.lastMileId) return undefined;
  return {
    lastMileId: t.lastMileId,
    includePickup: Boolean(t.includePickup),
    carrierRef: typeof t.carrierRef === "string" ? t.carrierRef : "",
    arrivalTime: typeof t.arrivalTime === "string" ? t.arrivalTime : "",
    arriveBy: asArriveBy(t.arriveBy),
    origin: getOrigin(typeof t.origin === "string" ? t.origin : "kolkata").id,
  };
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
      checkIn: typeof parsed.checkIn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.checkIn) ? parsed.checkIn : undefined,
      travel: asPendingTravel(parsed.travel),
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
