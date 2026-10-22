import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { guestLabel, useGuestLocale } from "@/lib/guest-locale";
import type { Traveler } from "@/lib/travelers";

type Preview = {
  fullName: string;
  nationality?: string;
  idNumber: string;
  warnings: string[];
  expiryWarning?: string;
  checkDigitsOk: boolean;
};

const WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";

export function PassportScan({
  arrivalDate,
  onApply,
}: {
  arrivalDate?: string;
  onApply: (patch: Partial<Traveler>) => void;
}) {
  const locale = useGuestLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failed, setFailed] = useState(false);

  const onFile = (file: File | undefined) => {
    setFailed(false);
    setPreview(null);
    if (!file) return;
    setBusy(true);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      void recognise(image, url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setBusy(false);
      setFailed(true);
    };
    image.src = url;
  };

  const recognise = async (image: HTMLImageElement, url: string) => {
    const canvas = document.createElement("canvas");
    let worker: { terminate: () => Promise<unknown> } | null = null;
    try {
      const cropH = Math.max(1, Math.round(image.naturalHeight * 0.25));
      const cropY = Math.max(0, image.naturalHeight - cropH);
      canvas.width = image.naturalWidth;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(image, 0, cropY, image.naturalWidth, cropH, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        const grey = data[i]! * 0.3 + data[i + 1]! * 0.59 + data[i + 2]! * 0.11;
        const bit = grey > 140 ? 255 : 0;
        data[i] = bit;
        data[i + 1] = bit;
        data[i + 2] = bit;
      }
      ctx.putImageData(pixels, 0, 0);
      const { createWorker } = await import("tesseract.js");
      const { mrzToTraveler, pickMrzLines } = await import("@/lib/mrz");
      const created = await createWorker("eng", 1, {
        workerPath: "/ocr/worker.min.js",
        corePath: "/ocr",
        langPath: "/ocr",
        workerBlobURL: true,
        gzip: true,
      });
      worker = created;
      await created.setParameters({ tessedit_char_whitelist: WHITELIST });
      const recognised = await created.recognize(canvas);
      const lines = pickMrzLines(recognised.data.text || "");
      const fill = lines ? mrzToTraveler(lines, { arrivalDate }) : null;
      if (!fill) {
        setFailed(true);
        return;
      }
      setPreview({
        fullName: fill.fullName,
        nationality: fill.nationality,
        idNumber: fill.idNumber,
        warnings: fill.warnings,
        expiryWarning: fill.expiryWarning,
        checkDigitsOk: fill.checkDigitsOk,
      });
    } catch {
      setFailed(true);
    } finally {
      URL.revokeObjectURL(url);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          /* already stopped */
        }
      }
      if (fileRef.current) fileRef.current.value = "";
      setBusy(false);
    }
  };

  return (
    <div className="sm:col-span-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? guestLabel(locale, "scanReading") : guestLabel(locale, "scanPassport")}
      </Button>
      {failed ? <p className="mt-2 text-xs text-muted">{guestLabel(locale, "scanFail")}</p> : null}
      {preview ? (
        <div className="mt-3 rounded-md border border-border bg-surface px-3 py-3 text-sm">
          <p>{preview.fullName}</p>
          {preview.nationality ? <p className="text-muted">{preview.nationality}</p> : null}
          {preview.idNumber ? <p className="text-muted">···· {preview.idNumber}</p> : null}
          {preview.checkDigitsOk ? <p className="mt-1 text-xs text-muted">{guestLabel(locale, "checkDigitsOk")}</p> : null}
          {preview.expiryWarning ? <p className="mt-1 text-xs text-muted">{guestLabel(locale, "expiryWarn")}</p> : null}
          {preview.warnings.map((warning) => (
            <p key={warning} className="mt-1 text-xs text-muted">
              {warning}
            </p>
          ))}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const patch: Partial<Traveler> = { fullName: preview.fullName, idType: "passport" };
                if (preview.nationality) patch.nationality = preview.nationality;
                if (preview.idNumber) patch.idNumber = preview.idNumber;
                onApply(patch);
                setPreview(null);
              }}
            >
              {guestLabel(locale, "savedUse")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreview(null)}>
              {guestLabel(locale, "discard")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
