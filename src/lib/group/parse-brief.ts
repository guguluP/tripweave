import { addDays, FESTIVAL, todayIso } from "../inventory.ts";
import { GROUP_INTERESTS, GROUP_NEEDS, type GroupInterest, type GroupNeed } from "./types.ts";

export type ParsedGroupBrief = {
  adults: number | null;
  children: number | null;
  elderly: number | null;
  interests: GroupInterest[];
  needs: GroupNeed[];
  budgetPerHeadInr: number | null;
  /** First of the named month, or the next Rath Yatra check-in when the text says so. */
  checkIn: string | null;
  nights: number | null;
  dateMode: "dates" | "rath_yatra" | null;
  title: string | null;
};

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

/** Next Rath Yatra window from FESTIVAL (June ranges only). */
export function nextRathStay(now = new Date()): { checkIn: string; nights: number } {
  const today = todayIso(now);
  const windows = FESTIVAL.filter(([start]) => start.slice(5, 7) === "06");
  const upcoming = windows.find(([, end]) => end >= today) ?? windows[windows.length - 1]!;
  const [start, end] = upcoming;
  const checkIn = start < today ? today : start;
  const endDate = new Date(`${end}T12:00:00Z`);
  const inDate = new Date(`${checkIn}T12:00:00Z`);
  const nights = Math.max(1, Math.round((endDate.getTime() - inDate.getTime()) / 86400000));
  return { checkIn, nights: Math.min(14, nights) };
}

function nextMonthStart(month: number, now = new Date()): string {
  const today = todayIso(now);
  const year = Number(today.slice(0, 4));
  const thisYear = `${year}-${String(month).padStart(2, "0")}-01`;
  if (thisYear >= today) return thisYear;
  return `${year + 1}-${String(month).padStart(2, "0")}-01`;
}

/**
 * Deterministic parse. Unknown words are ignored.
 * "13 people, 3 grandparents, darshan + Konark, June, ₹3,000 per head"
 */
export function parseGroupBrief(text: string, now = new Date()): ParsedGroupBrief {
  const raw = text.replace(/\s+/g, " ").trim();
  const lower = raw.toLowerCase();
  const people = numberBefore(lower, ["people", "person", "guests", "guest", "of us", "pax"]);
  const children = numberBefore(lower, ["children", "child", "kids", "kid"]);
  const elderly = numberBefore(lower, ["grandparents", "grandparent", "elderly", "seniors", "senior"]);
  const adultsFromWords = numberBefore(lower, ["adults", "adult"]);

  let adults: number | null = adultsFromWords;
  let childCount = children;
  let elderCount = elderly;
  if (people != null) {
    const kids = childCount ?? 0;
    const elders = elderCount ?? 0;
    const rest = people - kids;
    adults = Math.max(elders, rest);
    if (childCount == null) childCount = kids;
    if (elderCount == null) elderCount = elders;
  }
  if (adults != null && elderCount != null && elderCount > adults) elderCount = adults;

  const interests: GroupInterest[] = [];
  if (/\bdarshan\b|\btemple\b|\bjagannath\b/.test(lower)) interests.push("darshan");
  if (/\bgundicha\b/.test(lower)) interests.push("gundicha");
  if (/\bkonark\b/.test(lower)) interests.push("konark");
  if (/\bbeach\b|\bsea\b/.test(lower)) interests.push("beach");

  const needs: GroupNeed[] = [];
  if (/\bwheelchair\b/.test(lower)) needs.push("wheelchair");
  if (/\bground floor\b|\bground-floor\b/.test(lower)) needs.push("ground_floor");
  if (/\blift\b|\belevator\b/.test(lower)) needs.push("lift");

  const money = raw.match(/(?:₹|rs\.?|inr)\s*([0-9][0-9,]*)/i);
  const budgetPerHeadInr = money ? Number(money[1]!.replace(/,/g, "")) : null;

  const rath = /\brath\s*yatra\b/.test(lower);
  let checkIn: string | null = null;
  let nights: number | null = null;
  let dateMode: ParsedGroupBrief["dateMode"] = null;
  if (rath) {
    const stay = nextRathStay(now);
    checkIn = stay.checkIn;
    nights = stay.nights;
    dateMode = "rath_yatra";
  } else {
    const monthName = Object.keys(MONTHS).find((name) => new RegExp(`\\b${name}\\b`).test(lower));
    if (monthName) {
      checkIn = nextMonthStart(MONTHS[monthName]!, now);
      dateMode = "dates";
    }
    const nightMatch = lower.match(/\b(\d{1,2})\s*nights?\b/);
    if (nightMatch) nights = Math.min(14, Math.max(1, Number(nightMatch[1])));
  }

  const iso = raw.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso && !rath) {
    checkIn = iso[1]!;
    dateMode = "dates";
  }

  return {
    adults,
    children: childCount,
    elderly: elderCount,
    interests: interests.filter((item) => (GROUP_INTERESTS as readonly string[]).includes(item)),
    needs: needs.filter((item) => (GROUP_NEEDS as readonly string[]).includes(item)),
    budgetPerHeadInr: budgetPerHeadInr && budgetPerHeadInr > 0 ? budgetPerHeadInr : null,
    checkIn,
    nights,
    dateMode,
    title: null,
  };
}

function numberBefore(text: string, words: string[]): number | null {
  for (const word of words) {
    const match = text.match(new RegExp(`\\b(\\d{1,3})\\s+${word}\\b`));
    if (match) return Number(match[1]);
  }
  return null;
}

export function addNights(checkIn: string, nights: number): string {
  return addDays(checkIn, nights);
}
