import { useEffect, useState } from "react";
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

export const DEMO_USER: AppUser = {
  id: "demo-user",
  displayName: "Demo Guest",
  primaryEmail: "demo@tripweave.app",
  profileImageUrl: null,
  isDevFallback: true,
};

export const DEMO_FLAG_KEY = "tripweave-demo";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEMO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function enableDemoMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_FLAG_KEY, "1");
    document.cookie = `${DEMO_FLAG_KEY}=1; path=/; max-age=86400; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function clearDemoMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_FLAG_KEY);
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
  const [demo, setDemo] = useState(false);
  const [demoReady, setDemoReady] = useState(false);

  useEffect(() => {
    setDemo(isDemoMode());
    setDemoReady(true);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const session = authEnabled ? authClient.useSession() : { data: null, isPending: false };

  if (!authEnabled) {
    return { user: DEV_USER, isPending: false };
  }

  if (!demoReady) {
    return { user: null, isPending: true };
  }

  if (demo) {
    return { user: DEMO_USER, isPending: false };
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
