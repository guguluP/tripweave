import { Link } from "@tanstack/react-router";
import { quoteStay } from "@/lib/inventory";
import {
  formatMoney,
  nightsPhrase,
  stayTotal,
  variantLabel,
  type Brief,
  type StayPackage,
} from "@/lib/packages";
import { TrustMeter } from "@/components/trust-meter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DigitPop, LearnMore, LikeButton } from "@/components/motion";
import { ReviewerChip } from "@/components/reviewer-consensus";
import { LastMilePicker } from "@/components/last-mile-picker";
import { youtubeSourceCount } from "@/lib/trust-score";
import { quoteTravel } from "@/lib/travel-plan";

export function PackageCard({
  pkg,
  rank,
  nights,
  originWhy,
  brief,
  checkIn,
  lastMileId,
  onLastMile,
}: {
  pkg: StayPackage;
  rank?: string;
  /** When known from the brief, show an N-night total alongside the nightly rate. */
  nights?: number;
  /** When set, the card uses the seasonal quote instead of the flat nightly rate. */
  checkIn?: string;
  originWhy?: string;
  brief?: Brief;
  lastMileId?: string;
  onLastMile?: (id: string) => void;
}) {
  const sources = youtubeSourceCount(pkg);
  const stayNights =
    typeof nights === "number" && Number.isFinite(nights) && nights >= 1
      ? Math.min(pkg.nightsMax, Math.max(pkg.nightsMin, Math.round(nights)))
      : null;
  const dated =
    checkIn && stayNights
      ? quoteStay({ packageId: pkg.id, checkIn, nights: stayNights })
      : null;
  const multiTotal = dated
    ? dated.perPerson
    : stayNights && stayNights > 1
      ? stayTotal(pkg, stayNights)
      : null;
  const nightly = dated ? Math.round(dated.perPerson / Math.max(dated.nights, 1)) : pkg.priceFrom;
  const quote = brief ? quoteTravel(pkg.id, brief, { lastMileId }) : null;

  return (
    <Card className="relative h-full overflow-visible transition-transform duration-150 hover:-translate-y-0.5">
      <div className="absolute right-3 top-3 z-10">
        <LikeButton id={pkg.id} />
      </div>
      <Link to="/trip/$id" params={{ id: pkg.id }} viewTransition className="group block">
        <div className="overflow-hidden rounded-t-xl" style={{ viewTransitionName: `stay-${pkg.id}` }}>
          <div className="relative">
            <img src={pkg.image} alt={pkg.name} className="h-44 w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-fg/70 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pr-12">
              <Badge className="border-0 bg-elevated/95 text-fg">{variantLabel(pkg)}</Badge>
              {rank ? (
                <span className="font-display text-sm text-primary-fg">{rank}</span>
              ) : null}
            </div>
          </div>
          {pkg.images.length > 1 ? (
            <div className="grid grid-cols-3 gap-px bg-border">
              {pkg.images.slice(1, 4).map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt=""
                  className="h-16 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 p-4 pb-0">
          <div>
            <h3 className="font-display text-lg leading-snug">{pkg.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {pkg.destination} · {pkg.nightsMin}–{pkg.nightsMax} nights
            </p>
            {originWhy ? <p className="mt-1 text-xs text-subtle">{originWhy}</p> : null}
            <div className="mt-2">
              <ReviewerChip packageId={pkg.id} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p>
                <span className="text-muted">{dated ? "" : "catalog "}</span>
                <span className="font-semibold tabular-nums">
                  <DigitPop value={formatMoney(nightly)} />
                </span>
                <span className="text-muted"> / night for the room</span>
              </p>
              {!dated ? (
                <p className="mt-0.5 text-xs text-subtle">Seasonal price is set at checkout.</p>
              ) : null}
              {multiTotal != null && stayNights != null && stayNights > 1 ? (
                <p className="mt-0.5 text-xs text-subtle">
                  <span className="tabular-nums">
                    <DigitPop value={formatMoney(multiTotal)} />
                  </span>
                  {" "}
                  for {nightsPhrase(stayNights)}
                  {dated ? " · seasonal rate" : ""}
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
      {quote && onLastMile ? (
        <div className="border-t border-border p-4">
          <LastMilePicker
            quote={quote}
            selectedId={lastMileId || quote.recommendedId}
            onSelect={onLastMile}
            compact
          />
        </div>
      ) : quote ? (
        <p className="border-t border-border px-4 py-3 text-xs text-muted">{quote.costLine}</p>
      ) : null}
    </Card>
  );
}
