import { ArrowRight, Bus, CarFront, Landmark, Plane, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BUS_GUIDE, DIGIYATRA_GUIDE, type Journey, type TransportLeg } from "@/lib/transport";
import { getOrigin } from "@/lib/origins";
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

export function TransportPanel({ journey }: { journey: Journey }) {
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
        </div>
      </div>

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
        <ul className="grid gap-2">
          <LegRow recommended leg={journey.lastMile} />
        </ul>
      </div>

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
