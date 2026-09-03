import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { Shell } from "@/components/shell";
import { TrustMeter } from "@/components/trust-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DigitPop, LikeButton, Stagger, TextSwap } from "@/components/motion";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  formatMoney,
  getPackage,
  priceWithSwaps,
  saveNext,
  savePending,
  variantLabel,
} from "@/lib/packages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trip/$id")({ component: TripDetail });

function TripDetail() {
  const { id } = Route.useParams();
  const pkg = getPackage(id);
  const nav = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState(false);

  if (!pkg) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="font-display text-3xl">Stay not found</h1>
          <Button asChild className="mt-6">
            <Link to="/">Back to Discover</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const price = priceWithSwaps(pkg, swaps);

  const toggleSwap = (dayIdx: number, optionId: string) => {
    setSwaps((s) => {
      const key = String(dayIdx);
      const next = { ...s };
      if (next[key] === optionId) delete next[key];
      else next[key] = optionId;
      return next;
    });
  };

  const goBook = () => {
    savePending({ packageId: pkg.id, swaps });
    if (isPending) return;
    setBooking(true);
    if (!user) {
      saveNext("/travelers");
      void nav({ to: "/login" });
      return;
    }
    void nav({ to: "/travelers" });
  };

  return (
    <Shell>
      <div className="relative h-64 md:h-80">
        <img src={pkg.image} alt={pkg.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        <div className="absolute right-4 top-4">
          <LikeButton id={pkg.id} />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-28">
        <div className="-mt-16 relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Stagger>
            <p className="eyebrow">{pkg.destination}</p>
            <h1 className="font-display text-4xl text-fg">{pkg.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-3.5" />
              {pkg.neighborhood} · {pkg.nights} nights
            </p>
          </Stagger>
          <TrustMeter score={pkg.trustScore} reviews={pkg.reviews} />
        </div>

        <p className="mt-6 text-muted">{pkg.summary}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {pkg.includes.map((item) => (
            <Badge key={item} className="gap-1">
              <Check className="size-3" />
              {item}
            </Badge>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl">Stay plan</h2>
        <p className="mt-1 text-sm text-muted">
          Swap activities — the all-in rupee price updates live.
        </p>
        <div className="mt-5 grid gap-3">
          {pkg.days.map((day, i) => (
            <Card key={day.title} className="p-4 shadow-none">
              <p className="eyebrow">Day {i + 1}</p>
              <h3 className="mt-1 font-display text-lg">{day.title}</h3>
              <p className="mt-1 text-sm text-muted">{day.base}</p>
              {day.options.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {day.options.map((o) => {
                    const on = swaps[String(i)] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => toggleSwap(i, o.id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                          on
                            ? "border-primary bg-primary text-primary-fg"
                            : "border-border bg-surface text-muted hover:text-fg",
                        )}
                      >
                        {o.label} ({o.delta >= 0 ? "+" : ""}
                        {formatMoney(o.delta)})
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-border bg-elevated/95 px-4 py-3 backdrop-blur-md md:bottom-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl tabular-nums">
              <DigitPop value={formatMoney(price)} />
            </p>
            <p className="text-xs text-muted">all-in · per person</p>
          </div>
          <Button size="lg" onClick={goBook} disabled={isPending}>
            <TextSwap text={booking ? "Traveller details…" : "Book this stay"} shimmer={booking} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
