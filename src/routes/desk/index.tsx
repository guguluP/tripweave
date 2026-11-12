import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPackage, PACKAGES } from "@/lib/packages";
import { addDays, roomUnits, todayIso } from "@/lib/inventory";
import { ForeignGuestRegister, foreignCodes } from "@/components/foreign-guest-register";
import {
  deskForeignRegister,
  deskListAllotment,
  deskListBookings,
  deskListStopSell,
  deskResolvePackages,
  deskSetAllotment,
  deskSetStopSell,
  deskTransitionBooking,
  type DeskOpsBooking,
} from "@/lib/server/desk-ops";
import type { ForeignGuestRow } from "@/lib/server/guest-arrivals";
import { pushBanner } from "@/lib/banners";
import { pageHead } from "@/lib/page-title";
import { deskFor } from "@/lib/hotel-desk";
import { Stagger } from "@/components/motion";
import {
  DeskBookingsSkeleton,
  DeskBookingsTable,
  DeskBookingCard,
  DeskEmptyState,
  DeskErrorState,
  DeskGate,
  DeskPageSkeleton,
  DeskSelect,
  DeskStatCard,
  DeskStatusBadge,
  formatDeskDate,
  type DeskBookingView,
} from "@/components/desk-ui";

export const Route = createFileRoute("/desk/")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
    packageId: typeof search.packageId === "string" ? search.packageId : "",
  }),
  component: DeskPortal,
  head: () => pageHead("Hotel desk"),
});

type StayFilter = "all" | "paid" | "confirmed" | "checked_in";

function DeskPortal() {
  const search = Route.useSearch();
  const [token, setToken] = useState(search.token);
  const [allowed, setAllowed] = useState<string[] | null>(null);
  const [packageId, setPackageId] = useState(search.packageId);
  const [bookings, setBookings] = useState<DeskOpsBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(false);
  const [foreignGuests, setForeignGuests] = useState<ForeignGuestRow[]>([]);
  const [night, setNight] = useState(todayIso());
  const [roomId, setRoomId] = useState("");
  const [units, setUnits] = useState(2);
  const [allotment, setAllotment] = useState<{ roomId: string; night: string; units: number }[]>(
    [],
  );
  const [stops, setStops] = useState<{ roomId: string; night: string; reason?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("Room held for this confirmation code.");
  const [filter, setFilter] = useState<StayFilter>("all");

  const pkg = getPackage(packageId);
  const from = todayIso();
  const to = addDays(from, 21);

  useEffect(() => {
    if (!token.trim()) {
      setAllowed([]);
      return;
    }
    deskResolvePackages({ data: { deskToken: token.trim() } })
      .then((ids) => {
        setAllowed(ids);
        if (!packageId && ids[0]) setPackageId(ids[0]);
      })
      .catch(() => setAllowed([]));
  }, [token]);

  useEffect(() => {
    if (!packageId || !pkg) return;
    setRoomId(pkg.rooms[0]?.id ?? "");
  }, [packageId]);

  useEffect(() => {
    if (!pkg || !roomId) return;
    const saved = allotment.find((row) => row.roomId === roomId && row.night === night);
    setUnits(saved ? saved.units : roomUnits(pkg, roomId));
  }, [night, roomId, allotment, pkg]);

  const refresh = () => {
    if (!packageId || !token.trim()) return;
    const deskToken = token.trim();
    setBookingsLoading(true);
    setBookingsError(false);
    deskListBookings({ data: { packageId, deskToken: token.trim() } })
      .then((rows) => {
        setBookings(rows);
        setBookingsError(false);
      })
      .catch(() => {
        setBookings([]);
        setBookingsError(true);
      })
      .finally(() => setBookingsLoading(false));
    deskForeignRegister({ data: { packageId, deskToken } })
      .then(setForeignGuests)
      .catch(() => setForeignGuests([]));
    deskListAllotment({ data: { packageId, from, to, deskToken } })
      .then(setAllotment)
      .catch(() => setAllotment([]));
    deskListStopSell({ data: { packageId, from, to, deskToken } })
      .then(setStops)
      .catch(() => setStops([]));
  };

  useEffect(() => {
    refresh();
  }, [packageId, token]);

  const foreignStay = useMemo(() => foreignCodes(foreignGuests), [foreignGuests]);
  const stays = useMemo(() => PACKAGES.filter((s) => allowed?.includes(s.id)), [allowed]);

  const pending = bookings.filter((b) => b.status === "paid").length;
  const confirmed = bookings.filter(
    (b) => b.status === "desk_confirmed" || b.status === "confirmed",
  ).length;
  const checkedIn = bookings.filter((b) => b.status === "checked_in").length;
  const flagged = bookings.filter((b) => b.opsFlaggedAt).length;
  const closedNightCount = new Set(stops.map((row) => row.night)).size;

  const today = todayIso();
  const tonightStops = stops.filter((row) => row.night === today);
  const tonightClosedAll = tonightStops.some((row) => !row.roomId);
  const hotelStatus = tonightClosedAll
    ? "Stop-sell tonight"
    : tonightStops.length
      ? "Some rooms closed tonight"
      : "Open";
  const hotelStatusTone = tonightClosedAll ? "danger" : tonightStops.length ? "awaiting" : "ok";

  const desk = packageId ? deskFor(packageId) : null;
  const subtitle = [pkg?.neighborhood, desk?.note].filter(Boolean).join(" · ");

  const visibleBookings = bookings.filter((booking) => {
    if (filter === "paid") return booking.status === "paid";
    if (filter === "confirmed")
      return booking.status === "desk_confirmed" || booking.status === "confirmed";
    if (filter === "checked_in") return booking.status === "checked_in";
    return true;
  });

  const roomName = (id: string) => {
    if (!id) return "all rooms";
    return pkg?.rooms.find((room) => room.id === id)?.name ?? id;
  };

  const confirmBooking = (booking: DeskBookingView) => {
    void deskTransitionBooking({
      data: {
        id: booking.id,
        packageId,
        action: "desk_confirm",
        note,
        deskToken: token.trim(),
      },
    }).then((result) => {
      if (!result.ok)
        pushBanner({ title: "Could not confirm", body: result.message, tone: "danger" });
      else {
        pushBanner({ title: "Hotel confirmed", body: booking.confirmationCode, tone: "ok" });
        refresh();
      }
    });
  };

  const declineBooking = (booking: DeskBookingView) => {
    void deskTransitionBooking({
      data: {
        id: booking.id,
        packageId,
        action: "desk_decline",
        deskToken: token.trim(),
      },
    }).then((result) => {
      if (!result.ok)
        pushBanner({ title: "Could not decline", body: result.message, tone: "danger" });
      else {
        pushBanner({
          title: "Declined",
          body: "message" in result && result.message ? result.message : booking.confirmationCode,
          tone: "info",
        });
        refresh();
      }
    });
  };

  const checkInBooking = (booking: DeskBookingView) => {
    void deskTransitionBooking({
      data: { id: booking.id, packageId, action: "check_in", deskToken: token.trim() },
    }).then((result) => {
      if (!result.ok)
        pushBanner({ title: "Check-in failed", body: result.message, tone: "danger" });
      else {
        pushBanner({ title: "Checked in", body: booking.confirmationCode, tone: "ok" });
        refresh();
      }
    });
  };

  const bookingActions = (booking: DeskBookingView, compact = false) => {
    if (booking.status === "paid") {
      return (
        <div className={compact ? "flex flex-wrap items-end gap-3" : "mt-3 grid gap-2"}>
          <Label
            className={
              compact
                ? "min-w-0 flex-1 text-xs font-medium text-muted"
                : "text-xs font-medium text-muted"
            }
          >
            Note
            <Input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => confirmBooking(booking)}
            >
              Confirm
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 flex-1 border-danger/30 text-danger hover:bg-danger/10 sm:flex-none"
              onClick={() => declineBooking(booking)}
            >
              Decline
            </Button>
          </div>
        </div>
      );
    }
    if (booking.status === "desk_confirmed" || booking.status === "confirmed") {
      return (
        <div className={compact ? "flex justify-end" : "mt-3"}>
          <Button type="button" size="sm" variant="outline" onClick={() => checkInBooking(booking)}>
            Mark checked in
          </Button>
        </div>
      );
    }
    return null;
  };

  if (!token.trim()) {
    return (
      <Shell>
        <DeskGate
          title="Open your desk"
          body="This is for the hotel, not for guests. Paste the desk key TripWeave sent you. It opens only your property."
        >
          <Label className="mt-6">
            Desk key
            <Input
              className="mt-1"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
            />
          </Label>
          <Button className="mt-4 w-full" type="button" onClick={() => setToken(token.trim())}>
            Open desk
          </Button>
        </DeskGate>
      </Shell>
    );
  }

  if (allowed === null) {
    return (
      <Shell>
        <DeskPageSkeleton />
      </Shell>
    );
  }

  if (!allowed.length) {
    return (
      <Shell>
        <DeskGate
          title="Desk token not recognised"
          body="That desk key does not match a hotel."
          tone="danger"
        >
          <Button
            className="mt-6 w-full"
            type="button"
            variant="outline"
            onClick={() => setToken("")}
          >
            Try another token
          </Button>
        </DeskGate>
      </Shell>
    );
  }

  const filters: { id: StayFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: bookings.length },
    { id: "paid", label: "Awaiting", count: pending },
    { id: "confirmed", label: "Confirmed", count: confirmed },
    { id: "checked_in", label: "Checked in", count: checkedIn },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <Stagger>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              {pkg?.image ? (
                <img
                  src={pkg.image}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover sm:size-[4.5rem]"
                />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-primary font-display text-2xl text-primary-fg sm:size-[4.5rem]">
                  {(pkg?.name ?? "D").charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="eyebrow">Partner desk</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                    {pkg?.name ?? "Hotel desk"}
                  </h1>
                  <DeskStatusBadge tone={hotelStatusTone}>{hotelStatus}</DeskStatusBadge>
                </div>
                {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  Set units per room per night, close dates (stop-sell), and confirm paid stays.
                  Guests see “awaiting hotel confirmation” until you accept.
                </p>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-xs lg:w-72">
              <Label>
                Property
                <DeskSelect
                  className="mt-1"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                >
                  {stays.map((stay) => (
                    <option key={stay.id} value={stay.id}>
                      {stay.name}
                    </option>
                  ))}
                </DeskSelect>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start text-muted"
                onClick={() => setToken("")}
              >
                Use a different desk key
              </Button>
            </div>
          </div>
        </Stagger>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DeskStatCard
            label="Awaiting confirmation"
            value={pending}
            loading={bookingsLoading}
            emphasize={pending > 0}
            hint={pending > 0 ? "Needs a confirm or decline" : undefined}
          />
          <DeskStatCard label="Hotel confirmed" value={confirmed} loading={bookingsLoading} />
          <DeskStatCard label="Checked in" value={checkedIn} loading={bookingsLoading} />
          <DeskStatCard
            label="Closed nights"
            value={closedNightCount}
            hint="Stop-sell in the next three weeks"
          />
        </div>

        {flagged > 0 ? (
          <p className="mt-4 rounded-lg border border-[#c4852a]/30 bg-[#c4852a]/10 px-4 py-3 text-sm">
            {flagged === 1 ? "1 paid stay is" : `${flagged} paid stays are`} still waiting past the
            confirmation window.
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <Card className="flex h-full flex-col space-y-3 p-5 shadow-none">
            <h2 className="font-display text-xl">Units for one night</h2>
            <Label>
              Room
              <DeskSelect
                className="mt-1"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                {(pkg?.rooms ?? []).map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </DeskSelect>
            </Label>
            <Label>
              Night
              <Input
                className="mt-1"
                type="date"
                min={from}
                value={night}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next >= from) setNight(next);
                }}
              />
            </Label>
            <Label>
              Units
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={40}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
              />
            </Label>
            <p className="text-xs text-muted">
              This count is only for {formatDeskDate(night)}. Other dates keep their own count.
              Stays already booked for this night are left as they are.
            </p>
            <Button
              type="button"
              className="self-start"
              disabled={busy || !roomId || night < from}
              onClick={() => {
                setBusy(true);
                void deskSetAllotment({
                  data: { packageId, roomId, night, units, deskToken: token.trim() },
                }).then((result) => {
                  setBusy(false);
                  if (!result.ok)
                    pushBanner({
                      title: "Could not save units",
                      body: result.message,
                      tone: "danger",
                    });
                  else {
                    pushBanner({ title: "Units saved", body: `${night} · ${units}`, tone: "ok" });
                    refresh();
                  }
                });
              }}
            >
              Save units
            </Button>
            {allotment.length ? (
              <ul className="mt-1 max-h-40 overflow-auto divide-y divide-border rounded-md border border-border text-sm">
                {allotment.map((row) => (
                  <li
                    key={`${row.roomId}-${row.night}`}
                    className="flex justify-between gap-3 px-3 py-2"
                  >
                    <span>
                      {formatDeskDate(row.night)} · {roomName(row.roomId)}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {row.units} {row.units === 1 ? "unit" : "units"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <Card className="flex h-full flex-col space-y-3 p-5 shadow-none">
            <h2 className="font-display text-xl">Stop-sell / close date</h2>
            <Label>
              Night
              <Input
                className="mt-1"
                type="date"
                min={from}
                value={night}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next >= from) setNight(next);
                }}
              />
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy || night < from}
                onClick={() => {
                  setBusy(true);
                  void deskSetStopSell({
                    data: {
                      packageId,
                      roomId: "",
                      night,
                      closed: true,
                      reason: "Desk stop-sell",
                      deskToken: token.trim(),
                    },
                  }).then((result) => {
                    setBusy(false);
                    if (!result.ok)
                      pushBanner({
                        title: "Could not close date",
                        body: result.message,
                        tone: "danger",
                      });
                    else {
                      pushBanner({ title: "Date closed", body: night, tone: "ok" });
                      refresh();
                    }
                  });
                }}
              >
                Close night
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || night < from}
                onClick={() => {
                  setBusy(true);
                  void deskSetStopSell({
                    data: { packageId, roomId: "", night, closed: false, deskToken: token.trim() },
                  }).then((result) => {
                    setBusy(false);
                    if (!result.ok)
                      pushBanner({
                        title: "Could not reopen",
                        body: result.message,
                        tone: "danger",
                      });
                    else {
                      pushBanner({ title: "Date reopened", body: night, tone: "ok" });
                      refresh();
                    }
                  });
                }}
              >
                Reopen night
              </Button>
            </div>
            {stops.length ? (
              <ul className="mt-1 max-h-40 overflow-auto divide-y divide-border rounded-md border border-border text-sm">
                {stops.map((row) => (
                  <li
                    key={`${row.roomId || "*"}-${row.night}`}
                    className="flex justify-between gap-3 px-3 py-2"
                  >
                    <span>
                      {formatDeskDate(row.night)} · {roomName(row.roomId)}
                      {row.reason ? <span className="text-muted"> · {row.reason}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No stop-sell nights in the next three weeks.</p>
            )}
          </Card>
        </div>

        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl">Paid stays</h2>
              <p className="mt-1 text-sm text-muted">
                Paid and hotel-confirmed stays for this property. Email accept/decline links also
                work.
              </p>
            </div>
            <div
              className="flex flex-nowrap gap-1 overflow-x-auto rounded-lg border border-border bg-elevated p-1 scrollbar-hide"
              role="tablist"
              aria-label="Filter stays"
            >
              {filters.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                    filter === tab.id
                      ? "bg-primary text-primary-fg"
                      : "text-muted hover:bg-surface hover:text-fg"
                  }`}
                  onClick={() => setFilter(tab.id)}
                >
                  {tab.label}
                  <span className="ml-1.5 tabular-nums opacity-80">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {bookingsLoading ? (
              <DeskBookingsSkeleton />
            ) : bookingsError ? (
              <DeskErrorState
                body="The list of paid stays could not be loaded. Your desk key is still valid — try again."
                onRetry={() => refresh()}
              />
            ) : bookings.length === 0 ? (
              <DeskEmptyState
                title="No paid stays yet"
                body="When a guest pays for this property, the stay appears here for you to confirm or decline."
              />
            ) : visibleBookings.length === 0 ? (
              <DeskEmptyState
                title="No stays in this view"
                body="Nothing matches the filter you picked. Choose All to see every paid stay."
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <DeskBookingsTable
                    bookings={visibleBookings}
                    foreignCodes={foreignStay}
                    actions={(booking) => bookingActions(booking, true)}
                  />
                </div>
                <ul className="grid gap-3 md:hidden">
                  {visibleBookings.map((booking) => (
                    <DeskBookingCard
                      key={booking.id}
                      booking={booking}
                      foreign={foreignStay.has(booking.confirmationCode)}
                      flagged={Boolean(booking.opsFlaggedAt)}
                    >
                      {bookingActions(booking, false)}
                    </DeskBookingCard>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {packageId ? <ForeignGuestRegister packageId={packageId} rows={foreignGuests} /> : null}
      </div>
    </Shell>
  );
}
