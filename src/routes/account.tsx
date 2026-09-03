import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, MotionToggle, Stagger, TextSwap } from "@/components/motion";
import { signOut } from "@/lib/auth/client";
import { isDemoMode, useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatMoney } from "@/lib/packages";
import { paymentLine } from "@/lib/pay";
import { listBookings, type BookingRow } from "@/lib/server/bookings";
import { listDemoBookings } from "@/lib/demo-bookings";

export const Route = createFileRoute("/account")({ component: Account });

function AccountSkeleton() {
  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 py-10">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </Shell>
  );
}

function Account() {
  return (
    <RequireAuth next="/account" fallback={<AccountSkeleton />}>
      <AccountInner />
    </RequireAuth>
  );
}

function AccountInner() {
  const { user } = useCurrentUserState();
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (isDemoMode()) {
      setBookings(listDemoBookings());
      return;
    }
    listBookings()
      .then(setBookings)
      .catch(() => setBookings([]));
  }, []);

  const paid = useMemo(
    () => (bookings ?? []).filter((b) => b.status === "paid"),
    [bookings],
  );
  const cancelled = useMemo(
    () => (bookings ?? []).filter((b) => b.status === "cancelled"),
    [bookings],
  );
  const spent = paid.reduce((sum, b) => sum + b.amountInr, 0);
  const visible = showCancelled ? cancelled : paid;

  if (!user) return <AccountSkeleton />;

  const label = user.displayName ?? user.primaryEmail ?? "Guest";

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 py-10">
        <Stagger>
          <p className="eyebrow">Account</p>
        </Stagger>
        <div className="mt-4 flex items-center gap-4">
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt=""
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-2xl text-primary-fg">
              {label.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="font-display text-3xl">{label}</h1>
            {user.primaryEmail ? (
              <p className="text-sm text-muted">{user.primaryEmail}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Card className="p-4 shadow-none">
            <p className="text-xs text-muted">Paid stays</p>
            <p className="mt-1 font-display text-2xl tabular-nums">
              <DigitPop value={paid.length} />
            </p>
          </Card>
          <Card className="p-4 shadow-none">
            <p className="text-xs text-muted">Spent</p>
            <p className="mt-1 font-display text-2xl tabular-nums">
              <DigitPop value={formatMoney(spent)} />
            </p>
          </Card>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
          <div>
            <p className="text-sm font-medium">Show cancelled</p>
            <p className="text-xs text-muted">List stays you released instead of paid ones.</p>
          </div>
          <MotionToggle
            on={showCancelled}
            onChange={setShowCancelled}
            label="Show cancelled stays"
          />
        </div>

        {visible.length > 0 ? (
          <ul className="mt-6 grid gap-2">
            {visible.slice(0, 4).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{b.packageName}</span>
                <span className="shrink-0 text-right text-xs text-muted">
                  <span className="block tabular-nums">{formatMoney(b.amountInr)}</span>
                  <span className="block">{paymentLine(b)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted">
            {showCancelled ? "No cancelled stays." : "No paid stays yet."}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/trips">View bookings</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut().catch(() => setSigningOut(false));
            }}
          >
            <TextSwap text={signingOut ? "Signing out" : "Sign out"} shimmer={signingOut} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
