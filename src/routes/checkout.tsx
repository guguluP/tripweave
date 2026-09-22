import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Shell } from "@/components/shell";
import { AddToWallet } from "@/components/wallet-pass";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DigitPop,
  MotionToggle,
  ShakeField,
  Stagger,
  SuccessCheck,
  TextSwap,
} from "@/components/motion";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pushBanner } from "@/lib/banners";
import {
  clampNights,
  clearPending,
  formatMoney,
  getPackage,
  getRoom,
  loadPending,
  nightsPhrase,
  stayTotal,
  saveNext,
  loadBrief,
} from "@/lib/packages";
import { quoteStay, travelersFitRoom } from "@/lib/inventory";
import { usePaidHolds } from "@/lib/use-occupancy";
import { hotelMailto } from "@/lib/hotel-desk";
import { refundPolicyFor } from "@/lib/refund-policy";
import { loadLocalProfile } from "@/lib/profile-local";
import { methodLabel, paymentLine } from "@/lib/pay";
import { createBooking, type BookingRow } from "@/lib/server/bookings";

import { bookingToWalletPayload } from "@/lib/apple-wallet";
import { saveWalletPass } from "@/lib/wallet-store";
import { createRazorpayOrder } from "@/lib/server/razorpay";
import { loadTravelers, validateTravelers, clearSensitiveTravelers } from "@/lib/travelers";
import { saveTravellers } from "@/lib/server/travellers";
import {
  getPublicRazorpayKeyId,
  isRazorpayTestMode,
  loadRazorpayScript,
  openRazorpayCheckout,
} from "@/lib/razorpay-client";
import { getJourney } from "@/lib/transport";
import { getOrigin } from "@/lib/origins";
import { writeMeta, readMeta } from "@/lib/booking-meta";
import {
  defaultTravelPlan,
  EMPTY_TRAVEL,
  formatInrRange,
  pickupChargeInr,
  quoteTravel,
  travelShareText,
  travelSummaryLine,
  type TravelPlan,
} from "@/lib/travel-plan";
import { TravelShareButtons } from "@/components/travel-planner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function CheckoutSkeleton() {
  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-8 h-80 w-full rounded-xl" />
      </div>
    </Shell>
  );
}

function Checkout() {
  return (
    <RequireAuth next="/checkout" fallback={<CheckoutSkeleton />}>
      <CheckoutInner />
    </RequireAuth>
  );
}

function CheckoutInner() {
  const { user } = useCurrentUserState();
  usePaidHolds();
  const [ready, setReady] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [nights, setNights] = useState(1);
  const [roomId, setRoomId] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [checkIn, setCheckIn] = useState(tomorrowIso);
  const [payerName, setPayerName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [travelersOk, setTravelersOk] = useState(false);
  const [travel, setTravel] = useState<TravelPlan>(EMPTY_TRAVEL);
  const [held, setHeld] = useState<BookingRow | null>(null);
  const [confirmation, setConfirmation] = useState<{
    code: string;
    amount: number;
    name: string;
    method: string;
    line: string;
    ref: string | null;
    stored: "supabase" | "local";
  } | null>(null);

  useEffect(() => {
    const pending = loadPending();
    setPackageId(pending?.packageId ?? null);
    setSwaps(pending?.swaps ?? {});
    setNights(pending?.nights ?? 1);
    setRoomId(pending?.roomId ?? "");
    if (pending?.checkIn) setCheckIn(pending.checkIn);
    const b = loadBrief();
    if (pending?.packageId) {
      setTravel(defaultTravelPlan(pending.packageId, b, pending.travel));
    }
    try {
      const n = Number(window.localStorage.getItem("tripweave-traveler-count") || "0");
      if (n >= 1 && n <= 8) setTravelers(n);
      else {
        const list = loadTravelers();
        if (list.length >= 1) setTravelers(list.length);
      }
    } catch {
      /* ignore */
    }
    try {
      const list = loadTravelers();
      setTravelersOk(validateTravelers(list).ok && list.length >= 1);
    } catch {
      setTravelersOk(false);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (user?.displayName && !payerName) setPayerName(user.displayName);
    const local = loadLocalProfile();
    if (local?.displayName && !payerName) setPayerName(local.displayName);
  }, [user, payerName]);

  const pkg = packageId ? getPackage(packageId) : undefined;
  const room = pkg ? getRoom(pkg, roomId) : undefined;
  const stayNights = pkg ? clampNights(pkg, nights) : nights;
  const quote = pkg
    ? quoteStay({
        packageId: pkg.id,
        roomId: room?.id,
        checkIn,
        nights: stayNights,
        swaps,
      })
    : null;
  const perPerson = quote?.perPerson ?? (pkg ? stayTotal(pkg, stayNights, room?.id, swaps) : 0);
  const occupancy = room?.occupancy ?? 8;
  const brief = loadBrief();
  const journey = pkg ? getJourney(pkg.id, brief.origin, brief.arriveBy) : null;
  const plan = {
    ...travel,
    arriveBy: brief.arriveBy,
    origin: brief.origin,
  };
  const travelQuote = pkg ? quoteTravel(pkg.id, brief, plan) : null;
  const pickupInr = pkg ? pickupChargeInr(pkg.id, plan) : 0;
  const stayDue = perPerson * travelers;
  const total = stayDue + pickupInr;
  const swapsForPay = writeMeta(swaps, { travel: plan, pickupInr, roomId: room?.id });

  const finishPaid = (booking: BookingRow, stored: "supabase" | "local" = "local") => {
    saveWalletPass(bookingToWalletPayload(booking));
    clearSensitiveTravelers();
    clearPending();
    pushBanner({
      title: `Booked · ${booking.confirmationCode}`,
      body: pkg?.name ?? booking.packageName,
      tone: "ok",
    });
    setHeld(booking);
    setConfirmation({
      code: booking.confirmationCode,
      amount: booking.amountInr,
      name: pkg?.name ?? booking.packageName,
      method: booking.paymentMethod,
      line: paymentLine(booking),
      ref: booking.paymentRef,
      stored,
    });
    setBusy(false);
  };

  if (!ready) return <CheckoutSkeleton />;

  if (!pkg) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-3xl">Nothing to check out</h1>
          <p className="mt-3 text-muted">Pick a stay first, then come back to pay.</p>
          <Button asChild className="mt-6">
            <Link to="/plan">Find a hotel</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (!travelersOk) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-3xl">Add traveller details</h1>
          <p className="mt-3 text-muted">
            We need guest names and ID details before Razorpay checkout.
          </p>
          <Button asChild className="mt-6">
            <Link to="/travelers">Continue to travellers</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (confirmation && held) {
    const heldPlan = {
      ...plan,
      ...readMeta(held.swaps).travel,
    };
    const heldQuote = quoteTravel(held.packageId, brief, heldPlan);
    const travelText = travelSummaryLine(heldQuote, heldPlan);
    const mailto = hotelMailto({
      packageId: held.packageId,
      packageName: held.packageName,
      confirmationCode: held.confirmationCode,
      checkIn: held.checkIn,
      nights: held.nights,
      travelers: held.travelers,
      payerName: held.payerName,
      amountInr: held.amountInr,
      travelSummary: travelShareText({
        confirmationCode: held.confirmationCode,
        hotelName: held.packageName,
        checkIn: held.checkIn,
        quote: heldQuote,
        plan: heldPlan,
        guests: held.travelers,
      }),
    });
    return (
      <Shell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
          <SuccessCheck />
          <h1 className="mt-6 font-display text-4xl">Booking confirmed</h1>
          <p className="mt-3 text-muted">
            {confirmation.name} is booked. Your confirmation code is
          </p>
          <p className="mt-4 font-display text-3xl tabular-nums tracking-wide">
            <DigitPop value={confirmation.code} />
          </p>
          <p className="mt-2 text-sm text-muted">
            Charged <DigitPop value={formatMoney(confirmation.amount)} /> via{" "}
            {methodLabel(confirmation.method).toLowerCase()}
            {confirmation.line ? ` · ${confirmation.line}` : ""}.
          </p>
          {confirmation.ref ? (
            <p className="mt-1 text-xs text-subtle">Ref {confirmation.ref}</p>
          ) : null}
          <p className="mt-3 text-xs text-subtle">
            {confirmation.stored === "supabase"
              ? "Saved to your TripWeave account — it will show up on any device you sign in from."
              : "Saved on this device. Sign-in bookings sync to the cloud once the live site keys are connected."}
          </p>
          <div className="mt-8 w-full text-left">
            <AddToWallet booking={held} />
          </div>
          <Card className="mt-6 w-full space-y-3 p-4 text-left shadow-none">
            <p className="eyebrow">Travel</p>
            <p className="text-sm">{travelText}</p>
            {heldPlan.carrierRef ? (
              <p className="text-xs text-muted">Carrier {heldPlan.carrierRef}</p>
            ) : null}
            <iframe
              title="Last-mile map"
              src={heldQuote.mapEmbedUrl}
              className="h-40 w-full rounded-md border border-border"
              loading="lazy"
            />
            <TravelShareButtons
              hotelName={held.packageName}
              quote={heldQuote}
              plan={heldPlan}
              confirmationCode={held.confirmationCode}
              checkIn={held.checkIn}
              guests={held.travelers}
              emailHref={mailto}
            />
          </Card>
          <div className="mt-6 flex w-full flex-col gap-3">
            <Button asChild variant="outline">
              <Link to="/voucher/$code" params={{ code: confirmation.code }}>
                Open desk voucher
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/trips">View trips</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  const onPay = async (e: FormEvent) => {
    e.preventDefault();
    if (payerName.trim().length < 2) {
      setErrors({ payerName: "Name on the payment, please." });
      setShakeKey((k) => k + 1);
      return;
    }
    if (room && !travelersFitRoom(room.occupancy, travelers)) {
      setErrors({ form: `This room sleeps ${room.occupancy}.` });
      setShakeKey((k) => k + 1);
      return;
    }
    if (quote && !quote.available) {
      setErrors({ checkIn: "Those nights are sold out. Pick another date." });
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
    setBusy(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setErrors({ form: "Could not load Razorpay Checkout. Check your network." });
        setShakeKey((k) => k + 1);
        setBusy(false);
        return;
      }

      const order = await createRazorpayOrder({
        data: {
          amountInr: total,
          receipt: `tw_${pkg.id}_${Date.now()}`.slice(0, 40),
          notes: {
            packageId: pkg.id,
            travelers: String(travelers),
            checkIn,
            pickupInr: String(pickupInr),
          },
        },
      });
      if (!order.ok) {
        setErrors({ form: order.message });
        setShakeKey((k) => k + 1);
        pushBanner({ title: "Could not start payment", body: order.message, tone: "danger" });
        setBusy(false);
        return;
      }

      const key = order.keyId || getPublicRazorpayKeyId();
      if (!key) {
        setErrors({
          form: "Razorpay key missing. Set RAZORPAY_KEY_ID on Vercel and redeploy.",
        });
        setBusy(false);
        return;
      }

      await new Promise<void>((resolve) => {
        openRazorpayCheckout(
          {
            key,
            amount: order.amount,
            currency: order.currency,
            name: "TripWeave",
            description: pkg.name,
            order_id: order.orderId,
            prefill: {
              name: payerName.trim(),
              email: user?.primaryEmail ?? undefined,
            },
            notes: { packageId: pkg.id, pickupInr: String(pickupInr) },
            theme: { color: "#1e5853" },
            handler: async (response) => {
              try {
                const result = await createBooking({
                  data: {
                    packageId: pkg.id,
                    swaps: swapsForPay,
                    travelers,
                    checkIn,
                    nights: stayNights,
                    roomId: room?.id,
                    payerName: payerName.trim(),
                    method: "razorpay",
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                });
                if (!result.ok) {
                  setErrors({ form: result.message });
                  pushBanner({ title: "Payment received, booking not saved", body: result.message, tone: "danger" });
                  setBusy(false);
                  resolve();
                  return;
                }
                const booking = result.booking;
                const stored = result.stored;
                try {
                  const guests = loadTravelers();
                  if (guests.length) {
                    await saveTravellers({
                      data: {
                        travelers: guests.map((g) => ({
                          fullName: g.fullName,
                          phone: g.phone,
                          email: g.email,
                          nationality: g.nationality,
                          idType: g.idType,
                          idNumber: g.idNumber,
                          emergencyName: g.emergencyName,
                          emergencyPhone: g.emergencyPhone,
                          digiYatra: g.digiYatra,
                        })),
                        bookingId: booking.id,
                        checkIn: booking.checkIn,
                        nights: stayNights,
                      },
                    });
                  }
                } catch {
                  /* booking already saved */
                }
                finishPaid(booking, stored);
                resolve();
              } catch (err) {
                const raw = err instanceof Error ? err.message : "Booking failed";
                if (raw === "Unauthorized") {
                  saveNext("/checkout");
                  window.location.assign("/login");
                  resolve();
                  return;
                }
                setErrors({ form: raw });
                pushBanner({
                  title: "Payment received, booking not saved",
                  body: raw,
                  tone: "danger",
                });
                setBusy(false);
                resolve();
              }
            },
            modal: {
              ondismiss: () => {
                setBusy(false);
                pushBanner({
                  title: "Payment cancelled",
                  body: "You closed Razorpay before completing payment.",
                  tone: "info",
                });
                resolve();
              },
            },
          },
          (failure) => {
            setBusy(false);
            const msg =
              failure?.error?.description ||
              failure?.error?.reason ||
              "Payment failed. Try again.";
            setErrors({ form: msg });
            setShakeKey((k) => k + 1);
            pushBanner({ title: "Payment failed", body: msg, tone: "danger" });
            resolve();
          },
        );
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      if (message === "Unauthorized") {
        saveNext("/checkout");
        window.location.assign("/login");
        return;
      }
      const shown = /password authentication failed|28P01/i.test(message)
        ? "Could not confirm the stay after payment. Check My trips — the booking may already be saved."
        : message;
      setErrors({ form: shown });
      setShakeKey((k) => k + 1);
      pushBanner({ title: "Payment didn’t go through", body: shown, tone: "danger" });
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Stagger>
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-2 font-display text-4xl">Pay and confirm this stay</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Lock className="size-3.5" />
              {isRazorpayTestMode()
                ? "Secure payment via Razorpay (test mode)."
                : "Secure payment via Razorpay."}
            </p>
          </Stagger>

          <form className="mt-8 grid gap-4" noValidate onSubmit={onPay}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ShakeField
                label="Check-in"
                type="date"
                value={checkIn}
                min={new Date().toISOString().slice(0, 10)}
                error={errors.checkIn}
                shakeKey={shakeKey}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  setErrors((er) => ({ ...er, checkIn: "" }));
                }}
              />
              <ShakeField
                label="Travelers"
                type="number"
                min={1}
                max={occupancy}
                value={travelers}
                onChange={(e) =>
                  setTravelers(Math.min(occupancy, Math.max(1, Number(e.target.value) || 1)))
                }
              />
            </div>
            <ShakeField
              label="Payer name"
              name="payerName"
              value={payerName}
              error={errors.payerName}
              shakeKey={shakeKey}
              autoComplete="name"
              onChange={(e) => {
                setPayerName(e.target.value);
                setErrors((er) => ({ ...er, payerName: "" }));
              }}
            />

            {travelQuote?.pickup.available ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {travelQuote.pickup.included
                      ? "Ask hotel to send the included transfer"
                      : `Add hotel pickup · ${formatInrRange(travelQuote.pickup.price, travelQuote.pickup.price)}`}
                  </p>
                  <p className="text-xs text-muted">
                    {travelQuote.pickup.included
                      ? "No extra charge — we’ll include your flight or train number in the desk email."
                      : "Added to this Razorpay total. One car, not per guest."}
                  </p>
                </div>
                <MotionToggle
                  on={plan.includePickup}
                  onChange={(v) => setTravel({ ...plan, includePickup: v })}
                  label="Hotel pickup"
                />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="checkout-carrier">Flight / train / bus number</Label>
                <Input
                  id="checkout-carrier"
                  value={plan.carrierRef}
                  placeholder="6E 123 / Puri Exp"
                  autoComplete="off"
                  onChange={(e) => setTravel({ ...plan, carrierRef: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="checkout-eta">Arrival time</Label>
                <Input
                  id="checkout-eta"
                  type="time"
                  value={plan.arrivalTime}
                  onChange={(e) => setTravel({ ...plan, arrivalTime: e.target.value })}
                />
              </div>
            </div>

            {errors.form ? (
              <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {errors.form}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={busy || (quote != null && !quote.available)} className="mt-2">
              <TextSwap
                shimmer={busy}
                text={
                  busy
                    ? "Opening Razorpay…"
                    : quote && !quote.available
                      ? "Sold out for these nights"
                      : `Pay ${formatMoney(total)} with Razorpay`
                }
              />
            </Button>
            <p className="text-xs text-subtle">
              This room sleeps {occupancy}. {refundPolicyFor(checkIn).label}.
            </p>
            {quote ? (
              <p className="text-xs text-subtle">
                {quote.available
                  ? `${quote.remaining} of ${quote.units} rooms left for these nights.`
                  : "Pick another date — leftover inventory is sold out."}
              </p>
            ) : null}
            {isRazorpayTestMode() ? (
              <p className="text-xs text-subtle">
                Test card 4100 2800 0000 1007 · CVV 123 · 12/26 · or UPI test@razorpay
              </p>
            ) : null}
          </form>
        </div>

        <Card className="h-fit overflow-hidden">
          <img src={pkg.image} alt="" className="h-40 w-full object-cover" />
          <div className="p-5">
            <h2 className="font-display text-xl">{pkg.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {nightsPhrase(stayNights)} · {room?.name ?? "Room"} · {pkg.neighborhood}
            </p>
            {travelQuote ? (
              <p className="mt-2 text-xs text-subtle">
                {getOrigin(brief.origin).label} · {travelQuote.costLine}
              </p>
            ) : journey ? (
              <p className="mt-2 text-xs text-subtle">
                {getOrigin(brief.origin).label} · {journey.inbound.label}
              </p>
            ) : null}
            <dl className="mt-5 grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Stay</dt>
                <dd className="tabular-nums">
                  <DigitPop value={formatMoney(stayDue)} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Travelers</dt>
                <dd className="tabular-nums">
                  <DigitPop value={travelers} />
                </dd>
              </div>
              {pickupInr > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Hotel pickup</dt>
                  <dd className="tabular-nums">
                    <DigitPop value={formatMoney(pickupInr)} />
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">Method</dt>
                <dd>Razorpay</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  <DigitPop value={formatMoney(total)} />
                </dd>
              </div>
            </dl>
            {quote ? (
              <ul className="mt-4 grid gap-1 text-xs text-muted">
                {quote.nightsQuoted.map((n) => (
                  <li key={n.date} className="flex justify-between gap-3">
                    <span>
                      {n.date} · {n.label}
                    </span>
                    <span className="tabular-nums">
                      {n.remaining <= 0 ? "Sold out" : `${formatMoney(n.rate)} · ${n.remaining} left`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
