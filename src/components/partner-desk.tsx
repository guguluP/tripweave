import { useEffect, useState } from "react";
import { PACKAGES, formatMoney, getPackage } from "@/lib/packages";
import { partnerStays } from "@/lib/server/partner";
import { loadCatalog, saveCatalogOverride, listDeskBookings, confirmDeskBooking, sendStayReminder, type DeskBooking } from "@/lib/server/catalog";
import { setCatalogOverlays } from "@/lib/catalog-store";
import { Button } from "@/components/ui/button";
import { pushBanner } from "@/lib/banners";

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
  const [note, setNote] = useState("Room held for this confirmation code.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    partnerStays().then((ids) => {
      setAllowed(ids);
      setPackageId(ids[0] ?? "");
    }).catch(() => setAllowed([]));
  }, []);

  useEffect(() => {
    const current = getPackage(packageId);
    if (!current) return;
    setPrice(current.pricePerNight);
    setKeys(current.rooms[0] ? 2 : 2);
    setImage("");
    const options = current.days.flatMap((day) => day.options.map((option) => ({ optionId: option.id, label: option.label, delta: option.delta })));
    const seen = new Set<string>();
    setExtras(options.filter((option) => (seen.has(option.optionId) ? false : (seen.add(option.optionId), true))));
  }, [packageId]);

  const refreshBookings = () => {
    listDeskBookings({ data: packageId }).then(setBookings).catch(() => setBookings([]));
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
          ...(pkg?.rooms ?? []).map((room) => ({ optionId: `units:${room.id}`, delta: keys, label: "keys" })),
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

  return (
    <section className="mt-12 border-t border-border pt-8">
      <p className="eyebrow">Partner desk</p>
      <h2 className="mt-2 font-display text-2xl">Rates, photos, and confirmations</h2>
      <p className="mt-2 text-sm text-muted">Changes apply on top of the Puri catalog. Guests see the new nightly rate, cover photo, and extra prices.</p>
      <label className="mt-4 block text-sm font-medium">
        Property
        <select className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
          {stays.map((stay) => (
            <option key={stay.id} value={stay.id}>{stay.name}</option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium">
        Keys we can sell of each room
        <input className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2" type="number" min={1} max={40} value={keys} onChange={(e) => setKeys(Number(e.target.value))} />
      </label>
      <label className="mt-3 block text-sm font-medium">
        Nightly rate, base room (₹)
        <input className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2" type="number" min={500} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
      </label>
      <label className="mt-3 block text-sm font-medium">
        Cover photo URL
        <input className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2" placeholder="https://…" value={image} onChange={(e) => setImage(e.target.value)} />
      </label>
      <div className="mt-4 grid gap-2">
        {extras.map((extra, index) => (
          <label key={extra.optionId} className="flex items-center justify-between gap-3 text-sm">
            <span>{extra.label}</span>
            <input
              className="w-28 rounded-md border border-border bg-elevated px-2 py-1"
              type="number"
              min={0}
              value={extra.delta}
              onChange={(e) => {
                const delta = Number(e.target.value);
                setExtras((list) => list.map((item, i) => (i === index ? { ...item, delta } : item)));
              }}
            />
          </label>
        ))}
      </div>
      <Button className="mt-4" type="button" disabled={busy} onClick={() => void save()}>Save catalog</Button>

      <h3 className="mt-8 font-medium">Waiting on the desk</h3>
      <ul className="mt-3 grid gap-3">
        {bookings.length === 0 ? <li className="text-sm text-muted">No paid stays for this property.</li> : null}
        {bookings.map((booking) => (
          <li key={booking.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">{booking.payerName} · {booking.confirmationCode}</p>
            <p className="text-muted">{booking.checkIn} · {booking.nights} nights · {formatMoney(booking.amountInr)} · {booking.status}</p>
            {booking.status === "paid" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <input className="min-w-48 flex-1 rounded-md border border-border px-2 py-1" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    void confirmDeskBooking({ data: { id: booking.id, packageId, note } }).then((result) => {
                      if (!result.ok) pushBanner({ title: "Could not confirm", body: result.message, tone: "danger" });
                      else {
                        pushBanner({ title: "Desk confirmed", body: booking.confirmationCode, tone: "ok" });
                        refreshBookings();
                      }
                    });
                  }}
                >
                  Confirm room
                </Button>
              </div>
            ) : (
              <p className="mt-1 text-muted">Confirmed for the guest.</p>
            )}
            {booking.guestEmail ? (
              <Button
                className="mt-2"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void sendStayReminder({
                    data: { email: booking.guestEmail!, hotel: booking.packageName, checkIn: booking.checkIn, code: booking.confirmationCode, packageId },
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
          </li>
        ))}
      </ul>
    </section>
  );
}
