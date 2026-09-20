import { useEffect } from "react";
import { ArrowUpRight, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Brief, StayPackage } from "@/lib/packages";
import {
  quoteTravel,
  travelShareText,
  whatsappShareHref,
  type TravelPlan,
} from "@/lib/travel-plan";
import { LastMilePicker } from "@/components/last-mile-picker";

export function TravelPlanner({
  brief,
  packages,
  lastMileByPackage,
  onSelectLastMile,
  onClose,
}: {
  brief: Brief;
  packages: StayPackage[];
  lastMileByPackage: Record<string, string>;
  onSelectLastMile: (packageId: string, lastMileId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-fg/50 p-3 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="travel-planner-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-bg p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Travel plan</p>
            <h2 id="travel-planner-title" className="mt-1 font-display text-2xl">
              How you’ll get there
            </h2>
            <p className="mt-1 text-sm text-muted">
              Inbound plus last mile for your three matches, ranked for a {brief.style} {brief.vibe} trip.
            </p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-4">
          {packages.map((pkg) => {
            const quote = quoteTravel(pkg.id, brief, { lastMileId: lastMileByPackage[pkg.id] });
            return (
              <Card key={pkg.id} className="space-y-3 p-4 shadow-none">
                <div>
                  <h3 className="font-display text-lg">{pkg.name}</h3>
                  <p className="mt-1 text-sm tabular-nums text-fg">{quote.costLine}</p>
                  <p className="mt-0.5 text-xs text-ok">{quote.bestLine}</p>
                </div>
                <p className="text-xs text-muted">
                  {quote.inbound.label} · {quote.inbound.duration}
                </p>
                <LastMilePicker
                  quote={quote}
                  selectedId={lastMileByPackage[pkg.id] || quote.recommendedId}
                  onSelect={(id) => onSelectLastMile(pkg.id, id)}
                  compact
                />
                <div className="flex flex-wrap gap-2">
                  {quote.bookingLinks.slice(0, 2).map((link) => (
                    <Button key={link.href} type="button" size="sm" variant="outline" asChild>
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    </Button>
                  ))}
                  <Button type="button" size="sm" variant="outline" asChild>
                    <a href={quote.mapDirectionsUrl} target="_blank" rel="noreferrer">
                      <MapPin className="size-3.5" />
                      Last-mile map
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TravelShareButtons({
  hotelName,
  quote,
  plan,
  confirmationCode,
  checkIn,
  guests,
  emailHref,
}: {
  hotelName: string;
  quote: ReturnType<typeof quoteTravel>;
  plan: TravelPlan;
  confirmationCode?: string;
  checkIn?: string;
  guests?: number;
  emailHref: string;
}) {
  const text = travelShareText({
    confirmationCode,
    hotelName,
    checkIn,
    quote,
    plan,
    guests,
  });
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" asChild>
        <a href={emailHref}>Email hotel desk</a>
      </Button>
      <Button type="button" variant="outline" asChild>
        <a href={whatsappShareHref(text)} target="_blank" rel="noreferrer">
          Share travel on WhatsApp
        </a>
      </Button>
    </div>
  );
}
