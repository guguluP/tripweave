import { useEffect, type ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { clearDemoMode, useCurrentUserState } from "@/lib/auth/use-current-user";
import { saveNext } from "@/lib/packages";
import { isRealUser } from "@/lib/session-guard";

export function RequireAuth({
  next,
  children,
  fallback,
}: {
  next: string;
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return fallback;
  if (!isRealUser(user)) {
    clearDemoMode();
    return <SaveAndRedirect next={next} />;
  }
  return <>{children}</>;
}

function SaveAndRedirect({ next }: { next: string }) {
  // Save before navigate so email and OAuth return to travelers / trips / account / checkout.
  saveNext(next);
  useEffect(() => {
    saveNext(next);
  }, [next]);
  const search = next && next !== "/" ? { next } : undefined;
  return <RedirectToSignIn search={search} />;
}
