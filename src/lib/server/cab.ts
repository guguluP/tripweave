import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LANDMARKS, stayPin } from "@/lib/places";

const FLAG_INR = 50;
const PER_KM_INR = 25;

export type CabLeg = {
  id: string;
  label: string;
  km: number;
  minutes: number;
  inr: number;
};

export const quoteCab = createServerFn({ method: "POST" })
  .validator((packageId: string) => z.string().min(1).max(80).parse(packageId))
  .handler(async ({ data }): Promise<CabLeg[] | { ok: false; message: string }> => {
    const stay = stayPin(data, data);
    if (!stay) return { ok: false, message: "This stay has no map pin yet." };
    const legs: CabLeg[] = [];
    for (const mark of LANDMARKS) {
      const url = `https://router.project-osrm.org/route/v1/driving/${stay.lng},${stay.lat};${mark.lng},${mark.lat}?overview=false`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as { routes?: { distance?: number; duration?: number }[] };
      const route = json.routes?.[0];
      if (!route?.distance || !route.duration) continue;
      const km = Math.round((route.distance / 1000) * 10) / 10;
      const minutes = Math.max(1, Math.round(route.duration / 60));
      legs.push({
        id: mark.id,
        label: mark.label,
        km,
        minutes,
        inr: FLAG_INR + Math.round(km * PER_KM_INR),
      });
    }
    if (legs.length === 0) return { ok: false, message: "Road quotes are unavailable right now." };
    return legs;
  });
