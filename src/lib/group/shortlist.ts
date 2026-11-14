import { originFitScore, listPackages, type Brief, type Budget, type StayPackage, type Vibe } from "../packages.ts";
import {
  eachNight,
  nightIsStopSell,
  publishedNightUnits,
  quoteStay,
} from "../inventory.ts";
import { recommendRooms } from "../recommend-rooms.ts";
import { stayWalkTimes } from "../walk-estimate.ts";
import type { GroupInterest, GroupNeed, LockedRoom, ShortlistStay } from "./types.ts";

export type ShortlistBrief = {
  checkIn: string;
  nights: number;
  adults: number;
  children: number;
  elderly: number;
  budgetPerHeadInr: number | null;
  needs: GroupNeed[];
  interests: GroupInterest[];
};

const RELATED: Record<Vibe, Vibe> = {
  beach: "relax",
  relax: "beach",
  culture: "adventure",
  adventure: "culture",
};

/**
 * Up to five catalog stays that can sleep the party.
 * A stay is lockable only when every night of every chosen room has a published key count.
 * The catalog roomUnits figure is not stock.
 */
export function shortlistForGroup(brief: ShortlistBrief): ShortlistStay[] {
  const party = brief.adults + brief.children;
  if (party < 1) return [];
  const vibe = vibeFor(brief.interests);
  const budget = budgetTier(brief.budgetPerHeadInr);
  const style = brief.children > 0 || brief.adults >= 3 ? "family" : "couple";
  const matchBrief: Brief = {
    vibe,
    budget,
    style,
    nights: brief.nights,
    flexible: false,
    origin: "puri",
    arriveBy: "road",
    adults: brief.adults,
    children: brief.children,
  };

  const rows = listPackages().map((pkg) => {
    const mix = roomMix(pkg, party, brief);
    const fit = fitScore(pkg, matchBrief);
    // listPackages() already applied guest notes; recomputing here showed a different
    // number from the stay page whenever a stay had reviews.
    const trustScore = pkg.trustScore;
    const walk = stayWalkTimes(pkg.id, pkg.name);
    return {
      packageId: pkg.id,
      name: pkg.name,
      area: pkg.area,
      rank: 0,
      fit,
      trustScore,
      templeMinutes: walk?.templeMinutes ?? null,
      rateKind: mix.rateKind,
      totalInr: mix.totalInr,
      perHeadInr: party > 0 ? Math.ceil(mix.totalInr / party) : mix.totalInr,
      roomsReleased: mix.roomsReleased,
      lockable: mix.lockable,
      note: mix.note,
      rooms: mix.rooms,
      walkPenalty: brief.elderly > 0 ? (walk?.templeMinutes ?? 999) : 0,
    };
  });

  const within = brief.budgetPerHeadInr
    ? rows.filter((row) => row.perHeadInr <= brief.budgetPerHeadInr!)
    : rows;
  const pool = within.length > 0 ? within : rows;
  pool.sort((a, b) => {
    if (a.lockable !== b.lockable) return a.lockable ? -1 : 1;
    if (b.fit !== a.fit) return b.fit - a.fit;
    if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
    return a.walkPenalty - b.walkPenalty;
  });
  return pool.slice(0, 5).map((row, index) => {
    const { walkPenalty: _walk, ...stay } = row;
    return { ...stay, rank: index + 1 };
  });
}

function vibeFor(interests: GroupInterest[]): Vibe {
  if (interests.includes("konark") && !interests.includes("darshan")) return "adventure";
  if (interests.includes("beach") && !interests.includes("darshan") && !interests.includes("gundicha")) return "beach";
  return "culture";
}

function budgetTier(perHead: number | null): Budget {
  if (perHead == null) return "mid";
  if (perHead < 4500) return "value";
  if (perHead < 9000) return "mid";
  return "premium";
}

function fitScore(pkg: StayPackage, brief: Brief): number {
  let score = 0;
  if (pkg.vibe === brief.vibe) score += 4;
  else if (pkg.vibe === RELATED[brief.vibe]) score += 1.5;
  if (pkg.budget === brief.budget) score += 2;
  if (pkg.style.includes(brief.style)) score += 2;
  const inRange = brief.nights >= pkg.nightsMin && brief.nights <= pkg.nightsMax;
  if (inRange) score += Math.max(0, 2 - Math.abs(pkg.nights - brief.nights) / 2);
  score += originFitScore(pkg, brief);
  // Same rounding as scorePackages, so equal fits reach the Trust Score tie-break.
  return Math.round(score * 100) / 100;
}

function roomMix(
  pkg: StayPackage,
  party: number,
  brief: ShortlistBrief,
): { rooms: LockedRoom[]; totalInr: number; roomsReleased: boolean; lockable: boolean; note: string; rateKind: string } {
  const access = brief.needs.includes("wheelchair") || brief.needs.includes("ground_floor");
  const ranked = recommendRooms(pkg.rooms, brief.children > 0 ? "family" : undefined, 1);
  const ordered = [...pkg.rooms].sort((a, b) => {
    const aAccess = access && /ground|access|wheelchair/i.test(`${a.name} ${a.summary}`) ? 0 : 1;
    const bAccess = access && /ground|access|wheelchair/i.test(`${b.name} ${b.summary}`) ? 0 : 1;
    if (aAccess !== bAccess) return aAccess - bAccess;
    const aRank = ranked.findIndex((room) => room.id === a.id);
    const bRank = ranked.findIndex((room) => room.id === b.id);
    return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank) || b.occupancy - a.occupancy;
  });

  const nights = eachNight(brief.checkIn, brief.nights);
  let uncovered = party;
  const picks: LockedRoom[] = [];
  let total = 0;
  let anyUnpublished = false;
  let rateKind = "Standard";
  for (const room of ordered) {
    if (uncovered <= 0) break;
    const published = nights.map((night) => publishedNightUnits(pkg, room.id, night));
    const unpublished = published.some((count) => count == null);
    if (unpublished) {
      anyUnpublished = true;
      continue;
    }
    if (nights.some((night) => nightIsStopSell(pkg.id, room.id, night))) continue;
    const quote = quoteStay({ packageId: pkg.id, roomId: room.id, checkIn: brief.checkIn, nights: brief.nights });
    const cap = Math.min(...(published as number[]), quote?.remaining ?? 0);
    if (cap < 1 || !quote) continue;
    const need = Math.ceil(uncovered / Math.max(1, room.occupancy));
    const units = Math.min(cap, need);
    if (units < 1) continue;
    picks.push({
      roomId: room.id,
      units,
      nightly: quote.nightsQuoted.map((night) => night.rate),
    });
    total += quote.perPerson * units;
    uncovered -= units * room.occupancy;
    rateKind = quote.nightsQuoted[0]?.label ?? rateKind;
  }

  if (picks.length === 0 && anyUnpublished) {
    return {
      rooms: [],
      totalInr: 0,
      roomsReleased: false,
      lockable: false,
      note: "Rooms not released",
      rateKind,
    };
  }
  if (uncovered > 0) {
    return {
      rooms: picks,
      totalInr: total,
      roomsReleased: !anyUnpublished && picks.length > 0,
      lockable: false,
      note: picks.length === 0 ? "Rooms not released" : "Not enough published rooms for this party",
      rateKind,
    };
  }
  const lift = brief.needs.includes("lift") ? " Ask the hotel about a lift." : "";
  return {
    rooms: picks,
    totalInr: total,
    roomsReleased: true,
    lockable: true,
    note: `${picks.reduce((sum, room) => sum + room.units, 0)} rooms.${lift}`,
    rateKind,
  };
}
