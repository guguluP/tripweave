import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/packages";
import { ALLOTMENT_LABEL, type StayQuote } from "@/lib/inventory";
import { cn } from "@/lib/utils";

function monthCells(cursor: string) {
  const [y, m] = cursor.slice(0, 7).split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const start = first.getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: Array<{ iso: string; day: number } | null> = Array.from({ length: start }, () => null);
  for (let day = 1; day <= days; day++) {
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ iso, day });
  }
  return { label: first.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }), cells };
}

function shiftMonth(iso: string, delta: number) {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1 + delta, 1));
  return next.toISOString().slice(0, 10);
}

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
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(checkIn || minDate);
  const month = useMemo(() => monthCells(cursor || minDate), [cursor, minDate]);
  const shown = checkIn
    ? new Date(`${checkIn}T12:00:00+05:30`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "Choose a date";

  return (
    <section className="mt-8 rounded-xl border border-border bg-elevated p-4">
      <p className="eyebrow">Live rate</p>
      <h2 className="mt-1 font-display text-xl">Dates and leftover rooms</h2>
      <div className="mt-4">
        <p className="text-sm font-medium">Check-in</p>
        <button
          type="button"
          className="mt-2 flex min-h-11 w-full items-center rounded-md border border-border bg-bg px-3 text-left text-sm"
          aria-expanded={open}
          onClick={() => setOpen((on) => !on)}
        >
          {shown}
        </button>
        {open ? (
          <div className="mt-2 rounded-lg border border-border bg-bg p-3">
            <div className="flex items-center justify-between">
              <button type="button" className="min-h-9 px-2 text-sm" onClick={() => setCursor(shiftMonth(cursor || minDate, -1))} aria-label="Previous month">
                ‹
              </button>
              <p className="text-sm font-medium">{month.label}</p>
              <button type="button" className="min-h-9 px-2 text-sm" onClick={() => setCursor(shiftMonth(cursor || minDate, 1))} aria-label="Next month">
                ›
              </button>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {month.cells.map((cell, i) =>
                cell ? (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={cell.iso < minDate}
                    onClick={() => {
                      onCheckIn(cell.iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "min-h-9 rounded-md text-sm",
                      cell.iso === checkIn ? "bg-primary text-primary-fg" : "hover:bg-surface",
                      cell.iso < minDate && "text-subtle",
                    )}
                  >
                    {cell.day}
                  </button>
                ) : (
                  <span key={`e-${i}`} />
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
      {quote ? (
        <div className="mt-4">
          <p className="text-sm text-muted">
            {quote.available
              ? `${ALLOTMENT_LABEL}: ${quote.remaining} of ${quote.units} ${quote.occupancy}-guest rooms left for these nights.`
              : `${ALLOTMENT_LABEL}: sold out on at least one of these nights. Change the date or room.`}
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
