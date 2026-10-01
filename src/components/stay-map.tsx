import { useEffect, useState } from "react";
import { quoteCab, type CabLeg } from "@/lib/server/cab";
import { LANDMARKS, stayPin } from "@/lib/places";
import { mapplsPinUrl } from "@/lib/mappls";
import { MapplsMap } from "@/components/mappls-map";
import { formatMoney } from "@/lib/packages";
import { stayWalkTimes } from "@/lib/walk-estimate";

export function StayMap({ packageId, name }: { packageId: string; name: string }) {
  const stay = stayPin(packageId, name);
  const [legs, setLegs] = useState<CabLeg[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const walks = stay ? stayWalkTimes(packageId, name) : null;

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
  const mappls = mapplsPinUrl(stay.lat, stay.lng);

  return (
    <section className="mt-10 scroll-mt-24" aria-labelledby="stay-map-title">
      <h2 id="stay-map-title" className="font-display text-2xl">Where it sits</h2>
      <p className="mt-1 text-sm text-muted">
        The stay against the temple, the station, and the beach. Cab prices use live road distance;
        walking times below are straight-line estimates at ~5 km/h.
      </p>
      <div className="map-frame relative mt-4 h-72 overflow-hidden rounded-xl border border-border">
        <MapplsMap
          title={`Map of ${name} in Puri`}
          className="h-full w-full"
          markers={[stay, ...LANDMARKS].map((pin) => ({ lat: pin.lat, lng: pin.lng, label: pin.label }))}
        />
      </div>
      <a href={mappls} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
        Open this pin on Mappls
      </a>
      {walks && (walks.templeMinutes != null || walks.stationMinutes != null) ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {walks.templeMinutes != null ? (
            <li className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm">
              <p className="font-medium">Walk to Jagannath Temple</p>
              <p className="text-muted">~{walks.templeMinutes} min · estimate</p>
            </li>
          ) : null}
          {walks.stationMinutes != null ? (
            <li className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm">
              <p className="font-medium">Walk to Puri station</p>
              <p className="text-muted">~{walks.stationMinutes} min · estimate</p>
            </li>
          ) : null}
        </ul>
      ) : null}
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
