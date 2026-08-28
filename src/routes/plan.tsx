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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan")({ component: Plan });

const VIBES: { id: Vibe; label: string; hint: string }[] = [
  { id: "culture", label: "Culture & temple", hint: "Darshan, Konark, old town" },
  { id: "beach", label: "Beach & coast", hint: "Sand, sunrise, slow walks" },
  { id: "relax", label: "Slow & spa", hint: "Pool, Ayurveda, quiet" },
  { id: "adventure", label: "Adventure", hint: "Day trips, extra miles" },
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

  const update = <K extends keyof Brief>(key: K, value: Brief[K]) => {
    setBrief((b) => ({ ...b, [key]: value }));
  };

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Stagger>
          <p className="eyebrow">Your brief</p>
          <h1 className="mt-2 font-display text-4xl">Tell us what you want</h1>
          <p className="mt-3 text-muted">
            We use this to rank a short list — not to spam you with 200 results.
          </p>
        </Stagger>

        <fieldset className="mt-10">
          <legend className="text-sm font-medium">Trip vibe</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {VIBES.map((v) => (
              <Choice
                key={v.id}
                selected={brief.vibe === v.id}
                title={v.label}
                hint={v.hint}
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
              onClick={() => update("nights", Math.max(2, brief.nights - 1))}
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

        <Button
          className="mt-10 w-full sm:w-auto"
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
  onClick,
}: {
  selected: boolean;
  title: string;
  hint?: string;
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
    </button>
  );
}
