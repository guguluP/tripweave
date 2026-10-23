import { useState } from "react";
import { checklistForParty, SOURCES, type ChecklistItem } from "@/lib/arrival-rules";
import { CHECKLIST_HI, guestLabel, useGuestLocale } from "@/lib/guest-locale";
import { emailArrivalChecklist } from "@/lib/server/arrival-mail";
import { pushBanner } from "@/lib/banners";
import { AskTripWeave } from "@/components/ask-tripweave";
import { Button } from "@/components/ui/button";

export function ArrivalChecklist({
  nationalities,
  oci,
  priorIndianVisa,
  arrivalAirport = "BBI",
  checkIn,
  promptOnly = false,
  showEmail = false,
  confirmationCode,
  packageId,
  roomId,
  nights,
  arriveBy,
  hideAsk = false,
}: {
  nationalities: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
  promptOnly?: boolean;
  showEmail?: boolean;
  confirmationCode?: string;
  packageId?: string;
  roomId?: string;
  nights?: number;
  arriveBy?: string;
  hideAsk?: boolean;
}) {
  const locale = useGuestLocale();
  const [sending, setSending] = useState(false);
  const codes = nationalities.map((code) => (code || "IN").trim().toUpperCase());
  const foreign = codes.some((code) => code !== "IN");

  if (promptOnly || !foreign) {
    if (!promptOnly) return null;
    return (
      <div className="rounded-lg border border-border bg-elevated px-4 py-3">
        <p className="text-sm font-medium">{guestLabel(locale, "checklistTitle")}</p>
        <p className="mt-1 text-sm text-muted">{guestLabel(locale, "checklistPrompt")}</p>
      </div>
    );
  }

  const items = checklistForParty({
    nationalities: codes,
    oci,
    priorIndianVisa,
    arrivalAirport,
    arrivalDate: checkIn,
  });

  const send = () => {
    setSending(true);
    void emailArrivalChecklist({
      data: {
        nationalities: codes.filter((code) => /^[A-Z]{2}$/.test(code)).slice(0, 12),
        oci,
        priorIndianVisa,
        confirmationCode,
        arrivalAirport,
      },
    })
      .then((result) => {
        if (result.ok) {
          pushBanner({ title: guestLabel(locale, "emailSent"), tone: "ok" });
        } else if (result.reason === "rate_limited") {
          pushBanner({ title: guestLabel(locale, "emailFailed"), body: "Try again in an hour.", tone: "info" });
        } else {
          pushBanner({ title: guestLabel(locale, "emailFailed"), tone: "info" });
        }
      })
      .catch(() => pushBanner({ title: guestLabel(locale, "emailFailed"), tone: "info" }))
      .finally(() => setSending(false));
  };

  return (
    <section className="rounded-lg border border-border bg-elevated px-4 py-3">
      <h2 className="text-sm font-medium">{guestLabel(locale, "checklistTitle")}</h2>
      <ul className="mt-3 grid gap-3">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} hindi={locale === "hi"} />
        ))}
      </ul>
      {showEmail ? (
        <Button type="button" variant="outline" className="mt-4" disabled={sending} onClick={send}>
          {guestLabel(locale, "emailChecklist")}
        </Button>
      ) : null}
      {hideAsk ? null : (
        <AskTripWeave
          nationalities={codes}
          oci={oci}
          priorIndianVisa={priorIndianVisa}
          arrivalAirport={arrivalAirport}
          checkIn={checkIn}
          packageId={packageId}
          roomId={roomId}
          nights={nights}
          arriveBy={arriveBy}
          confirmationCode={confirmationCode}
          embedded
        />
      )}
    </section>
  );
}

function ChecklistRow({ item, hindi }: { item: ChecklistItem; hindi: boolean }) {
  const source = SOURCES[item.sourceId];
  return (
    <li className="text-sm">
      <p>{item.text}</p>
      <a className="mt-1 inline-block text-xs text-primary underline" href={source.url}>
        {source.title}
      </a>
      {hindi ? (
        <p className="mt-1 text-xs text-muted">
          {guestLabel("hi", "unofficial")}: {CHECKLIST_HI[item.id] ?? "आधिकारिक वाक्य अंग्रेज़ी में है।"}
        </p>
      ) : null}
    </li>
  );
}
