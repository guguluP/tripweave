import { Link } from "@tanstack/react-router";
import {
  formatMoney,
  nightsPhrase,
  stayTotal,
  variantLabel,
  type StayPackage,
} from "@/lib/packages";
import { TrustMeter } from "@/components/trust-meter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DigitPop, LearnMore, LikeButton } from "@/components/motion";
import { ReviewerChip } from "@/components/reviewer-consensus";
import { youtubeSourceCount } from "@/lib/trust-score";

export function PackageCard({
  pkg,
  rank,
  nights,
}: {
  pkg: StayPackage;
  rank?: string;
  /** When known from the brief, show an N-night total alongside the nightly rate. */
  nights?: number;
}) {
  const sources = youtubeSourceCount(pkg);
  const stayNights =
    typeof nights === "number" && Number.isFinite(nights) && nights >= 1
      ? Math.min(pkg.nightsMax, Math.max(pkg.nightsMin, Math.round(nights)))
      : null;
  const multiTotal =
    stayNights && stayNights > 1 ? stayTotal(pkg, stayNights) : null;

  return (
    <Card className="relative h-full overflow-visible transition-transform duration-150 hover:-translate-y-0.5">
      <div className="absolute right-3 top-3 z-10">
        <LikeButton id={pkg.id} />
      </div>
      <Link to="/trip/$id" params={{ id: pkg.id }} className="group block">
        <div className="relative overflow-hidden rounded-t-xl">
          <img src={pkg.image} alt={pkg.name} className="h-48 w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-fg/70 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pr-12">
            <Badge className="border-0 bg-elevated/95 text-fg">{variantLabel(pkg)}</Badge>
            {rank ? (
              <span className="font-display text-sm text-primary-fg">{rank}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div>
            <h3 className="font-display text-lg leading-snug">{pkg.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {pkg.destination} · {pkg.nightsMin}–{pkg.nightsMax} nights
            </p>
            <div className="mt-2">
              <ReviewerChip packageId={pkg.id} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p>
                <span className="text-muted">from </span>
                <span className="font-semibold tabular-nums">
                  <DigitPop value={formatMoney(pkg.priceFrom)} />
                </span>
                <span className="text-muted"> / night / person</span>
              </p>
              {multiTotal != null && stayNights != null ? (
                <p className="mt-0.5 text-xs text-subtle">
                  <span className="tabular-nums">
                    <DigitPop value={formatMoney(multiTotal)} />
                  </span>
                  {" "}
                  for {nightsPhrase(stayNights)}
                </p>
              ) : null}
            </div>
            <TrustMeter score={pkg.trustScore} youtubeSources={sources} compact />
          </div>
          <p className="text-xs text-subtle">
            Typical stay {nightsPhrase(pkg.nights)} · {pkg.rooms.length} room types
          </p>
          <LearnMore as="span" className="text-sm text-primary">
            View stay
          </LearnMore>
        </div>
      </Link>
    </Card>
  );
}
