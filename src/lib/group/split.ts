import type { GroupMember, SplitMode } from "./types.ts";

export type ShareDraft = { memberId: string; amountInr: number; familyLabel: string | null };

export type SplitInput = {
  totalInr: number;
  members: Pick<GroupMember, "id" | "isOrganiser" | "familyLabel" | "leftAt">[];
  mode: SplitMode;
  organiserId: string;
  /** Required for custom. Ignored otherwise. */
  custom?: { memberId: string; amountInr: number }[];
};

/**
 * Integer rupees. The shares sum to totalInr.
 * The leftover rupee from division goes to the organiser.
 */
export function splitShares(input: SplitInput): ShareDraft[] | null {
  const total = Math.round(input.totalInr);
  if (!Number.isInteger(total) || total < 1) return null;
  const active = input.members.filter((member) => !member.leftAt);
  if (active.length === 0) return null;
  const organiser = active.find((member) => member.id === input.organiserId) ?? active[0]!;

  if (input.mode === "organiser") {
    return [{ memberId: organiser.id, amountInr: total, familyLabel: organiser.familyLabel }];
  }

  if (input.mode === "custom") {
    const rows = input.custom ?? [];
    if (rows.length === 0) return null;
    const known = new Set(active.map((member) => member.id));
    if (rows.some((row) => !known.has(row.memberId) || !Number.isInteger(row.amountInr) || row.amountInr < 1)) {
      return null;
    }
    const sum = rows.reduce((acc, row) => acc + row.amountInr, 0);
    if (sum !== total) return null;
    return rows.map((row) => ({
      memberId: row.memberId,
      amountInr: row.amountInr,
      familyLabel: active.find((member) => member.id === row.memberId)?.familyLabel ?? null,
    }));
  }

  if (input.mode === "per_family") {
    const families = new Map<string, typeof active>();
    for (const member of active) {
      const key = member.familyLabel?.trim() || member.id;
      const list = families.get(key) ?? [];
      list.push(member);
      families.set(key, list);
    }
    const keys = [...families.keys()];
    const base = Math.floor(total / keys.length);
    let remainder = total - base * keys.length;
    const organiserKey = organiser.familyLabel?.trim() || organiser.id;
    return keys.map((key) => {
      const members = families.get(key)!;
      const head = members.find((member) => member.id === organiser.id) ?? members[0]!;
      const extra = key === organiserKey ? remainder : 0;
      if (key === organiserKey) remainder = 0;
      return { memberId: head.id, amountInr: base + extra, familyLabel: head.familyLabel };
    });
  }

  const base = Math.floor(total / active.length);
  let remainder = total - base * active.length;
  return active.map((member) => {
    const extra = member.id === organiser.id ? remainder : 0;
    if (member.id === organiser.id) remainder = 0;
    return { memberId: member.id, amountInr: base + extra, familyLabel: member.familyLabel };
  });
}
