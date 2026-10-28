import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AskTripWeave } from "@/components/ask-tripweave";
import { guestLabel, useGuestLocale } from "@/lib/guest-locale";
import { getPackage } from "@/lib/packages";

type AskProps = {
  nationalities?: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
  packageId?: string;
  roomId?: string;
  nights?: number;
  arriveBy?: string;
  confirmationCode?: string;
  includePickup?: boolean;
  amountInr?: number;
  /** The booking's status, so a confirmed or cancelled stay is not quoted a refund. */
  status?: string;
  onRequestCar?: () => void;
  hotelName?: string;
};

export function AskTripWeaveButton({ children, ...props }: AskProps & { children?: ReactNode }) {
  const locale = useGuestLocale();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const hotel = props.hotelName || (props.packageId ? getPackage(props.packageId)?.name : "") || guestLabel(locale, "askTitle");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="text-sm font-medium underline" onClick={() => setOpen(true)}>
        {children ?? guestLabel(locale, "askTitle")}
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button type="button" className="absolute inset-0 bg-fg/40" aria-label={guestLabel(locale, "askClose")} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="ask-sheet relative z-10 m-3 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-elevated p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p id={titleId} className="font-display text-xl">{hotel}</p>
                <p className="text-xs text-muted">{guestLabel(locale, "askTitle")}</p>
              </div>
              <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
                {guestLabel(locale, "askClose")}
              </button>
            </div>
            <AskTripWeave {...props} embedded />
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
