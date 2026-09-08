import { ArrowRight, CarFront, Landmark, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DIGIYATRA_GUIDE, type PropertyTransport, type TransportLeg } from "@/lib/transport";
import { cn } from "@/lib/utils";

function LegRow({ leg, recommended }: { leg: TransportLeg; recommended?: boolean }) {
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
                Best
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

export function TransportPanel({ transport }: { transport: PropertyTransport }) {
  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <CarFront className="size-4" />
        </span>
        <div>
          <p className="eyebrow">Best way to the property</p>
          <h3 className="mt-1 font-display text-lg">{transport.best.mode}</h3>
        </div>
      </div>
      <p className="text-sm text-muted">{transport.best.why}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-surface px-3 py-2">
          <dt className="text-xs text-subtle">Time</dt>
          <dd className="mt-0.5 font-medium">{transport.best.duration}</dd>
        </div>
        <div className="rounded-lg bg-surface px-3 py-2">
          <dt className="text-xs text-subtle">Typical cost</dt>
          <dd className="mt-0.5 font-medium">{transport.best.costHint}</dd>
        </div>
      </dl>
      {transport.best.tips ? <p className="text-xs text-subtle">{transport.best.tips}</p> : null}
      <p className="text-xs text-subtle">{transport.localNote}</p>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-xs font-medium text-muted">
          <Plane className="size-3.5" />
          From BBI airport
        </p>
        <ul className="grid gap-2">
          {transport.fromAirport.map((leg, i) => (
            <LegRow key={leg.mode} leg={leg} recommended={i === 0} />
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-medium text-muted">
          <Landmark className="size-3.5" />
          From Puri station
        </p>
        <ul className="grid gap-2">
          {transport.fromStation.map((leg, i) => (
            <LegRow key={leg.mode} leg={leg} recommended={i === 0} />
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function DigiYatraPanel() {
  return (
    <Card className="space-y-3 p-5 shadow-none">
      <p className="eyebrow">DigiYatra · {DIGIYATRA_GUIDE.airportCode}</p>
      <h3 className="font-display text-lg">Airport e-gates only</h3>
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
