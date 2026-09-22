import { useEffect } from "react";
import { authClient, authEnabled } from "./client";

export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

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

  if (!authEnabled) {
    if (import.meta.env.PROD) return { user: null, isPending: false };
    return { user: DEV_USER, isPending: false };
  }

  const user = session.data?.user;
  return {
    user: user
      ? {
          id: user.id,
          displayName: user.name ?? null,
          primaryEmail: user.email ?? null,
          profileImageUrl: user.image ?? null,
          isDevFallback: false,
        }
      : null,
    isPending: session.isPending,
  };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
