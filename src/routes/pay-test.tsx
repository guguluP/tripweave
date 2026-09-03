import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RequireAuth } from "@/components/require-auth";
import { pushBanner } from "@/lib/banners";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/server/razorpay";
import {
  getPublicRazorpayKeyId,
  loadRazorpayScript,
  openRazorpayCheckout,
} from "@/lib/razorpay-client";

export const Route = createFileRoute("/pay-test")({ component: PayTest });

function PayTest() {
  return (
    <RequireAuth next="/pay-test" fallback={<Shell><p className="p-10 text-muted">Loading…</p></Shell>}>
      <PayTestInner />
    </RequireAuth>
  );
}

function PayTestInner() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onPay = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Could not load Razorpay Checkout script.");
        setBusy(false);
        return;
      }

      const order = await createRazorpayOrder({
        data: {
          amountInr: 1,
          receipt: `test_${Date.now()}`.slice(0, 40),
          notes: { purpose: "razorpay_activation_test" },
        },
      });
      if (!order.ok) {
        setError(order.message);
        setBusy(false);
        return;
      }

      const key = order.keyId || getPublicRazorpayKeyId();
      if (!key) {
        setError("Missing Razorpay key. Set RAZORPAY_KEY_ID / VITE_RAZORPAY_KEY_ID on Vercel.");
        setBusy(false);
        return;
      }

      openRazorpayCheckout(
        {
          key,
          amount: order.amount,
          currency: order.currency,
          name: "TripWeave",
          description: "Razorpay test payment (₹1)",
          order_id: order.orderId,
          theme: { color: "#1e5853" },
          handler: async (response) => {
            try {
              const verified = await verifyRazorpayPayment({
                data: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });
              if (!verified.ok) {
                setError(verified.message);
                setBusy(false);
                return;
              }
              const msg = `Success · payment ${response.razorpay_payment_id}`;
              setResult(msg);
              pushBanner({ title: "Test payment complete", body: msg, tone: "ok" });
              setBusy(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Verify failed");
              setBusy(false);
            }
          },
          modal: {
            ondismiss: () => {
              setBusy(false);
              setError("Payment cancelled.");
            },
          },
        },
        (failure) => {
          setBusy(false);
          setError(failure?.error?.description || failure?.error?.reason || "Payment failed");
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="eyebrow">Razorpay</p>
        <h1 className="mt-2 font-display text-3xl">Test payment</h1>
        <p className="mt-3 text-sm text-muted">
          Charges <strong>₹1</strong> in test mode so Razorpay can detect a completed
          transaction. Use their test card or test UPI.
        </p>
        <Card className="mt-8 space-y-4 p-5 shadow-none">
          <ul className="space-y-1 text-sm text-muted">
            <li>Card: <code>4100 2800 0000 1007</code></li>
            <li>CVV: <code>123</code> · Expiry: <code>12/26</code></li>
            <li>UPI: <code>test@razorpay</code></li>
          </ul>
          <Button type="button" size="lg" className="w-full" disabled={busy} onClick={onPay}>
            {busy ? "Opening Razorpay…" : "Pay ₹1 with Razorpay"}
          </Button>
          {error ? (
            <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          {result ? (
            <p className="rounded-md border border-ok/30 bg-ok/5 px-3 py-2 text-sm text-ok">
              {result}
            </p>
          ) : null}
        </Card>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Back home
          </Link>
        </p>
      </div>
    </Shell>
  );
}
