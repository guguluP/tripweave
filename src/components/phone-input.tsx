import { useEffect, useRef, useState } from "react";
import { ShakeField, ShakeSelect } from "@/components/motion";
import { callingCode, countryOptions } from "@/lib/countries";
import { guestLabel, useGuestLocale } from "@/lib/guest-locale";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toE164 } from "@/lib/phone";

function regionFromValue(value: string, preferred: string): { region: string; national: string } {
  const fallback = (preferred || "IN").toUpperCase();
  if (!value) return { region: fallback, national: "" };
  if (/^[6-9]\d{9}$/.test(value)) return { region: "IN", national: value };
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed) return { region: fallback, national: value.replace(/\D/g, "") };
  const preferredCode = callingCode(fallback);
  const region = preferredCode && preferredCode === parsed.countryCallingCode ? fallback : parsed.country || fallback;
  return { region, national: parsed.nationalNumber };
}

export function PhoneInput({
  label,
  value,
  defaultCountry = "IN",
  onChange,
  error,
  shakeKey = 0,
  fieldId,
  className,
  helper,
}: {
  label?: string;
  value: string;
  defaultCountry?: string;
  onChange: (e164: string) => void;
  error?: string | null;
  shakeKey?: number;
  fieldId?: string;
  className?: string;
  helper?: string;
}) {
  const locale = useGuestLocale();
  const initial = regionFromValue(value, defaultCountry);
  const [region, setRegion] = useState(initial.region);
  const [national, setNational] = useState(initial.national);
  const emitted = useRef(value);

  useEffect(() => {
    if (value === emitted.current) {
      if (!value) setRegion((defaultCountry || "IN").toUpperCase());
      return;
    }
    const next = regionFromValue(value, defaultCountry);
    setRegion(next.region);
    setNational(next.national);
    emitted.current = value;
  }, [value, defaultCountry]);

  const emit = (nextRegion: string, nextNational: string) => {
    const digits = nextNational.replace(/\D/g, "").slice(0, 15);
    const code = callingCode(nextRegion);
    const raw = digits && code ? `+${code}${digits}` : "";
    const e164 = raw ? (toE164(raw, nextRegion) ?? raw) : "";
    emitted.current = e164;
    onChange(e164);
  };

  const options = countryOptions(locale === "hi" ? "hi" : "en").filter((option) => callingCode(option.code));

  return (
    <div className={className ?? "grid gap-3 sm:col-span-2 sm:grid-cols-2"}>
      <ShakeSelect
        label={label || guestLabel(locale, "phoneCountry")}
        value={region}
        onChange={(event) => {
          const next = event.target.value;
          setRegion(next);
          emit(next, national);
        }}
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name} (+{callingCode(option.code)})
          </option>
        ))}
      </ShakeSelect>
      <ShakeField
        label={guestLabel(locale, "nationalNumber")}
        fieldId={fieldId}
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        error={error}
        shakeKey={shakeKey}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 15);
          setNational(digits);
          emit(region, digits);
        }}
      />
      {helper ? <p className="text-xs font-normal text-muted sm:col-span-2">{helper}</p> : null}
    </div>
  );
}
