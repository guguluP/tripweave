import {
  DEFAULT_BRIEF,
  BRIEF_KEY,
  type Brief,
  loadBrief as loadBriefBase,
  saveBrief as saveBriefBase,
} from "./packages.ts";

export type BriefDates = Brief & { checkIn?: string };

function parseCheckIn(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

/** loadBrief + ISO checkIn from the same localStorage blob. */
export function loadBriefWithDates(): BriefDates {
  if (typeof window === "undefined") return DEFAULT_BRIEF;
  try {
    const raw = window.localStorage.getItem(BRIEF_KEY);
    if (!raw) return loadBriefBase();
    const parsed = JSON.parse(raw) as Partial<BriefDates>;
    const base = loadBriefBase();
    const checkIn = parseCheckIn(parsed.checkIn);
    return checkIn ? { ...base, checkIn } : base;
  } catch {
    return loadBriefBase();
  }
}

export function saveBriefWithDates(brief: BriefDates) {
  saveBriefBase(brief);
}
