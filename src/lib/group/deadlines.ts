/** Deadlines are stored in UTC and shown in India time. */

export function checkInNoon(checkIn: string): Date {
  return new Date(`${checkIn}T12:00:00+05:30`);
}

/** A payment deadline must sit at least 72 hours before check-in noon IST. */
export function paymentDeadlineOk(checkIn: string, deadlineIso: string, now = new Date()): boolean {
  const deadline = new Date(deadlineIso);
  if (Number.isNaN(deadline.getTime())) return false;
  const noon = checkInNoon(checkIn).getTime();
  return deadline.getTime() >= now.getTime() && deadline.getTime() <= noon - 72 * 3600 * 1000;
}

export function hoursFromNow(hours: number, now = new Date()): string {
  return new Date(now.getTime() + hours * 3600 * 1000).toISOString();
}

export function formatIst(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
