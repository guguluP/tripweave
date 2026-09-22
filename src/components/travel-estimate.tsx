import { ArrowUpRight, Bus, CarFront, Plane, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ArriveBy } from "@/lib/origins";
import type { TravelQuote } from "@/lib/travel-plan";
import { cn } from "@/lib/utils";

function GatewayIcon({ arriveBy, className }: { arriveBy: ArriveBy; className?: string }) {
  const Icon =
    arriveBy === "train" ? TrainFront : arriveBy === "bus" ? Bus : arriveBy === "road" ? CarFront : Plane;
  return <Icon className={className} />;
}

export function TravelEstimateCard({
  quote,
  arriveBy,
  className,
}: {
  quote: TravelQuote;
  arriveBy: ArriveBy;
  className?: string;
}) {
  return (
    <Card className={cn("space-y-4 p-5 shadow-none", className)}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <GatewayIcon arriveBy={arriveBy} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="eyebrow">Getting there</p>
          <p className="mt-1 text-sm text-muted">From {quote.originLabel}</p>
          <p className="mt-1 font-display text-2xl leading-snug">{quote.costLine}</p>
          <p className="mt-1 text-sm text-ok">{quote.bestLine}</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        {quote.inbound.label} · {quote.inbound.duration} · {quote.inbound.costHint}
      </p>
      {quote.bookingLinks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {quote.bookingLinks.map((link) => (
            <Button key={link.href} type="button" size="sm" variant="outline" asChild>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <ArrowUpRight className="size-3.5" />
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
