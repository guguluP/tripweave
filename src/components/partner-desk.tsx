import { useEffect, useState } from "react";
import { PACKAGES, getPackage } from "@/lib/packages";
import { partnerStays } from "@/lib/server/partner";
import {
  loadCatalog,
  saveCatalogOverride,
  listDeskBookings,
  confirmDeskBooking,
  sendStayReminder,
  type DeskBooking,
} from "@/lib/server/catalog";
import { setCatalogOverlays } from "@/lib/catalog-store";
import { ForeignGuestRegister, foreignCodes } from "@/components/foreign-guest-register";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pushBanner } from "@/lib/banners";
import { deskForeignRegister } from "@/lib/server/desk-ops";
import type { ForeignGuestRow } from "@/lib/server/guest-arrivals";
import {
  DeskBookingCard,
  DeskEmptyState,
  DeskSelect,
  DeskStatCard,
  DeskStatusBadge,
} from "@/components/desk-ui";

export function PartnerDesk() {
  const [allowed, setAllowed] = useState<string[] | null>(null);
  const stays = PACKAGES.filter((stay) => allowed?.includes(stay.id));
  const [packageId, setPackageId] = useState("");
  const pkg = getPackage(packageId);
  const [price, setPrice] = useState(pkg?.pricePerNight ?? 0);
  const [keys, setKeys] = useState(2);
  const [image, setImage] = useState("");
  const [extras, setExtras] = useState<{ optionId: string; label: string; delta: number }[]>([]);
  const [bookings, setBookings] = useState<DeskBooking[]>([]);
  const [foreignGuests, setForeignGuests] = useState<ForeignGuestRow[]>([]);
  const [note, setNote] = useState("Room held for this confirmation code.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    partnerStays()
      .then((ids) => {
        setAllowed(ids);
        setPackageId(ids[0] ?? "");
      })
      .catch(() => setAllowed([]));
  }, []);

  useEffect(() => {
    const current = getPackage(packageId);
    if (!current) return;
    setPrice(current.pricePerNight);
    setKeys(current.rooms[0] ? 2 : 2);
    setImage("");
    const options = current.days.flatMap((day) =>
      day.options.map((option) => ({
        optionId: option.id,
        label: option.label,
        delta: option.delta,
      })),
    );
    const seen = new Set<string>();
    setExtras(
      options.filter((option) =>
        seen.has(option.optionId) ? false : (seen.add(option.optionId), true),
      ),
    );
  }, [packageId]);

  const refreshBookings = () => {
    listDeskBookings({ data: packageId })
      .then(setBookings)
      .catch(() => setBookings([]));
    deskForeignRegister({ data: { packageId } })
      .then(setForeignGuests)
      .catch(() => setForeignGuests([]));
  };

  useEffect(() => {
    refreshBookings();
  }, [packageId]);

  const save = async () => {
    setBusy(true);
    const result = await saveCatalogOverride({
      data: {
        packageId,
        pricePerNight: price,
        image: image.trim() || undefined,
        extras: [
          ...extras.filter((extra) => !extra.optionId.startsWith("units:")),
          ...(pkg?.rooms ?? []).map((room) => ({
            optionId: `units:${room.id}`,
            delta: keys,
            label: "keys",
          })),
        ],
      },
    });
    if (!result.ok) {
      pushBanner({ title: "Could not save the stay", body: result.message, tone: "danger" });
      setBusy(false);
      return;
    }
    setCatalogOverlays(await loadCatalog());
    pushBanner({ title: "Rate and photo saved", body: pkg?.name, tone: "ok" });
    setBusy(false);
  };

  if (!allowed?.length) return null;

  const pending = bookings.filter((b) => b.status === "paid").length;
  const confirmed = bookings.filter(
    (b) => b.status === "desk_confirmed" || b.status === "confirmed",
  ).length;
  const foreignStay = foreignCodes(foreignGuests);

  return (
    <section className="mt-12 min-w-0 border-t border-border pt-8">
      <p className="eyebrow">Partner desk</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl">{pkg?.name ?? "Rates, photos, and confirmations"}</h2>
        {pkg ? <DeskStatusBadge tone="ok">Signed in</DeskStatusBadge> : null}
      </div>
      <p className="mt-2 text-sm text-muted">
        Changes apply on top of the Puri catalog. For per-night units and stop-sell, use the{" "}
        <a className="underline" href="/desk">
          desk portal
        </a>{" "}
        with a TW_DESK_TOKENS secret.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg">
        <DeskStatCard label="Awaiting confirmation" value={pending} emphasize={pending > 0} />
        <DeskStatCard label="Hotel confirmed" value={confirmed} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <Card className="space-y-3 p-5 shadow-none">
          <h3 className="font-display text-xl">Rates and photos</h3>
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
          <Label>
            Keys we can sell of each room
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={40}
              value={keys}
              onChange={(e) => setKeys(Number(e.target.value))}
            />
          </Label>
          <Label>
            Nightly rate, base room (₹)
            <Input
              className="mt-1"
              type="number"
              min={500}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </Label>
          <Label>
            Cover photo URL
            <Input
              className="mt-1"
              placeholder="https://…"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </Label>
          {extras.length ? (
            <div className="grid gap-2 border-t border-border pt-3">
              {extras.map((extra, index) => (
                <label
                  key={extra.optionId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{extra.label}</span>
                  <input
                    className="w-28 rounded-md border border-border bg-elevated px-2 py-1"
                    type="number"
                    min={0}
                    value={extra.delta}
                    onChange={(e) => {
                      const delta = Number(e.target.value);
                      setExtras((list) =>
                        list.map((item, i) => (i === index ? { ...item, delta } : item)),
                      );
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}
          <Button
            className="w-full sm:w-auto"
            type="button"
            disabled={busy}
            onClick={() => void save()}
          >
            Save catalog
          </Button>
        </Card>

        <div>
          <h3 className="font-display text-xl">Waiting on the desk</h3>
          {bookings.length === 0 ? (
            <div className="mt-3">
              <DeskEmptyState title="No paid stays" body="No paid stays for this property." />
            </div>
          ) : (
            <ul className="mt-3 grid gap-3">
              {bookings.map((booking) => (
                <DeskBookingCard
                  key={booking.id}
                  booking={booking}
                  foreign={foreignStay.has(booking.confirmationCode)}
                >
                  {booking.status === "paid" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Input
                        className="min-w-0 flex-1 sm:min-w-48"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        aria-label="Note"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-11"
                        onClick={() => {
                          void confirmDeskBooking({
                            data: { id: booking.id, packageId, note },
                          }).then((result) => {
                            if (!result.ok)
                              pushBanner({
                                title: "Could not confirm",
                                body: result.message,
                                tone: "danger",
                              });
                            else {
                              pushBanner({
                                title: "Desk confirmed",
                                body: booking.confirmationCode,
                                tone: "ok",
                              });
                              refreshBookings();
                            }
                          });
                        }}
                      >
                        Confirm room
                      </Button>
                    </div>
                  ) : booking.status === "desk_confirmed" || booking.status === "confirmed" ? (
                    <p className="mt-2 text-sm text-muted">Hotel confirmed for the guest.</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted">{booking.status}</p>
                  )}
                  {booking.guestEmail ? (
                    <Button
                      className="mt-2"
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void sendStayReminder({
                          data: {
                            email: booking.guestEmail!,
                            hotel: booking.packageName,
                            checkIn: booking.checkIn,
                            code: booking.confirmationCode,
                            packageId,
                          },
                        }).then((result) => {
                          pushBanner({
                            title: result.ok ? "Reminder sent" : "Reminder not emailed",
                            body: result.ok ? booking.guestEmail! : result.message,
                            tone: result.ok ? "ok" : "info",
                          });
                        });
                      }}
                    >
                      Email day-before reminder
                    </Button>
                  ) : null}
                </DeskBookingCard>
              ))}
            </ul>
          )}
        </div>
      </div>
      {packageId ? <ForeignGuestRegister packageId={packageId} rows={foreignGuests} /> : null}
    </section>
  );
}
