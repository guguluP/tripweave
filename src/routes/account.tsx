import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, MotionToggle, Stagger, TextSwap } from "@/components/motion";
import { signOut } from "@/lib/auth/client";
import { clearDemoMode, useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatMoney } from "@/lib/packages";
import { paymentLine } from "@/lib/pay";
import { listBookings, type BookingRow } from "@/lib/server/bookings";

import { AddToWallet } from "@/components/wallet-pass";
import { bookingToWalletPayload } from "@/lib/apple-wallet";
import { listWalletPasses } from "@/lib/wallet-store";
import { useAppleDevice } from "@/lib/apple-device";
import { walletSigningReady } from "@/lib/server/wallet-status";
import { getProfile, saveProfile } from "@/lib/server/profile";
import { PartnerDesk } from "@/components/partner-desk";
import { loadLocalProfile, saveLocalProfile } from "@/lib/profile-local";
import { isClosedStay } from "@/lib/refund-policy";
import { pushBanner } from "@/lib/banners";

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
  const apple = useAppleDevice();
  const [walletReady, setWalletReady] = useState(false);
  useEffect(() => {
    if (!apple) return;
    walletSigningReady().then(setWalletReady).catch(() => setWalletReady(false));
  }, [apple]);
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [wallet] = useState(() =>
    typeof window === "undefined" ? [] : listWalletPasses(),
  );
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listBookings()
      .then(setBookings)
      .catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    const local = loadLocalProfile();
    if (local?.displayName) setDisplayName(local.displayName);
    else if (user?.displayName) setDisplayName(user.displayName);
    if (local?.phone) setPhone(local.phone);
    if (local?.homeCity) setHomeCity(local.homeCity);
    getProfile()
      .then((p) => {
        if (p.displayName) setDisplayName(p.displayName);
        if (p.phone) setPhone(p.phone);
      })
      .catch(() => {
        /* local / session name is enough */
      });
  }, [user?.displayName]);

  const paid = useMemo(
    () => (bookings ?? []).filter((b) => !isClosedStay(b.status)),
    [bookings],
  );
  const cancelled = useMemo(
    () => (bookings ?? []).filter((b) => isClosedStay(b.status)),
    [bookings],
  );
  const spent = paid.reduce((sum, b) => sum + b.amountInr, 0);
  const visible = showCancelled ? cancelled : paid;

  if (!user) return <AccountSkeleton />;

  const label = displayName || user.displayName || user.primaryEmail || "Guest";
  const email = user.primaryEmail ?? "";

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) {
      pushBanner({ title: "Name is too short", tone: "danger" });
      return;
    }
    const next = { displayName: name, phone: phone.trim(), email, homeCity: homeCity.trim() };
    saveLocalProfile(next);
    setSaving(true);
    try {
      await saveProfile({ data: next });
      pushBanner({ title: "Profile saved", tone: "ok" });
    } catch {
      pushBanner({ title: "Saved on this device", body: "Cloud profile will sync when you are signed in.", tone: "info" });
    } finally {
      setSaving(false);
    }
  };

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
            {email ? <p className="text-sm text-muted">{email}</p> : null}
          </div>
        </div>

        <Card className="mt-8 p-5 shadow-none">
          <p className="eyebrow">Profile</p>
          <h2 className="mt-1 font-display text-xl">Name on the stay</h2>
          <p className="mt-1 text-sm text-muted">
            Used as the payer name and on the hotel desk voucher.
          </p>
          <form className="mt-4 grid gap-3" onSubmit={onSaveProfile}>
            <Label>
              Display name
              <Input
                value={displayName}
                autoComplete="name"
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Label>
            <Label>
              Mobile
              <Input
                value={phone}
                inputMode="tel"
                autoComplete="tel"
                placeholder="10-digit mobile"
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </Label>
            <Label>
              Home city
              <Input
                value={homeCity}
                autoComplete="address-level2"
                placeholder="Any city in India or abroad"
                onChange={(e) => setHomeCity(e.target.value.slice(0, 80))}
              />
            </Label>
            <Label>
              Email
              <Input value={email} readOnly disabled />
            </Label>
            <Button type="submit" disabled={saving}>
              <TextSwap text={saving ? "Saving" : "Save profile"} shimmer={saving} />
            </Button>
          </form>
        </Card>

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
            <p className="text-xs text-muted">List stays you released or refunded.</p>
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

        {apple && walletReady && (wallet.length > 0 || paid.length > 0) && !showCancelled ? (
          <div className="mt-10">
            <p className="eyebrow">Apple Wallet</p>
            <h2 className="mt-2 font-display text-2xl">Saved passes</h2>
            <p className="mt-2 text-sm text-muted">
              {wallet.length > 0
                ? "Each pass is tied to one confirmation."
                : "No pass saved yet. Add one for a paid stay below."}
            </p>
            <div className="mt-4 grid gap-4">
              {(wallet.length > 0
                ? wallet
                : paid.slice(0, 2).map((b) => bookingToWalletPayload(b))
              ).map((payload) => (
                <AddToWallet
                  key={payload.confirmationCode}
                  compact
                  booking={{
                    confirmationCode: payload.confirmationCode,
                    packageName: payload.packageName,
                    packageId: payload.packageId,
                    checkIn: payload.checkIn,
                    nights: payload.nights,
                    travelers: payload.travelers,
                    payerName: payload.payerName,
                    amountInr: payload.amountInr,
                    paymentRef: payload.paymentRef,
                    status: payload.status,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <PartnerDesk />
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
              clearDemoMode();
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
