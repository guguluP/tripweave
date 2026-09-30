import {
  DEFAULT_BRIEF,
  type Brief,
  type Budget,
  type TravelStyle,
  type Vibe,
} from "./packages.ts";
import { getOrigin, type ArriveBy } from "./origins.ts";

/** Brief fields + check-in that a shared /matches link may carry. */
export type BriefUrlState = Brief & { checkIn?: string };

const VIBES = new Set<Vibe>(["culture", "beach", "relax", "adventure"]);
const BUDGETS = new Set<Budget>(["value", "mid", "premium"]);
const STYLES = new Set<TravelStyle>(["solo", "couple", "family", "friends"]);
const ARRIVES = new Set<ArriveBy>(["fly", "train", "bus", "road"]);

function asVibe(v: unknown): Vibe | undefined {
  const s = searchScalar(v);
  return s && VIBES.has(s as Vibe) ? (s as Vibe) : undefined;
}
function asBudget(v: unknown): Budget | undefined {
  const s = searchScalar(v);
  return s && BUDGETS.has(s as Budget) ? (s as Budget) : undefined;
}
function asStyle(v: unknown): TravelStyle | undefined {
  const s = searchScalar(v);
  return s && STYLES.has(s as TravelStyle) ? (s as TravelStyle) : undefined;
}
function asArrive(v: unknown): ArriveBy | undefined {
  const s = searchScalar(v);
  return s && ARRIVES.has(s as ArriveBy) ? (s as ArriveBy) : undefined;
}
/** Old links JSON-encoded strings, so a value can arrive as `"3"` including the quotes. */
function searchScalar(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === "string" || typeof parsed === "number" || typeof parsed === "boolean") {
        return String(parsed);
      }
    } catch {
      /* keep the raw token */
    }
  }
  return trimmed;
}

function asIsoDate(v: unknown): string | undefined {
  const s = searchScalar(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
}
function asNights(v: unknown): number | undefined {
  const s = searchScalar(v);
  const n = s == null ? NaN : Number(s);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(14, Math.round(n));
}

/** Check-in written on the link. Kept even when it is before today — Rath Yatra links do this. */
export function explicitCheckIn(search: Record<string, unknown>): string | undefined {
  return asIsoDate(search.checkIn);
}

/** Encode key brief fields for a reproducible /matches (or /plan) link. */
export function briefToSearch(state: BriefUrlState): Record<string, string> {
  const out: Record<string, string> = {
    vibe: state.vibe,
    budget: state.budget,
    style: state.style,
    nights: String(state.nights),
    origin: state.origin,
    arriveBy: state.arriveBy,
  };
  if (state.flexible) out.flexible = "1";
  if (state.origin === "other" && state.originCity?.trim()) {
    out.originCity = state.originCity.trim().slice(0, 80);
  }
  if (state.checkIn) out.checkIn = state.checkIn;
  return out;
}

/**
 * Parse URL search into a partial brief. Missing keys stay undefined so the
 * caller can fall back to localStorage / defaults without wiping them.
 */
export function searchToBrief(search: Record<string, unknown>): Partial<BriefUrlState> {
  const partial: Partial<BriefUrlState> = {};
  const vibe = asVibe(search.vibe);
  const budget = asBudget(search.budget);
  const style = asStyle(search.style);
  const nights = asNights(search.nights);
  const arriveBy = asArrive(search.arriveBy);
  const checkIn = asIsoDate(search.checkIn);
  const originRaw = searchScalar(search.origin);
  const originCity = searchScalar(search.originCity)?.slice(0, 80);

  if (vibe) partial.vibe = vibe;
  if (budget) partial.budget = budget;
  if (style) partial.style = style;
  if (nights != null) partial.nights = nights;
  if (checkIn) partial.checkIn = checkIn;
  const flexible = searchScalar(search.flexible);
  if (flexible === "1" || flexible === "true") {
    partial.flexible = true;
  } else if (flexible === "0" || flexible === "false") {
    partial.flexible = false;
  }

  if (originRaw) {
    const origin = getOrigin(originRaw).id;
    partial.origin = origin;
    if (origin === "other" && originCity) partial.originCity = originCity;
    const allowed = getOrigin(origin).inbound.map((l) => l.mode);
    if (arriveBy && allowed.includes(arriveBy)) partial.arriveBy = arriveBy;
    else if (arriveBy) partial.arriveBy = getOrigin(origin).defaultArriveBy;
  } else if (arriveBy) {
    partial.arriveBy = arriveBy;
  }

  return partial;
}

/** Merge URL partial over a base brief; clamp arriveBy against the resulting origin. */
export function mergeBriefUrl(base: BriefUrlState, patch: Partial<BriefUrlState>): BriefUrlState {
  const next: BriefUrlState = {
    ...base,
    ...patch,
    originCity:
      patch.origin !== undefined
        ? patch.origin === "other"
          ? patch.originCity ?? (base.origin === "other" ? base.originCity : undefined)
          : undefined
        : patch.originCity !== undefined
          ? patch.originCity
          : base.originCity,
  };
  const origin = getOrigin(next.origin);
  const allowed = origin.inbound.map((l) => l.mode);
  if (!allowed.includes(next.arriveBy)) next.arriveBy = origin.defaultArriveBy;
  if (next.origin !== "other") next.originCity = undefined;
  return next;
}

/** True when the search object carries at least one brief field we recognize. */
export function searchHasBrief(search: Record<string, unknown>): boolean {
  return (
    asVibe(search.vibe) != null ||
    asBudget(search.budget) != null ||
    asStyle(search.style) != null ||
    asNights(search.nights) != null ||
    asArrive(search.arriveBy) != null ||
    asIsoDate(search.checkIn) != null ||
    searchScalar(search.origin) != null ||
    searchScalar(search.flexible) === "1" ||
    searchScalar(search.flexible) === "0"
  );
}

export function emptyBriefSearch(): BriefUrlState {
  return { ...DEFAULT_BRIEF };
}
