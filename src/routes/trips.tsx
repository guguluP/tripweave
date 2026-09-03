import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, LearnMore, Stagger, TextSwap } from "@/components/motion";
import { pushBanner } from "@/lib/banners";
import { formatMoney, getPackage } from "@/lib/packages";
import { paymentLine } from "@/lib/pay";
import {
  cancelBooking,
  listBookings,
  type BookingRow,
} from "@/lib/server/bookings";
import { cancelDemoBooking, listDemoBookings } from "@/lib/demo-bookings";
import { isDemoMode } from "@/lib/auth/use-current-user";
import { AddToWalletButton } from "@/components/add-to-wallet";

export const Route = createFileRoute("/trips")({ component: Trips });

function TripsSkeleton() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-6 h-32 w-full rounded-xl" />
      </div>
    </Shell>
  );
}

function Trips() {
  return (
    <RequireAuth next="/trips" fallback={<TripsSkeleton />}>
      <TripsInner />
    </RequireAuth>
  );
}

function TripsInner() {
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const refresh = () => {
    if (isDemoMode()) {
      setBookings(listDemoBookings());
      return;
    }
    listBookings()
      .then(setBookings)
      .catch(() => setBookings([]));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Stagger>
          <p className="eyebrow">My trips</p>
          <h1 className="mt-2 font-display text-4xl">Bookings</h1>
        </Stagger>
        {bookings === null ? (
          <Skeleton className="mt-8 h-32 w-full rounded-xl" />
        ) : bookings.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-elevated p-8">
            <p className="text-muted">No bookings yet. Find a Puri hotel and pay to hold it.</p>
            <LearnMore to="/plan" className="mt-5 text-sm font-medium text-primary">
              Find my hotel
            </LearnMore>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {bookings.map((b) => {
              const pkg = getPackage(b.packageId);
              const cancelled = b.status === "cancelled";
              return (
                <Card key={b.id} className="overflow-hidden shadow-none">
                  <div className="grid sm:grid-cols-[9rem_1fr]">
                    {pkg ? (
                      <img src={pkg.image} alt="" className="h-36 w-full object-cover sm:h-full" />
                    ) : (
                      <div className="bg-surface" />
                    )}
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-display text-xl">{b.packageName}</h2>
                          <p className="mt-1 text-sm text-muted">
                            Check-in {b.checkIn} · {b.travelers} traveler
                            {b.travelers === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Badge className={cancelled ? "text-danger" : "text-ok"}>
                          {cancelled ? "Cancelled" : "Paid"}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium tabular-nums">
                          <DigitPop value={formatMoney(b.amountInr)} />
                        </span>
                        <span className="text-muted">
                          {" "}
                          · {b.confirmationCode} · {paymentLine(b)}
                        </span>
                      </p>
                      {b.paymentRef ? (
                        <p className="text-xs text-subtle">Ref {b.paymentRef}</p>
                      ) : null}
                      {!cancelled ? (
                        <div className="flex flex-col gap-2">
                          <AddToWalletButton booking={b} />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancelling === b.id}
                            onClick={async () => {
                              setCancelling(b.id);
                              try {
                                if (isDemoMode()) {
                                  cancelDemoBooking(b.id);
                                } else {
                                  await cancelBooking({ data: b.id });
                                }
                                pushBanner({
                                  title: "Stay cancelled",
                                  body: b.packageName,
                                  tone: "info",
                                });
                                refresh();
                              } catch {
                                pushBanner({
                                  title: "Could not cancel",
                                  tone: "danger",
                                });
                              } finally {
                                setCancelling(null);
                              }
                            }}
                          >
                            <TextSwap
                              text={cancelling === b.id ? "Cancelling" : "Cancel stay"}
                              shimmer={cancelling === b.id}
                            />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
