import { ArrowRight, Bus, CarFront, Landmark, MapPin, Plane, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LastMilePicker } from "@/components/last-mile-picker";
import { BUS_GUIDE, DIGIYATRA_GUIDE, type Journey, type TransportLeg } from "@/lib/transport";
import { getOrigin } from "@/lib/origins";
import { formatInrRange, type TravelPlan, type TravelQuote } from "@/lib/travel-plan";
import { MotionToggle } from "@/components/motion";
import { cn } from "@/lib/utils";

function LegRow({
  leg,
  recommended,
}: {
  leg: Pick<TransportLeg, "mode" | "duration" | "costHint" | "why">;
  recommended?: boolean;
}) {
  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-3",
        recommended ? "border-primary/30 bg-primary/5" : "border-border bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {leg.mode}
            {recommended ? (
              <span className="ml-2 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                Next
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted">{leg.why}</p>
        </div>
        <p className="shrink-0 text-right text-xs tabular-nums text-subtle">
          {leg.duration}
          <br />
          {leg.costHint}
        </p>
      </div>
    </li>
  );
}

export function TransportPanel({
  journey,
  quote,
  plan,
  onChange,
  interactive = false,
}: {
  journey: Journey;
  quote?: TravelQuote;
  plan?: TravelPlan;
  onChange?: (next: TravelPlan) => void;
  interactive?: boolean;
}) {
  const origin = getOrigin(journey.originId);
  const skipInbound = origin.id === "puri" && journey.arriveBy !== "bus";
  const GatewayIcon =
    journey.inbound.gateway === "PURI"
      ? TrainFront
      : journey.inbound.gateway === "BUS"
        ? Bus
        : journey.inbound.gateway === "ROAD"
          ? CarFront
          : Plane;

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <GatewayIcon className="size-4" />
        </span>
        <div>
          <p className="eyebrow">Getting there</p>
          <h3 className="mt-1 font-display text-lg">
            {skipInbound ? `To ${journey.neighborhood}` : `${origin.label} → ${journey.neighborhood}`}
          </h3>
          {quote ? <p className="mt-1 text-sm tabular-nums text-muted">{quote.costLine}</p> : null}
        </div>
      </div>
      {quote ? <p className="text-sm text-ok">{quote.bestLine}</p> : null}

      {!skipInbound ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-medium text-muted">
            <GatewayIcon className="size-3.5" />
            1. From {origin.label}
          </p>
          <ul className="grid gap-2">
            <LegRow
              recommended
              leg={{
                mode: journey.inbound.label,
                duration: journey.inbound.duration,
                costHint: journey.inbound.costHint,
                why: journey.inbound.why,
              }}
            />
          </ul>
          {journey.inbound.tips ? (
            <p className="text-xs text-subtle">{journey.inbound.tips}</p>
          ) : null}
          {quote && quote.bookingLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {quote.bookingLinks.map((link) => (
                <Button key={link.href} type="button" size="sm" variant="outline" asChild>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                    <ArrowRight className="size-3.5" />
                  </a>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-medium text-muted">
          {journey.arriveBy === "train" ? (
            <Landmark className="size-3.5" />
          ) : journey.arriveBy === "bus" ? (
            <Bus className="size-3.5" />
          ) : (
            <CarFront className="size-3.5" />
          )}
          {skipInbound ? "To the stay" : "2. Last mile to the stay"}
        </p>
        {interactive && quote && plan && onChange ? (
          <LastMilePicker
            quote={quote}
            selectedId={plan.lastMileId || quote.recommendedId}
            onSelect={(id) => {
              const next = quote.options.find((o) => o.id === id);
              onChange({
                ...plan,
                lastMileId: id,
                includePickup: next?.bucket === "hotel" ? plan.includePickup || quote.pickup.available : false,
              });
            }}
          />
        ) : (
          <ul className="grid gap-2">
            <LegRow recommended leg={quote?.lastMile ?? journey.lastMile} />
          </ul>
        )}
      </div>

      {interactive && quote && plan && onChange && quote.pickup.available ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
          <div>
            <p className="text-sm font-medium">
              {quote.pickup.included
                ? "Hotel car, already in the stay price"
                : `Add a hotel-pickup estimate · ${formatInrRange(quote.pickup.price, quote.pickup.price)}`}
            </p>
            <p className="text-xs text-muted">
              {quote.pickup.included
                ? "This hotel lists an airport transfer with the room. Turning this on asks the desk to send that car. It does not add rupees."
                : "This hotel does not include a car. The amount is TripWeave’s road estimate, charged once at checkout. It is not a confirmed booking with the hotel or with Ola."}
            </p>
          </div>
          <MotionToggle
            on={plan.includePickup}
            onChange={(v) => onChange({ ...plan, includePickup: v })}
            label="Hotel pickup"
          />
        </div>
      ) : null}

      {interactive && quote && plan && onChange ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="carrier-ref">Flight / train / bus number</Label>
            <Input
              id="carrier-ref"
              value={plan.carrierRef}
              placeholder="6E 123 / Puri Exp / OSRTC"
              autoComplete="off"
              onChange={(e) => onChange({ ...plan, carrierRef: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="arrival-time">Arrival time</Label>
            <Input
              id="arrival-time"
              type="time"
              value={plan.arrivalTime}
              onChange={(e) => onChange({ ...plan, arrivalTime: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      {quote ? (
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={quote.mapDirectionsUrl} target="_blank" rel="noreferrer">
            <MapPin className="size-3.5" />
            Open last-mile map
          </a>
        </Button>
      ) : null}

      <p className="text-xs text-subtle">{journey.localNote}</p>
    </Card>
  );
}

export function DigiYatraPanel() {
  return (
    <Card className="space-y-3 p-5 shadow-none">
      <p className="eyebrow">DigiYatra · {DIGIYATRA_GUIDE.airportCode}</p>
      <h3 className="font-display text-lg">Airport e-gates at BBI</h3>
      <p className="text-sm text-muted">{DIGIYATRA_GUIDE.summary}</p>
      <ol className="list-decimal space-y-1.5 pl-4 text-xs text-subtle">
        {DIGIYATRA_GUIDE.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="text-xs text-subtle">{DIGIYATRA_GUIDE.note}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={DIGIYATRA_GUIDE.appLinks.android} target="_blank" rel="noreferrer">
            Android app
            <ArrowRight className="size-3.5" />
          </a>
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={DIGIYATRA_GUIDE.appLinks.ios} target="_blank" rel="noreferrer">
            iOS app
            <ArrowRight className="size-3.5" />
          </a>
        </Button>
      </div>
    </Card>
  );
}

export function BusGuidePanel() {
  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Bus className="size-4" />
        </span>
        <div>
          <p className="eyebrow">Bus · OSRTC & Ama Bus</p>
          <h3 className="mt-1 font-display text-lg">Official buses into Puri</h3>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-surface px-3 py-3">
          <p className="text-sm font-medium">{BUS_GUIDE.osrtc.name}</p>
          <p className="mt-1 text-xs text-muted">{BUS_GUIDE.osrtc.summary}</p>
          <p className="mt-2 text-xs text-subtle">{BUS_GUIDE.osrtc.drop}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-subtle">
            {BUS_GUIDE.osrtc.routes.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={BUS_GUIDE.osrtc.book} target="_blank" rel="noreferrer">
                Book OSRTC
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={BUS_GUIDE.osrtc.android} target="_blank" rel="noreferrer">
                Android
              </a>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={BUS_GUIDE.osrtc.ios} target="_blank" rel="noreferrer">
                iOS
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface px-3 py-3">
          <p className="text-sm font-medium">{BUS_GUIDE.ama.name}</p>
          <p className="mt-1 text-xs text-muted">{BUS_GUIDE.ama.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-subtle">
            {BUS_GUIDE.ama.routes.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={BUS_GUIDE.ama.android} target="_blank" rel="noreferrer">
                Ama Bus app
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={BUS_GUIDE.ama.whatsapp} target="_blank" rel="noreferrer">
                WhatsApp tickets
              </a>
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={BUS_GUIDE.ama.site} target="_blank" rel="noreferrer">
                Route map
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
