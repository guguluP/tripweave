/**
 * Guest data this browser keeps between visits, and how it is wiped.
 *
 * A shared phone or family laptop must not hand one person's guests, phone
 * numbers, ID last-4s, flight numbers, cart or booking codes to whoever signs in
 * (or just opens the site) next. Search preferences (`tripweave-brief`) stay: they
 * hold no personal data and keep the next search quick.
 */

/** localStorage keys holding a person's details or bookings. */
export const PERSONAL_LOCAL_KEYS = [
  "tripweave-travelers",
  "tripweave-profile",
  "tripweave-pending",
  "tripweave-wallet-passes",
  "tripweave-travel-draft",
  "tripweave-saved",
  "tripweave-plan-at",
] as const;

/** localStorage key prefixes for per-account flags. */
export const PERSONAL_LOCAL_PREFIXES = ["tripweave-likes-synced:"] as const;

/** sessionStorage keys for this tab's booking. */
export const PERSONAL_SESSION_KEYS = ["tw-last-booking", "tripweave-next", "tripweave-own-holds"] as const;

/** The account whose data this browser holds. */
export const DEVICE_OWNER_KEY = "tw-device-owner";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

function storages(): { local: StorageLike | null; session: StorageLike | null } {
  if (typeof window === "undefined") return { local: null, session: null };
  try {
    return { local: window.localStorage, session: window.sessionStorage };
  } catch {
    return { local: null, session: null };
  }
}

/** Remove every personal key. Safe to call when nothing is stored. */
export function clearPersonalDeviceData(
  local: StorageLike | null = storages().local,
  session: StorageLike | null = storages().session,
): void {
  try {
    if (local) {
      for (const key of PERSONAL_LOCAL_KEYS) local.removeItem(key);
      const prefixed: string[] = [];
      for (let i = 0; i < local.length; i += 1) {
        const key = local.key(i);
        if (key && PERSONAL_LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix))) prefixed.push(key);
      }
      for (const key of prefixed) local.removeItem(key);
      local.removeItem(DEVICE_OWNER_KEY);
    }
    if (session) for (const key of PERSONAL_SESSION_KEYS) session.removeItem(key);
  } catch {
    /* private mode / quota: nothing to clear */
  }
}

/**
 * Call when a signed-in account is known. If this browser last held another
 * account's data, wipe it first (covers an expired session followed by a
 * different sign-in, where no sign-out ever ran). Returns true when it wiped.
 *
 * Data typed while signed out (no owner yet) is kept and adopted, so a guest who
 * fills the form and then signs in does not lose it.
 */
export function claimDeviceData(
  userId: string,
  local: StorageLike | null = storages().local,
  session: StorageLike | null = storages().session,
): boolean {
  if (!local || !userId) return false;
  let wiped = false;
  try {
    const owner = local.getItem(DEVICE_OWNER_KEY);
    if (owner && owner !== userId) {
      clearPersonalDeviceData(local, session);
      wiped = true;
    }
    local.setItem(DEVICE_OWNER_KEY, userId);
  } catch {
    /* ignore */
  }
  return wiped;
}
