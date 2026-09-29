import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShakeField, ShakeSelect } from "@/components/motion";
import {
  DIGIYATRA_LABELS,
  GENDER_LABELS,
  ID_LABELS,
  maskAadhaar,
  travelerInitials,
  type DigiYatraStatus,
  type Gender,
  type IdType,
  type Traveler,
  type TravelerErrors,
} from "@/lib/travelers";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-5 min-w-0">
      <legend className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{title}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function TravelerGuestCard({
  index,
  traveler: t,
  err,
  shakeKey,
  onUpdate,
  onOpenDigi,
}: {
  index: number;
  traveler: Traveler;
  err: TravelerErrors;
  shakeKey: number;
  onUpdate: (index: number, patch: Partial<Traveler>) => void;
  onOpenDigi: (index: number) => void;
}) {
  const i = index;
  const filled = t.identitySource !== "manual";
  return (
    <Card className="p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
            {travelerInitials(t, i)}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl">
              Guest {i + 1}
              {i === 0 ? " · primary" : ""}
            </h2>
            {filled ? (
              <p className="text-xs text-ok">
                {t.identitySource === "digilocker_demo" ? "Sandbox DigiLocker" : "DigiLocker"}
                {t.issuedDocs[0] ? ` · ${t.issuedDocs[0].label}` : ""}
              </p>
            ) : (
              <p className="text-xs text-subtle">Manual entry</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => onOpenDigi(i)}
        >
          Fill from DigiLocker
        </Button>
      </div>

      <FieldGroup title="Identity">
        <ShakeField
          className="sm:col-span-2"
          label="Full name (as on ID)"
          value={t.fullName}
          error={err.fullName}
          shakeKey={shakeKey}
          autoComplete="name"
          onChange={(e) => onUpdate(i, { fullName: e.target.value, identitySource: "manual" })}
        />
        <ShakeField
          label="Date of birth"
          type="date"
          value={t.dateOfBirth}
          error={err.dateOfBirth}
          shakeKey={shakeKey}
          onChange={(e) => onUpdate(i, { dateOfBirth: e.target.value })}
        />
        <ShakeSelect
          label="Gender"
          value={t.gender}
          onChange={(e) => onUpdate(i, { gender: e.target.value as Gender })}
        >
          {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
            <option key={g} value={g}>
              {GENDER_LABELS[g]}
            </option>
          ))}
        </ShakeSelect>
        <ShakeField
          label="Nationality"
          value={t.nationality}
          error={err.nationality}
          shakeKey={shakeKey}
          onChange={(e) =>
            onUpdate(i, { nationality: e.target.value.toUpperCase().slice(0, 2) })
          }
        />
        <ShakeSelect
          label="ID type"
          value={t.idType}
          onChange={(e) => onUpdate(i, { idType: e.target.value as IdType })}
        >
          {(Object.keys(ID_LABELS) as IdType[]).map((id) => (
            <option key={id} value={id}>
              {ID_LABELS[id]}
            </option>
          ))}
        </ShakeSelect>
        <ShakeField
          className="sm:col-span-2"
          label="ID number"
          value={t.idNumber}
          error={err.idNumber}
          shakeKey={shakeKey}
          onChange={(e) => onUpdate(i, { idNumber: e.target.value, identitySource: "manual" })}
          onBlur={() => {
            if (t.idType === "aadhaar") onUpdate(i, { idNumber: maskAadhaar(t.idNumber) });
          }}
        />
      </FieldGroup>

      <FieldGroup title="Contact">
        <ShakeField
          label="Mobile"
          inputMode="tel"
          placeholder="10-digit mobile"
          value={t.phone}
          error={err.phone}
          shakeKey={shakeKey}
          autoComplete="tel"
          onChange={(e) =>
            onUpdate(i, { phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
          }
        />
        <ShakeField
          label="Email"
          type="email"
          value={t.email}
          error={err.email}
          shakeKey={shakeKey}
          autoComplete="email"
          onChange={(e) => onUpdate(i, { email: e.target.value })}
        />
      </FieldGroup>

      <FieldGroup title="Emergency">
        <ShakeField
          label="Contact name"
          value={t.emergencyName}
          autoComplete="off"
          onChange={(e) => onUpdate(i, { emergencyName: e.target.value })}
        />
        <ShakeField
          label="Mobile"
          inputMode="tel"
          value={t.emergencyPhone}
          error={err.emergencyPhone}
          shakeKey={shakeKey}
          onChange={(e) =>
            onUpdate(i, {
              emergencyPhone: e.target.value.replace(/\D/g, "").slice(0, 10),
            })
          }
        />
        <ShakeField
          className="sm:col-span-2"
          label="Special requests (optional)"
          value={t.specialRequests}
          placeholder="Diet, accessibility, room preference"
          onChange={(e) => onUpdate(i, { specialRequests: e.target.value })}
        />
      </FieldGroup>

      {t.issuedDocs.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {t.issuedDocs.map((d) => (
            <li
              key={`${d.label}-${d.idMasked}`}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted"
            >
              {d.label} · {d.idMasked}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-medium">DigiYatra for BBI (guest note only)</p>
        <p className="mt-1 text-xs text-subtle">
          Optional personal reminder — not submitted to TripWeave, DigiYatra, or the hotel.
          Airport e-gates only; does not replace hotel ID.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(DIGIYATRA_LABELS) as DigiYatraStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              className={cn(
                "min-h-11 min-w-[7.5rem] flex-1 rounded-md border px-3 text-center text-xs font-medium",
                t.digiYatra === status
                  ? "border-primary/40 bg-primary/5 text-fg"
                  : "border-border bg-elevated text-muted",
              )}
              onClick={() => onUpdate(i, { digiYatra: status })}
            >
              {DIGIYATRA_LABELS[status]}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
