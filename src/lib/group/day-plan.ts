import { daysForStay, getPackage, type DayPlan } from "../packages.ts";
import { eachNight, FESTIVAL } from "../inventory.ts";
import { checklistForParty } from "../arrival-rules.ts";

export type GroupDay = DayPlan & { note: string | null };

/** Catalog day skeleton, shorter when elderly guests are travelling, plus a Rath Yatra note. */
export function groupDayPlan(packageId: string, nights: number, elderly: number, checkIn: string): GroupDay[] {
  const pkg = getPackage(packageId);
  if (!pkg) return [];
  const days = daysForStay(pkg, nights);
  const rath = overlapsRath(checkIn, nights);
  return days.map((day, index) => {
    const outing = /konark|chilika|drive/i.test(`${day.title} ${day.base}`);
    let note: string | null = null;
    if (elderly > 0 && outing) note = "Optional. Keep the day short for elderly guests.";
    else if (elderly > 0 && index > 0) note = "A shorter day. The party includes elderly guests.";
    if (rath && index === 0) {
      note = [note, "These dates fall in Rath Yatra. The room rate uses the festival multiplier."].filter(Boolean).join(" ");
    }
    return { ...day, note };
  });
}

export function indianPassportChecklist(checkIn: string) {
  return checklistForParty({ nationalities: ["IN"], arrivalDate: checkIn });
}

function overlapsRath(checkIn: string, nights: number): boolean {
  const nightsOn = eachNight(checkIn, nights);
  return FESTIVAL.some(([start, end]) => start.slice(5, 7) === "06" && nightsOn.some((night) => night >= start && night <= end));
}
