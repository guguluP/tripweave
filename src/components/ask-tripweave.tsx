import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { emailArrivalChecklist } from "@/lib/server/arrival-mail";
import { requestHotelCar } from "@/lib/server/ask-actions";
import { SOURCES } from "@/lib/arrival-rules";
import { presentAnswer, type AskChip } from "@/lib/ask-present";
import { getBearerToken } from "@/lib/auth/client";
import { guestLabel, useGuestLocale, type GuestLocale } from "@/lib/guest-locale";
import { refundAmountInr, refundPolicyFor } from "@/lib/refund-policy";
import { pickupQuoteFor } from "@/lib/travel-plan";
import { Button } from "@/components/ui/button";

type Turn = { question: string; answer: string; chips: AskChip[]; tripweave: boolean };

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
  includePickup = false,
  amountInr,
  onRequestCar,
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
  includePickup?: boolean;
  amountInr?: number;
  /** Before a booking exists, the page turns the car on in the travel draft. */
  onRequestCar?: () => void;
  embedded?: boolean;
}) {
  const locale = useGuestLocale();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [carOn, setCarOn] = useState(includePickup);
  const [carNote, setCarNote] = useState("");
  const [mailNote, setMailNote] = useState("");

  useEffect(() => {
    setCarOn(includePickup);
  }, [includePickup]);

  useEffect(() => {
    const code = confirmationCode?.trim();
    if (!code) return;
    const headers: Record<string, string> = {};
    const token = getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    void fetch(`/api/ask?confirmationCode=${encodeURIComponent(code)}`, { headers, credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { turns?: { question: string; answer: string }[] } | null) => {
        const saved = body?.turns ?? [];
        if (saved.length === 0) return;
        const allowed = Object.values(SOURCES).map((source) => source.url);
        setTurns(
          saved.map((row) => {
            const view = presentAnswer(row.answer, allowed);
            return { question: row.question, answer: view.prose || row.answer, chips: view.chips, tripweave: view.tripweave };
          }),
        );
      })
      .catch(() => undefined);
  }, [confirmationCode]);

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
    setDraft("");
    const history = turns.slice(-4).map((row) => ({ question: row.question, answer: row.answer }));
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    void fetch("/api/ask", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({
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
      }),
    })
      .then(async (res) => {
        const type = res.headers.get("content-type") ?? "";
        if (type.includes("application/json")) {
          const body = (await res.json()) as { reason?: TurnReason };
          pushTurn(text, answerFor(locale, body.reason ?? "unavailable"), [], false);
          return;
        }
        if (!res.body) {
          pushTurn(text, guestLabel(locale, "askFailed"), [], false);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let live = "";
        while (true) {
          const step = await reader.read();
          if (step.done) break;
          buf += decoder.decode(step.value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let event: {
              type?: string;
              text?: string;
              answer?: string;
              chips?: AskChip[];
              tripweave?: boolean;
              reason?: TurnReason;
            };
            try {
              event = JSON.parse(line) as typeof event;
            } catch {
              continue;
            }
            if (event.type === "token" && event.text) {
              live += event.text;
              setDraft(live);
            } else if (event.type === "done") {
              pushTurn(text, event.answer || live, event.chips ?? [], Boolean(event.tripweave));
              live = "";
            } else if (event.type === "error") {
              pushTurn(text, guestLabel(locale, "askFailed"), [], false);
            }
          }
        }
      })
      .catch(() => pushTurn(text, guestLabel(locale, "askFailed"), [], false))
      .finally(() => {
        setDraft("");
        setBusy(false);
        if (!next) setQuestion("");
      });
  };

  const pushTurn = (asked: string, answer: string, chips: AskChip[], tripweave: boolean) => {
    setTurns((prev) => [...prev, { question: asked, answer, chips, tripweave }].slice(-8));
  };

  const foreign = nationalities.some((code) => (code || "IN").toUpperCase() !== "IN");
  const carAvailable = arriveBy === "fly" && packageId ? pickupQuoteFor(packageId, "fly").available : false;
  const refund =
    checkIn && amountInr != null && amountInr > 0
      ? `₹${refundAmountInr(amountInr, checkIn).toLocaleString("en-IN")}. ${refundPolicyFor(checkIn).label}.`
      : checkIn
        ? refundPolicyFor(checkIn).label
        : "";

  const emailChecklist = () => {
    setMailNote("");
    void emailArrivalChecklist({
      data: {
        nationalities: nationalities.filter((code) => /^[A-Z]{2}$/.test(code)).slice(0, 12),
        oci,
        priorIndianVisa,
        confirmationCode,
        arrivalAirport,
      },
    })
      .then((result) => {
        setMailNote(result.ok ? guestLabel(locale, "askEmailSent") : guestLabel(locale, "askFailed"));
      })
      .catch(() => setMailNote(guestLabel(locale, "askFailed")));
  };

  const requestCar = () => {
    if (onRequestCar && !confirmationCode) {
      onRequestCar();
      setCarOn(true);
      setCarNote(guestLabel(locale, "askCarDone"));
      return;
    }
    if (!confirmationCode) return;
    void requestHotelCar({ data: { confirmationCode } })
      .then((result) => {
        if (result.ok) {
          setCarOn(true);
          setCarNote(guestLabel(locale, "askCarDone"));
        } else setCarNote(result.message);
      })
      .catch(() => setCarNote(guestLabel(locale, "askFailed")));
  };

  return (
    <div className={embedded ? "" : "mt-4 rounded-lg border border-border bg-elevated px-4 py-3"}>
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
      <div aria-live="polite">
        {turns.map((turn, index) => (
          <div key={`${index}-${turn.question}`} className="mt-3 text-sm">
            <p className="text-xs text-muted">{guestLabel(locale, "askYou")}</p>
            <p>{turn.question}</p>
            <p className="mt-1">{turn.answer}</p>
            {turn.tripweave ? <p className="mt-1 text-xs text-muted">{guestLabel(locale, "askFromStay")}</p> : null}
            {turn.chips.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {turn.chips.map((chip) => (
                  <a key={chip.url} className="ask-chip rounded-md border border-border px-2 py-1 text-xs underline" href={chip.url}>
                    {chip.title}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {draft ? <p className="mt-3 text-sm">{draft}</p> : null}
      </div>
      <label className="mt-3 block text-sm">
        <span className="sr-only">{guestLabel(locale, "askTitle")}</span>
        <textarea
          value={question}
          maxLength={400}
          rows={2}
          placeholder={guestLabel(locale, "askPlaceholder")}
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          onChange={(event) => setQuestion(event.target.value)}
        />
      </label>
      <Button type="button" variant="outline" className="mt-2" disabled={busy || question.trim().length < 3} onClick={() => ask()}>
        {busy ? guestLabel(locale, "askWorking") : guestLabel(locale, "askSend")}
      </Button>
      {turns.length > 0 ? (
        <div className="mt-4 grid gap-2 border-t border-border pt-3">
          {foreign ? (
            <Button type="button" variant="outline" onClick={emailChecklist}>
              {guestLabel(locale, "askEmail")}
            </Button>
          ) : null}
          {mailNote ? <p className="text-xs text-muted">{mailNote}</p> : null}
          {carAvailable && !carOn ? (
            <Button type="button" variant="outline" onClick={requestCar}>
              {guestLabel(locale, "askCarButton")}
            </Button>
          ) : null}
          {carNote ? <p className="text-xs text-muted">{carNote}</p> : null}
          {refund ? <p className="text-xs text-muted">{guestLabel(locale, "askRefundNow")} {refund}</p> : null}
          {confirmationCode ? (
            <Link to="/voucher/$code" params={{ code: confirmationCode }} className="text-sm font-medium underline">
              {guestLabel(locale, "askOpenVoucher")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type TurnReason = "not_configured" | "rate_limited" | "no_documents" | "unavailable";

function answerFor(locale: GuestLocale, reason: TurnReason): string {
  if (reason === "not_configured") return guestLabel(locale, "askOff");
  if (reason === "rate_limited") return guestLabel(locale, "askLimited");
  if (reason === "no_documents") return guestLabel(locale, "askNoDocuments");
  return guestLabel(locale, "askFailed");
}
