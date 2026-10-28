/** The signed-in user as the app sees it. Pure (no auth client) so it can be tested in Node. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

export type SessionUserFields = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * A string that changes only when a field the app shows changes. `authClient.useSession()`
 * hands back a fresh `user` object on every render, so an effect keyed on that object (or on
 * an AppUser rebuilt from it) re-runs on every render. The voucher page did exactly that and
 * fetched its bookings in a loop. Memoizing on this key keeps one AppUser per real change.
 */
export function appUserKey(user: SessionUserFields | null | undefined): string {
  if (!user?.id) return "";
  return JSON.stringify([user.id, user.name ?? null, user.email ?? null, user.image ?? null]);
}

/** Rebuild the AppUser from `appUserKey` output ("" means signed out). */
export function appUserFromKey(key: string): AppUser | null {
  if (!key) return null;
  const [id, displayName, primaryEmail, profileImageUrl] = JSON.parse(key) as [
    string,
    string | null,
    string | null,
    string | null,
  ];
  return { id, displayName, primaryEmail, profileImageUrl, isDevFallback: false };
}
