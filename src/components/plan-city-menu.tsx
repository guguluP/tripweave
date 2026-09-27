import { useEffect, useMemo, useRef, useState } from "react";
import { ORIGINS, getOrigin } from "@/lib/origins";
import { searchWorldCities, type WorldCity } from "@/lib/world-cities";
import type { Brief } from "@/lib/packages";
import { cn } from "@/lib/utils";

export function CityMenu({
  origin,
  originCity,
  homeCity,
  onListed,
  onCustom,
}: {
  origin: Brief["origin"];
  originCity: string;
  homeCity: string;
  onListed: (id: Brief["origin"]) => void;
  onCustom: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const listed = ORIGINS.filter((city) => city.id !== "other");
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!q) return listed;
    return listed.filter((city) => city.label.toLowerCase().includes(q) || city.hint.toLowerCase().includes(q));
  }, [listed, q]);
  const world = useMemo(() => {
    const hits = searchWorldCities(query);
    const listedNames = new Set(shown.map((city) => city.label.toLowerCase()));
    return hits.filter((city) => !listedNames.has(city.name.toLowerCase()));
  }, [query, shown]);
  const accountCity = homeCity.trim();
  const showAccount =
    accountCity.length > 1 &&
    (!q || accountCity.toLowerCase().includes(q)) &&
    !shown.some((city) => city.label.toLowerCase() === accountCity.toLowerCase()) &&
    !world.some((city) => city.name.toLowerCase() === accountCity.toLowerCase());
  const typed = query.trim();
  const typedAlready =
    !typed ||
    shown.some((city) => city.label.toLowerCase() === typed.toLowerCase()) ||
    world.some((city) => city.name.toLowerCase() === typed.toLowerCase()) ||
    accountCity.toLowerCase() === typed.toLowerCase();
  const label = origin === "other" ? originCity.trim() || "Somewhere else" : getOrigin(origin).label;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={box} className="relative mt-3">
      <button
        type="button"
        className="flex min-h-14 w-full items-center justify-between rounded-lg border border-border bg-elevated px-4 text-left text-base"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
      >
        <span>
          <span className="block font-medium">{label}</span>
          <span className="block text-sm text-muted">
            {origin === "other" ? "Your city" : getOrigin(origin).hint}
          </span>
        </span>
        <span className="text-muted" aria-hidden>▾</span>
      </button>
      {open ? (
        <div className="absolute z-40 mt-2 w-full rounded-lg border border-border bg-bg p-2 shadow-lg">
          <input
            autoFocus
            className="min-h-12 w-full rounded-md border border-border bg-elevated px-3 text-base"
            placeholder="Search any city in India or abroad"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="mt-2 max-h-72 overflow-auto">
            {showAccount ? (
              <li>
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-3 text-left hover:bg-surface"
                  onClick={() => {
                    onCustom(accountCity);
                    setOpen(false);
                  }}
                >
                  <span className="block text-base font-medium">{accountCity}</span>
                  <span className="block text-sm text-muted">From your account</span>
                </button>
              </li>
            ) : null}
            {shown.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-3 text-left hover:bg-surface"
                  onClick={() => {
                    onListed(city.id);
                    setOpen(false);
                  }}
                >
                  <span className="block text-base font-medium">{city.label}</span>
                  <span className="block text-sm text-muted">{city.hint}</span>
                </button>
              </li>
            ))}
            {world.map((city) => (
              <WorldRow
                key={`${city.name}-${city.place}`}
                city={city}
                onPick={() => {
                  onCustom(city.name);
                  setOpen(false);
                }}
              />
            ))}
            {typed && !typedAlready ? (
              <li>
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-3 text-left hover:bg-surface"
                  onClick={() => {
                    onCustom(typed);
                    setOpen(false);
                  }}
                >
                  <span className="block text-base font-medium">Use “{typed}”</span>
                  <span className="block text-sm text-muted">Any city in India or abroad</span>
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function WorldRow({ city, onPick }: { city: WorldCity; onPick: () => void }) {
  return (
    <li>
      <button type="button" className="w-full rounded-md px-3 py-3 text-left hover:bg-surface" onClick={onPick}>
        <span className="block text-base font-medium">{city.name}</span>
        <span className="block text-sm text-muted">{city.place}</span>
      </button>
    </li>
  );
}

export function Choice({
  selected,
  title,
  hint,
  detail,
  onClick,
}: {
  selected: boolean;
  title: string;
  hint?: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-3 text-left transition-colors duration-150",
        selected
          ? "border-primary bg-surface"
          : "border-border bg-elevated hover:bg-surface",
      )}
    >
      <span className="block text-sm font-medium">{title}</span>
      {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      {detail ? <span className="mt-2 block text-xs text-fg/80">{detail}</span> : null}
    </button>
  );
}
