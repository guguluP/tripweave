import { Link } from "@tanstack/react-router";
import { formatMoney, variantLabel, type StayPackage } from "@/lib/packages";
import { TrustMeter } from "@/components/trust-meter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DigitPop, LearnMore, LikeButton } from "@/components/motion";

export function PackageCard({
  pkg,
  rank,
}: {
  pkg: StayPackage;
  rank?: string;
}) {
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
              {pkg.destination} · {pkg.nights} nights
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold tabular-nums">
                <DigitPop value={formatMoney(pkg.priceFrom)} />
              </span>
              <span className="text-muted"> all-in</span>
            </p>
            <TrustMeter score={pkg.trustScore} reviews={pkg.reviews} compact />
          </div>
          <LearnMore as="span" className="text-sm text-primary">
            View stay
          </LearnMore>
        </div>
      </Link>
    </Card>
  );
}
