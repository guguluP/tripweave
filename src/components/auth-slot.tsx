import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth/client";
import { clearDemoMode, isDemoMode, useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TextSwap } from "@/components/motion";
import { isRealUser } from "@/lib/session-guard";
import { loadBriefWithDates, PLAN_EVENT, PLAN_STAMP_KEY, saveBriefWithDates } from "@/lib/brief-persist";
import { checkInOnOrAfterToday } from "@/lib/inventory";
import { clearPending, loadPending, saveNext, savePending, type PendingBooking } from "@/lib/packages";
import { readSaved, replaceSaved } from "@/lib/saved";
import { loadGuestPlan, saveGuestPlan } from "@/lib/supabase/plan";
import { listSavedStays, syncSavedStay } from "@/lib/supabase/saved";

function applyDocument(document: Record<string, unknown>, updatedAt: string) {
  const brief = document.brief;
  if (brief && typeof brief === "object") {
    const row = brief as { checkIn?: string };
    saveBriefWithDates({
      ...(brief as object),
      checkIn: checkInOnOrAfterToday(row.checkIn),
    } as Parameters<typeof saveBriefWithDates>[0]);
  }
  const pending = document.pending;
  if (pending && typeof pending === "object" && typeof (pending as PendingBooking).packageId === "string") {
    savePending(pending as PendingBooking);
  } else {
    clearPending();
  }
  if (updatedAt) window.localStorage.setItem(PLAN_STAMP_KEY, updatedAt);
}

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isRealUser(user) || isDemoMode()) return;
    let cancelled = false;
    let timer = 0;
    const applying = { current: false };

    const pushPlan = () => {
      if (applying.current || !window.localStorage.getItem("tripweave-brief")) return;
      const updatedAt = window.localStorage.getItem(PLAN_STAMP_KEY) || new Date().toISOString();
      void saveGuestPlan({
        data: {
          brief: loadBriefWithDates() as unknown as Record<string, unknown>,
          pending: (loadPending() as unknown as Record<string, unknown> | null) ?? null,
          updatedAt,
        },
      })
        .then((result) => {
          if (cancelled || !result?.stale || !result.document) return;
          applying.current = true;
          applyDocument(result.document, result.updatedAt || updatedAt);
          applying.current = false;
        })
        .catch(() => {});
    };

    const onPlan = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(pushPlan, 500);
    };

    void (async () => {
      try {
        const [remote, remoteLikes] = await Promise.all([
          loadGuestPlan().catch(() => null),
          listSavedStays().catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        const localAt = Date.parse(window.localStorage.getItem(PLAN_STAMP_KEY) || "") || 0;
        const remoteAt = remote?.updatedAt ? Date.parse(remote.updatedAt) : 0;
        const hasLocal = window.localStorage.getItem("tripweave-brief") != null;
        if (remote && (!hasLocal || remoteAt > localAt)) {
          applying.current = true;
          applyDocument(remote.document, remote.updatedAt);
          applying.current = false;
        } else if (hasLocal) {
          pushPlan();
        }
        const likeKey = `tripweave-likes-synced:${user.id}`;
        let likes = remoteLikes;
        if (window.localStorage.getItem(likeKey) !== "1") {
          const localLikes = readSaved();
          const remoteSet = new Set(remoteLikes);
          const missing = localLikes.filter((id) => !remoteSet.has(id));
          await Promise.all(missing.map((packageId) => syncSavedStay({ data: { packageId, on: true } }).catch(() => {})));
          likes = [...new Set([...remoteLikes, ...localLikes])];
          window.localStorage.setItem(likeKey, "1");
        }
        if (!cancelled) replaceSaved(likes);
      } catch {
        /* this browser keeps the plan */
      }
    })();

    window.addEventListener(PLAN_EVENT, onPlan);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(PLAN_EVENT, onPlan);
    };
  }, [user]);

  if (isPending) {
    return <Skeleton className="h-9 w-24 rounded-md" />;
  }

  if (!isRealUser(user)) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link
          to="/login"
          onClick={() => {
            clearDemoMode();
            const path = `${window.location.pathname}${window.location.search}`;
            if (path && path !== "/login" && !path.startsWith("/login?")) saveNext(path);
          }}
        >
          Sign in
        </Link>
      </Button>
    );
  }

  const label = user.displayName ?? user.primaryEmail ?? "Account";

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/account"
        className="flex min-h-9 items-center gap-2 rounded-md px-1"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-28 truncate text-sm font-medium md:inline">
          {label}
        </span>
      </Link>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="hidden md:inline-flex"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          clearDemoMode();
          void signOut().catch(() => setSigningOut(false));
        }}
      >
        <TextSwap text={signingOut ? "Signing out" : "Sign out"} shimmer={signingOut} />
      </Button>
    </div>
  );
}
