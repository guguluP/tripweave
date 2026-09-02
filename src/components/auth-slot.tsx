import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TextSwap } from "@/components/motion";
import { saveNext } from "@/lib/packages";
import { useState } from "react";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <Skeleton className="h-9 w-24 rounded-md" />;
  }

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link
          to="/login"
          onClick={() => {
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
          void signOut().catch(() => setSigningOut(false));
        }}
      >
        <TextSwap text={signingOut ? "Signing out" : "Sign out"} shimmer={signingOut} />
      </Button>
    </div>
  );
}
