import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { deskApplyActionToken } from "@/lib/server/desk-ops";

export const Route = createFileRoute("/desk/action")({
  validateSearch: (search: Record<string, unknown>) => ({
    t: typeof search.t === "string" ? search.t : "",
  }),
  component: DeskActionPage,
});

function DeskActionPage() {
  const { t } = Route.useSearch();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const looksLikeDecline = t.includes("decline") || /decline/i.test(decodeURIComponent(t).slice(0, 80));

  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="eyebrow">Hotel desk</p>
        <h1 className="mt-2 font-display text-3xl">Confirm or decline this stay</h1>
        <p className="mt-3 text-sm text-muted">
          This one-time link was emailed when the guest paid. It does not require the desk portal token.
        </p>
        {!t ? <p className="mt-4 text-sm text-danger">Missing action token.</p> : null}
        {result ? (
          <p className={`mt-6 text-sm ${result.ok ? "text-ok" : "text-danger"}`}>{result.message}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            type="button"
            disabled={!t || busy || Boolean(result?.ok)}
            onClick={() => {
              setBusy(true);
              void deskApplyActionToken({ data: { token: t } }).then((res) => {
                setBusy(false);
                setResult({
                  ok: res.ok,
                  message: res.ok
                    ? "Done. The guest trip list will update to hotel confirmed or cancelled."
                    : res.message,
                });
              });
            }}
          >
            {looksLikeDecline ? "Apply decline link" : "Apply confirm / decline link"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/desk">Open desk portal</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
