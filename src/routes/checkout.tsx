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
  ShakeSelect,
  SlidingTabs,
  Stagger,
  SuccessCheck,
  TextSwap,
} from "@/components/motion";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pushBanner } from "@/lib/banners";
import {
  brandLabel,
  cardBrand,
  cvcValid,
  digitsOnly,
  expiryValid,
  formatCardNumber,
  luhnValid,
} from "@/lib/card";
import {
  clearPending,
  formatMoney,
  getPackage,
  loadPending,
  priceWithSwaps,
  saveNext,
} from "@/lib/packages";
import {
  NET_BANKS,
  methodLabel,
  paymentLine,
  upiValid,
  type PayMethod,
} from "@/lib/pay";
import { createBooking } from "@/lib/server/bookings";

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
  const [method, setMethod] = useState<PayMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankId, setBankId] = useState("");
  const [bankPin, setBankPin] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    code: string;
    amount: number;
    name: string;
    method: string;
    line: string;
    ref: string | null;
  } | null>(null);

  useEffect(() => {
    const pending = loadPending();
    setPackageId(pending?.packageId ?? null);
    setSwaps(pending?.swaps ?? {});
    setReady(true);
  }, []);

  useEffect(() => {
    if (user?.displayName && !payerName) setPayerName(user.displayName);
  }, [user, payerName]);

  const pkg = packageId ? getPackage(packageId) : undefined;
  const perPerson = pkg ? priceWithSwaps(pkg, swaps) : 0;
  const total = perPerson * travelers;
  const brand = cardBrand(cardNumber);

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
          <Button asChild size="lg" className="mt-8">
            <Link to="/trips">View trips</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const onPay = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (payerName.trim().length < 2) next.payerName = "Name on the payment, please.";
    if (method === "card") {
      if (!luhnValid(cardNumber)) next.cardNumber = "That card number doesn’t check out.";
      if (!expiryValid(expiry)) next.expiry = "Use a future MM / YY.";
      if (!cvcValid(cvc, brand)) next.cvc = "Check the CVC.";
    } else if (method === "upi") {
      if (!upiValid(upiId)) next.upiId = "Use a UPI ID like name@okaxis.";
    } else {
      if (!bankId) next.bankId = "Choose a bank.";
      if (digitsOnly(bankPin).length !== 6) next.bankPin = "Enter the 6-digit PIN.";
    }
    if (Object.keys(next).length) {
      setErrors(next);
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const result = await createBooking({
        data: {
          packageId: pkg.id,
          swaps,
          travelers,
          checkIn,
          payerName: payerName.trim(),
          method,
          cardNumber: method === "card" ? digitsOnly(cardNumber) : undefined,
          expiry: method === "card" ? expiry : undefined,
          cvc: method === "card" ? digitsOnly(cvc) : undefined,
          upiId: method === "upi" ? upiId.trim() : undefined,
          bankId: method === "netbanking" ? bankId : undefined,
          bankPin: method === "netbanking" ? digitsOnly(bankPin) : undefined,
        },
      });
      if (!result.ok) {
        const field = result.field ?? "form";
        setErrors({ [field]: result.message });
        setShakeKey((k) => k + 1);
        pushBanner({ title: "Payment didn’t go through", body: result.message, tone: "danger" });
        setBusy(false);
        return;
      }
      const booking = result.booking;
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

  const hint =
    method === "card"
      ? "Try 4242 4242 4242 4242 · 4000 0000 0000 0002 declines."
      : method === "upi"
        ? "Try you@okaxis · fail@okaxis declines."
        : "PIN 123456 pays · 000000 declines.";

  return (
    <Shell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Stagger>
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-2 font-display text-4xl">Pay and hold this stay</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Lock className="size-3.5" />
              Sandbox checkout — no live charge. Card, UPI, or net banking.
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
              autoComplete="cc-name"
              onChange={(e) => {
                setPayerName(e.target.value);
                setErrors((er) => ({ ...er, payerName: "" }));
              }}
            />

            <div className="grid gap-3">
              <p className="text-sm font-medium">Payment method</p>
              <SlidingTabs
                fullWidth
                tabs={[
                  { id: "card", label: "Card" },
                  { id: "upi", label: "UPI" },
                  { id: "netbanking", label: "Net banking" },
                ]}
                value={method}
                onChange={(id) => {
                  setMethod(id);
                  setErrors({});
                }}
              />
            </div>

            {method === "card" ? (
              <>
                <ShakeField
                  label="Card number"
                  name="cardNumber"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  error={errors.cardNumber}
                  shakeKey={shakeKey}
                  onChange={(e) => {
                    setCardNumber(formatCardNumber(e.target.value));
                    setErrors((er) => ({ ...er, cardNumber: "" }));
                  }}
                />
                <div className="grid grid-cols-2 gap-4">
                  <ShakeField
                    label="Expiry"
                    placeholder="MM / YY"
                    autoComplete="cc-exp"
                    value={expiry}
                    error={errors.expiry}
                    shakeKey={shakeKey}
                    onChange={(e) => {
                      const d = digitsOnly(e.target.value).slice(0, 4);
                      setExpiry(d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d);
                      setErrors((er) => ({ ...er, expiry: "" }));
                    }}
                  />
                  <ShakeField
                    label="CVC"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvc}
                    error={errors.cvc}
                    shakeKey={shakeKey}
                    onChange={(e) => {
                      setCvc(digitsOnly(e.target.value).slice(0, 4));
                      setErrors((er) => ({ ...er, cvc: "" }));
                    }}
                  />
                </div>
              </>
            ) : null}

            {method === "upi" ? (
              <ShakeField
                label="UPI ID"
                name="upiId"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="name@okaxis"
                value={upiId}
                error={errors.upiId}
                shakeKey={shakeKey}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setErrors((er) => ({ ...er, upiId: "" }));
                }}
              />
            ) : null}

            {method === "netbanking" ? (
              <>
                <ShakeSelect
                  label="Bank"
                  value={bankId}
                  error={errors.bankId}
                  shakeKey={shakeKey}
                  onChange={(e) => {
                    setBankId(e.target.value);
                    setErrors((er) => ({ ...er, bankId: "" }));
                  }}
                >
                  <option value="">Choose your bank</option>
                  {NET_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </ShakeSelect>
                <ShakeField
                  label="Net-banking PIN"
                  name="bankPin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="6-digit PIN"
                  maxLength={6}
                  value={bankPin}
                  error={errors.bankPin}
                  shakeKey={shakeKey}
                  onChange={(e) => {
                    setBankPin(digitsOnly(e.target.value).slice(0, 6));
                    setErrors((er) => ({ ...er, bankPin: "" }));
                  }}
                />
              </>
            ) : null}

            {errors.form ? (
              <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {errors.form}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={busy} className="mt-2">
              <TextSwap
                shimmer={busy}
                text={busy ? "Processing" : `Pay ${formatMoney(total)}`}
              />
            </Button>
            <p className="text-xs text-subtle">{hint}</p>
            <p className="text-xs text-subtle">
              We never store the full card number, UPI secret, or PIN — only a
              masked handle, last four, bank name, and a payment reference.
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
                <dd>{methodLabel(method)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  <DigitPop value={formatMoney(total)} />
                </dd>
              </div>
            </dl>
            {method === "card" && digitsOnly(cardNumber).length >= 4 ? (
              <p className="mt-4 text-xs text-muted">
                {brandLabel(brand)} · {digitsOnly(cardNumber).slice(-4)}
              </p>
            ) : null}
            {method === "upi" && upiId.trim() ? (
              <p className="mt-4 text-xs text-muted">{upiId.trim().toLowerCase()}</p>
            ) : null}
            {method === "netbanking" && bankId ? (
              <p className="mt-4 text-xs text-muted">
                {NET_BANKS.find((b) => b.id === bankId)?.label}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
