import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShakeField, ShakeSelect } from "@/components/motion";
import type { GuestDetailsPolicy } from "@/lib/hotel-desk";
import {
  GENDER_LABELS,
  ID_LABELS,
  maskAadhaar,
  travelerInitials,
  type AgeBand,
  type Gender,
  type IdType,
  type Traveler,
  type TravelerErrors,
} from "@/lib/travelers";

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-5 min-w-0">
      <legend className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{title}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: "adult", label: "Adult" },
  { id: "child_5_11", label: "Child, 5–11" },
  { id: "infant_0_4", label: "Infant, 0–4" },
];

export function TravelerGuestCard({
  index,
  traveler: t,
  err,
  shakeKey,
  policy: _policy,
  showDigiLocker = false,
  onUpdate,
  onOpenDigi,
}: {
  index: number;
  traveler: Traveler;
  err: TravelerErrors;
  shakeKey: number;
  policy: GuestDetailsPolicy;
  showDigiLocker?: boolean;
  onUpdate: (index: number, patch: Partial<Traveler>) => void;
  onOpenDigi: (index: number) => void;
}) {
  const i = index;
  const lead = i === 0 || t.role === "lead";
  const foreign = (t.nationality || "IN").trim().toUpperCase() !== "IN";
  const [more, setMore] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(Boolean(t.emergencyName || t.emergencyPhone));
  const extraError = Object.entries(err).some(
    ([key, value]) => value && key !== "fullName" && key !== "ageBand",
  );
  const showFull = lead || more || foreign || extraError;
  const filled = t.identitySource !== "manual";
  const field = (name: string) => `guest-${i}-${name}`;

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
              {lead ? " · lead" : ""}
            </h2>
            {filled && showDigiLocker ? (
              <p className="text-xs text-muted">
                {t.identitySource === "digilocker_demo" ? "Sample DigiLocker — not a verified guest" : "DigiLocker"}
              </p>
            ) : (
              <p className="text-xs text-subtle">{lead ? "Name, contact, and ID" : "Name and age band"}</p>
            )}
          </div>
        </div>
        {showDigiLocker ? (
          <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onOpenDigi(i)}>
            Fill from DigiLocker
          </Button>
        ) : null}
      </div>

      <FieldGroup title={lead ? "Identity" : "Guest"}>
        <ShakeField
          className="sm:col-span-2"
          label="Full name (as on ID)"
          fieldId={field("fullName")}
          value={t.fullName}
          error={err.fullName}
          shakeKey={shakeKey}
          autoComplete={lead ? "name" : "off"}
          onChange={(e) => onUpdate(i, { fullName: e.target.value, identitySource: "manual" })}
        />
        {!lead ? (
          <ShakeSelect
            className="sm:col-span-2"
            label="Age band"
            fieldId={field("ageBand")}
            value={t.ageBand ?? ""}
            error={err.ageBand}
            shakeKey={shakeKey}
            onChange={(e) => onUpdate(i, { ageBand: e.target.value as AgeBand })}
          >
            <option value="">Choose</option>
            {AGE_BANDS.map((band) => (
              <option key={band.id} value={band.id}>
                {band.label}
              </option>
            ))}
          </ShakeSelect>
        ) : null}
        {showFull ? (
          <>
            {lead ? (
              <ShakeField
                label="Date of birth"
                type="date"
                fieldId={field("dateOfBirth")}
                value={t.dateOfBirth}
                error={err.dateOfBirth}
                shakeKey={shakeKey}
                onChange={(e) => onUpdate(i, { dateOfBirth: e.target.value })}
              />
            ) : null}
            {lead ? (
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
            ) : null}
            <ShakeField
              label="Nationality"
              fieldId={field("nationality")}
              value={t.nationality}
              error={err.nationality}
              shakeKey={shakeKey}
              onChange={(e) => {
                const nationality = e.target.value.toUpperCase().slice(0, 2);
                onUpdate(i, nationality !== "IN" ? { nationality, idType: "passport" } : { nationality });
              }}
            />
            <ShakeSelect
              label="ID type"
              fieldId={field("idType")}
              value={foreign ? "passport" : t.idType}
              error={err.idType}
              shakeKey={shakeKey}
              onChange={(e) => onUpdate(i, { idType: e.target.value as IdType })}
            >
              {(Object.keys(ID_LABELS) as IdType[])
                .filter((id) => !foreign || id === "passport")
                .map((id) => (
                  <option key={id} value={id}>
                    {ID_LABELS[id]}
                  </option>
                ))}
            </ShakeSelect>
            <ShakeField
              className="sm:col-span-2"
              label="ID number"
              fieldId={field("idNumber")}
              value={t.idNumber}
              error={err.idNumber}
              shakeKey={shakeKey}
              onChange={(e) => onUpdate(i, { idNumber: e.target.value, identitySource: "manual" })}
              onBlur={() => {
                if (t.idType === "aadhaar" && !foreign) onUpdate(i, { idNumber: maskAadhaar(t.idNumber) });
              }}
            />
            {!lead ? (
              <ShakeField
                label="Date of birth"
                type="date"
                fieldId={field("dateOfBirth")}
                value={t.dateOfBirth}
                error={err.dateOfBirth}
                shakeKey={shakeKey}
                onChange={(e) => onUpdate(i, { dateOfBirth: e.target.value })}
              />
            ) : null}
          </>
        ) : null}
      </FieldGroup>

      {showFull && lead ? (
        <FieldGroup title="Contact">
          <ShakeField
            label="Mobile"
            fieldId={field("phone")}
            inputMode="tel"
            placeholder="10-digit mobile"
            value={t.phone}
            error={err.phone}
            shakeKey={shakeKey}
            autoComplete="tel"
            onChange={(e) => onUpdate(i, { phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          />
          <ShakeField
            label="Email"
            fieldId={field("email")}
            type="email"
            value={t.email}
            error={err.email}
            shakeKey={shakeKey}
            autoComplete="email"
            onChange={(e) => onUpdate(i, { email: e.target.value })}
          />
        </FieldGroup>
      ) : null}

      {!lead && !showFull ? (
        <button type="button" className="mt-4 text-sm font-medium text-primary underline" onClick={() => setMore(true)}>
          Add more details
        </button>
      ) : null}
      {!lead && showFull && !foreign ? (
        <button type="button" className="mt-4 text-xs text-muted underline" onClick={() => setMore(false)}>
          Hide extra details
        </button>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <button type="button" className="text-sm font-medium underline" onClick={() => setEmergencyOpen((open) => !open)}>
          {emergencyOpen ? "Hide emergency contact" : "Add an emergency contact (optional)"}
        </button>
        {emergencyOpen ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ShakeField
              label="Contact name"
              value={t.emergencyName}
              autoComplete="off"
              onChange={(e) => onUpdate(i, { emergencyName: e.target.value })}
            />
            <ShakeField
              label="Mobile"
              fieldId={field("emergencyPhone")}
              inputMode="tel"
              value={t.emergencyPhone}
              error={err.emergencyPhone}
              shakeKey={shakeKey}
              onChange={(e) => onUpdate(i, { emergencyPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
            <ShakeField
              className="sm:col-span-2"
              label="Special requests (optional)"
              value={t.specialRequests}
              placeholder="Diet, accessibility, room preference"
              onChange={(e) => onUpdate(i, { specialRequests: e.target.value })}
            />
          </div>
        ) : null}
      </div>

      {showDigiLocker && t.issuedDocs.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {t.issuedDocs.map((d) => (
            <li key={`${d.label}-${d.idMasked}`} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              {d.label} · {d.idMasked}
            </li>
          ))}
        </ul>
      ) : null}

    </Card>
  );
}
