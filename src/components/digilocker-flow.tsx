import { useState } from "react";
import { FileCheck, Lock, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShakeField } from "@/components/motion";
import { DIGILOCKER_DOC_OPTIONS, DIGILOCKER_STATUS, type DigilockerDocId } from "@/lib/digilocker";
import { completeDigilockerSandbox, startDigilockerSession } from "@/lib/server/digilocker";
import type { Traveler } from "@/lib/travelers";
import { cn } from "@/lib/utils";

type Step = "consent" | "otp" | "done";

export function DigilockerFlow({
  guestIndex,
  guestLabel,
  onClose,
  onApply,
}: {
  guestIndex: number;
  guestLabel: string;
  onClose: () => void;
  onApply: (traveler: Traveler) => void;
}) {
  const [step, setStep] = useState<Step>("consent");
  const [docs, setDocs] = useState<DigilockerDocId[]>(["aadhaar"]);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("123456");

  const toggleDoc = (id: DigilockerDocId) => {
    setDocs((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const onConsent = async () => {
    if (docs.length === 0) {
      setError("Choose at least one issued document.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await startDigilockerSession({ data: { guestIndex } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.mode === "live") {
        window.open(result.authorizeUrl, "_blank", "noopener,noreferrer");
        setError("Finish consent on DigiLocker, then return. Sandbox is used until partner credentials are live.");
        return;
      }
      setHint(result.hint);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start DigiLocker.");
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await completeDigilockerSandbox({
        data: { guestIndex, otp, docs },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onApply(result.traveler);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch issued documents.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-fg/40"
        aria-label="Close DigiLocker"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md rounded-2xl p-5 shadow-soft sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">DigiLocker</p>
            <h2 className="mt-1 font-display text-2xl">Fill {guestLabel}</h2>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === "consent" ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              TripWeave requests issued documents with your consent. Live pull needs API Setu
              requester credentials. This sandbox returns sample identity for product testing.
            </p>
            <ul className="grid gap-2">
              {DIGILOCKER_DOC_OPTIONS.map((doc) => {
                const on = docs.includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm",
                      on ? "border-primary/40 bg-primary/5" : "border-border bg-elevated",
                    )}
                  >
                    <span>
                      <span className="font-medium">{doc.label}</span>
                      <span className="ml-2 text-xs text-subtle">{doc.issuer}</span>
                    </span>
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={on}
                      onChange={() => toggleDoc(doc.id)}
                    />
                  </label>
                );
              })}
            </ul>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="flex-1" disabled={busy} onClick={() => void onConsent()}>
                <ShieldCheck className="size-4" />
                {busy ? "Starting…" : "Continue with consent"}
              </Button>
              <Button type="button" variant="outline" asChild className="flex-1">
                <a href={DIGILOCKER_STATUS.citizenApp} target="_blank" rel="noreferrer">
                  Open DigiLocker
                </a>
              </Button>
            </div>
            <p className="text-xs text-subtle">
              Partner onboarding:{" "}
              <a className="underline underline-offset-2" href={DIGILOCKER_STATUS.portal} target="_blank" rel="noreferrer">
                API Setu DigiLocker
              </a>
            </p>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              Sandbox OTP for this session is <span className="font-medium tabular-nums text-fg">{hint}</span>.
              Live DigiLocker would send this to the Aadhaar-linked mobile.
            </p>
            <ShakeField
              label="6-digit OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              error={error}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button type="button" className="w-full" disabled={busy || otp.length !== 6} onClick={() => void onVerify()}>
              <Lock className="size-4" />
              {busy ? "Fetching issued documents…" : "Verify and fill guest"}
            </Button>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="mt-4 space-y-4">
            <p className="flex items-center gap-2 text-sm text-ok">
              <FileCheck className="size-4" />
              Issued documents applied to {guestLabel}.
            </p>
            <Button type="button" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
