import { useEffect, useId, useState } from "react";

export type MapPoint = { lat: number; lng: number; label: string };

type MapplsMapObj = { remove?: () => void; addListener?: (event: string, fn: () => void) => void };

declare global {
  interface Window {
    mappls?: {
      Map: new (
        id: string,
        options: { center: [number, number]; zoom: number; zoomControl?: boolean },
      ) => MapplsMapObj;
      Marker: new (options: {
        map: MapplsMapObj;
        position: { lat: number; lng: number };
        popupHtml?: string;
        fitbounds?: boolean;
      }) => unknown;
    };
  }
}

let loading: Promise<void> | null = null;

function mapplsKey(): string {
  const raw = import.meta.env.VITE_MAPPLS_KEY;
  return typeof raw === "string" ? raw.trim() : "";
}

function loadMappls(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.mappls?.Map) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://apis.mappls.com/advancedmaps/api/${encodeURIComponent(key)}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.dataset.mappls = "1";
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("mappls"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Mappls map drawn from our coordinates. The key only loads tiles. */
export function MapplsMap({
  markers,
  title,
  className,
}: {
  markers: MapPoint[];
  title: string;
  className?: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const mapId = `mappls-${reactId}`;
  const [failed, setFailed] = useState(false);
  const key = mapplsKey();
  const signature = markers.map((m) => `${m.lat},${m.lng},${m.label}`).join("|");

  useEffect(() => {
    if (!key || markers.length === 0) return;
    let cancel = false;
    let map: MapplsMapObj | undefined;
    loadMappls(key)
      .then(() => {
        if (cancel || !window.mappls?.Map) return;
        const first = markers[0]!;
        map = new window.mappls.Map(mapId, {
          center: [first.lat, first.lng],
          zoom: markers.length > 1 ? 11 : 14,
          zoomControl: true,
        });
        const place = () => {
          if (!window.mappls) return;
          for (const pin of markers) {
            new window.mappls.Marker({
              map: map!,
              position: { lat: pin.lat, lng: pin.lng },
              popupHtml: pin.label,
              fitbounds: true,
            });
          }
        };
        if (map.addListener) map.addListener("load", place);
        else place();
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
      map?.remove?.();
    };
  }, [key, mapId, signature]);

  if (!key || failed) {
    return <p className="text-sm text-muted">Map is unavailable right now.</p>;
  }

  return <div id={mapId} role="region" aria-label={title} className={className ?? "h-full w-full"} />;
}
