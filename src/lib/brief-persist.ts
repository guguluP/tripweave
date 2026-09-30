import { checkInOnOrAfterToday } from "./inventory.ts";
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
    return { ...base, checkIn: checkInOnOrAfterToday(checkIn) };
  } catch {
    return loadBriefBase();
  }
}

export const PLAN_STAMP_KEY = "tripweave-plan-at";
export const PLAN_EVENT = "tripweave-plan";

export function saveBriefWithDates(brief: BriefDates) {
  saveBriefBase(brief);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_STAMP_KEY, new Date().toISOString());
  window.dispatchEvent(new Event(PLAN_EVENT));
}
