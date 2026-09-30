import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { DigitPop, MotionToggle, Stagger, TextSwap } from "@/components/motion";
import { CheckInField } from "@/components/stay-quote";
import {
  DEFAULT_BRIEF,
  type Brief,
  type Budget,
  type TravelStyle,
  type Vibe,
} from "@/lib/packages";
import { loadBriefWithDates, saveBriefWithDates, type BriefDates } from "@/lib/brief-persist";
import { ARRIVE_BY, ORIGINS, arriveOptionsFor, getOrigin, type ArriveBy } from "@/lib/origins";
import { loadLocalProfile } from "@/lib/profile-local";
import { inboundPreview } from "@/lib/travel-plan";
import { track } from "@/lib/analytics";
import { TravelEstimateCard } from "@/components/travel-estimate";
import { briefToSearch, mergeBriefUrl, searchHasBrief, searchToBrief } from "@/lib/brief-url";
import { checkInOnOrAfterToday, todayIso } from "@/lib/inventory";
import { CityMenu, Choice } from "@/components/plan-city-menu";

type PlanSearch = Record<string, string | undefined>;

export const Route = createFileRoute("/plan")({
  component: Plan,
  validateSearch: (s: Record<string, unknown>): PlanSearch => {
    if (!searchHasBrief(s)) return {};
    return briefToSearch(mergeBriefUrl(DEFAULT_BRIEF, searchToBrief(s)));
  },
});

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

function cityAsOrigin(name: string): Pick<Brief, "origin" | "originCity" | "arriveBy"> {
  const trimmed = name.trim().slice(0, 80);
  const listed = ORIGINS.find(
    (city) => city.id !== "other" && city.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (listed) {
    return { origin: listed.id, originCity: "", arriveBy: listed.defaultArriveBy };
  }
  return { origin: "other", originCity: trimmed, arriveBy: getOrigin("other").defaultArriveBy };
}

function defaultCheckIn(brief: BriefDates): string {
  return checkInOnOrAfterToday(brief.checkIn);
}

function Plan() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [brief, setBrief] = useState<BriefDates>(() => {
    if (typeof window === "undefined") return DEFAULT_BRIEF;
    const saved = window.localStorage.getItem("tripweave-brief");
    let loaded = loadBriefWithDates();
    if (!saved) {
      const home = loadLocalProfile()?.homeCity?.trim();
      if (home) loaded = { ...loaded, ...cityAsOrigin(home) };
    }
    if (searchHasBrief(search)) loaded = mergeBriefUrl(loaded, searchToBrief(search));
    if (!loaded.checkIn) loaded = { ...loaded, checkIn: defaultCheckIn(loaded) };
    return loaded;
  });
  const homeCity = typeof window === "undefined" ? "" : loadLocalProfile()?.homeCity?.trim() ?? "";
  const [busy, setBusy] = useState(false);
  const arriveChoices = arriveOptionsFor(brief.origin);
  const checkIn = defaultCheckIn(brief);

  const update = <K extends keyof BriefDates>(key: K, value: BriefDates[K]) => {
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
            Dates first — festival nights change the rate — then how you arrive, then the trip feel.
          </p>
        </Stagger>

        <section className="mt-10 rounded-xl border border-border bg-elevated p-4">
          <p className="eyebrow">When</p>
          <h2 className="mt-1 font-display text-xl">Check-in and nights</h2>
          <div className="mt-4">
            <CheckInField
              checkIn={checkIn}
              minDate={todayIso()}
              onCheckIn={(iso) => update("checkIn", iso)}
              hint="Rath Yatra, Diwali, and New Year nights price differently — pick the date before we rank."
            />
          </div>
          <div className="mt-6">
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
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-bg px-4 py-3">
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
        </section>

        <section className="mt-8">
          <p className="eyebrow">Arrival</p>
          <h2 className="mt-1 font-display text-xl">Coming from · how you’ll arrive</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:items-start">
            <fieldset>
              <legend className="text-sm font-medium">Coming from</legend>
              <CityMenu
                origin={brief.origin}
                originCity={brief.originCity ?? ""}
                onListed={(id) => update("origin", id)}
                homeCity={homeCity}
                onCustom={(name) => {
                  setBrief((b) => {
                    const picked = cityAsOrigin(name);
                    const allowed = getOrigin(picked.origin).inbound.map((leg) => leg.mode);
                    return {
                      ...b,
                      ...picked,
                      arriveBy: allowed.includes(b.arriveBy) ? b.arriveBy : picked.arriveBy,
                    };
                  });
                }}
              />
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium">How you’ll arrive</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
            </fieldset>
          </div>
          <p className="mt-2 text-xs text-muted">
            Puri has no airport. Flyers land at Bhubaneswar (BBI). OSRTC is the intercity bus; Ama Bus
            is the city network — including Khordha / Jatani (route 56).
          </p>
        </section>

        <section className="mt-10">
          <p className="eyebrow">Trip feel</p>
          <h2 className="mt-1 font-display text-xl">Vibe, budget, and style</h2>
          <p className="mt-2 text-sm text-muted">Second decision — after dates and arrival.</p>

          <fieldset className="mt-6">
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
            <legend className="text-sm font-medium">Budget</legend>
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
        </section>

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
            const next = { ...brief, checkIn };
            saveBriefWithDates(next);
            track("brief_completed", { nights: next.nights, origin: next.origin });
            void nav({ to: "/matches", search: briefToSearch(next) });
          }}
        >
          <TextSwap text={busy ? "Matching stays" : "Show matches"} shimmer={busy} />
        </Button>
      </div>
    </Shell>
  );
}
