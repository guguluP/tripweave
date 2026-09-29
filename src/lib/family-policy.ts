import type { RoomType, StayPackage } from "./packages.ts";

/**
 * Published child / extra-bed wording per stay, copied from the hotel's own
 * policy page. Empty on purpose: do not fill a stay in until you have the
 * hotel's published text. Missing entries render as "not published — ask the desk".
 */
export type PublishedFamilyPolicy = {
  childPolicy?: string;
  extraBed?: string;
};

export const PUBLISHED_FAMILY_POLICY: Record<string, PublishedFamilyPolicy> = {};

export type FamilyPolicy = PublishedFamilyPolicy & {
  /** Most people the chosen room (or, with no room, the largest room) sleeps. */
  sleeps: number;
};

export function familyPolicyFor(pkg: StayPackage, room?: RoomType): FamilyPolicy {
  const published = PUBLISHED_FAMILY_POLICY[pkg.id] ?? {};
  const sleeps = room?.occupancy ?? Math.max(0, ...pkg.rooms.map((r) => r.occupancy));
  return { ...published, sleeps };
}

export function familyPolicyLines(policy: FamilyPolicy): string[] {
  const lines = [`Sleeps ${policy.sleeps}.`];
  if (policy.childPolicy) lines.push(`Children: ${policy.childPolicy}`);
  if (policy.extraBed) lines.push(`Extra bed: ${policy.extraBed}`);
  return lines;
}
