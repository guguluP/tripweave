import { cn } from "@/lib/utils";

export function Shimmer({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={cn("t-shimmer", className)} data-text={children}>
      {children}
    </span>
  );
}
