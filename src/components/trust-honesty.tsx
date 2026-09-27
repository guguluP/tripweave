import { AlertTriangle, Check } from "lucide-react";
import { getSeededConsensus } from "@/lib/youtube/get-seeded";
import type { PackageReviewConsensus } from "@/lib/youtube/types";
import { cn } from "@/lib/utils";

/**
 * Above-the-fold honesty strip on the stay page: reviewer caveats and the
 * reason an honesty bonus is in the Trust Score — before the long consensus card.
 */
export function TrustHonestyStrip({
  packageId,
  consensus,
  honestyBonus,
  className,
}: {
  packageId: string;
  consensus?: PackageReviewConsensus | null;
  honestyBonus?: boolean;
  className?: string;
}) {
  const seed = consensus ?? getSeededConsensus(packageId);
  if (!seed || seed.origin === "empty") return null;

  const caveats = seed.caveats ?? [];
  const watchouts = seed.keyNegatives?.slice(0, 2) ?? [];
  if (caveats.length === 0 && watchouts.length === 0 && !honestyBonus) return null;

  return (
    <aside
      className={cn(
        "mt-5 rounded-xl border border-border bg-elevated/80 px-4 py-3",
        className,
      )}
      aria-label="Reviewer caveats"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow">Before you book</p>
        {honestyBonus ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-[0.65rem] font-medium text-ok">
            <Check className="size-3" aria-hidden />
            Honesty bonus in Trust Score
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted">
        Reviewer caveats sit here on purpose — TripWeave rewards notes that name the
        watch-outs, not only the praise.
      </p>
      {caveats.length > 0 || watchouts.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {caveats.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-snug text-fg">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
              {item}
            </li>
          ))}
          {caveats.length === 0
            ? watchouts.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-snug text-fg">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                  {item}
                </li>
              ))
            : null}
        </ul>
      ) : null}
    </aside>
  );
}
