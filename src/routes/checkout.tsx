import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DigitPop,
  ShakeField,
  Stagger,
  SuccessCheck,
  TextSwap,
} from "@/components/motion";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pushBanner } from "@/lib/banners";
import {
  clearPending,
  formatMoney,
  getPackage,
  loadPending,
  priceWithSwaps,
  saveNext,
} from "@/lib/packages";
import { methodLabel, paymentLine } from "@/lib/pay";
import { createBooking } from "@/lib/server/bookings";
import { saveDemoBooking } from "@/lib/demo-bookings";
import { createRazorpayOrder } from "@/lib/server/razorpay";
import { loadTravelers, validateTravelers } from "@/lib/travelers";
import {
  getPublicRazorpayKeyId,
  loadRazorpayScript,
  openRazorpayCheckout,
} from "@/lib/razorpay-client";
import { AddToWalletButton } from "@/components/add-to-wallet";

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
  const [ready, setReady] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [travelers, setTravelers] = useState(2);
  const [checkIn, setCheckIn] = useState(tomorrowIso);
  const [payerName, setPayerName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [travelersOk, setTravelersOk] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    code: string;
    amount: number;
    name: string;
    method: string;
    line: string;
    ref: string | null;
    packageId: string;
    nights: number;
    travelers: number;
    payerName: string;
    checkIn: string;
  } | null>(null);

  useEffect(() => {
    const pending = loadPending();
    setPackageId(pending?.packageId ?? null);
    setSwaps(pending?.swaps ?? {});
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
  }, [user, payerName]);

  const pkg = packageId ? getPackage(packageId) : undefined;
  const perPerson = pkg ? priceWithSwaps(pkg, swaps) : 0;
  const total = perPerson * travelers;

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

  if (confirmation) {
    return (
      <Shell>
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
          <SuccessCheck />
          <h1 className="mt-6 font-display text-4xl">Stay held</h1>
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
          <div className="mt-8 flex flex-col items-center gap-3">
            <AddToWalletButton
              booking={{
                confirmationCode: confirmation.code,
                packageName: confirmation.name,
                packageId: confirmation.packageId,
                checkIn: confirmation.checkIn,
                nights: confirmation.nights,
                travelers: confirmation.travelers,
                payerName: confirmation.payerName,
                amountInr: confirmation.amount,
                paymentRef: confirmation.ref,
                status: "confirmed",
              }}
            />
            <Button asChild size="lg" variant="outline">
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
            notes: { packageId: pkg.id },
            theme: { color: "#1e5853" },
            handler: async (response) => {
              try {
                const result = await createBooking({
                  data: {
                    packageId: pkg.id,
                    swaps,
                    travelers,
                    checkIn,
                    payerName: payerName.trim(),
                    method: "razorpay",
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                });
                if (!result.ok) {
                  setErrors({ form: result.message });
                  setShakeKey((k) => k + 1);
                  pushBanner({
                    title: "Payment received, booking failed",
                    body: result.message,
                    tone: "danger",
                  });
                  setBusy(false);
                  resolve();
                  return;
                }
                const booking = result.booking;
                saveDemoBooking(booking);
                clearPending();
                pushBanner({
                  title: `Booked · ${booking.confirmationCode}`,
                  body: pkg.name,
                  tone: "ok",
                });
                setConfirmation({
                  code: booking.confirmationCode,
                  amount: booking.amountInr,
                  name: pkg.name,
                  method: booking.paymentMethod,
                  line: paymentLine(booking),
                  ref: booking.paymentRef,
                  packageId: pkg.id,
                  nights: pkg.nights,
                  travelers,
                  payerName: payerName.trim(),
                  checkIn,
                });
                setBusy(false);
                resolve();
              } catch (err) {
                const message = err instanceof Error ? err.message : "Booking failed";
                setErrors({ form: message });
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
      setErrors({ form: message });
      setShakeKey((k) => k + 1);
      pushBanner({ title: "Payment didn’t go through", body: message, tone: "danger" });
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Stagger>
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-2 font-display text-4xl">Pay and hold this stay</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Lock className="size-3.5" />
              Secure payment via Razorpay. Test mode: use Razorpay test cards / UPI.
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
                max={8}
                value={travelers}
                onChange={(e) =>
                  setTravelers(Math.min(8, Math.max(1, Number(e.target.value) || 1)))
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

            {errors.form ? (
              <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {errors.form}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={busy} className="mt-2">
              <TextSwap
                shimmer={busy}
                text={busy ? "Opening Razorpay…" : `Pay ${formatMoney(total)} with Razorpay`}
              />
            </Button>
            <p className="text-xs text-subtle">
              Test card 4100 2800 0000 1007 · CVV 123 · 12/26 · or UPI test@razorpay
            </p>
          </form>
        </div>

        <Card className="h-fit overflow-hidden">
          <img src={pkg.image} alt="" className="h-40 w-full object-cover" />
          <div className="p-5">
            <h2 className="font-display text-xl">{pkg.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {pkg.nights} nights · {pkg.neighborhood}
            </p>
            <dl className="mt-5 grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Per person</dt>
                <dd className="tabular-nums">
                  <DigitPop value={formatMoney(perPerson)} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Travelers</dt>
                <dd className="tabular-nums">
                  <DigitPop value={travelers} />
                </dd>
              </div>
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
          </div>
        </Card>
      </div>
    </Shell>
  );
}
