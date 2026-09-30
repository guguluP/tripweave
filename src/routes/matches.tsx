import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { PackageCard } from "@/components/package-card";
import { ReviewerCompare } from "@/components/reviewer-consensus";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClearInput, LearnMore, Shimmer, SlidingTabs, Stagger } from "@/components/motion";
import {
  DEFAULT_BRIEF,
  listPackages,
  RANK_LABELS,
  loadPending,
  rankingBlurb,
  type Brief,
  type MatchedStay,
  type StayPackage,
} from "@/lib/packages";
import { rankEyebrow, scorePackages } from "@/lib/match-score";
import { loadBriefWithDates, saveBriefWithDates } from "@/lib/brief-persist";
import { checkInOnOrAfterToday } from "@/lib/inventory";
import { useSavedIds } from "@/lib/saved";
import { getOrigin } from "@/lib/origins";
import { loadTravelDraft, patchTravelDraft, quoteTravel } from "@/lib/travel-plan";
import { TravelEstimateCard } from "@/components/travel-estimate";
import { TravelPlanner } from "@/components/travel-planner";
import {
  briefToSearch,
  mergeBriefUrl,
  searchHasBrief,
  searchToBrief,
  type BriefUrlState,
} from "@/lib/brief-url";
import { formatCheckInLabel } from "@/components/stay-quote";

type MatchesSearch = Record<string, string | undefined>;

export const Route = createFileRoute("/matches")({
  component: Matches,
  validateSearch: (s: Record<string, unknown>): MatchesSearch => {
    if (!searchHasBrief(s)) return {};
    return briefToSearch(mergeBriefUrl(DEFAULT_BRIEF, searchToBrief(s)));
  },
});

type Tab = "matches" | "saved" | "all";

function headingFor(tab: Tab, count: number) {
  if (tab === "matches") return "Your three matches";
  if (tab === "all") return `All Puri stays (${count})`;
  return "Saved stays";
}

function Matches() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [brief, setBrief] = useState<Brief>(DEFAULT_BRIEF);
  const [matches, setMatches] = useState<MatchedStay[]>([]);
  const [rest, setRest] = useState<MatchedStay[]>([]);
  const [checkIn, setCheckIn] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>("matches");
  const [query, setQuery] = useState("");
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [lastMileByPackage, setLastMileByPackage] = useState<Record<string, string>>({});
  const savedIds = useSavedIds();

  useEffect(() => {
    const stored = loadBriefWithDates();
    const fromUrl = searchHasBrief(search);
    const next: BriefUrlState = fromUrl
      ? mergeBriefUrl(stored, searchToBrief(search))
      : { ...stored };
    next.checkIn = checkInOnOrAfterToday(next.checkIn ?? loadPending()?.checkIn);
    saveBriefWithDates(next);
    setBrief(next);
    const scored = scorePackages(next);
    setMatches(scored.slice(0, 3));
    setRest(scored.slice(3));
    setCheckIn(next.checkIn ?? loadPending()?.checkIn);
    setLastMileByPackage(loadTravelDraft().lastMileByPackage);
    setReady(true);
    // Persist into the URL so a shared matches link is reproducible.
    if (!fromUrl) {
      void nav({ to: "/matches", search: briefToSearch(next), replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from URL + storage
  }, []);

  const list = useMemo(() => {
    let src: StayPackage[] =
      tab === "all"
        ? listPackages()
        : tab === "saved"
          ? listPackages().filter((p) => savedIds.includes(p.id))
          : matches;
    const q = query.trim().toLowerCase();
    if (q) {
      src = src.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q),
      );
    }
    return src;
  }, [tab, query, matches, savedIds]);

  const title = headingFor(tab, tab === "all" ? listPackages().length : list.length);
  const topMatch = tab === "matches" && !query ? matches[0] : undefined;
  const planSearch = briefToSearch({ ...brief, checkIn });

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Stagger>
          <p className="eyebrow">Matches</p>
          <h1 className="mt-2 font-display text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-muted">
            Ranked for a {brief.nights}-night {brief.style} trip from {getOrigin(brief.origin).label},{" "}
            {brief.budget} budget, {brief.vibe} vibe
            {brief.flexible ? ", with flexible dates" : ""}
            {checkIn ? `, check-in ${formatCheckInLabel(checkIn)}` : ""}. {rankingBlurb(brief)} Three
            on the short list; the other nine stay visible below.
          </p>
        </Stagger>

        {ready && tab === "matches" && !query && matches[0] ? (
          <div className="mt-8 space-y-2">
            <TravelEstimateCard
              arriveBy={brief.arriveBy}
              quote={quoteTravel(matches[0].id, brief, { lastMileId: lastMileByPackage[matches[0].id] })}
            />
            {brief.arriveBy === "train" || brief.arriveBy === "bus" ? (
              <p className="text-xs text-subtle">
                Stays are ranked for a {brief.arriveBy} arrival. The line above suggests a last-mile
                option from the station or bus stand — it does not replace your {brief.arriveBy} choice.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {topMatch ? (
            <Button asChild size="lg" className="flex-1 md:flex-none">
              <Link to="/trip/$id" params={{ id: topMatch.id }}>
                View top match
              </Link>
            </Button>
          ) : null}
          {ready && tab === "matches" && matches.length > 0 ? (
            <Button type="button" variant="outline" size="lg" onClick={() => setPlannerOpen(true)}>
              Plan my travel
            </Button>
          ) : null}
          <Button asChild variant="outline" size="lg" className={topMatch ? "hidden md:inline-flex" : "flex-1"}>
            <Link to="/plan" search={planSearch}>
              Edit brief
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SlidingTabs
            tabs={[
              { id: "matches", label: "Matches" },
              { id: "saved", label: "Saved" },
              { id: "all", label: "All stays" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="w-full sm:max-w-xs">
            <ClearInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search hotels"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {!ready
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)
            : list.map((pkg, i) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  rank={
                    tab === "matches" && !query
                      ? "weakMatch" in pkg && pkg.weakMatch
                        ? "Weak match"
                        : RANK_LABELS[i]
                      : undefined
                  }
                  rankWhy={
                    tab === "matches" && !query ? rankEyebrow(pkg, brief, i) : undefined
                  }
                  nights={brief.nights}
                  checkIn={checkIn}
                  originWhy={undefined}
                  brief={brief}
                  lastMileId={lastMileByPackage[pkg.id]}
                  onLastMile={
                    tab === "matches"
                      ? (id) => {
                          patchTravelDraft(pkg.id, { lastMileId: id });
                          setLastMileByPackage((prev) => ({ ...prev, [pkg.id]: id }));
                        }
                      : undefined
                  }
                />
              ))}
        </div>
        {ready && list.length === 0 ? (
          <p className="mt-6 text-muted">
            {tab === "saved"
              ? "No saved stays yet — tap the heart on a hotel."
              : query
                ? "Nothing matches that search."
                : "No strong matches — try adjusting your brief."}
          </p>
        ) : null}
        {!ready ? (
          <p className="mt-6">
            <Shimmer>Matching your brief</Shimmer>
          </p>
        ) : null}

        {ready && tab === "matches" && !query && rest.length > 0 ? (
          <details className="mt-10 rounded-xl border border-border bg-elevated open:pb-4">
            <summary className="cursor-pointer list-none px-4 py-4 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                <span>
                  See the other {rest.length}
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Three-rule short list stays on top — the rest of the catalog is still here.
                  </span>
                </span>
                <span className="text-muted" aria-hidden>
                  ▾
                </span>
              </span>
            </summary>
            <div className="grid gap-3 border-t border-border px-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((pkg, i) => (
                <Link
                  key={pkg.id}
                  to="/trip/$id"
                  params={{ id: pkg.id }}
                  className="rounded-lg border border-border bg-bg px-3 py-3 transition-colors hover:bg-surface"
                >
                  <p className="text-xs text-subtle">#{i + 4} in this ranking</p>
                  <p className="mt-0.5 font-display text-base leading-snug">{pkg.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {pkg.neighborhood} · {pkg.budget}
                  </p>
                </Link>
              ))}
            </div>
          </details>
        ) : null}

        {ready && tab === "matches" && !query && matches.length >= 2 ? (
          <ReviewerCompare items={matches.map((p) => ({ id: p.id, name: p.name }))} />
        ) : null}

        <LearnMore to="/plan" className="mt-8 hidden text-sm font-medium text-primary md:inline-flex">
          Edit brief
        </LearnMore>
      </div>
      {plannerOpen ? (
        <TravelPlanner
          brief={brief}
          packages={matches.slice(0, 3)}
          lastMileByPackage={lastMileByPackage}
          onSelectLastMile={(packageId, lastMileId) => {
            patchTravelDraft(packageId, { lastMileId });
            setLastMileByPackage((prev) => ({ ...prev, [packageId]: lastMileId }));
          }}
          onClose={() => setPlannerOpen(false)}
        />
      ) : null}
    </Shell>
  );
}
