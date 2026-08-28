import { cn } from "@/lib/utils";
import { DigitPop } from "@/components/motion";

export function TrustMeter({
  score,
  reviews,
  compact = false,
}: {
  score: number;
  reviews: number;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      <div
        className="grid size-9 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-primary) ${score}%, var(--color-border) 0)`,
        }}
        aria-label={`Trust score ${score}`}
      >
        <span className="grid size-7 place-items-center rounded-full bg-elevated text-xs font-semibold tabular-nums text-fg">
          <DigitPop value={score} />
        </span>
      </div>
      {!compact && (
        <div>
          <p className="text-xs font-semibold text-fg">Trust Score</p>
          <p className="text-xs text-muted">
            {reviews.toLocaleString("en-IN")} verified
          </p>
        </div>
      )}
    </div>
  );
}
