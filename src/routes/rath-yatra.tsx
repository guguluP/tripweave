import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { RathCarousel } from "@/components/rath-carousel";
import { FESTIVAL } from "@/lib/inventory";

export const Route = createFileRoute("/rath-yatra")({
  component: RathYatraPage,
});

function RathYatraPage() {
  const window = FESTIVAL.find(([start]) => start.startsWith("2026-06")) ?? FESTIVAL[0];
  const [start, end] = window ?? ["2026-06-26", "2026-07-06"];
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="eyebrow">Puri · 2026</p>
        <h1 className="mt-2 font-display text-4xl">Rath Yatra rooms</h1>
        <p className="mt-3 text-muted">
          Festival nights in this catalog run {start} through {end}. The room rate uses the festival
          multiplier. A night is sold out only when the hotel desk has set keys for that date, or when
          those keys are already held.
        </p>
        <p className="mt-3 text-sm text-muted">
          If the desk has not published a count, TripWeave will not pretend the chariot week is reserved.
          Checkout fails closed until the shared hold is recorded.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/plan" search={{ checkIn: start }}>
              Plan those dates
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/matches" search={{ checkIn: start }}>
              See the three stays
            </Link>
          </Button>
        </div>
      </div>
      <RathCarousel />
    </Shell>
  );
}
