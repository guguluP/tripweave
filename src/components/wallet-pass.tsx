import { useEffect, useState } from "react";
import { CalendarPlus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pushBanner } from "@/lib/banners";
import type { BookingRow } from "@/lib/server/bookings";
import {
  bookingToWalletPayload,
  buildBookingIcs,
  buildOfflinePassHtml,
  downloadTextFile,
  type WalletPassPayload,
} from "@/lib/apple-wallet";
import { formatMoney } from "@/lib/packages";
import { saveWalletPass, listWalletPasses } from "@/lib/wallet-store";
import { useAppleDevice } from "@/lib/apple-device";
import { walletSigningReady } from "@/lib/server/wallet-status";
import { cn } from "@/lib/utils";

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 12.86c-.03-2.45 2-3.63 2.09-3.69-1.14-1.67-2.91-1.9-3.54-1.92-1.51-.15-2.94.89-3.71.89-.76 0-1.95-.87-3.2-.84-1.65.02-3.16.96-4.01 2.43-1.71 2.96-.44 7.35 1.23 9.75.82 1.17 1.79 2.49 3.07 2.44 1.23-.05 1.7-.8 3.19-.8 1.49 0 1.91.8 3.21.77 1.33-.02 2.17-1.19 2.98-2.37.94-1.37 1.32-2.7 1.34-2.77-.03-.01-2.57-.98-2.6-3.9zM14.7 6.4c.68-.82 1.13-1.96 1.01-3.1-1.07.04-2.16.72-2.86 1.54-.62.72-1.17 1.88-1.02 2.99 1.17.09 2.18-.59 2.87-1.43z"
      />
    </svg>
  );
}

export function WalletPassCard({ payload }: { payload: WalletPassPayload }) {
  const checkOut = addDays(payload.checkIn, payload.nights);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(payload.confirmationCode)}`;
  return (
    <div className="overflow-hidden rounded-2xl bg-primary text-primary-fg shadow-soft">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary-fg/70">
            TripWeave · stay
          </p>
          <h3 className="mt-1 font-display text-xl leading-tight">{payload.packageName}</h3>
          <p className="mt-1 text-xs text-primary-fg/70">
            {payload.neighborhood}, {payload.destination}
          </p>
        </div>
        <WalletCards className="size-5 text-primary-fg/80" />
      </div>
      {payload.travelLine ? (
        <p className="mt-4 px-5 text-xs text-primary-fg/80">{payload.travelLine}</p>
      ) : null}
      <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4 px-5 pb-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-primary-fg/60">Check-in</p>
            <p className="mt-0.5 tabular-nums">{payload.checkIn}</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-primary-fg/60">Check-out</p>
            <p className="mt-0.5 tabular-nums">{checkOut}</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-primary-fg/60">Guests</p>
            <p className="mt-0.5 tabular-nums">{payload.travelers}</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-primary-fg/60">Paid</p>
            <p className="mt-0.5 tabular-nums">{formatMoney(payload.amountInr)}</p>
          </div>
        </div>
        <img
          src={qrUrl}
          alt={`QR ${payload.confirmationCode}`}
          width={88}
          height={88}
          className="rounded-md bg-elevated p-1"
        />
      </div>
      <div className="flex items-center justify-between border-t border-primary-fg/15 px-5 py-3">
        <p className="font-display text-lg tracking-[0.12em]">{payload.confirmationCode}</p>
        <p className="text-xs text-primary-fg/70">{payload.payerName}</p>
      </div>
    </div>
  );
}

type BookingLike = Pick<
  BookingRow,
  | "confirmationCode"
  | "packageName"
  | "packageId"
  | "checkIn"
  | "nights"
  | "travelers"
  | "payerName"
  | "amountInr"
  | "paymentRef"
  | "status"
> & { swaps?: Record<string, string> };

export function AddToWallet({
  booking,
  className,
  compact = false,
}: {
  booking: BookingLike;
  className?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const apple = useAppleDevice();
  const [walletReady, setWalletReady] = useState(false);
  const payload = bookingToWalletPayload(booking as BookingRow);
  useEffect(() => {
    if (!apple) return;
    walletSigningReady().then(setWalletReady).catch(() => setWalletReady(false));
  }, [apple]);

  const persist = () => saveWalletPass(payload);

  const saveOffline = () => {
    persist();
    downloadTextFile(
      `tripweave-${payload.confirmationCode}.html`,
      buildOfflinePassHtml(payload),
      "text/html;charset=utf-8",
    );
    pushBanner({
      title: "Pass saved",
      body: "Stored in your TripWeave wallet. Open the HTML on iPhone for offline check-in.",
      tone: "ok",
    });
  };

  const saveCalendar = () => {
    persist();
    downloadTextFile(
      `tripweave-${payload.confirmationCode}.ics`,
      buildBookingIcs(payload),
      "text/calendar;charset=utf-8",
    );
    pushBanner({ title: "Calendar event saved", tone: "ok" });
  };

  const onAppleWallet = async () => {
    setBusy(true);
    persist();
    try {
      const res = await fetch("/api/wallet-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationCode: payload.confirmationCode,
          packageName: payload.packageName,
          packageId: payload.packageId,
          checkIn: payload.checkIn,
          nights: payload.nights,
          travelers: payload.travelers,
          payerName: payload.payerName,
          amountInr: payload.amountInr,
          paymentRef: payload.paymentRef,
          status: payload.status,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/vnd.apple.pkpass")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tripweave-${payload.confirmationCode}.pkpass`;
        a.rel = "noopener";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        pushBanner({
          title: "Apple Wallet",
          body: "Open the pass on your iPhone to add it to Wallet.",
          tone: "ok",
        });
        return;
      }

      let message =
        "Signed .pkpass needs an Apple Pass Type ID certificate. Saving a Wallet-ready pass card instead.";
      try {
        const data = (await res.json()) as { message?: string };
        if (data.message) message = data.message;
      } catch {
        /* ignore */
      }

      const html = buildOfflinePassHtml(payload);
      const file = new File([html], `tripweave-${payload.confirmationCode}.html`, {
        type: "text/html",
      });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: `TripWeave · ${payload.confirmationCode}`,
            text: `${payload.packageName} · ${payload.checkIn}`,
          });
          pushBanner({ title: "Pass shared", body: message, tone: "ok" });
          return;
        } catch {
          /* user cancelled share — fall through to download */
        }
      }

      pushBanner({ title: "Pass card ready", body: message, tone: "info" });
      saveOffline();
    } catch {
      pushBanner({
        title: "Saving a pass card",
        body: "Apple Wallet signing is not configured. Download the offline pass instead.",
        tone: "info",
      });
      saveOffline();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      {compact ? (
        <div className="mb-2">
          <p className="font-medium">{payload.packageName}</p>
          <p className="text-xs text-muted">
            {payload.confirmationCode} · check-in {payload.checkIn} · {payload.nights}{" "}
            {payload.nights === 1 ? "night" : "nights"}
          </p>
        </div>
      ) : (
        <WalletPassCard payload={payload} />
      )}
      <div className={compact ? "flex flex-wrap gap-2" : "mt-3 grid gap-2 sm:grid-cols-2"}>
        {apple && walletReady ? (
          <Button
            type="button"
            size={compact ? "sm" : "lg"}
            disabled={busy}
            className="bg-fg text-elevated hover:bg-fg/90"
            onClick={() => void onAppleWallet()}
          >
            <AppleMark />
            {busy ? "Preparing…" : "Add to Apple Wallet"}
          </Button>
        ) : null}
        <Button type="button" size={compact ? "sm" : "lg"} variant="outline" onClick={saveCalendar}>
          <CalendarPlus className="size-4" />
          Add to calendar
        </Button>
      </div>
      {compact || !apple ? null : (
        <p className="mt-2 text-xs text-subtle">
          On this Apple device the pass can go into Wallet. Until a signed .pkpass is configured,
          the card and calendar event work offline.
        </p>
      )}
    </div>
  );
}

export function SavedWalletList({ className }: { className?: string }) {
  const apple = useAppleDevice();
  const [passes] = useState(() => (typeof window === "undefined" ? [] : listWalletPasses()));

  if (!apple || passes.length === 0) return null;

  return (
    <div className={cn("grid gap-4", className)}>
      {passes.map((payload) => (
        <AddToWallet
          key={payload.confirmationCode}
          booking={{
            confirmationCode: payload.confirmationCode,
            packageName: payload.packageName,
            packageId: payload.packageId,
            checkIn: payload.checkIn,
            nights: payload.nights,
            travelers: payload.travelers,
            payerName: payload.payerName,
            amountInr: payload.amountInr,
            paymentRef: payload.paymentRef,
            status: payload.status,
          }}
        />
      ))}
    </div>
  );
}
