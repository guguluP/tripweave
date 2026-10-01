import { useEffect, useId, useState } from "react";

export type MapPoint = { lat: number; lng: number; label: string };

type MapplsMapObj = { remove?: () => void; addListener?: (event: string, fn: () => void) => void };

declare global {
  interface Window {
    mappls?: {
      Map: new (
        id: string,
        options: { center: { lat: number; lng: number }; zoom: number; zoomControl?: boolean },
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

/** One frame for every pin. Per-marker fitbounds ends on the last pin, which is the beach. */
function frameFor(markers: MapPoint[]): { center: { lat: number; lng: number }; zoom: number } {
  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.008);
  const lngSpan = Math.max(maxLng - minLng, 0.008);
  const zLat = Math.log2((288 * 0.7 * 360) / (latSpan * 256));
  const zLng = Math.log2((640 * 0.7 * 360) / (lngSpan * 256));
  const zoom = Math.max(9, Math.min(15, Math.round(Math.min(zLat, zLng))));
  return { center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }, zoom };
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
    const domain = window.location.hostname;
    script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${encodeURIComponent(key)}&domain=${encodeURIComponent(domain)}`;
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
        const frame = frameFor(markers);
        map = new window.mappls.Map(mapId, {
          center: frame.center,
          zoom: frame.zoom,
          zoomControl: true,
        });
        const place = () => {
          if (!window.mappls) return;
          for (const pin of markers) {
            new window.mappls.Marker({
              map: map!,
              position: { lat: pin.lat, lng: pin.lng },
              popupHtml: pin.label,
              fitbounds: false,
            });
          }
        };
        const parkControls = () => {
          const root = document.getElementById(mapId);
          const scope = root?.parentElement ?? root;
          if (!scope) return;
          const nodes = scope.querySelectorAll<HTMLElement>("*");
          for (const el of nodes) {
            const name = typeof el.className === "string" ? el.className : "";
            if (!/bottom-right|ctrl-bottom|control-bottom|zoom-control|mappls-ctrl/i.test(name)) continue;
            el.style.position = "absolute";
            el.style.top = "0.5rem";
            el.style.right = "0.5rem";
            el.style.bottom = "auto";
            el.style.left = "auto";
            el.style.zIndex = "2";
          }
        };
        if (map.addListener) map.addListener("load", () => {
          place();
          parkControls();
        });
        else place();
        window.setTimeout(parkControls, 400);
        window.setTimeout(parkControls, 1200);
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
