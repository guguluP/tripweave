import { useState } from "react";
import { askTripWeave } from "@/lib/server/arrival-ask";
import { guestLabel, useGuestLocale } from "@/lib/guest-locale";
import { Button } from "@/components/ui/button";

export function AskTripWeave({
  nationalities,
  oci,
  priorIndianVisa,
  arrivalAirport,
  checkIn,
}: {
  nationalities: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
}) {
  const locale = useGuestLocale();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = () => {
    const text = question.trim();
    if (text.length < 3) return;
    setBusy(true);
    setAnswer("");
    void askTripWeave({
      data: {
        question: text,
        nationalities: nationalities.filter((code) => /^[A-Z]{2}$/.test(code)).slice(0, 12),
        oci,
        priorIndianVisa,
        arrivalAirport,
        checkIn,
      },
    })
      .then((result) => {
        if (result.ok) {
          setAnswer(result.answer);
          return;
        }
        if (result.reason === "not_configured") setAnswer(guestLabel(locale, "askOff"));
        else if (result.reason === "rate_limited") setAnswer(guestLabel(locale, "askLimited"));
        else if (result.reason === "no_documents") setAnswer(guestLabel(locale, "askNoDocuments"));
        else setAnswer(guestLabel(locale, "askFailed"));
      })
      .catch(() => setAnswer(guestLabel(locale, "askFailed")))
      .finally(() => setBusy(false));
  };

  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="text-sm font-medium">{guestLabel(locale, "askTitle")}</p>
      <label className="mt-2 block text-sm">
        <span className="sr-only">{guestLabel(locale, "askTitle")}</span>
        <textarea
          value={question}
          maxLength={400}
          rows={2}
          placeholder={guestLabel(locale, "askPlaceholder")}
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>
      <Button type="button" variant="outline" className="mt-2" disabled={busy || question.trim().length < 3} onClick={ask}>
        {guestLabel(locale, "askSend")}
      </Button>
      {answer ? <p className="mt-2 text-sm">{answer}</p> : null}
    </div>
  );
}
