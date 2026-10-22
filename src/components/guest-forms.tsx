import { useEffect, useState } from "react";
import { TravelerGuestCard } from "@/components/travelers-guest-card";
import { guestLabel, setGuestLocale, useGuestLocale } from "@/lib/guest-locale";
import type { GuestDetailsPolicy } from "@/lib/hotel-desk";
import { guestsForOccupancy } from "@/lib/occupancy-policy";
import { guestsFromStyle, loadBrief, type PendingBooking } from "@/lib/packages";
import type { SavedTraveller } from "@/lib/saved-travellers";
import { listSavedTravellers } from "@/lib/server/saved-travellers";
import { defaultIdType } from "@/lib/travelers";
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
      const leadNat = (next[0]?.nationality || "IN").toUpperCase();
      next.push(
        emptyTraveler(
          index === 0
            ? { role: "lead", fullName: user?.displayName ?? "", email: user?.primaryEmail ?? "" }
            : {
                role: "companion",
                ...(leadNat !== "IN" ? { nationality: leadNat, idType: defaultIdType(leadNat) } : {}),
              },
          index,
        ),
      );
    }
    for (let index = 0; index < next.length; index += 1) {
      const guest = next[index]!;
      const nat = (guest.nationality || "IN").toUpperCase();
      if (nat !== "IN" && guest.idType === "aadhaar" && !guest.idNumber.trim()) {
        next[index] = { ...guest, nationality: nat, idType: "passport" };
      }
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
    setList((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const next = { ...t, ...patch };
        const nat = (next.nationality || "IN").toUpperCase();
        if (nat !== "IN" && next.idType === "aadhaar" && !next.idNumber.trim()) next.idType = "passport";
        return next;
      }),
    );
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
  checkIn,
  onUpdate,
  onOpenDigi,
}: {
  list: Traveler[];
  errors: TravelerErrors[];
  shakeKey: number;
  policy: GuestDetailsPolicy;
  showDigiLocker: boolean;
  checkIn?: string;
  onUpdate: (index: number, patch: Partial<Traveler>) => void;
  onOpenDigi: (index: number) => void;
}) {
  const locale = useGuestLocale();
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          className={locale === "en" ? "font-medium text-fg underline" : "text-muted underline"}
          onClick={() => setGuestLocale("en")}
        >
          {guestLabel(locale, "langEnglish")}
        </button>
        <button
          type="button"
          className={locale === "hi" ? "font-medium text-fg underline" : "text-muted underline"}
          onClick={() => setGuestLocale("hi")}
        >
          {guestLabel(locale, "langHindi")}
        </button>
      </div>
      <p className="text-sm text-muted">{guestLabel(locale, "intro")}</p>
      <SavedPeoplePicker
        count={list.length}
        onFill={(index, person) =>
          onUpdate(index, {
            fullName: person.fullName,
            nationality: person.nationality,
            phone: person.phone,
            email: person.email,
            idType: (person.idType as Traveler["idType"]) || defaultIdType(person.nationality),
            idNumber: person.idLast4 ?? "",
          })
        }
      />
      {list.map((traveler, index) => (
        <TravelerGuestCard
          key={index}
          index={index}
          traveler={traveler}
          err={errors[index] ?? {}}
          shakeKey={shakeKey}
          policy={policy}
          showDigiLocker={showDigiLocker}
          checkIn={checkIn}
          onUpdate={onUpdate}
          onOpenDigi={onOpenDigi}
          onCopyFromLead={
            index === 0
              ? undefined
              : (guestIndex) => {
                  const lead = list[0];
                  if (!lead) return;
                  onUpdate(guestIndex, {
                    nationality: lead.nationality,
                    phone: lead.phone,
                    emergencyName: lead.emergencyName,
                    emergencyPhone: lead.emergencyPhone,
                    email: lead.email,
                  });
                }
          }
        />
      ))}
    </div>
  );
}

function SavedPeoplePicker({
  count,
  onFill,
}: {
  count: number;
  onFill: (index: number, person: SavedTraveller) => void;
}) {
  const locale = useGuestLocale();
  const [people, setPeople] = useState<SavedTraveller[]>([]);
  const [personId, setPersonId] = useState("");
  const [guestIndex, setGuestIndex] = useState("0");
  const [ready, setReady] = useState<SavedTraveller | null>(null);

  useEffect(() => {
    void listSavedTravellers()
      .then(setPeople)
      .catch(() => setPeople([]));
  }, []);

  if (people.length === 0) return null;
  const selected = people.find((person) => String(person.id) === personId) ?? null;

  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-3">
      <p className="text-sm font-medium">{guestLabel(locale, "savedPeople")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          {guestLabel(locale, "savedPeople")}
          <select
            className="rounded-md border border-border bg-surface px-3 py-2"
            value={personId}
            onChange={(event) => {
              setPersonId(event.target.value);
              setReady(null);
            }}
          >
            <option value="">Choose</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label ? `${person.label} · ` : ""}
                {person.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {guestLabel(locale, "guest")}
          <select
            className="rounded-md border border-border bg-surface px-3 py-2"
            value={guestIndex}
            onChange={(event) => setGuestIndex(event.target.value)}
          >
            {Array.from({ length: count }, (_, index) => (
              <option key={index} value={index}>
                {guestLabel(locale, "guest")} {index + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selected ? (
        <div className="mt-3">
          <p className="text-xs text-muted">{guestLabel(locale, "savedConfirm")}</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium underline"
            onClick={() => {
              if (!ready) {
                setReady(selected);
                return;
              }
              onFill(Number(guestIndex), ready);
              setReady(null);
            }}
          >
            {guestLabel(locale, "savedUse")}
            {ready ? `: ${ready.fullName}` : ""}
          </button>
        </div>
      ) : null}
    </div>
  );
}
