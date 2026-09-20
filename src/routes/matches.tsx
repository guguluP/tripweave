import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { PackageCard } from "@/components/package-card";
import { ReviewerCompare } from "@/components/reviewer-consensus";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClearInput, LearnMore, Shimmer, SlidingTabs, Stagger } from "@/components/motion";
import {
  DEFAULT_BRIEF,
  PACKAGES,
  RANK_LABELS,
  loadBrief,
  matchPackages,
  originFitReason,
  rankingBlurb,
  type Brief,
  type StayPackage,
} from "@/lib/packages";
import { useSavedIds } from "@/lib/saved";
import { getOrigin } from "@/lib/origins";
import { loadTravelDraft, patchTravelDraft, quoteTravel } from "@/lib/travel-plan";
import { TravelEstimateCard } from "@/components/travel-estimate";
import { TravelPlanner } from "@/components/travel-planner";

export const Route = createFileRoute("/matches")({ component: Matches });

type Tab = "matches" | "saved" | "all";

function headingFor(tab: Tab, count: number) {
  if (tab === "matches") return "Your three matches";
  if (tab === "all") return `All Puri stays (${count})`;
  return "Saved stays";
}

function Matches() {
  const [ready, setReady] = useState(false);
  const [brief, setBrief] = useState<Brief>(DEFAULT_BRIEF);
  const [matches, setMatches] = useState<StayPackage[]>([]);
  const [tab, setTab] = useState<Tab>("matches");
  const [query, setQuery] = useState("");
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [lastMileByPackage, setLastMileByPackage] = useState<Record<string, string>>({});
  const savedIds = useSavedIds();

  useEffect(() => {
    const b = loadBrief();
    setBrief(b);
    setMatches(matchPackages(b));
    setLastMileByPackage(loadTravelDraft().lastMileByPackage);
    setReady(true);
  }, []);

  const list = useMemo(() => {
    let src: StayPackage[] =
      tab === "all"
        ? PACKAGES
        : tab === "saved"
          ? PACKAGES.filter((p) => savedIds.includes(p.id))
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

  const title = headingFor(tab, tab === "all" ? PACKAGES.length : list.length);
  const topMatch = tab === "matches" && !query ? matches[0] : undefined;

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Stagger>
          <p className="eyebrow">Matches</p>
          <h1 className="mt-2 font-display text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-muted">
            Ranked for a {brief.nights}-night {brief.style} trip from {getOrigin(brief.origin).label},{" "}
            {brief.budget} budget, {brief.vibe} vibe
            {brief.flexible ? ", with flexible dates" : ""}. {rankingBlurb(brief)} Twelve stays in
            the catalog; three on the short list.
          </p>
        </Stagger>

        {/* Primary CTA early on mobile so it is not buried under the bottom nav */}
        {ready && tab === "matches" && !query && matches[0] ? (
          <TravelEstimateCard
            className="mt-8"
            arriveBy={brief.arriveBy}
            quote={quoteTravel(matches[0].id, brief, { lastMileId: lastMileByPackage[matches[0].id] })}
          />
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
            <Link to="/plan">Edit brief</Link>
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
                  rank={tab === "matches" && !query ? RANK_LABELS[i] : undefined}
                  nights={brief.nights}
                  originWhy={
                    tab === "matches" && !query ? originFitReason(pkg, brief) : undefined
                  }
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
