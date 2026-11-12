import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { deskApplyActionToken } from "@/lib/server/desk-ops";
import { pageHead } from "@/lib/page-title";
import { DeskGate } from "@/components/desk-ui";

export const Route = createFileRoute("/desk/action")({
  validateSearch: (search: Record<string, unknown>) => ({
    t: typeof search.t === "string" ? search.t : "",
  }),
  component: DeskActionPage,
  head: () => pageHead("Hotel desk"),
});

function DeskActionPage() {
  const { t } = Route.useSearch();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const looksLikeDecline =
    t.includes("decline") || /decline/i.test(decodeURIComponent(t).slice(0, 80));

  return (
    <Shell>
      <DeskGate
        title="Confirm or decline this stay"
        body="This one-time link was emailed when the guest paid. It does not require the desk portal token."
      >
        {!t ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            Missing action token.
          </p>
        ) : null}
        {result ? (
          <p
            className={`mt-6 text-sm ${result.ok ? "text-ok" : "text-danger"}`}
            role={result.ok ? "status" : "alert"}
          >
            {result.message}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            type="button"
            className="w-full"
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
            {busy
              ? "Applying…"
              : looksLikeDecline
                ? "Apply decline link"
                : "Apply confirm / decline link"}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/desk" search={{ token: "", packageId: "" }}>
              Open desk portal
            </Link>
          </Button>
        </div>
      </DeskGate>
    </Shell>
  );
}
