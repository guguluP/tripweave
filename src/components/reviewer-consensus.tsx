import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Minus,
  RefreshCw,
  Youtube,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shimmer } from "@/components/motion";
import {
  getReviewerConsensus,
  refreshReviewerConsensus,
} from "@/lib/youtube/server";
import type { PackageReviewConsensus, Sentiment } from "@/lib/youtube/types";
import { getSeededConsensus } from "@/lib/youtube/get-seeded";
import { captionFailureCopy, isCaptionHostBlock } from "@/lib/youtube/caption-copy";
import { cn } from "@/lib/utils";

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "Mostly positive",
  mixed: "Mixed",
  negative: "Mostly critical",
};

function formatUpdated(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <Badge
      className={cn(
        "border font-medium",
        sentiment === "positive" && "border-ok/30 bg-ok/10 text-ok",
        sentiment === "negative" && "border-danger/30 bg-danger/10 text-danger",
        sentiment === "mixed" && "border-border bg-surface text-muted",
      )}
    >
      {SENTIMENT_LABEL[sentiment]}
    </Badge>
  );
}

function ConsensusSkeleton() {
  return (
    <Card className="mt-10 p-5 shadow-none">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-7 w-64" />
      <Skeleton className="mt-4 h-16 w-full" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
    </Card>
  );
}

export function ReviewerConsensus({
  packageId,
  roomId,
  roomName,
  onConsensus,
}: {
  packageId: string;
  roomId?: string;
  roomName?: string;
  onConsensus?: (consensus: PackageReviewConsensus) => void;
}) {
  const onConsensusRef = useRef(onConsensus);
  onConsensusRef.current = onConsensus;
  const [data, setData] = useState<PackageReviewConsensus | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setMessage(null);
    void getReviewerConsensus({ data: { packageId } })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok && !res.consensus) {
          setStatus("error");
          setMessage(res.message);
          return;
        }
        const consensus = res.consensus;
        if (!consensus || consensus.origin === "empty") {
          setData(consensus ?? null);
          setStatus("empty");
          return;
        }
        setData(consensus);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        const seed = getSeededConsensus(packageId);
        if (seed) {
          setData(seed);
          setStatus("ready");
          return;
        }
        setStatus("error");
        setMessage("Could not load reviewer notes.");
      });
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  useEffect(() => {
    if (data) onConsensusRef.current?.(data);
  }, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const res = await refreshReviewerConsensus({ data: { packageId } });
      if (res.consensus && res.consensus.origin !== "empty") {
        setData(res.consensus);
        setStatus("ready");
        if (!res.ok) setMessage(res.message);
      } else if (!res.ok) {
        setMessage(res.message);
      }
    } catch {
      setMessage("Rebuild did not finish. The saved notes are still here.");
    } finally {
      setRefreshing(false);
    }
  };

  if (status === "loading") return <ConsensusSkeleton />;

  if (status === "error" && !data) {
    return (
      <Card className="mt-10 p-5 shadow-none">
        <p className="eyebrow">YouTube reviewers</p>
        <h2 className="mt-2 font-display text-2xl">Reviewer consensus</h2>
        <p className="mt-3 text-sm text-muted">
          {message ?? "No recent video reviews found."}
        </p>
      </Card>
    );
  }

  if (status === "empty" || !data) {
    return (
      <Card className="mt-10 p-5 shadow-none">
        <p className="eyebrow">YouTube reviewers</p>
        <h2 className="mt-2 font-display text-2xl">Reviewer consensus</h2>
        <p className="mt-3 text-sm text-muted">No recent video reviews found.</p>
      </Card>
    );
  }

  const count = data.sources.length;
  const basedOn =
    count === 0
      ? "No source videos yet"
      : `Based on ${count} YouTube ${count === 1 ? "review" : "reviews"}`;
  const failedCount = data.failedSources?.length ?? 0;
  const failedCopy =
    data.rebuildNote ?? (failedCount > 0 ? captionFailureCopy(data.failedSources ?? []) : null);
  const blockedAll =
    failedCount > 0 && (data.failedSources ?? []).every((f) => isCaptionHostBlock(f.reason));
  const roomNotes = roomId ? data.roomNotes?.[roomId] : undefined;

  return (
    <section className="mt-10" aria-labelledby="reviewer-consensus-title">
      <Card className="p-5 shadow-none sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">YouTube reviewers</p>
            <h2 id="reviewer-consensus-title" className="mt-2 font-display text-2xl">
              What reviewers actually said
            </h2>
          </div>
          <SentimentBadge sentiment={data.overallSentiment} />
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {data.consensusSummary}
        </p>

        {roomNotes ? (
          <div className="mt-6 rounded-lg border border-primary/20 bg-bg p-4">
            <p className="eyebrow">This room</p>
            <h3 className="mt-1 font-display text-lg">
              {roomName ?? "Selected room"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{roomNotes.summary}</p>
            {roomNotes.positives.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {roomNotes.positives.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            {roomNotes.watchouts.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {roomNotes.watchouts.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <Minus className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ok">
              <Check className="size-3.5" aria-hidden />
              Worked well
            </p>
            {data.keyPositives.length ? (
              <ul className="mt-3 space-y-2">
                {data.keyPositives.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ok" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Nothing consistent yet.</p>
            )}
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger">
              <Minus className="size-3.5" aria-hidden />
              Watch-outs
            </p>
            {data.keyNegatives.length ? (
              <ul className="mt-3 space-y-2">
                {data.keyNegatives.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No repeating complaints.</p>
            )}
          </div>
        </div>

        {data.caveats.length > 0 ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-muted">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
            <ul className="space-y-1">
              {data.caveats.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
        {!message && failedCopy ? <p className="mt-4 text-sm text-muted">{failedCopy}</p> : null}

        <div className="mt-5 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setSourcesOpen((o) => !o)}
            className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-medium"
            aria-expanded={sourcesOpen}
          >
            <span className="flex items-center gap-2 text-fg">
              <Youtube className="size-4 text-muted" aria-hidden />
              {basedOn}
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted transition-transform duration-150",
                sourcesOpen && "rotate-180",
              )}
            />
          </button>
          {sourcesOpen ? (
            <ul className="mt-2 space-y-1 pb-1">
              {data.sources.map((src) => (
                <li key={src.videoId}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center rounded-md px-2 py-2 text-sm text-primary hover:bg-surface"
                  >
                    {src.title ?? src.videoId}
                    <span className="ml-2 text-xs text-muted">
                      {src.language.toUpperCase()}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {failedCount > 0 && !blockedAll && !failedCopy ? (
            <p className="mt-2 text-xs text-subtle">
              {failedCount} {failedCount === 1 ? "video had" : "videos had"} no usable captions.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-subtle">
              {data.origin === "live" ? "Rebuilt from captions" : "Curated from stay-review videos"}
              {data.updatedAt ? ` · ${formatUpdated(data.updatedAt)}` : ""}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => void onRefresh()}
              disabled={refreshing}
              className="text-muted"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
              {refreshing ? (
                <Shimmer>Watching the videos</Shimmer>
              ) : (
                "Rebuild from videos"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}

export function ReviewerChip({ packageId }: { packageId: string }) {
  const seed = getSeededConsensus(packageId);
  if (!seed || seed.origin === "empty") return null;
  const sentiment = seed.overallSentiment;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        sentiment === "positive" && "border-ok/30 bg-ok/10 text-ok",
        sentiment === "negative" && "border-danger/30 bg-danger/10 text-danger",
        sentiment === "mixed" && "border-border bg-elevated/90 text-muted",
      )}
    >
      Reviewers {SENTIMENT_LABEL[sentiment].toLowerCase()}
    </span>
  );
}

/** Side-by-side snapshot for the three-stay comparison. Uses seed, no network. */
export function ReviewerCompare({
  items,
}: {
  items: { id: string; name: string }[];
}) {
  if (items.length < 2) return null;
  return (
    <section className="mt-12" aria-labelledby="reviewer-compare-title">
      <p className="eyebrow">YouTube reviewers</p>
      <h2 id="reviewer-compare-title" className="mt-2 font-display text-2xl">
        How reviewers split them
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Structured notes from stay-review videos — not star averages.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const seed = getSeededConsensus(item.id);
          return (
            <Card key={item.id} className="flex h-full flex-col p-4 shadow-none">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg leading-snug">{item.name}</h3>
                {seed ? <SentimentBadge sentiment={seed.overallSentiment} /> : null}
              </div>
              {seed ? (
                <>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">
                    {seed.consensusSummary}
                  </p>
                  {seed.keyPositives[0] ? (
                    <p className="mt-4 flex gap-2 text-sm">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden />
                      {seed.keyPositives[0]}
                    </p>
                  ) : null}
                  {seed.keyNegatives[0] ? (
                    <p className="mt-2 flex gap-2 text-sm">
                      <Minus className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
                      {seed.keyNegatives[0]}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">No recent video reviews found.</p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
