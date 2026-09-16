import { cn } from "@/lib/utils";
import { DigitPop } from "@/components/motion";
import {
  TRUST_SCORE_EXPLAINER,
  formatTrustScore,
  youtubeSourcesLabel,
} from "@/lib/trust-score";

export function TrustMeter({
  score,
  youtubeSources,
  compact = false,
}: {
  score: number;
  /** Curated YouTube stay-review / tour count for this property. */
  youtubeSources: number;
  compact?: boolean;
}) {
  const label = formatTrustScore(score);
  const pct = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div
      className={cn("flex items-center gap-3", compact && "gap-2")}
      title={TRUST_SCORE_EXPLAINER}
    >
      <div
        className={cn("grid shrink-0 place-items-center rounded-full", compact ? "size-8" : "size-9")}
        style={{
          background: `conic-gradient(var(--color-primary) ${pct}%, var(--color-border) 0)`,
        }}
        aria-hidden
      >
        <span
          className={cn(
            "grid place-items-center rounded-full bg-elevated font-semibold tabular-nums text-fg",
            compact ? "size-6 text-[0.65rem]" : "size-7 text-xs",
          )}
        >
          {pct}
        </span>
      </div>
      {compact ? (
        <div className="min-w-0 text-right">
          <p className="text-xs font-semibold tabular-nums text-fg">
            <DigitPop value={label} />
          </p>
          <p className="text-[0.65rem] text-muted">{youtubeSourcesLabel(youtubeSources)}</p>
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-fg">
            Trust Score <DigitPop value={label} />
          </p>
          <p className="text-xs text-muted">{youtubeSourcesLabel(youtubeSources)}</p>
          <p className="mt-0.5 max-w-[14rem] text-[0.65rem] leading-snug text-subtle">
            {TRUST_SCORE_EXPLAINER}
          </p>
        </div>
      )}
    </div>
  );
}
