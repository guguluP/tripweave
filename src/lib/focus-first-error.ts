export type NamedFieldError = {
  id: string;
  guestIndex?: number;
  label?: string;
  field?: string;
};

const FIELD_ORDER = [
  "fullName",
  "ageBand",
  "phone",
  "email",
  "dateOfBirth",
  "nationality",
  "idType",
  "idNumber",
  "payerName",
  "checkIn",
  "room",
];

/** First invalid field after guest order, then field order. */
export function firstErrorField(errors: NamedFieldError[]): string | null {
  if (errors.length === 0) return null;
  const ranked = [...errors].sort((a, b) => {
    const ga = a.guestIndex ?? 0;
    const gb = b.guestIndex ?? 0;
    if (ga !== gb) return ga - gb;
    const ia = FIELD_ORDER.indexOf(a.field ?? "");
    const ib = FIELD_ORDER.indexOf(b.field ?? "");
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return ranked[0]?.id ?? null;
}

export function guestErrorBanner(errors: { guestIndex: number; label: string }[]): string {
  if (errors.length === 0) return "";
  const first = errors[0]!;
  const head = `Guest ${first.guestIndex + 1}: ${first.label} is required`;
  const more = errors.length - 1;
  return more > 0 ? `${head} (+${more} more)` : head;
}

function escapeAttr(id: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(id);
  return id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Scroll to and focus the first rendered field. Returns false when none are in the document. */
export function focusFirstError(fieldIds: string[]): boolean {
  if (typeof document === "undefined") return false;
  for (const id of fieldIds) {
    if (!id) continue;
    const el = document.querySelector(`[data-field-id="${escapeAttr(id)}"]`);
    if (!(el instanceof HTMLElement)) continue;
    el.scrollIntoView({ block: "center" });
    el.focus();
    el.setAttribute("aria-invalid", "true");
    return true;
  }
  return false;
}
