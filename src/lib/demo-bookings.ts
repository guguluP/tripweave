import type { BookingRow } from "@/lib/server/bookings";
import { isDemoMode } from "@/lib/auth/use-current-user";

const KEY = "tripweave-demo-bookings";

function read(): BookingRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as BookingRow[];
  } catch {
    return [];
  }
}

function write(rows: BookingRow[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* quota / private mode */
  }
}

/** Persist a booking after successful demo checkout. */
export function saveDemoBooking(booking: BookingRow) {
  if (!isDemoMode()) return;
  const existing = read().filter(
    (b) => b.id !== booking.id && b.confirmationCode !== booking.confirmationCode,
  );
  write([booking, ...existing]);
}

/** List demo bookings from localStorage (client-only). */
export function listDemoBookings(): BookingRow[] {
  return read();
}

/** Cancel a demo booking by id. */
export function cancelDemoBooking(id: number) {
  const next = read().map((b) => (b.id === id ? { ...b, status: "cancelled" } : b));
  write(next);
}

/** Clear all demo bookings (e.g. on demo sign-out). */
export function clearDemoBookings() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
