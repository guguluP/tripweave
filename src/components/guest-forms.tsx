import { useEffect, useState } from "react";
import { TravelerGuestCard } from "@/components/travelers-guest-card";
import type { GuestDetailsPolicy } from "@/lib/hotel-desk";
import { guestsForOccupancy } from "@/lib/occupancy-policy";
import { guestsFromStyle, loadBrief, type PendingBooking } from "@/lib/packages";
import {
  emptyTraveler,
  loadTravelers,
  orderedGuestErrors,
  saveTravelers,
  validateTravelers,
  type Traveler,
  type TravelerErrors,
} from "@/lib/travelers";

function countFromPending(pending: PendingBooking | null): number {
  if (!pending) return guestsForOccupancy(guestsFromStyle(loadBrief().style));
  if (pending.travelers && pending.travelers >= 1) return Math.min(12, pending.travelers);
  if (pending.adults != null || pending.children != null) {
    const n = guestsForOccupancy({ adults: pending.adults ?? 0, children: pending.children ?? 0 });
    return Math.min(12, Math.max(1, n));
  }
  return guestsForOccupancy(guestsFromStyle(loadBrief().style));
}

export function useGuestForms(
  pending: PendingBooking | null,
  policy: GuestDetailsPolicy,
  user?: { displayName?: string | null; primaryEmail?: string | null } | null,
) {
  const [list, setList] = useState<Traveler[]>([]);
  const [errors, setErrors] = useState<TravelerErrors[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [ready, setReady] = useState(false);
  const initKey = pending
    ? `${pending.packageId}:${pending.travelers ?? ""}:${pending.adults ?? ""}:${pending.children ?? ""}`
    : "";

  useEffect(() => {
    if (!pending?.packageId) {
      setList([]);
      setReady(false);
      return;
    }
    const count = countFromPending(pending);
    const saved = loadTravelers().map((t, i) => ({ ...t, role: i === 0 ? ("lead" as const) : ("companion" as const) }));
    const next = saved.slice(0, count);
    while (next.length < count) {
      const index = next.length;
      next.push(
        emptyTraveler(
          index === 0
            ? { role: "lead", fullName: user?.displayName ?? "", email: user?.primaryEmail ?? "" }
            : { role: "companion" },
          index,
        ),
      );
    }
    if (next[0] && !next[0].fullName && user?.displayName) next[0] = { ...next[0], fullName: user.displayName };
    if (next[0] && !next[0].email && user?.primaryEmail) next[0] = { ...next[0], email: user.primaryEmail };
    setList(next);
    setReady(true);
    // Prefill once per cart. Typing must not reset the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey]);

  useEffect(() => {
    if (!user) return;
    setList((prev) =>
      prev.map((t, i) => {
        if (i !== 0) return t;
        return {
          ...t,
          fullName: t.fullName || user.displayName || "",
          email: t.email || user.primaryEmail || "",
        };
      }),
    );
  }, [user?.displayName, user?.primaryEmail]);

  const update = (index: number, patch: Partial<Traveler>) => {
    setList((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
    setErrors((prev) => prev.map((e, i) => (i === index ? { ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) } : e)));
  };

  const validate = () => {
    const result = validateTravelers(list, policy);
    setErrors(result.errors);
    saveTravelers(list);
    if (!result.ok) setShakeKey((k) => k + 1);
    return { ...result, fields: orderedGuestErrors(list, policy) };
  };

  return { list, update, errors, shakeKey, setShakeKey, validate, ready, count: list.length };
}

export function GuestForms({
  list,
  errors,
  shakeKey,
  policy,
  showDigiLocker,
  onUpdate,
  onOpenDigi,
}: {
  list: Traveler[];
  errors: TravelerErrors[];
  shakeKey: number;
  policy: GuestDetailsPolicy;
  showDigiLocker: boolean;
  onUpdate: (index: number, patch: Partial<Traveler>) => void;
  onOpenDigi: (index: number) => void;
}) {
  return (
    <div className="grid gap-5">
      {list.map((traveler, index) => (
        <TravelerGuestCard
          key={index}
          index={index}
          traveler={traveler}
          err={errors[index] ?? {}}
          shakeKey={shakeKey}
          policy={policy}
          showDigiLocker={showDigiLocker}
          onUpdate={onUpdate}
          onOpenDigi={onOpenDigi}
        />
      ))}
    </div>
  );
}
