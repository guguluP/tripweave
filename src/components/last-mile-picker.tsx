import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInrRange, rideLinks, type LastMileBucket, type RankedLastMile, type TravelQuote } from "@/lib/travel-plan";
import { cn } from "@/lib/utils";

const BUCKET_LABEL: Record<LastMileBucket, string> = {
  hotel: "Hotel transfer",
  cab: "App cab",
  auto_bus: "Bus + auto",
  other: "Other",
};

function bucketChoice(options: RankedLastMile[]): RankedLastMile[] {
  const seen = new Set<LastMileBucket>();
  const out: RankedLastMile[] = [];
  for (const row of options) {
    if (row.bucket === "other") continue;
    if (seen.has(row.bucket)) continue;
    seen.add(row.bucket);
    out.push(row);
  }
  return out;
}

export function LastMilePicker({
  quote,
  selectedId,
  onSelect,
  compact = false,
}: {
  quote: TravelQuote;
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const choices = bucketChoice(quote.options);
  const selected = quote.options.find((o) => o.id === selectedId) ?? quote.options[0];
  const [pickupName, setPickupName] = useState(quote.ride.pickup.name);
  const [dropName, setDropName] = useState(quote.ride.drop.name);
  useEffect(() => {
    setPickupName(quote.ride.pickup.name);
    setDropName(quote.ride.drop.name);
  }, [quote.ride.pickup.name, quote.ride.drop.name]);
  if (!selected) return null;
  const cab = selected.bucket === "cab" || /auto/i.test(selected.leg.mode);
  const links = cab
    ? rideLinks(
        { ...quote.ride.pickup, name: pickupName.trim() || quote.ride.pickup.name },
        { ...quote.ride.drop, name: dropName.trim() || quote.ride.drop.name },
      )
    : quote.lastMileLinks;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div>
        <p className={cn("text-sm font-medium", compact && "text-xs")}>
          From your brief: {selected.leg.duration}, {formatInrRange(quote.lastMileRange.min, quote.lastMileRange.max)}
        </p>
        {selected.badge ? <p className="mt-0.5 text-xs text-ok">{selected.badge}</p> : null}
      </div>
      {choices.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {choices.map((row) => {
            const on = row.id === selectedId;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row.id)}
                className={cn(
                  "min-h-11 rounded-md border px-3 text-xs font-medium transition-colors duration-150",
                  on ? "border-primary bg-primary/10 text-fg" : "border-border bg-elevated text-muted hover:text-fg",
                )}
              >
                {BUCKET_LABEL[row.bucket]}
                {row.recommended ? (
                  <span className="ml-1 text-[0.65rem] uppercase tracking-wider text-primary">Best</span>
                ) : row.cheapest ? (
                  <span className="ml-1 text-[0.65rem] uppercase tracking-wider text-ok">Cheap</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
      {!compact && selected.leg.why ? <p className="text-xs text-subtle">{selected.leg.why}</p> : null}
      {!compact && cab ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            aria-label="Cab pickup"
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value.slice(0, 80))}
          />
          <Input
            aria-label="Cab drop"
            value={dropName}
            onChange={(e) => setDropName(e.target.value.slice(0, 80))}
          />
        </div>
      ) : null}
      {!compact && links.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Button key={link.label} type="button" size="sm" variant="outline" asChild>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
