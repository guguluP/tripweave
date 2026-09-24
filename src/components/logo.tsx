import { cn } from "@/lib/utils";
import { LOCKUP_SRC, MARK_SRC } from "./brand-assets";

export function WeaveMark({ className }: { className?: string }) {
  return (
    <img
      src={MARK_SRC}
      alt=""
      className={cn("size-10 shrink-0 rounded-full object-cover", className)}
    />
  );
}

export function BrandWord({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-semibold tracking-tight text-[#12343C]", className)}>
      TripWeave
    </span>
  );
}

export function BrandLockup({
  className,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <img
      src={LOCKUP_SRC}
      alt="TripWeave"
      className={cn(
        "h-10 w-auto max-w-[min(72vw,280px)] object-contain object-left",
        className,
      )}
    />
  );
}
