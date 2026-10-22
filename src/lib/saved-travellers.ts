import { idLast4 } from "./travelers.ts";

export const SAVED_TRAVELLER_CAP = 20;

export type SavedTraveller = {
  id: number;
  label: string;
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  idType: string | null;
  idLast4: string | null;
  lastUsedAt: string;
};

/** True when last_used_at is more than 12 months before now. */
export function isSavedPurgeDue(lastUsedAt: string, now = new Date()): boolean {
  const used = Date.parse(lastUsedAt);
  if (!Number.isFinite(used)) return false;
  const cutoff = new Date(now.getTime());
  cutoff.setMonth(cutoff.getMonth() - 12);
  return used < cutoff.getTime();
}

export function savedInsertAllowed(existing: number): boolean {
  return existing < SAVED_TRAVELLER_CAP;
}

/** Last 4 only. Never return a full passport or Aadhaar number. */
export function savedIdLast4(value: string): string {
  const last = idLast4(value || "");
  return last.slice(-4);
}
