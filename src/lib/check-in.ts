/** True only when the string is a real calendar day, not just YYYY-MM-DD shaped. */
export function isRealIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Why a check-in cannot be used, or null when the day is real and not before today. */
export function checkInRefusal(iso: string, today: string): string | null {
  if (!isRealIsoDate(iso)) return "That date doesn't exist";
  if (iso < today) return "Check-in must be today or later.";
  return null;
}
