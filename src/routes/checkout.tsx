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
  savePending,
  loadBrief,
  type PendingBooking,
} from "@/lib/packages";
import { addDays, checkInOnOrAfterToday, quoteStay, todayIso, travelersFitRoom } from "@/lib/inventory";
import { holdCartRoom } from "@/lib/soft-hold-client";
import { useStayInventory } from "@/lib/use-occupancy";
import { deskFor, hotelMailto } from "@/lib/hotel-desk";
import { refundPolicyFor } from "@/lib/refund-policy";
import { loadLocalProfile } from "@/lib/profile-local";
import { paymentLine } from "@/lib/pay";
import { track } from "@/lib/analytics";
import { pageHead } from "@/lib/page-title";
import { createBooking, type BookingRow } from "@/lib/server/bookings-browser";
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

export const Route = createFileRoute("/checkout")({ component: Checkout, head: () => pageHead("Checkout") });

/** Default check-in: tomorrow in India time (min date on the form is still today). */
function tomorrowIso() {
  return addDays(todayIso(), 1);
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
  /** Guests with a filled, valid traveller form. Checkout charges for exactly this many. */
  const [namedGuests, setNamedGuests] = useState(0);
  const [pendingBase, setPendingBase] = useState<PendingBooking | null>(null);
  const [holdNote, setHoldNote] = useState<string | null>(null);
  const [travel, setTravel] = useState<TravelPlan>(EMPTY_TRAVEL);
  const inventory = useStayInventory(packageId ?? undefined, checkIn, nights);
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
    setPendingBase(pending);
    if (pending?.checkIn) setCheckIn(checkInOnOrAfterToday(pending.checkIn));
    const b = loadBrief();
    if (pending?.packageId) setTravel(defaultTravelPlan(pending.packageId, b, pending.travel));
    try {
      // Pay for exactly the guests who have a filled form. A stale stored count must not
      // let checkout charge for 4 when only 1 traveller was named.
      const list = loadTravelers();
      const ok = list.length >= 1 && validateTravelers(list).ok;
      const stored = Number(window.localStorage.getItem("tripweave-traveler-count") || "0");
      const countMatches = !(stored >= 1) || stored === list.length;
      setNamedGuests(ok ? list.length : 0);
      if (list.length >= 1) setTravelers(list.length);
      setTravelersOk(ok && countMatches);
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
  const inventoryKnown = inventory === "ready";
  const quote = pkg
    ? quoteStay({
        packageId: pkg.id,
        roomId: room?.id,
        checkIn,
        nights: stayNights,
        swaps,
        inventoryKnown,
      })
    : null;
  const perPerson = quote?.perPerson ?? (pkg ? stayTotal(pkg, stayNights, room?.id, swaps) : 0);
  const occupancy = room?.occupancy ?? 8;
  const brief = loadBrief();
  const plan = { ...travel, arriveBy: brief.arriveBy, origin: brief.origin };
  const travelQuote = pkg ? quoteTravel(pkg.id, { ...brief, checkIn, nights: stayNights }, plan) : null;
  const pickupInr = pkg ? pickupChargeInr(pkg.id, plan) : 0;
  const stayDue = perPerson;
  const total = stayDue + pickupInr;
  const swapsForPay = writeMeta(swaps, {
    travel: plan,
    pickupInr,
    roomId: room?.id,
    guestEmail: user?.primaryEmail ?? undefined,
  });

  // Keep the cart in step with what the guest edits here, so Back / refresh / sign-in keep it.
  const persistCart = (patch: { checkIn?: string; travel?: TravelPlan }) => {
    if (!pendingBase || !pkg) return;
    const nextTravel = patch.travel ?? plan;
    const nextCheckIn = patch.checkIn ?? checkIn;
    const nextPickup = pickupChargeInr(pkg.id, nextTravel);
    const next: PendingBooking = {
      ...pendingBase,
      checkIn: nextCheckIn,
      travel: { ...nextTravel, origin: getOrigin(nextTravel.origin).id },
      swaps: writeMeta(pendingBase.swaps, { travel: nextTravel, pickupInr: nextPickup, roomId: room?.id }),
    };
    setPendingBase(next);
    savePending(next);
  };

  const finishPaid = (booking: BookingRow, stored: "supabase" | "local" = "local") => {
    saveWalletPass(bookingToWalletPayload(booking));
    clearSensitiveTravelers();
    clearPending();
    pushBanner({ title: `Booked · ${booking.confirmationCode}`, body: pkg?.name ?? booking.packageName, tone: "ok" });
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
    track("paid", { packageId: booking.packageId });
  };

  useEffect(() => {
    if (!pkg) return;
    track("checkout_opened", { packageId: pkg.id });
  }, [pkg?.id]);

  // Refresh (or move) the soft room hold for these dates while the guest is on Pay.
  const userId = user?.id;
  const holdRoomId = room?.id;
  useEffect(() => {
    if (!ready || !userId || !packageId || !travelersOk || confirmation) return;
    let cancelled = false;
    void holdCartRoom({ packageId, roomId: holdRoomId, checkIn, nights: stayNights }).then((result) => {
      if (cancelled || !result) return;
      setHoldNote(result.ok ? null : result.reason === "sold_out" ? result.message : null);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, userId, packageId, holdRoomId, checkIn, stayNights, travelersOk, confirmation]);

  if (!ready) return <CheckoutSkeleton />;

  if (!pkg) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-3xl">Nothing to check out</h1>
          <p className="mt-3 text-muted">Pick a stay first, then come back to pay.</p>
          <Button asChild className="mt-6"><Link to="/plan">Find a hotel</Link></Button>
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
            We need a name and ID details for every guest before Razorpay checkout.
            {namedGuests > 0 ? ` ${namedGuests} filled so far — check the guest count and forms.` : ""}
          </p>
          <Button asChild className="mt-6"><Link to="/travelers">Continue to travellers</Link></Button>
        </div>
      </Shell>
    );
  }

  if (confirmation && held) {
    const heldPlan = { ...plan, ...readMeta(held.swaps).travel };
    const heldQuote = quoteTravel(held.packageId, { ...brief, checkIn, nights: stayNights }, heldPlan);
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
          <h1 className="mt-6 font-display text-4xl">Payment received</h1>
          <p className="mt-3 text-muted">{confirmation.name} — awaiting hotel confirmation. Your code is</p>
          <p className="mt-4 font-display text-3xl tabular-nums tracking-wide"><DigitPop value={confirmation.code} /></p>
          <p className="mt-2 text-sm text-muted">
            Charged <DigitPop value={formatMoney(confirmation.amount)} />. Paid via Razorpay · UPI/card
            {confirmation.line ? ` · ${confirmation.line}` : ""}. The hotel desk still confirms the room.
          </p>
          {confirmation.ref ? <p className="mt-1 text-xs text-subtle">Ref {confirmation.ref}</p> : null}
          <div className="mt-8 w-full text-left"><AddToWallet booking={held} /></div>
          <Card className="mt-6 w-full space-y-3 p-4 text-left shadow-none">
            <p className="eyebrow">Travel</p>
            <p className="text-sm">{travelText}</p>
            <TravelShareButtons hotelName={held.packageName} quote={heldQuote} plan={heldPlan} confirmationCode={held.confirmationCode} checkIn={held.checkIn} guests={held.travelers} emailHref={mailto} />
          </Card>
          <div className="mt-6 flex w-full flex-col gap-3">
            <Button asChild variant="outline"><Link to="/voucher/$code" params={{ code: confirmation.code }}>Open desk voucher</Link></Button>
            <Button asChild variant="outline"><a href={`/api/invoice/${encodeURIComponent(confirmation.code)}`}>GST invoice PDF</a></Button>
            <Button asChild variant="outline"><Link to="/trips">View trips</Link></Button>
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
    if (travelers !== namedGuests || travelers < 1) {
      setErrors({ form: `Add details for every guest. ${namedGuests} of ${travelers} traveller forms are filled.` });
      setShakeKey((k) => k + 1);
      return;
    }
    if (room && !travelersFitRoom(room.occupancy, travelers)) {
      setErrors({ form: `This room sleeps ${room.occupancy}.` });
      setShakeKey((k) => k + 1);
      return;
    }
    if (inventory === "failed" || quote?.unknown) {
      setErrors({ checkIn: "Couldn't check rooms for these dates. Try again." });
      setShakeKey((k) => k + 1);
      return;
    }
    if (quote && !quote.released) {
      setErrors({ checkIn: "The hotel has not released these nights yet." });
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
          kind: "stay",
          packageId: pkg.id,
          swaps: swapsForPay,
          travelers,
          checkIn,
          nights: stayNights,
          roomId: room?.id,
          receipt: `tw_${pkg.id}_${Date.now()}`.slice(0, 40),
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
        setErrors({ form: "Razorpay key missing. Set RAZORPAY_KEY_ID on Vercel and redeploy." });
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
            prefill: { name: payerName.trim(), email: user?.primaryEmail ?? undefined },
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
                  // Keep DOB / ID drafts so the guest (or desk) can retry without re-typing.
                  setErrors({ form: result.message });
                  pushBanner({ title: "Payment received, booking not saved", body: result.message, tone: "danger" });
                  setBusy(false);
                  resolve();
                  return;
                }
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
                        bookingId: result.booking.id,
                        checkIn: result.booking.checkIn,
                        nights: stayNights,
                      },
                    });
                  }
                } catch {
                  /* booking already saved */
                }
                finishPaid(result.booking, result.stored);
                resolve();
              } catch (err) {
                const raw = err instanceof Error ? err.message : "Booking failed";
                if (raw === "Unauthorized") {
                  saveNext("/checkout");
                  window.location.assign("/login?next=%2Fcheckout");
                  resolve();
                  return;
                }
                setErrors({ form: raw });
                setBusy(false);
                resolve();
              }
            },
            modal: {
              ondismiss: () => {
                setBusy(false);
                pushBanner({ title: "Payment cancelled", body: "You closed Razorpay before completing payment.", tone: "info" });
                resolve();
              },
            },
          },
          (failure) => {
            // Failed / declined payment: keep traveller drafts for the retry.
            setBusy(false);
            const msg = failure?.error?.description || failure?.error?.reason || "Payment failed. Try again.";
            setErrors({ form: msg });
            setShakeKey((k) => k + 1);
            resolve();
          },
        );
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      if (message === "Unauthorized") {
        saveNext("/checkout");
        window.location.assign("/login?next=%2Fcheckout");
        return;
      }
      setErrors({ form: message });
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
              {isRazorpayTestMode() ? "Secure payment via Razorpay (test mode)." : "Secure payment via Razorpay."}
            </p>
          </Stagger>
          <form className="mt-8 grid gap-4" noValidate onSubmit={onPay}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ShakeField label="Check-in" type="date" value={checkIn} min={todayIso()} error={errors.checkIn} shakeKey={shakeKey} onChange={(e) => { const v = e.target.value; setCheckIn(v); setErrors((er) => ({ ...er, checkIn: "" })); if (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayIso()) persistCart({ checkIn: v }); }} />
              <div className="grid gap-1.5">
                <Label>Travelers</Label>
                <div className="flex h-10 items-center justify-between rounded-md border border-border bg-elevated px-3 text-sm">
                  <span className="tabular-nums">{travelers} {travelers === 1 ? "guest" : "guests"}{travelers > occupancy ? ` · room sleeps ${occupancy}` : ""}</span>
                  <Link to="/travelers" className="text-xs font-medium text-primary underline">Edit guests</Link>
                </div>
              </div>
            </div>
            <ShakeField label="Payer name" name="payerName" value={payerName} error={errors.payerName} shakeKey={shakeKey} autoComplete="name" onChange={(e) => { setPayerName(e.target.value); setErrors((er) => ({ ...er, payerName: "" })); }} />
            {travelQuote?.pickup.available ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Airport pickup and drop</p>
                  <p className="text-xs text-muted">Ask the hotel to send a car from Bhubaneswar airport and back. The hotel bills it. TripWeave does not add it.</p>
                </div>
                <MotionToggle on={plan.includePickup} onChange={(v) => { const next = { ...plan, includePickup: v }; setTravel(next); persistCart({ travel: next }); }} label="Hotel pickup" />
              </div>
            ) : null}
            {holdNote ? <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{holdNote}</p> : null}
            {errors.form ? <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{errors.form}</p> : null}
            <p className="rounded-md border border-border bg-elevated px-3 py-2 text-xs text-muted">
              Refund window before you pay: {refundPolicyFor(checkIn).label}. My trips uses this same rule after you pay.
            </p>
            <Button type="submit" size="lg" disabled={busy || inventory !== "ready" || (quote != null && !quote.available)} className="mt-2">
              <TextSwap shimmer={busy} text={busy ? "Opening Razorpay…" : inventory === "loading" ? "Checking rooms…" : inventory === "failed" || quote?.unknown ? "Couldn't check rooms" : quote && !quote.released ? "Nights not released" : quote && !quote.available ? "Sold out for these nights" : `Pay ${formatMoney(total)} with Razorpay`} />
            </Button>
          </form>
        </div>
        <Card className="h-fit overflow-hidden">
          <img src={pkg.image} alt="" className="h-40 w-full object-cover" />
          <div className="p-5">
            <h2 className="font-display text-xl">{pkg.name}</h2>
            <p className="mt-1 text-sm text-muted">{nightsPhrase(stayNights)} · {room?.name ?? "Room"} · {pkg.neighborhood}</p>
            <dl className="mt-5 grid gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Room · {nightsPhrase(stayNights)}</dt><dd className="tabular-nums"><DigitPop value={formatMoney(stayDue)} /></dd></div>
              <p className="text-xs text-muted">
                {room ? `${formatMoney(Math.round(stayDue / Math.max(stayNights, 1)))} / night for ${room.name} (sleeps ${room.occupancy}). ` : ""}
                One room price — guest count does not multiply it. Taxes included at checkout
                {deskFor(pkg.id).gstin ? ` · GSTIN ${deskFor(pkg.id).gstin}` : " · GST as billed by the hotel"}.
              </p>
              {pickupInr > 0 ? (
                <div className="flex justify-between"><dt className="text-muted">Hotel pickup estimate</dt><dd className="tabular-nums"><DigitPop value={formatMoney(pickupInr)} /></dd></div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-2 font-medium"><dt>Total</dt><dd className="tabular-nums"><DigitPop value={formatMoney(total)} /></dd></div>
            </dl>
            {inventory === "failed" || quote?.unknown ? (
              <p className="mt-3 text-sm text-danger">Couldn't check rooms for these dates.</p>
            ) : quote && !quote.released ? (
              <p className="mt-3 text-sm text-muted">The hotel has not released these nights yet.</p>
            ) : quote && !quote.available ? (
              <p className="mt-3 text-sm text-danger">Sold out for these nights.</p>
            ) : null}
            <p className="mt-2 text-xs text-subtle">From {getOrigin(brief.origin)?.label ?? brief.origin}</p>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
