import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AskTripWeave } from "@/components/ask-tripweave";
import { Button } from "@/components/ui/button";
import { guestLabel } from "@/lib/guest-labels";
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
  groupToken?: string;
  includePickup?: boolean;
  amountInr?: number;
  /** The booking's status, so a confirmed or cancelled stay is not quoted a refund. */
  status?: string;
  onRequestCar?: () => void;
  hotelName?: string;
};

export function AskTripWeaveButton({ children, ...props }: AskProps & { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const hotel = props.hotelName || (props.packageId ? getPackage(props.packageId)?.name : "") || guestLabel("askTitle");

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
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        {children ?? guestLabel("askTitle")}
      </Button>
      {open && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-fg/50 p-3 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="ask-sheet max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-bg p-5 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{guestLabel("askTitle")}</p>
                <h2 id={titleId} className="mt-1 font-display text-2xl">{hotel}</h2>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label={guestLabel("askClose")}>
                <X className="size-4" />
              </Button>
            </div>
            <AskTripWeave {...props} embedded />
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
