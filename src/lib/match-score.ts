import {
  listPackages,
  originFitReason,
  originFitScore,
  originPlace,
  originTraits,
  WEAK_MATCH_BELOW,
  type Brief,
  type MatchedStay,
  type StayPackage,
  type Vibe,
} from "./packages.ts";

const RELATED_VIBE: Record<Vibe, Vibe> = {
  beach: "relax",
  relax: "beach",
  culture: "adventure",
  adventure: "culture",
};

/** Score every catalog stay for the brief (sorted best-first). */
export function scorePackages(brief: Brief): MatchedStay[] {
  const scored = listPackages().map((p) => {
    let score = 0;
    if (p.vibe === brief.vibe) score += 4;
    else if (p.vibe === RELATED_VIBE[brief.vibe]) score += 1.5;
    if (p.budget === brief.budget) score += 2;
    if (p.style.includes(brief.style)) score += 2;
    if (brief.flexible) {
      score += 1.5;
    } else {
      const wanted = brief.nights || 3;
      const inRange = wanted >= p.nightsMin && wanted <= p.nightsMax;
      if (inRange) {
        const nightDiff = Math.abs(p.nights - wanted);
        score += Math.max(0, 2 - nightDiff / 2);
      }
    }
    score += originFitScore(p, brief);
    return { ...p, matchScore: score, weakMatch: score < WEAK_MATCH_BELOW };
  });
  return scored.sort((a, b) => b.matchScore - a.matchScore || b.trustScore - a.trustScore);
}

/**
 * One-sentence card eyebrow explaining rank, built from originFitReason /
 * arrival mode (e.g. "First because you flew into BBI…").
 */
export function rankEyebrow(pkg: StayPackage, brief: Brief, index: number): string {
  const { temple, beach, airportTransfer, nearStation } = originTraits(pkg);
  const city = originPlace(brief);
  if (index === 0) {
    if (brief.arriveBy === "fly") {
      if (airportTransfer) {
        return `First because you flew into BBI — this hotel can arrange airport pickup and drop from ${city}.`;
      }
      if (beach) {
        return `First because you flew into BBI — beach stay after the hop from ${city}.`;
      }
      return `First because you flew into BBI — ranked for a flight from ${city}.`;
    }
    if ((brief.arriveBy === "train" || brief.arriveBy === "bus") && (nearStation || temple)) {
      return `First because a ${brief.arriveBy} from ${city} puts you on the temple / station side.`;
    }
    const why = originFitReason(pkg, brief).replace(/\.$/, "");
    return `First because ${why.charAt(0).toLowerCase()}${why.slice(1)}.`;
  }
  const why = originFitReason(pkg, brief).replace(/\.$/, "");
  if (index === 1) return `Also strong — ${why}.`;
  return `Worth a look — ${why}.`;
}
