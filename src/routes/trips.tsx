import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AddToWallet } from "@/components/wallet-pass";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, LearnMore, Stagger, TextSwap } from "@/components/motion";
import { pushBanner } from "@/lib/banners";
import { DEFAULT_BRIEF, formatMoney, getPackage, loadBrief, nightsPhrase } from "@/lib/packages";
import { paymentLine } from "@/lib/pay";
import { cancelBooking, listBookings, type BookingRow } from "@/lib/server/bookings";

import { getPersistStatus } from "@/lib/supabase/status";
import { hotelMailto } from "@/lib/hotel-desk";
import { readMeta } from "@/lib/booking-meta";
import {
  parseTravelPlan,
  quoteTravel,
  travelShareText,
  travelSummaryLine,
  whatsappShareHref,
} from "@/lib/travel-plan";
import type { OriginId } from "@/lib/origins";
import {
  isClosedStay,
  refundAmountInr,
  refundPolicyFor,
  stayStatusLabel,
} from "@/lib/refund-policy";

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
  const [cloud, setCloud] = useState<boolean | null>(null);

  const refresh = () => {
    listBookings()
      .then((rows) => setBookings(rows))
      .catch(() => setBookings([]));
  };

  useEffect(() => {
    refresh();
    getPersistStatus()
      .then((s) => setCloud(s.cloud))
      .catch(() => setCloud(false));
  }, []);

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Stagger>
          <p className="eyebrow">My trips</p>
          <h1 className="mt-2 font-display text-4xl">Bookings</h1>
          {cloud === true ? (
            <p className="mt-2 text-sm text-muted">Synced to your TripWeave account.</p>
          ) : cloud === false ? (
            <p className="mt-2 text-sm text-muted">Shown from this device until cloud save is connected.</p>
          ) : null}
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
              const closed = isClosedStay(b.status);
              const policy = refundPolicyFor(b.checkIn);
              const refundInr = refundAmountInr(b.amountInr, b.checkIn);
              const meta = readMeta(b.swaps);
              const refundedAmount = meta.refundAmount ?? (b.status === "refunded" ? refundInr : 0);
              const brief = typeof window === "undefined" ? DEFAULT_BRIEF : loadBrief();
              const plan = parseTravelPlan(meta.travel);
              const travelQuote = quoteTravel(b.packageId, {
                ...brief,
                origin: (plan.origin as OriginId) || brief.origin,
                arriveBy: plan.arriveBy || brief.arriveBy,
              }, plan);
              const travelLine = plan.lastMileId ? travelSummaryLine(travelQuote, plan) : null;
              const travelBody = travelShareText({
                confirmationCode: b.confirmationCode,
                hotelName: b.packageName,
                checkIn: b.checkIn,
                quote: travelQuote,
                plan,
                guests: b.travelers,
              });
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
                            Check-in {b.checkIn} · {nightsPhrase(b.nights)} · {b.travelers} traveler
                            {b.travelers === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Badge className={closed ? "text-danger" : "text-ok"}>
                          {stayStatusLabel(b.status)}
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
                      {travelLine ? <p className="text-xs text-muted">{travelLine}</p> : null}
                      {closed && refundedAmount > 0 ? (
                        <p className="text-xs text-muted">
                          Refund {formatMoney(refundedAmount)} to the original payment.
                        </p>
                      ) : null}
                      {!closed ? (
                        <div className="grid gap-3">
                          <p className="text-xs text-subtle">{policy.label}.</p>
                          <AddToWallet booking={b} compact />
                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm">
                              <a
                                href={hotelMailto({
                                  packageId: b.packageId,
                                  packageName: b.packageName,
                                  confirmationCode: b.confirmationCode,
                                  checkIn: b.checkIn,
                                  nights: b.nights,
                                  travelers: b.travelers,
                                  payerName: b.payerName,
                                  amountInr: b.amountInr,
                                  travelSummary: travelBody,
                                })}
                              >
                                Email hotel desk
                              </a>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <a href={whatsappShareHref(travelBody)} target="_blank" rel="noreferrer">
                                Share travel
                              </a>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link to="/voucher/$code" params={{ code: b.confirmationCode }}>
                                Desk voucher
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={cancelling === b.id || policy.fraction <= 0}
                              onClick={async () => {
                                setCancelling(b.id);
                                try {
                                  const remote = await cancelBooking({ data: b.id });
                                  if (!remote.ok) {
                                    pushBanner({
                                      title: "Could not refund",
                                      body: remote.message,
                                      tone: "danger",
                                    });
                                    refresh();
                                    return;
                                  }
                                  pushBanner({
                                    title: "Stay refunded",
                                    body: remote.message,
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
                                text={
                                  cancelling === b.id
                                    ? "Refunding"
                                    : policy.fraction <= 0
                                      ? "Past check-in"
                                      : `Cancel & refund ${formatMoney(refundInr)}`
                                }
                                shimmer={cancelling === b.id}
                              />
                            </Button>
                          </div>
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
