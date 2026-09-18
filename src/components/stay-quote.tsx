import { formatMoney } from "@/lib/packages";
import { type StayQuote } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export function StayQuoteCard({
  quote,
  checkIn,
  onCheckIn,
  minDate,
}: {
  quote: StayQuote | null;
  checkIn: string;
  onCheckIn: (iso: string) => void;
  minDate: string;
}) {
  return (
    <section className="mt-8 rounded-xl border border-border bg-elevated p-4">
      <p className="eyebrow">Live rate</p>
      <h2 className="mt-1 font-display text-xl">Dates and leftover rooms</h2>
      <label className="mt-4 block text-sm font-medium">
        Check-in
        <input
          type="date"
          min={minDate}
          value={checkIn}
          onChange={(e) => onCheckIn(e.target.value)}
          suppressHydrationWarning
          className="mt-2 flex min-h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
        />
      </label>
      {quote ? (
        <div className="mt-4">
          <p className="text-sm text-muted">
            {quote.available
              ? `${quote.remaining} of ${quote.units} ${quote.occupancy}-guest rooms left for these nights.`
              : "Sold out on at least one of these nights. Change the date or room."}
          </p>
          <ul className="mt-3 grid gap-1.5">
            {quote.nightsQuoted.map((n) => (
              <li
                key={n.date}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                  n.remaining <= 0 ? "border-danger/30 bg-danger/5 text-danger" : "border-border bg-surface",
                )}
              >
                <span>
                  {n.date}
                  <span className="ml-2 text-xs text-muted">{n.label}</span>
                </span>
                <span className="tabular-nums">
                  {n.remaining <= 0 ? "Sold out" : `${formatMoney(n.rate)} · ${n.remaining} left`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
