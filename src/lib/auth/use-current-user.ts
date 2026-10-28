import { useEffect, useMemo } from "react";
import { authClient, authEnabled } from "./client";
import { appUserFromKey, appUserKey, type AppUser } from "./app-user";

export type { AppUser } from "./app-user";

export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

export const DEMO_FLAG_KEY = "tripweave-demo";

/** Demo guest sessions are retired. This only clears leftovers in the browser. */
export function isDemoMode(): boolean {
  return false;
}

export function enableDemoMode(): void {
  clearDemoMode();
}

export function clearDemoMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_FLAG_KEY);
    window.localStorage.removeItem("tripweave-demo-bookings");
    document.cookie = `${DEMO_FLAG_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

export function useCurrentUserState(): CurrentUserState {
  useEffect(() => {
    clearDemoMode();
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const session = authEnabled ? authClient.useSession() : { data: null, isPending: false };

  // Same AppUser object until the id, name, email or picture really change. useSession()
  // returns a new user object every render; effects keyed on `user` must not loop on that.
  const key = appUserKey(session.data?.user);
  const user = useMemo(() => appUserFromKey(key), [key]);

  if (!authEnabled) {
    if (import.meta.env.PROD) return { user: null, isPending: false };
    return { user: DEV_USER, isPending: false };
  }

  return { user, isPending: session.isPending };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
