import { useEffect, type ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { saveNext } from "@/lib/packages";

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
  if (!user) return <SaveAndRedirect next={next} />;
  return <>{children}</>;
}

function SaveAndRedirect({ next }: { next: string }) {
  useEffect(() => {
    saveNext(next);
  }, [next]);
  return <RedirectToSignIn />;
}
