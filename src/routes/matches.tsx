import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { PackageCard } from "@/components/package-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClearInput, LearnMore, Shimmer, SlidingTabs, Stagger } from "@/components/motion";
import {
  DEFAULT_BRIEF,
  PACKAGES,
  RANK_LABELS,
  loadBrief,
  matchPackages,
  type Brief,
  type StayPackage,
} from "@/lib/packages";
import { useSavedIds } from "@/lib/saved";

export const Route = createFileRoute("/matches")({ component: Matches });

type Tab = "matches" | "saved" | "all";

function Matches() {
  const [ready, setReady] = useState(false);
  const [brief, setBrief] = useState<Brief>(DEFAULT_BRIEF);
  const [matches, setMatches] = useState<StayPackage[]>([]);
  const [tab, setTab] = useState<Tab>("matches");
  const [query, setQuery] = useState("");
  const savedIds = useSavedIds();

  useEffect(() => {
    const b = loadBrief();
    setBrief(b);
    setMatches(matchPackages(b));
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

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Stagger>
          <p className="eyebrow">Matches</p>
          <h1 className="mt-2 font-display text-4xl">Your three in Puri</h1>
          <p className="mt-3 max-w-xl text-muted">
            Ranked to a {brief.nights}-night {brief.style} trip, {brief.budget} budget, {brief.vibe}{" "}
            vibe{brief.flexible ? ", with flexible dates" : ""}. All-in prices in rupees.
          </p>
        </Stagger>

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
        <LearnMore to="/plan" className="mt-8 text-sm font-medium text-primary">
          Edit brief
        </LearnMore>
      </div>
    </Shell>
  );
}
