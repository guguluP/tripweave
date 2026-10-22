import { useState, type ReactNode } from "react";
import { PassportScan } from "@/components/passport-scan";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShakeField, ShakeSelect } from "@/components/motion";
import { countryOptions } from "@/lib/countries";
import { guestLabel, useGuestLocale } from "@/lib/guest-locale";
import type { GuestDetailsPolicy } from "@/lib/hotel-desk";
import { pushBanner } from "@/lib/banners";
import { saveSavedTraveller } from "@/lib/server/saved-travellers";
import { idLast4 } from "@/lib/travelers";
import {
  ARRIVAL_PURPOSES,
  GENDER_LABELS,
  ID_LABELS,
  maskAadhaar,
  travelerInitials,
  type AgeBand,
  type ArrivalPurpose,
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
  onCopyFromLead,
  checkIn,
}: {
  index: number;
  traveler: Traveler;
  err: TravelerErrors;
  shakeKey: number;
  policy: GuestDetailsPolicy;
  showDigiLocker?: boolean;
  onUpdate: (index: number, patch: Partial<Traveler>) => void;
  onOpenDigi: (index: number) => void;
  onCopyFromLead?: (index: number) => void;
  checkIn?: string;
}) {
  const locale = useGuestLocale();
  const i = index;
  const lead = i === 0 || t.role === "lead";
  const foreign = (t.nationality || "IN").trim().toUpperCase() !== "IN";
  const digi = showDigiLocker && !foreign;
  const [more, setMore] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(Boolean(t.emergencyName || t.emergencyPhone));
  const extraError = Object.entries(err).some(([key, value]) => value && key !== "fullName" && key !== "ageBand");
  const showFull = lead || more || foreign || extraError;
  const filled = t.identitySource !== "manual";
  const field = (name: string) => `guest-${i}-${name}`;
  const countries = countryOptions(locale === "hi" ? "hi" : "en");
  const idTypes = (Object.keys(ID_LABELS) as IdType[]).filter((id) => !foreign || id === "passport");

  const savePerson = () => {
    if (t.fullName.trim().length < 2) return;
    void saveSavedTraveller({
      data: {
        fullName: t.fullName.trim(),
        nationality: (t.nationality || "IN").toUpperCase(),
        phone: t.phone,
        email: t.email,
        idType: t.idType,
        idLast4: t.idNumber ? idLast4(t.idNumber) : "",
      },
    }).then((result) => {
      pushBanner({
        title: result.ok ? guestLabel(locale, "savedSaved") : "Could not save",
        body: result.ok ? undefined : result.message,
        tone: result.ok ? "ok" : "info",
      });
    });
  };

  return (
    <Card className="p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
            {travelerInitials(t, i)}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl">
              {guestLabel(locale, "guest")} {i + 1}
              {lead ? ` · ${guestLabel(locale, "lead")}` : ""}
            </h2>
            {filled && digi ? (
              <p className="text-xs text-muted">
                {t.identitySource === "digilocker_demo" ? "Sample DigiLocker — not a verified guest" : "DigiLocker"}
              </p>
            ) : (
              <p className="text-xs text-subtle">{lead ? "Name, contact, and ID" : "Name and age band"}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!lead && onCopyFromLead ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onCopyFromLead(i)}>
              {guestLabel(locale, "copyLead")}
            </Button>
          ) : null}
          {digi ? (
            <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onOpenDigi(i)}>
              Fill from DigiLocker
            </Button>
          ) : null}
        </div>
      </div>

      {foreign ? <p className="mt-3 text-xs text-muted">{guestLabel(locale, "visiting")}</p> : null}

      <FieldGroup title={lead ? "Identity" : guestLabel(locale, "guest")}>
        <ShakeField
          className="sm:col-span-2"
          label={guestLabel(locale, "fullName")}
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
                label={guestLabel(locale, "dob")}
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
            <ShakeSelect
              className="sm:col-span-2"
              label={guestLabel(locale, "nationality")}
              fieldId={field("nationality")}
              value={t.nationality || "IN"}
              error={err.nationality}
              shakeKey={shakeKey}
              onChange={(e) => {
                const nationality = e.target.value.toUpperCase();
                const patch: Partial<Traveler> = { nationality };
                if (nationality !== "IN" && t.idType === "aadhaar" && !t.idNumber.trim()) patch.idType = "passport";
                onUpdate(i, patch);
              }}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </ShakeSelect>
            <ShakeSelect
              label={guestLabel(locale, "idType")}
              fieldId={field("idType")}
              value={foreign ? "passport" : t.idType}
              error={err.idType}
              shakeKey={shakeKey}
              onChange={(e) => onUpdate(i, { idType: e.target.value as IdType })}
            >
              {idTypes.map((id) => (
                <option key={id} value={id}>
                  {ID_LABELS[id]}
                </option>
              ))}
            </ShakeSelect>
            <ShakeField
              label={guestLabel(locale, "idNumber")}
              fieldId={field("idNumber")}
              value={t.idNumber}
              error={err.idNumber}
              shakeKey={shakeKey}
              onChange={(e) => onUpdate(i, { idNumber: e.target.value, identitySource: "manual" })}
              onBlur={() => {
                if (t.idType === "aadhaar" && !foreign) onUpdate(i, { idNumber: maskAadhaar(t.idNumber) });
              }}
            />
            {foreign && t.idType === "aadhaar" ? (
              <p className="text-xs font-normal text-muted sm:col-span-2">{guestLabel(locale, "passportHint")}</p>
            ) : null}
            {t.idType === "passport" ? (
              <PassportScan arrivalDate={checkIn} onApply={(patch) => onUpdate(i, patch)} />
            ) : null}
            {!lead ? (
              <ShakeField
                label={guestLabel(locale, "dob")}
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

      {showFull ? (
        <FieldGroup title="Contact">
          <PhoneInput
            label={guestLabel(locale, "mobile")}
            fieldId={field("phone")}
            value={t.phone}
            defaultCountry={t.nationality || "IN"}
            error={err.phone}
            shakeKey={shakeKey}
            helper={lead ? guestLabel(locale, "mobileHelp") : undefined}
            onChange={(phone) => onUpdate(i, { phone })}
          />
          <ShakeField
            label={guestLabel(locale, "email")}
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

      {foreign && showFull ? (
        <FieldGroup title={guestLabel(locale, "arrivalTitle")}>
          <label className="flex items-start gap-2 text-sm font-normal sm:col-span-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={Boolean(t.oci)}
              onChange={(e) => onUpdate(i, { oci: e.target.checked })}
            />
            <span>{guestLabel(locale, "oci")}</span>
          </label>
          {(t.nationality || "").toUpperCase() === "AE" ? (
            <label className="flex items-start gap-2 text-sm font-normal sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(t.priorIndianVisa)}
                onChange={(e) => onUpdate(i, { priorIndianVisa: e.target.checked })}
              />
              <span>{guestLabel(locale, "priorVisa")}</span>
            </label>
          ) : null}
          <ShakeField
            label={guestLabel(locale, "arrivedFrom")}
            value={t.arrivedFrom ?? ""}
            onChange={(e) => onUpdate(i, { arrivedFrom: e.target.value })}
          />
          <ShakeField
            label={guestLabel(locale, "arrivalTime")}
            type="time"
            value={t.arrivalTime ?? ""}
            onChange={(e) => onUpdate(i, { arrivalTime: e.target.value })}
          />
          <ShakeSelect
            label={guestLabel(locale, "purpose")}
            value={t.arrivalPurpose ?? ""}
            onChange={(e) => onUpdate(i, { arrivalPurpose: e.target.value as ArrivalPurpose | "" })}
          >
            <option value="">{guestLabel(locale, "purposeChoose")}</option>
            {ARRIVAL_PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>
                {guestLabel(locale, purposeLabel(purpose))}
              </option>
            ))}
          </ShakeSelect>
          <ShakeField
            label={guestLabel(locale, "previousStay")}
            value={t.previousStay ?? ""}
            onChange={(e) => onUpdate(i, { previousStay: e.target.value })}
          />
          <ShakeField
            className="sm:col-span-2"
            label={guestLabel(locale, "nextDestination")}
            value={t.nextDestination ?? ""}
            onChange={(e) => onUpdate(i, { nextDestination: e.target.value })}
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
          {emergencyOpen ? guestLabel(locale, "emergencyHide") : guestLabel(locale, "emergencyShow")}
        </button>
        {emergencyOpen ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ShakeField
              label={guestLabel(locale, "contactName")}
              value={t.emergencyName}
              autoComplete="off"
              onChange={(e) => onUpdate(i, { emergencyName: e.target.value })}
            />
            <PhoneInput
              label={guestLabel(locale, "mobile")}
              fieldId={field("emergencyPhone")}
              value={t.emergencyPhone}
              defaultCountry={t.nationality || "IN"}
              error={err.emergencyPhone}
              shakeKey={shakeKey}
              onChange={(emergencyPhone) => onUpdate(i, { emergencyPhone })}
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
        {showFull && t.fullName.trim().length >= 2 ? (
          <button type="button" className="mt-3 text-xs font-medium underline" onClick={savePerson}>
            {guestLabel(locale, "savedSave")}
          </button>
        ) : null}
      </div>

      {digi && t.issuedDocs.length > 0 ? (
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

function purposeLabel(purpose: ArrivalPurpose) {
  if (purpose === "tourism") return "purposeTourism" as const;
  if (purpose === "business") return "purposeBusiness" as const;
  if (purpose === "employment") return "purposeEmployment" as const;
  if (purpose === "medical") return "purposeMedical" as const;
  if (purpose === "student") return "purposeStudent" as const;
  if (purpose === "conference") return "purposeConference" as const;
  return "purposeOthers" as const;
}
