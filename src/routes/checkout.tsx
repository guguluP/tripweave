import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitPop, MotionToggle, ShakeField, Stagger, TextSwap } from "@/components/motion";
import { ArrivalChecklist } from "@/components/arrival-checklist";
import { GuestForms, useGuestForms } from "@/components/guest-forms";
import { DigilockerFlow } from "@/components/digilocker-flow";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pushBanner } from "@/lib/banners";
import {
  clearPending,
  formatMoney,
  getPackage,
  getRoom,
  loadPending,
  nightsPhrase,
  saveNext,
  savePending,
  loadBrief,
  type PendingBooking,
} from "@/lib/packages";
import { quoteStay, travelersFitRoom } from "@/lib/inventory";
import { holdCartRoom } from "@/lib/soft-hold-client";
import { useStayInventory } from "@/lib/use-occupancy";
import { deskFor } from "@/lib/hotel-desk";
import { refundPolicyFor } from "@/lib/refund-policy";
import { track } from "@/lib/analytics";
import { pageHead } from "@/lib/page-title";
import { createBooking, type BookingRow } from "@/lib/server/bookings-browser";
import { createRazorpayOrder } from "@/lib/server/razorpay";
import { isAcceptablePhone } from "@/lib/phone";
import { saveGuestArrivals } from "@/lib/server/guest-arrivals";
import { clearSensitiveTravelers, DIGIYATRA_LABELS, type DigiYatraStatus, type Traveler } from "@/lib/travelers";
import {
  getPublicRazorpayKeyId,
  isRazorpayTestMode,
  loadRazorpayScript,
  openRazorpayCheckout,
} from "@/lib/razorpay-client";
import { getOrigin } from "@/lib/origins";
import { writeMeta } from "@/lib/booking-meta";
import {
  defaultTravelPlan,
  EMPTY_TRAVEL,
  hotelCarRateCopy,
  quoteTravel,
  type TravelPlan,
} from "@/lib/travel-plan";
import { formatCheckInLabel } from "@/components/stay-quote";
import { checkoutReady } from "@/lib/checkout-ready";
import { checkoutEmptyState } from "@/lib/checkout-empty";
import { focusFirstError } from "@/lib/focus-first-error";
import { DIGILOCKER_STATUS, devToolsEnabled, showDigiLocker } from "@/lib/digilocker";
import { getJourney } from "@/lib/transport";
import { cn } from "@/lib/utils";

const LAST_BOOKING_KEY = "tw-last-booking";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => pageHead("Guests & pay"),
  validateSearch: (s: Record<string, unknown>): { digilocker?: string } => ({
    digilocker: s.digilocker === "sample" ? "sample" : undefined,
  }),
});

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

function guestPayError(message: string): { text: string; operator: boolean } {
  if (/KEY_ID|KEY_SECRET|not configured|Vercel|RAZORPAY_KEY/i.test(message)) {
    return { text: "Payments are temporarily unavailable", operator: true };
  }
  return { text: message, operator: false };
}

function Checkout() {
  return (
    <RequireAuth next="/checkout" fallback={<CheckoutSkeleton />}>
      <CheckoutInner />
    </RequireAuth>
  );
}

function CheckoutInner() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const { user } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  const [emptyKind, setEmptyKind] = useState<"form" | "empty" | "redirect">("form");
  const [pendingBase, setPendingBase] = useState<PendingBooking | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [nights, setNights] = useState(1);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [travel, setTravel] = useState<TravelPlan>(EMPTY_TRAVEL);
  const [payerOther, setPayerOther] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [holdNote, setHoldNote] = useState<string | null>(null);
  const [holdTone, setHoldTone] = useState<"ok" | "danger">("ok");
  const [digiGuest, setDigiGuest] = useState<number | null>(null);
  const [devTools, setDevTools] = useState(false);
  const [digiOpen, setDigiOpen] = useState(false);

  const pkgForPolicy = packageId ? getPackage(packageId) : undefined;
  const policy = pkgForPolicy ? (deskFor(pkgForPolicy.id).guestDetails ?? "lead_only") : "lead_only";
  const forms = useGuestForms(pendingBase, policy, user);

  useEffect(() => {
    try {
      setDevTools(devToolsEnabled(window.localStorage.getItem("tw-dev-tools")));
    } catch {
      setDevTools(false);
    }
    const pending = loadPending();
    let last = "";
    try {
      last = window.sessionStorage.getItem(LAST_BOOKING_KEY) ?? "";
    } catch {
      last = "";
    }
    const decision = checkoutEmptyState({ pending: Boolean(pending?.packageId), lastBooking: last });
    if (decision.kind === "redirect") {
      setEmptyKind("redirect");
      setReady(true);
      void nav({ to: "/voucher/$code", params: { code: decision.code }, replace: true });
      return;
    }
    if (decision.kind === "empty" || !pending) {
      setEmptyKind("empty");
      setReady(true);
      return;
    }
    setPendingBase(pending);
    setPackageId(pending.packageId);
    setSwaps(pending.swaps ?? {});
    setNights(pending.nights);
    setRoomId(pending.roomId);
    setCheckIn(pending.checkIn ?? "");
    const brief = loadBrief();
    setTravel(defaultTravelPlan(pending.packageId, brief, pending.travel));
    setEmptyKind("form");
    setReady(true);
  }, [nav]);

  const pkg = packageId ? getPackage(packageId) : undefined;
  const room = pkg ? getRoom(pkg, roomId) : undefined;
  const inventory = useStayInventory(pkg?.id, checkIn, nights);
  const inventoryKnown = inventory === "ready";
  const quote = pkg && checkIn
    ? quoteStay({
        packageId: pkg.id,
        roomId: room?.id,
        checkIn,
        nights,
        swaps,
        inventoryKnown,
      })
    : null;
  const stayDue = quote?.perPerson ?? 0;
  const total = stayDue;
  const brief = loadBrief();
  const plan = { ...travel, arriveBy: brief.arriveBy, origin: brief.origin };
  const travelQuote = pkg ? quoteTravel(pkg.id, { ...brief, checkIn, nights }, plan) : null;
  const journey = pkg ? getJourney(pkg.id, brief.origin, brief.arriveBy) : null;
  const leadName = forms.list[0]?.fullName?.trim() ?? "";
  const payingName = payerOther ? payerName : leadName || payerName;
  const digiOn = showDigiLocker(DIGILOCKER_STATUS, { sample: search.digilocker === "sample", devTools });

  useEffect(() => {
    if (!payerOther && leadName && payerName !== leadName) setPayerName(leadName);
  }, [leadName, payerOther, payerName]);

  useEffect(() => {
    if (pkg) track("checkout_opened", { packageId: pkg.id });
  }, [pkg?.id]);

  const userId = user?.id;
  const holdRoomId = room?.id;
  useEffect(() => {
    if (!ready || emptyKind !== "form" || !userId || !packageId || !checkIn) return;
    let cancelled = false;
    void holdCartRoom({ packageId, roomId: holdRoomId, checkIn, nights }).then((result) => {
      if (cancelled || !result) return;
      if (result.ok) {
        const until = new Date(result.expiresAt).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        });
        setHoldTone("ok");
        setHoldNote(`Room held until ${until} IST`);
      } else if (result.reason === "sold_out") {
        setHoldTone("danger");
        setHoldNote(result.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, emptyKind, userId, packageId, holdRoomId, checkIn, nights]);

  const persistTravel = (next: TravelPlan) => {
    if (!pendingBase || !pkg) return;
    const merged = { ...next, arriveBy: brief.arriveBy, origin: brief.origin };
    setTravel(merged);
    const saved: PendingBooking = {
      ...pendingBase,
      travel: { ...merged, origin: getOrigin(merged.origin).id },
      swaps: writeMeta(pendingBase.swaps, { travel: merged, roomId: room?.id }),
      travelers: forms.count || pendingBase.travelers,
      adults: pendingBase.adults,
      children: pendingBase.children,
    };
    setPendingBase(saved);
    savePending(saved);
  };

  const applyDigi = (index: number, filled: Traveler) => {
    forms.update(index, {
      ...filled,
      role: index === 0 ? "lead" : "companion",
      identitySource: DIGILOCKER_STATUS.live ? filled.identitySource : "digilocker_demo",
      specialRequests: forms.list[index]?.specialRequests ?? "",
      emergencyName: forms.list[index]?.emergencyName ?? "",
      emergencyPhone: forms.list[index]?.emergencyPhone ?? "",
      digiYatra: forms.list[index]?.digiYatra ?? "not_started",
      ageBand: forms.list[index]?.ageBand,
    });
  };

  if (!ready) return <CheckoutSkeleton />;

  if (emptyKind === "redirect") {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-3xl">Opening your voucher…</h1>
        </div>
      </Shell>
    );
  }

  if (emptyKind === "empty" || !pkg || !checkIn) {
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

  if (!forms.ready || forms.list.length === 0) return <CheckoutSkeleton />;

  const guestNationalities = [
    ...new Set(forms.list.map((guest) => (guest.nationality || "IN").trim().toUpperCase()).filter(Boolean)),
  ].slice(0, 12);
  const anyForeign = guestNationalities.some((code) => code !== "IN");
  const leadIsIndian = (forms.list[0]?.nationality || "IN").toUpperCase() === "IN";
  const swapsForPay = writeMeta(swaps, {
    travel: plan,
    roomId: room?.id,
    guestEmail: user?.primaryEmail ?? undefined,
    guestNationalities,
  });

  const onPay = async (e: FormEvent) => {
    e.preventDefault();
    const guestResult = forms.validate();
    const block = checkoutReady({
      pending: { packageId: pkg.id, checkIn, travelers: forms.count, roomId: room?.id },
      guests: forms.list,
      policy,
      inventory: {
        known: inventory === "ready",
        failed: inventory === "failed" || Boolean(quote?.unknown),
        released: quote ? quote.released !== false : undefined,
        available: quote ? quote.available : undefined,
        occupancy: room?.occupancy,
      },
      payerName: payingName,
    });
    if (block || !guestResult.ok) {
      const message = block?.message || "Check guest details.";
      const ids = guestResult.fields?.map((field) => field.id) ?? [];
      if (block?.fieldId) ids.push(block.fieldId);
      setFormError(message);
      forms.setShakeKey((k) => k + 1);
      focusFirstError(ids);
      return;
    }
    if (room && !travelersFitRoom(room.occupancy, forms.count)) {
      setFormError(`This room sleeps ${room.occupancy}.`);
      focusFirstError(["room"]);
      return;
    }
    setFormError("");
    setBusy(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setFormError("Could not load Razorpay Checkout. Check your network.");
        setBusy(false);
        return;
      }
      const order = await createRazorpayOrder({
        data: {
          kind: "stay",
          packageId: pkg.id,
          swaps: swapsForPay,
          travelers: forms.count,
          checkIn,
          nights,
          roomId: room?.id,
          receipt: `tw_${pkg.id}_${Date.now()}`.slice(0, 40),
        },
      });
      if (!order.ok) {
        const pay = guestPayError(order.message);
        if (pay.operator) console.error("[pay]", order.message);
        setFormError(pay.text);
        if (!pay.operator) pushBanner({ title: "Could not start payment", body: pay.text, tone: "danger" });
        setBusy(false);
        return;
      }
      const key = order.keyId || getPublicRazorpayKeyId();
      if (!key) {
        console.error("[pay] Razorpay key missing (KEY_ID).");
        setFormError("Payments are temporarily unavailable");
        setBusy(false);
        return;
      }
      const leadPhone = forms.list[0]?.phone?.trim() ?? "";
      const contact = leadPhone.startsWith("+") && isAcceptablePhone(leadPhone) ? leadPhone : undefined;
      const guestPayload = forms.list.map((g) => ({
        fullName: g.fullName,
        phone: g.phone,
        email: g.email,
        dateOfBirth: g.dateOfBirth,
        nationality: g.nationality,
        idType: g.idType,
        idNumber: g.idNumber,
        emergencyName: g.emergencyName,
        emergencyPhone: g.emergencyPhone,
        digiYatra: g.digiYatra,
        role: g.role,
        ageBand: g.ageBand,
        isLead: g.role === "lead",
      }));
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
              name: payingName.trim(),
              email: user?.primaryEmail ?? forms.list[0]?.email,
              ...(contact ? { contact } : {}),
            },
            notes: { packageId: pkg.id },
            theme: { color: "#1e5853" },
            handler: async (response) => {
              try {
                const result = await createBooking({
                  data: {
                    packageId: pkg.id,
                    swaps: swapsForPay,
                    travelers: forms.count,
                    checkIn,
                    nights,
                    roomId: room?.id,
                    payerName: payingName.trim(),
                    method: "razorpay",
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    guests: guestPayload,
                  },
                });
                if (result.ok && anyForeign) {
                  const rows = forms.list
                    .map((guest, guestIndex) => ({ guest, guestIndex }))
                    .filter(({ guest }) => (guest.nationality || "IN").toUpperCase() !== "IN")
                    .map(({ guest, guestIndex }) => ({
                      guestIndex,
                      arrivedFrom: guest.arrivedFrom ?? "",
                      arrivalTime: guest.arrivalTime ?? "",
                      purpose: guest.arrivalPurpose || "",
                      previousStay: guest.previousStay ?? "",
                      nextDestination: guest.nextDestination ?? "",
                    }));
                  if (rows.length > 0 && result.booking.id) {
                    try {
                      await saveGuestArrivals({
                        data: { bookingId: result.booking.id, checkIn, nights, rows },
                      });
                    } catch {
                      /* arrival details are optional */
                    }
                  }
                }
                if (!result.ok) {
                  setFormError(result.message);
                  pushBanner({ title: "Payment received, booking not saved", body: result.message, tone: "danger" });
                  setBusy(false);
                  resolve();
                  return;
                }
                finishPaid(result.booking);
                resolve();
              } catch (err) {
                const raw = err instanceof Error ? err.message : "Booking failed";
                if (raw === "Unauthorized") {
                  saveNext("/checkout");
                  window.location.assign("/login?next=%2Fcheckout");
                  resolve();
                  return;
                }
                setFormError(raw);
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
            setBusy(false);
            const msg = failure?.error?.description || failure?.error?.reason || "Payment failed. Try again.";
            setFormError(msg);
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
      const pay = guestPayError(message);
      if (pay.operator) console.error("[pay]", message);
      setFormError(pay.text);
      setBusy(false);
    }
  };

  function finishPaid(booking: BookingRow) {
    clearSensitiveTravelers();
    clearPending();
    try {
      window.sessionStorage.setItem(LAST_BOOKING_KEY, booking.confirmationCode);
    } catch {
      /* ignore */
    }
    track("paid", { packageId: booking.packageId });
    void nav({
      to: "/voucher/$code",
      params: { code: booking.confirmationCode },
      search: { new: "1" },
      replace: true,
    });
  }

  const who = brief.children > 0
    ? `${brief.adults} ${brief.adults === 1 ? "adult" : "adults"} · ${brief.children} ${brief.children === 1 ? "child" : "children"}`
    : `${forms.count} ${forms.count === 1 ? "guest" : "guests"}`;

  return (
    <Shell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Stagger>
            <ol className="flex items-center gap-2 text-xs font-medium text-subtle">
              <li className="text-muted">Stay</li>
              <li aria-hidden className="h-px w-6 bg-border" />
              <li className="text-primary">Guests & pay</li>
              <li aria-hidden className="h-px w-6 bg-border" />
              <li>Done</li>
            </ol>
            <p className="eyebrow mt-6">Checkout</p>
            <h1 className="mt-2 font-display text-4xl">Guests & pay</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Lock className="size-3.5" />
              {isRazorpayTestMode() ? "Secure payment via Razorpay (test mode)." : "Secure payment via Razorpay."}
            </p>
          </Stagger>

          <Card className="mt-6 p-4 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl">{pkg.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatCheckInLabel(checkIn)} · {nightsPhrase(nights)} · {room?.name ?? "Room"} · {who}
                </p>
              </div>
              <Link to="/trip/$id" params={{ id: pkg.id }} className="shrink-0 text-sm font-medium text-primary underline">
                Change
              </Link>
            </div>
          </Card>

          {holdNote ? (
            <p
              className={
                holdTone === "danger"
                  ? "mt-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
                  : "mt-4 rounded-md border border-border bg-elevated px-3 py-2 text-xs text-muted"
              }
              role="status"
            >
              {holdNote}
            </p>
          ) : null}

          <form className="mt-6 grid gap-4" noValidate onSubmit={onPay}>
            <GuestForms
              list={forms.list}
              errors={forms.errors}
              shakeKey={forms.shakeKey}
              policy={policy}
              showDigiLocker={digiOn}
              checkIn={checkIn}
              onUpdate={forms.update}
              onOpenDigi={setDigiGuest}
            />

            {digiOn && leadIsIndian ? (
              <div>
                <button type="button" className="text-sm font-medium underline" onClick={() => setDigiOpen((open) => !open)}>
                  Use DigiLocker (optional)
                </button>
                {digiOpen ? (
                  <p className="mt-2 text-xs text-muted">
                    Sample only. It fills the form and is not stored as a verified guest. {DIGILOCKER_STATUS.reason}
                  </p>
                ) : null}
                {digiOpen ? (
                  <Button type="button" variant="outline" className="mt-3" onClick={() => setDigiGuest(0)}>
                    Sample DigiLocker
                  </Button>
                ) : null}
              </div>
            ) : null}

            {anyForeign ? (
              <ArrivalChecklist
                nationalities={forms.list.map((guest) => guest.nationality)}
                oci={forms.list.map((guest) => Boolean(guest.oci))}
                priorIndianVisa={forms.list.map((guest) => Boolean(guest.priorIndianVisa))}
                arrivalAirport="BBI"
                checkIn={checkIn}
              />
            ) : journey?.showDigiYatra ? (
              <div className="rounded-lg border border-border bg-elevated px-4 py-3">
                <p className="text-sm font-medium">Airport e-gates (DigiYatra)</p>
                <p className="mt-1 text-xs text-muted">
                  Optional note for the lead guest only. Not sent to DigiYatra or the hotel.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(DIGIYATRA_LABELS) as DigiYatraStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        "min-h-11 rounded-md border px-3 text-xs font-medium",
                        (forms.list[0]?.digiYatra ?? "not_started") === status
                          ? "border-primary/40 bg-primary/5 text-fg"
                          : "border-border bg-surface text-muted",
                      )}
                      onClick={() => forms.update(0, { digiYatra: status })}
                    >
                      {DIGIYATRA_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <button
                type="button"
                className="text-sm font-medium underline"
                onClick={() => {
                  setPayerOther((open) => !open);
                  if (!payerOther) setPayerName(leadName);
                }}
              >
                Paying for someone else?
              </button>
              {payerOther ? (
                <div className="mt-3">
                  <ShakeField
                    label="Payer name"
                    fieldId="payerName"
                    name="payerName"
                    value={payerName}
                    error={formError && payingName.trim().length < 2 ? "Name on the payment, please." : undefined}
                    shakeKey={forms.shakeKey}
                    autoComplete="name"
                    onChange={(e) => setPayerName(e.target.value)}
                  />
                </div>
              ) : null}
            </div>

            {travelQuote?.pickup.available ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Ask the hotel for an airport car</p>
                  <p className="text-xs text-muted">{hotelCarRateCopy(travelQuote.pickup)}</p>
                </div>
                <MotionToggle
                  on={plan.includePickup}
                  onChange={(v) => persistTravel({ ...plan, includePickup: v })}
                  label="Hotel pickup"
                />
              </div>
            ) : null}

            <p className="rounded-md border border-border bg-elevated px-3 py-2 text-xs text-muted">
              Refund window before you pay: {refundPolicyFor(checkIn).label}. My trips uses this same rule after you pay.
            </p>
            {formError ? (
              <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
                {formError}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              disabled={busy || inventory === "loading"}
              className="mt-2"
            >
              <TextSwap
                shimmer={busy}
                text={
                  busy
                    ? "Opening Razorpay…"
                    : inventory === "loading"
                      ? "Checking rooms…"
                      : `Pay ${formatMoney(total)} with Razorpay`
                }
              />
            </Button>
          </form>
        </div>

        <Card className="h-fit overflow-hidden">
          <img src={pkg.image} alt="" className="h-40 w-full object-cover" />
          <div className="p-5">
            <h2 className="font-display text-xl">{pkg.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {nightsPhrase(nights)} · {room?.name ?? "Room"} · {pkg.neighborhood}
            </p>
            <dl className="mt-5 grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Room · {nightsPhrase(nights)}</dt>
                <dd className="tabular-nums">
                  <DigitPop value={formatMoney(stayDue)} />
                </dd>
              </div>
              <p className="text-xs text-muted">
                {room ? `${formatMoney(Math.round(stayDue / Math.max(nights, 1)))} / night for ${room.name} (sleeps ${room.occupancy}). ` : ""}
                One room price — guest count does not multiply it. Taxes included at checkout
                {deskFor(pkg.id).gstin ? ` · GSTIN ${deskFor(pkg.id).gstin}` : " · GST as billed by the hotel"}.
              </p>
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  <DigitPop value={formatMoney(total)} />
                </dd>
              </div>
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

      {digiGuest !== null && digiOn ? (
        <DigilockerFlow
          guestIndex={digiGuest}
          guestLabel={`guest ${digiGuest + 1}`}
          onClose={() => setDigiGuest(null)}
          onApply={(filled) => {
            applyDigi(digiGuest, filled);
            setDigiGuest(null);
          }}
        />
      ) : null}
    </Shell>
  );
}
