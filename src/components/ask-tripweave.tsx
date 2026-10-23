import { useState } from "react";
import { askTripWeave } from "@/lib/server/arrival-ask";
import { guestLabel, useGuestLocale, type GuestLocale } from "@/lib/guest-locale";
import { Button } from "@/components/ui/button";

type Turn = { question: string; answer: string };

export function AskTripWeave({
  nationalities = [],
  oci,
  priorIndianVisa,
  arrivalAirport,
  checkIn,
  packageId,
  roomId,
  nights,
  arriveBy,
  confirmationCode,
  embedded = false,
}: {
  nationalities?: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
  packageId?: string;
  roomId?: string;
  nights?: number;
  arriveBy?: string;
  confirmationCode?: string;
  /** Inside the arrival checklist, which already has the elevated frame. */
  embedded?: boolean;
}) {
  const locale = useGuestLocale();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  const suggestions = [
    guestLabel(locale, "askFly"),
    guestLabel(locale, "askRefund"),
    guestLabel(locale, "askCar"),
    ...(confirmationCode ? [guestLabel(locale, "askDesk")] : []),
  ];

  const ask = (next?: string) => {
    const text = (next ?? question).trim();
    if (text.length < 3 || busy) return;
    setBusy(true);
    const history = turns.slice(-4);
    void askTripWeave({
      data: {
        question: text,
        nationalities: nationalities.filter((code) => /^[A-Z]{2}$/.test(code)).slice(0, 12),
        oci,
        priorIndianVisa,
        arrivalAirport,
        checkIn,
        packageId,
        roomId,
        nights,
        arriveBy: arriveBy === "fly" || arriveBy === "train" || arriveBy === "bus" || arriveBy === "road" ? arriveBy : undefined,
        confirmationCode,
        locale,
        history,
      },
    })
      .then((result) => {
        const answer = answerFor(locale, result);
        setTurns((prev) => [...prev, { question: text, answer }].slice(-4));
        if (!next) setQuestion("");
      })
      .catch(() => {
        setTurns((prev) => [...prev, { question: text, answer: guestLabel(locale, "askFailed") }].slice(-4));
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className={embedded ? "mt-4 border-t border-border pt-3" : "mt-4 rounded-lg border border-border bg-elevated px-4 py-3"}>
      <p className="text-sm font-medium">{guestLabel(locale, "askTitle")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((text) => (
          <button
            key={text}
            type="button"
            className="rounded-md border border-border px-2 py-1 text-left text-xs"
            disabled={busy}
            onClick={() => ask(text)}
          >
            {text}
          </button>
        ))}
      </div>
      {turns.map((turn, index) => (
        <div key={`${index}-${turn.question}`} className="mt-3 text-sm">
          <p className="text-xs text-muted">{guestLabel(locale, "askYou")}</p>
          <p>{turn.question}</p>
          <p className="mt-1">{turn.answer}</p>
        </div>
      ))}
      <label className="mt-3 block text-sm">
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
      <Button type="button" variant="outline" className="mt-2" disabled={busy || question.trim().length < 3} onClick={() => ask()}>
        {guestLabel(locale, "askSend")}
      </Button>
    </div>
  );
}

function answerFor(
  locale: GuestLocale,
  result:
    | { ok: true; answer: string }
    | { ok: false; reason: "not_configured" | "rate_limited" | "no_documents" | "unavailable" },
): string {
  if (result.ok) return result.answer;
  if (result.reason === "not_configured") return guestLabel(locale, "askOff");
  if (result.reason === "rate_limited") return guestLabel(locale, "askLimited");
  if (result.reason === "no_documents") return guestLabel(locale, "askNoDocuments");
  return guestLabel(locale, "askFailed");
}
