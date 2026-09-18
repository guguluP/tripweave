import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney, nightsPhrase } from "@/lib/packages";
import { listDemoBookings } from "@/lib/demo-bookings";
import { listBookings, type BookingRow } from "@/lib/server/bookings";
import { deskFor, hotelMailto } from "@/lib/hotel-desk";
import { readMeta } from "@/lib/booking-meta";

export const Route = createFileRoute("/voucher/$code")({ component: VoucherPage });

function VoucherPage() {
  const { code } = Route.useParams();
  const [booking, setBooking] = useState<BookingRow | null>(null);

  useEffect(() => {
    const local = listDemoBookings().find((b) => b.confirmationCode === code);
    if (local) setBooking(local);
    void listBookings()
      .then((rows) => {
        const found = rows.find((b) => b.confirmationCode === code);
        if (found) setBooking(found);
      })
      .catch(() => {
        /* local voucher is enough */
      });
  }, [code]);

  if (!booking) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-3xl">Voucher not found</h1>
          <p className="mt-3 text-sm text-muted">
            Check the confirmation code on My trips, or open this page on the same device you paid on.
          </p>
          <Button asChild className="mt-6">
            <Link to="/trips">My trips</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const desk = deskFor(booking.packageId);
  const meta = readMeta(booking.swaps);
  const mailto = hotelMailto({
    packageId: booking.packageId,
    packageName: booking.packageName,
    confirmationCode: booking.confirmationCode,
    checkIn: booking.checkIn,
    nights: booking.nights,
    travelers: booking.travelers,
    payerName: booking.payerName,
    amountInr: booking.amountInr,
  });

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="eyebrow">Hotel desk copy</p>
        <h1 className="mt-2 font-display text-4xl">{booking.confirmationCode}</h1>
        <Card className="mt-6 p-5 shadow-none">
          <p className="font-display text-2xl">{booking.packageName}</p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Check-in</dt>
              <dd>{booking.checkIn}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Stay</dt>
              <dd>
                {nightsPhrase(booking.nights)} · {booking.travelers} guests
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Paid</dt>
              <dd className="tabular-nums">{formatMoney(booking.amountInr)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Guest</dt>
              <dd>{booking.payerName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Desk</dt>
              <dd className="text-right">{desk.email}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-subtle">
            Show this at the hotel. Email the desk so they hold the room against this code.
            {meta.hotelNotifiedAt ? " Desk copy already sent from this device." : ""}
          </p>
        </Card>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href={mailto}>Email hotel desk</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/trips">Back to trips</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
