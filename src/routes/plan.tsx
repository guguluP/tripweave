import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { DigitPop, MotionToggle, Stagger, TextSwap } from "@/components/motion";
import {
  DEFAULT_BRIEF,
  loadBrief,
  saveBrief,
  type Brief,
  type Budget,
  type TravelStyle,
  type Vibe,
} from "@/lib/packages";
import { ARRIVE_BY, ORIGINS, arriveOptionsFor, getOrigin, type ArriveBy } from "@/lib/origins";
import { inboundPreview } from "@/lib/travel-plan";
import { TravelEstimateCard } from "@/components/travel-estimate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan")({ component: Plan });

const VIBES: { id: Vibe; label: string; hint: string; ranks: string }[] = [
  {
    id: "culture",
    label: "Temple first",
    hint: "Darshan, Grand Road, a short night",
    ranks: "Station and temple-side hotels lead. Beach stays stay on the list if the nights fit.",
  },
  {
    id: "beach",
    label: "Beach first",
    hint: "Sunrise, Marine Drive, slow sand",
    ranks: "Sea-facing stays lead. A spa hotel can still place if it is on the coast.",
  },
  {
    id: "relax",
    label: "Slow & spa",
    hint: "Pool, Ayurveda, fewer outings",
    ranks: "Quiet resort stays lead. A beach hotel is the close second, not a temple night.",
  },
  {
    id: "adventure",
    label: "Out toward Konark",
    hint: "Day trips, Chilika, extra miles",
    ranks: "Stays built for a drive lead. Temple hotels still score on a one-night darshan.",
  },
];

const BUDGETS: { id: Budget; label: string; hint: string }[] = [
  { id: "value", label: "Value", hint: "Honest 2–3 star" },
  { id: "mid", label: "Mid-range", hint: "Reliable 4-star" },
  { id: "premium", label: "Premium", hint: "Heritage & 5-star" },
];

const STYLES: { id: TravelStyle; label: string }[] = [
  { id: "solo", label: "Solo" },
  { id: "couple", label: "Couple" },
  { id: "family", label: "Family" },
  { id: "friends", label: "Friends" },
];

function Plan() {
  const nav = useNavigate();
  const [brief, setBrief] = useState<Brief>(() =>
    typeof window === "undefined" ? DEFAULT_BRIEF : loadBrief(),
  );
  const [busy, setBusy] = useState(false);
  const arriveChoices = arriveOptionsFor(brief.origin);

  const update = <K extends keyof Brief>(key: K, value: Brief[K]) => {
    setBrief((b) => {
      const next = { ...b, [key]: value };
      if (key === "origin") {
        const origin = getOrigin(value as Brief["origin"]);
        const allowed = origin.inbound.map((l) => l.mode);
        if (!allowed.includes(next.arriveBy)) next.arriveBy = origin.defaultArriveBy;
        if (value !== "other") next.originCity = "";
      }
      return next;
    });
  };

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Stagger>
          <p className="eyebrow">Your brief</p>
          <h1 className="mt-2 font-display text-4xl">Tell us what you want</h1>
          <p className="mt-3 text-muted">
            We use this to rank a short list — and to map how you actually get to the stay.
          </p>
        </Stagger>

        <fieldset className="mt-10">
          <legend className="text-sm font-medium">Coming from</legend>
          <select
            className="mt-3 w-full rounded-lg border border-border bg-elevated px-3 py-3 text-sm"
            value={brief.origin}
            onChange={(e) => update("origin", e.target.value as Brief["origin"])}
          >
            {ORIGINS.filter((city) => city.id !== "other").map((city) => (
              <option key={city.id} value={city.id}>
                {city.label} — {city.hint}
              </option>
            ))}
            <option value="other">Somewhere else</option>
          </select>
          {brief.origin === "other" ? (
            <label className="mt-3 block text-sm">
              <span className="text-muted">Your city</span>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-3"
                value={brief.originCity ?? ""}
                placeholder="Ranchi, Jaipur, Berhampur…"
                maxLength={60}
                onChange={(e) => update("originCity", e.target.value)}
              />
            </label>
          ) : null}
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-sm font-medium">How you’ll arrive</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ARRIVE_BY.filter((v) => arriveChoices.includes(v.id)).map((v) => (
              <Choice
                key={v.id}
                selected={brief.arriveBy === v.id}
                title={v.label}
                hint={v.hint}
                onClick={() => update("arriveBy", v.id as ArriveBy)}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Puri has no airport. Flyers land at Bhubaneswar (BBI). OSRTC is the
            intercity bus; Ama Bus is the city network — including Khordha / Jatani (route 56).
          </p>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-sm font-medium">Trip vibe</legend>
          <div className="mt-3 grid gap-2">
            {VIBES.map((v) => (
              <Choice
                key={v.id}
                selected={brief.vibe === v.id}
                title={v.label}
                hint={v.hint}
                detail={brief.vibe === v.id ? v.ranks : undefined}
                onClick={() => update("vibe", v.id)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-sm font-medium">Budget per person</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {BUDGETS.map((v) => (
              <Choice
                key={v.id}
                selected={brief.budget === v.id}
                title={v.label}
                hint={v.hint}
                onClick={() => update("budget", v.id)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-sm font-medium">Travel style</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STYLES.map((v) => (
              <Choice
                key={v.id}
                selected={brief.style === v.id}
                title={v.label}
                onClick={() => update("style", v.id)}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-8">
          <p className="text-sm font-medium">Nights</p>
          <div className="mt-3 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => update("nights", Math.max(1, brief.nights - 1))}
              aria-label="Fewer nights"
            >
              −
            </Button>
            <span className="min-w-16 text-center font-display text-2xl tabular-nums">
              <DigitPop value={brief.nights} />
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => update("nights", Math.min(14, brief.nights + 1))}
              aria-label="More nights"
            >
              +
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Temple overnight? Start at 1. Every stay on the list can do a single night.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
          <div>
            <p className="text-sm font-medium">Flexible dates</p>
            <p className="text-xs text-muted">Rank stays even if nights don’t match exactly.</p>
          </div>
          <MotionToggle
            on={brief.flexible}
            onChange={(v) => update("flexible", v)}
            label="Flexible dates"
          />
        </div>

        <TravelEstimateCard
          className="mt-10"
          arriveBy={brief.arriveBy}
          quote={inboundPreview(brief)}
        />

        <Button
          className="mt-8 w-full sm:w-auto"
          size="lg"
          onClick={() => {
            setBusy(true);
            saveBrief(brief);
            void nav({ to: "/matches" });
          }}
        >
          <TextSwap text={busy ? "Matching stays" : "Show matches"} shimmer={busy} />
        </Button>
      </div>
    </Shell>
  );
}

function Choice({
  selected,
  title,
  hint,
  detail,
  onClick,
}: {
  selected: boolean;
  title: string;
  hint?: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-3 text-left transition-colors duration-150",
        selected
          ? "border-primary bg-surface"
          : "border-border bg-elevated hover:bg-surface",
      )}
    >
      <span className="block text-sm font-medium">{title}</span>
      {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      {detail ? <span className="mt-2 block text-xs text-fg/80">{detail}</span> : null}
    </button>
  );
}
