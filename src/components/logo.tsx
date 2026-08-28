import { cn } from "@/lib/utils";

export function WeaveMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 22V10h4.2c2.6 0 4.2 1.4 4.2 3.5 0 1.2-.6 2.2-1.6 2.8 1.3.5 2.1 1.7 2.1 3.2 0 2.3-1.7 3.5-4.5 3.5H8zm3.1-7.2h1.2c1.1 0 1.7-.5 1.7-1.4s-.6-1.4-1.7-1.4h-1.2v2.8zm0 5.2h1.5c1.2 0 1.9-.5 1.9-1.5s-.7-1.5-1.9-1.5h-1.5v3z"
        className="fill-primary-fg"
      />
      <path
        d="M18.2 10h2.8l3.9 12h-3.1l-.6-2H19l-.6 2h-3.1l3.9-12zm.9 7.4h2.7l-1.3-4.4-1.4 4.4z"
        className="fill-primary-fg"
      />
    </svg>
  );
}

export function BrandWord({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-semibold tracking-tight", className)}>
      TripWeave
    </span>
  );
}
