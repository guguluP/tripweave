import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPackage, formatMoney, PACKAGES } from "@/lib/packages";
import { stayStatusLabel } from "@/lib/refund-policy";
import { addDays, todayIso } from "@/lib/inventory";
import {
  deskListAllotment,
  deskListBookings,
  deskListStopSell,
  deskResolvePackages,
  deskSetAllotment,
  deskSetStopSell,
  deskTransitionBooking,
  type DeskOpsBooking,
} from "@/lib/server/desk-ops";
import { pushBanner } from "@/lib/banners";

export const Route = createFileRoute("/desk/")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
    packageId: typeof search.packageId === "string" ? search.packageId : "",
  }),
  component: DeskPortal,
});

function DeskPortal() {
  const search = Route.useSearch();
  const [token, setToken] = useState(search.token);
  const [allowed, setAllowed] = useState<string[] | null>(null);
  const [packageId, setPackageId] = useState(search.packageId);
  const [bookings, setBookings] = useState<DeskOpsBooking[]>([]);
  const [night, setNight] = useState(todayIso());
  const [roomId, setRoomId] = useState("");
  const [units, setUnits] = useState(2);
  const [allotment, setAllotment] = useState<{ roomId: string; night: string; units: number }[]>([]);
  const [stops, setStops] = useState<{ roomId: string; night: string; reason?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("Room held for this confirmation code.");

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

  const refresh = () => {
    if (!packageId || !token.trim()) return;
    const deskToken = token.trim();
    deskListBookings({ data: { packageId, deskToken: token.trim() } })
      .then(setBookings)
      .catch(() => setBookings([]));
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

  const stays = useMemo(
    () => PACKAGES.filter((s) => allowed?.includes(s.id)),
    [allowed],
  );

  if (!token.trim() || allowed === null) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-4 py-12">
          <p className="eyebrow">Hotel desk</p>
          <h1 className="mt-2 font-display text-3xl">Open your desk</h1>
          <p className="mt-2 text-sm text-muted">
            This is for the hotel, not for guests. Paste the desk key TripWeave sent you. It opens only your property.
          </p>
          <Label className="mt-6 block text-sm">
            Desk key
            <Input className="mt-1" type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
          </Label>
          <Button className="mt-4" type="button" onClick={() => setToken(token.trim())}>
            Open desk
          </Button>
        </div>
      </Shell>
    );
  }

  if (!allowed.length) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-4 py-12">
          <h1 className="font-display text-3xl">Desk token not recognised</h1>
          <p className="mt-2 text-sm text-muted">That desk key does not match a hotel. Ask TripWeave for the key for your property.</p>
          <Button className="mt-4" type="button" variant="outline" onClick={() => setToken("")}>
            Try another token
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="eyebrow">Partner desk</p>
        <h1 className="mt-2 font-display text-3xl">Inventory and confirmations</h1>
        <p className="mt-2 text-sm text-muted">
          Set units per room per night, close dates (stop-sell), and confirm paid stays. Guests see “awaiting hotel
          confirmation” until you accept.
        </p>

        <Label className="mt-6 block text-sm">
          Property
          <select
            className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
          >
            {stays.map((stay) => (
              <option key={stay.id} value={stay.id}>
                {stay.name}
              </option>
            ))}
          </select>
        </Label>

        <Card className="mt-6 space-y-3 p-4 shadow-none">
          <h2 className="font-medium">Units for one night</h2>
          <Label className="block text-sm">
            Room
            <select
              className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              {(pkg?.rooms ?? []).map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </Label>
          <Label className="block text-sm">
            Night
            <Input className="mt-1" type="date" value={night} onChange={(e) => setNight(e.target.value)} />
          </Label>
          <Label className="block text-sm">
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
          <Button
            type="button"
            disabled={busy || !roomId}
            onClick={() => {
              setBusy(true);
              void deskSetAllotment({
                data: { packageId, roomId, night, units, deskToken: token.trim() },
              }).then((result) => {
                setBusy(false);
                if (!result.ok) pushBanner({ title: "Could not save units", body: result.message, tone: "danger" });
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
            <ul className="mt-2 max-h-32 overflow-auto text-xs text-muted">
              {allotment.map((row) => (
                <li key={`${row.roomId}-${row.night}`}>
                  {row.night} · {row.roomId} · {row.units} keys
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card className="mt-4 space-y-3 p-4 shadow-none">
          <h2 className="font-medium">Stop-sell / close date</h2>
          <Label className="block text-sm">
            Night
            <Input className="mt-1" type="date" value={night} onChange={(e) => setNight(e.target.value)} />
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
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
                  if (!result.ok) pushBanner({ title: "Could not close date", body: result.message, tone: "danger" });
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
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void deskSetStopSell({
                  data: { packageId, roomId: "", night, closed: false, deskToken: token.trim() },
                }).then((result) => {
                  setBusy(false);
                  if (!result.ok) pushBanner({ title: "Could not reopen", body: result.message, tone: "danger" });
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
            <ul className="mt-2 max-h-32 overflow-auto text-xs text-muted">
              {stops.map((row) => (
                <li key={`${row.roomId || "*"}-${row.night}`}>
                  {row.night} · {row.roomId || "all rooms"}
                  {row.reason ? ` · ${row.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">No stop-sell nights in the next three weeks.</p>
          )}
        </Card>

        <h2 className="mt-8 font-medium">Paid stays waiting on the desk</h2>
        <p className="mt-1 text-xs text-muted">
          Paid stays appear here after Supabase partner_desk_ops.sql is applied. Email accept/decline links also work.
        </p>
        <ul className="mt-3 grid gap-3">
          {bookings.length === 0 ? (
            <li className="text-sm text-muted">No paid stays waiting for this property.</li>
          ) : null}
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">
                {booking.payerName} · {booking.confirmationCode}
              </p>
              <p className="text-muted">
                {booking.checkIn} · {booking.nights} nights · {formatMoney(booking.amountInr)} ·{" "}
                {stayStatusLabel(booking.status)}
              </p>
              {booking.status === "paid" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Input className="min-w-0 flex-1" value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      void deskTransitionBooking({
                        data: {
                          id: booking.id,
                          packageId,
                          action: "desk_confirm",
                          note,
                          deskToken: token.trim(),
                        },
                      }).then((result) => {
                        if (!result.ok) pushBanner({ title: "Could not confirm", body: result.message, tone: "danger" });
                        else {
                          pushBanner({ title: "Hotel confirmed", body: booking.confirmationCode, tone: "ok" });
                          refresh();
                        }
                      });
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void deskTransitionBooking({
                        data: {
                          id: booking.id,
                          packageId,
                          action: "desk_decline",
                          deskToken: token.trim(),
                        },
                      }).then((result) => {
                        if (!result.ok) pushBanner({ title: "Could not decline", body: result.message, tone: "danger" });
                        else {
                          pushBanner({ title: "Declined", body: booking.confirmationCode, tone: "info" });
                          refresh();
                        }
                      });
                    }}
                  >
                    Decline
                  </Button>
                </div>
              ) : booking.status === "desk_confirmed" || booking.status === "confirmed" ? (
                <Button
                  className="mt-2"
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void deskTransitionBooking({
                      data: { id: booking.id, packageId, action: "check_in", deskToken: token.trim() },
                    }).then((result) => {
                      if (!result.ok) pushBanner({ title: "Check-in failed", body: result.message, tone: "danger" });
                      else {
                        pushBanner({ title: "Checked in", body: booking.confirmationCode, tone: "ok" });
                        refresh();
                      }
                    });
                  }}
                >
                  Mark checked in
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
