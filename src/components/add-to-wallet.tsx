import { useState } from "react";
import { Button } from "@/components/ui/button";
import { pushBanner } from "@/lib/banners";
import type { BookingRow } from "@/lib/server/bookings";
import {
  bookingToWalletPayload,
  buildBookingIcs,
  buildOfflinePassHtml,
  downloadTextFile,
} from "@/lib/apple-wallet";

type Props = {
  booking: Pick<
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
  >;
  className?: string;
};

/**
 * Add to Apple Wallet when the server can sign .pkpass;
 * otherwise offers offline pass card + calendar (works without Apple certs).
 */
export function AddToWalletButton({ booking, className }: Props) {
  const [busy, setBusy] = useState(false);

  const payload = bookingToWalletPayload(booking as BookingRow);

  const saveOffline = () => {
    downloadTextFile(
      `tripweave-${payload.confirmationCode}.html`,
      buildOfflinePassHtml(payload),
      "text/html;charset=utf-8",
    );
    downloadTextFile(
      `tripweave-${payload.confirmationCode}.ics`,
      buildBookingIcs(payload),
      "text/calendar;charset=utf-8",
    );
    pushBanner({
      title: "Offline pass saved",
      body: "HTML pass card + calendar event downloaded. Open the HTML on your phone for offline check-in.",
      tone: "ok",
    });
  };

  const onAppleWallet = async () => {
    setBusy(true);
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
        a.click();
        URL.revokeObjectURL(url);
        pushBanner({
          title: "Apple Wallet pass",
          body: "Open the .pkpass file on your iPhone to add it to Wallet.",
          tone: "ok",
        });
        return;
      }

      let message = "Apple Wallet signing is not configured yet.";
      try {
        const data = (await res.json()) as { message?: string };
        if (data.message) message = data.message;
      } catch {
        /* ignore */
      }
      pushBanner({
        title: "Using offline pass",
        body: message,
        tone: "info",
      });
      saveOffline();
    } catch {
      pushBanner({
        title: "Wallet unavailable",
        body: "Saving an offline pass card instead.",
        tone: "info",
      });
      saveOffline();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className ? `flex flex-wrap gap-2 ${className}` : "flex flex-wrap gap-2"}>
      <Button type="button" size="lg" disabled={busy} onClick={onAppleWallet}>
        {busy ? "Preparing…" : "Add to Apple Wallet"}
      </Button>
      <Button type="button" size="lg" variant="outline" onClick={saveOffline}>
        Offline pass + calendar
      </Button>
    </div>
  );
}
