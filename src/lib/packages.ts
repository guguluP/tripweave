import { trustScoreForPackage } from "./trust-score.ts";
import { attachPropertyMedia } from "./property-media.ts";
import { RAW } from "./packages-data.ts";

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


const LEISURE_DAY: DayPlan = {
  title: "Leisure day",
  base: "Pool, beach, or a slow walk into town — your call.",
  options: [{ id: "konark", label: "Konark half-day", delta: 1600 }],
};

export const PACKAGES: StayPackage[] = RAW.map((p) => {
  // Media is property-owned (official CDNs or /stays placeholders) — not YouTube thumbs.
  const media = attachPropertyMedia(p);
  const base = {
    ...p,
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
