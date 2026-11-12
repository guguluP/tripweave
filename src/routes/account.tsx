import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, MotionToggle, TextSwap } from "@/components/motion";
import { signOut } from "@/lib/auth/client";
import { clearDemoMode, useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatMoney, getPackage, nightsPhrase } from "@/lib/packages";
import { paymentLine } from "@/lib/pay";
import { cancelBooking, listBookings, type BookingRow } from "@/lib/server/bookings";
import { AddToWallet } from "@/components/wallet-pass";
import { useAppleDevice } from "@/lib/apple-device";
import { walletSigningReady } from "@/lib/server/wallet-status";
import { PhoneInput } from "@/components/phone-input";
import { deleteSavedTraveller, listSavedTravellers } from "@/lib/server/saved-travellers";
import type { SavedTraveller } from "@/lib/saved-travellers";
import { deleteAccountData, getProfile, saveProfile } from "@/lib/server/profile";
import { loadLocalProfile, saveLocalProfile } from "@/lib/profile-local";
import { countsAsSpend, guestCancelMode, stayStatusLabel } from "@/lib/refund-policy";
import { pushBanner } from "@/lib/banners";
import { pageHead } from "@/lib/page-title";
import { formatCheckInLabel } from "@/components/stay-quote";
import { todayIso } from "@/lib/inventory";
import { useSavedIds } from "@/lib/saved";
import { listMyGroupTrips } from "@/lib/server/group-trips";
import { isGroupStatus, statusLabel } from "@/lib/group/state";

export const Route = createFileRoute("/account")({ component: Account, head: () => pageHead("Account") });

function AccountSkeleton() {
  return (
    <Shell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
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
  const savedIds = useSavedIds();
  const [walletReady, setWalletReady] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [bookingsError, setBookingsError] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPeople, setSavedPeople] = useState<SavedTraveller[]>([]);
  const [groups, setGroups] = useState<{ tripId: string; title: string; status: string; checkIn: string }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const reloadBookings = () => {
    setBookingsError(false);
    listBookings()
      .then((rows) => {
        setBookings(rows);
        setBookingsError(false);
      })
      .catch(() => {
        setBookings(null);
        setBookingsError(true);
      });
  };

  useEffect(() => {
    if (!apple) return;
    walletSigningReady().then(setWalletReady).catch(() => setWalletReady(false));
  }, [apple]);

  useEffect(() => {
    reloadBookings();
    listSavedTravellers()
      .then(setSavedPeople)
      .catch(() => setSavedPeople([]));
    void listMyGroupTrips()
      .then((rows) => setGroups(rows))
      .catch(() => setGroups([]));
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
        if (p.homeCity) setHomeCity(p.homeCity);
        setWhatsappOptIn(p.whatsappOptIn === true);
      })
      .catch(() => undefined);
  }, [user?.displayName]);

  const spendable = useMemo(
    () => (bookings ?? []).filter((b) => countsAsSpend(b.status)),
    [bookings],
  );
  const today = todayIso();
  const upcoming = useMemo(
    () =>
      spendable
        .filter((b) => b.checkIn >= today && b.status !== "completed")
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
    [spendable, today],
  );
  const featured = upcoming[0] ?? null;
  const spent = spendable.reduce((sum, b) => sum + b.amountInr, 0);
  const savedStays = savedIds.map((id) => getPackage(id)).filter((pkg) => pkg != null);

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
    const next = {
      displayName: name,
      phone: phone.trim(),
      email,
      homeCity: homeCity.trim(),
      whatsappOptIn,
    };
    setSaving(true);
    try {
      const saved = await saveProfile({ data: next });
      if (!saved.ok) {
        pushBanner({ title: "Profile was not saved", body: saved.message, tone: "danger" });
        return;
      }
      saveLocalProfile({ displayName: name, phone: next.phone, email, homeCity: next.homeCity });
      if (saved.homeCity === "device") {
        pushBanner({
          title: "Name and mobile saved",
          body: "Home city is on this device. It will join the account after the profile update.",
          tone: "info",
        });
      } else {
        pushBanner({ title: "Profile saved", tone: "ok" });
      }
    } catch {
      pushBanner({ title: "Profile was not saved", tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const downloadData = () => {
    const body = {
      profile: { displayName, phone, email, homeCity, whatsappOptIn },
      bookings: (bookings ?? []).map((b) => ({
        hotel: b.packageName,
        checkIn: b.checkIn,
        nights: b.nights,
        travelers: b.travelers,
        amountInr: b.amountInr,
        status: b.status,
        confirmationCode: b.confirmationCode,
      })),
      savedPeople: savedPeople.map((p) => ({ name: p.fullName, nationality: p.nationality })),
      savedStays: savedStays.map((p) => p.name),
      groups: groups.map((g) => ({ title: g.title, checkIn: g.checkIn, status: g.status })),
    };
    const file = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tripweave-account.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 pb-36 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:pb-10">
        <div className="flex items-center gap-4 lg:col-start-1">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-2xl text-primary-fg">
              {label.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="eyebrow">Account</p>
            <h1 className="truncate font-display text-3xl">{label}</h1>
            {email ? <p className="truncate text-sm text-muted">{email}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-start-2">
          <Card className="p-4 shadow-none">
            <p className="text-xs text-muted">Upcoming stays</p>
            <p className="mt-1 font-display text-3xl tabular-nums">
              {bookingsError ? "—" : <DigitPop value={bookings ? upcoming.length : 0} />}
            </p>
          </Card>
          <Card className="p-4 shadow-none">
            <p className="text-xs text-muted">Spent on paid stays</p>
            <p className="mt-1 font-display text-3xl tabular-nums">
              {bookingsError ? "—" : <DigitPop value={formatMoney(spent)} />}
            </p>
          </Card>
        </div>

        <div className="grid gap-6 lg:col-start-1">
          <Card className="p-5 shadow-none">
            <p className="eyebrow">Profile</p>
            <h2 className="mt-1 font-display text-xl">Name on the stay</h2>
            <p className="mt-1 text-sm text-muted">Used as the payer name and on the hotel desk voucher.</p>
            <form className="mt-4 grid gap-3" onSubmit={onSaveProfile}>
              <Label>
                Display name
                <Input value={displayName} autoComplete="name" onChange={(e) => setDisplayName(e.target.value)} />
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <PhoneInput label="Mobile" value={phone} defaultCountry="IN" onChange={setPhone} />
                <Label>
                  Home city
                  <Input
                    value={homeCity}
                    autoComplete="address-level2"
                    placeholder="Bhubaneswar"
                    onChange={(e) => setHomeCity(e.target.value.slice(0, 80))}
                  />
                </Label>
              </div>
              <Label>
                Email
                <Input value={email} readOnly disabled />
              </Label>
              <p className="text-xs text-muted">
                Email is the sign-in address and where group join codes are sent. It can't be edited here.
              </p>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
                <div>
                  <p className="text-sm font-medium">WhatsApp updates</p>
                  <p className="text-xs text-muted">Join codes still go by email.</p>
                </div>
                <MotionToggle on={whatsappOptIn} onChange={setWhatsappOptIn} label="WhatsApp updates" />
              </div>
              <div className="fixed inset-x-0 z-40 border-t border-border bg-bg/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom))]">
                <Button type="submit" className="w-full" disabled={saving}>
                  <TextSwap text={saving ? "Saving" : "Save profile"} shimmer={saving} />
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-display text-xl">Saved people</h2>
            <p className="mt-1 text-sm text-muted">Name, nationality, phone and the last 4 of an ID. No date of birth.</p>
            {savedPeople.length === 0 ? (
              <p className="mt-3 text-sm text-muted">You can also add a guest at checkout.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {savedPeople.map((person) => (
                  <li key={person.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0 truncate">
                      {person.fullName}
                      <span className="text-muted"> · {person.nationality}</span>
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-medium underline"
                      onClick={() => {
                        void deleteSavedTraveller({ data: { id: person.id } }).then((result) => {
                          if (result.ok) setSavedPeople((rows) => rows.filter((row) => row.id !== person.id));
                          else pushBanner({ title: "Could not delete", body: result.message, tone: "info" });
                        });
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-display text-xl">Privacy</h2>
            <p className="mt-1 text-sm text-muted">
              Download your data, or delete the profile, saved people, and saved hotels.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadData}>
                Download my data
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete account
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/privacy">Privacy</Link>
              </Button>
            </div>
            {confirmDelete ? (
              <div className="mt-4 grid gap-3">
                <p className="text-sm">
                  This removes your profile, saved people, and saved hotels. Paid stays stay on the books until you cancel them.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={deleting}
                    onClick={() => {
                      setDeleting(true);
                      void deleteAccountData()
                        .then(async (result) => {
                          if (!result.ok) {
                            pushBanner({ title: "Could not delete the account", body: result.message, tone: "danger" });
                            setDeleting(false);
                            return;
                          }
                          clearDemoMode();
                          await signOut().catch(() => undefined);
                        })
                        .catch(() => {
                          setDeleting(false);
                          pushBanner({ title: "Could not delete the account", tone: "danger" });
                        });
                    }}
                  >
                    {deleting ? "Deleting" : "Delete my data"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                    Keep account
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="grid content-start gap-6 lg:col-start-2">
          <Card className="p-5 shadow-none">
            {bookingsError ? (
              <p className="text-sm text-muted">Couldn’t load your stays.</p>
            ) : featured ? (
              <StayCard
                booking={featured}
                apple={apple && walletReady}
                cancelling={cancelling === featured.id}
                onCancel={() => {
                  setCancelling(featured.id);
                  void cancelBooking({ data: featured.id })
                    .then((remote) => {
                      if (!remote.ok) pushBanner({ title: "Could not cancel", body: remote.message, tone: "danger" });
                      else pushBanner({ title: "Stay updated", body: remote.message, tone: "info" });
                      reloadBookings();
                    })
                    .catch(() => pushBanner({ title: "Could not cancel", tone: "danger" }))
                    .finally(() => setCancelling(null));
                }}
              />
            ) : (
              <p className="text-sm text-muted">{bookings ? "No upcoming stays." : "Loading stays…"}</p>
            )}
          </Card>

          <Card className="p-5 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl">Family trips</h2>
              <Link to="/group/new" className="text-sm font-medium underline">
                Plan for the family
              </Link>
            </div>
            {groups.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No family trip yet.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {groups.map((group) => (
                  <li key={group.tripId}>
                    <Link to="/group/$id" params={{ id: group.tripId }} className="text-sm font-medium">
                      {group.title} · {formatCheckInLabel(group.checkIn)} ·{" "}
                      {isGroupStatus(group.status) ? statusLabel(group.status) : group.status}
                    </Link>
                    <p className="text-sm text-muted">Join codes for this group go out by email.</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-display text-xl">Saved stays</h2>
            {savedStays.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No saved stays yet. Tap the heart on a hotel.</p>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {savedStays.map((pkg, index) => (
                  <span key={pkg.id}>
                    {index > 0 ? (index === savedStays.length - 1 ? " and " : ", ") : null}
                    <Link to="/trip/$id" params={{ id: pkg.id }} className="font-medium text-fg">
                      {pkg.name}
                    </Link>
                  </span>
                ))}
                . Open them from Discover.
              </p>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function StayCard({
  booking,
  apple,
  cancelling,
  onCancel,
}: {
  booking: BookingRow;
  apple: boolean;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const pkg = getPackage(booking.packageId);
  const cancelMode = guestCancelMode(booking.status);
  return (
    <div className="grid gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      {pkg?.image ? (
        <img src={pkg.image} alt="" className="h-28 w-full rounded-lg object-cover sm:h-full" />
      ) : (
        <div className="h-28 rounded-lg bg-surface sm:h-full" />
      )}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl">{booking.packageName}</h2>
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {stayStatusLabel(booking.status)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Check-in {formatCheckInLabel(booking.checkIn)} · {nightsPhrase(booking.nights)} · {booking.travelers}{" "}
          {booking.travelers === 1 ? "traveler" : "travelers"}
        </p>
        <p className="mt-2 text-sm tabular-nums">
          {formatMoney(booking.amountInr)} · {booking.confirmationCode} · {paymentLine(booking)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/voucher/$code" params={{ code: booking.confirmationCode }}>
              Desk voucher
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`/api/invoice/${encodeURIComponent(booking.confirmationCode)}`}>GST invoice</a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/trips">All bookings</Link>
          </Button>
          {cancelMode === "refund" ? (
            <Button type="button" size="sm" variant="outline" disabled={cancelling} onClick={onCancel}>
              {cancelling ? "Cancelling" : "Cancel"}
            </Button>
          ) : cancelMode === "no_refund" ? (
            <p className="w-full text-xs text-muted">The hotel confirmed this stay. Cancel it from All bookings. No refund is issued.</p>
          ) : null}
        </div>
        {apple ? <AddToWallet booking={booking} compact className="mt-3" /> : null}
      </div>
    </div>
  );
}
