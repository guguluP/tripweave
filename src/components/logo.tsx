import { cn } from "@/lib/utils";
import { MARK_SRC } from "./brand-assets";

export function WeaveMark({ className }: { className?: string }) {
  return (
    <img
      src={MARK_SRC}
      alt=""
      className={cn("size-10 shrink-0 object-contain", className)}
    />
  );
}

export function BrandWord({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-[1.35rem] font-semibold leading-none tracking-tight text-[#12343C]",
        className,
      )}
    >
      Trip
      <span className="text-[#2A9B96]">W</span>
      <span className="text-[#E07A2F]">eave</span>
    </span>
  );
}

export function BrandLockup({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 overflow-visible", className)}>
      <WeaveMark className={markClassName} />
      <BrandWord />
    </span>
  );
}
