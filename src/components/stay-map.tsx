import { useEffect, useState } from "react";
import { quoteCab, type CabLeg } from "@/lib/server/cab";
import { LANDMARKS, mapFrame, pinPosition, stayPin } from "@/lib/places";
import { formatMoney } from "@/lib/packages";

const KIND_CLASS: Record<string, string> = {
  stay: "bg-primary",
  temple: "bg-fg",
  station: "bg-muted-fg",
  beach: "bg-sky-700",
};

export function StayMap({ packageId, name }: { packageId: string; name: string }) {
  const stay = stayPin(packageId, name);
  const [legs, setLegs] = useState<CabLeg[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    quoteCab({ data: packageId })
      .then((result) => {
        if (cancel) return;
        if (Array.isArray(result)) setLegs(result);
        else setNote(result.message);
      })
      .catch(() => {
        if (!cancel) setNote("Road quotes are unavailable right now.");
      });
    return () => {
      cancel = true;
    };
  }, [packageId]);

  if (!stay) return null;
  const pins = [stay, ...LANDMARKS];
  const frame = mapFrame(pins);
  const osm = `https://www.openstreetmap.org/?mlat=${stay.lat}&mlon=${stay.lng}#map=14/${stay.lat}/${stay.lng}`;

  return (
    <section className="mt-10 scroll-mt-24" aria-labelledby="stay-map-title">
      <h2 id="stay-map-title" className="font-display text-2xl">Where it sits</h2>
      <p className="mt-1 text-sm text-muted">The stay against the temple, the station, and the beach. Cab prices use live road distance.</p>
      <div className="relative mt-4 h-72 overflow-hidden rounded-xl border border-border bg-[#d7e4d4]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,60,40,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(30,60,40,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {pins.map((pin) => (
          <span
            key={pin.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={pinPosition(pin, frame)}
          >
            <span className={`block size-3 rounded-full ring-2 ring-white ${KIND_CLASS[pin.kind]}`} />
            <span className="mt-1 block max-w-28 text-[10px] font-medium leading-tight text-fg">{pin.label}</span>
          </span>
        ))}
      </div>
      <a href={osm} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
        Open this pin on OpenStreetMap
      </a>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {(legs ?? []).map((leg) => (
          <li key={leg.id} className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm">
            <p className="font-medium">{leg.label}</p>
            <p className="text-muted">{leg.km} km · {leg.minutes} min</p>
            <p>{formatMoney(leg.inr)} cab</p>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
      <p className="mt-2 text-xs text-muted">₹50 flag fall + ₹25 per km of the driving route. Not an Ola or Uber fare.</p>
    </section>
  );
}
