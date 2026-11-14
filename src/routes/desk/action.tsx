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

/**
 * The link's body is signed, not secret: read it only to label the button, so the
 * desk can see "Confirm" or "Decline" before pressing. The server still verifies it.
 */
function previewDeskLink(token: string): { action: "accept" | "decline"; code: string } | null {
  try {
    const body = token.split(".")[0] ?? "";
    if (!body) return null;
    const padded = body.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (body.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as { action?: unknown; confirmationCode?: unknown };
    if (parsed.action !== "accept" && parsed.action !== "decline") return null;
    const code = typeof parsed.confirmationCode === "string" ? parsed.confirmationCode.slice(0, 24) : "";
    return { action: parsed.action, code };
  } catch {
    return null;
  }
}

function DeskActionPage() {
  const { t } = Route.useSearch();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = previewDeskLink(t);
  const looksLikeDecline = preview?.action === "decline";

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
                ? `Decline${preview?.code ? ` ${preview.code}` : " this stay"}`
                : preview?.action === "accept"
                  ? `Confirm${preview.code ? ` ${preview.code}` : " this stay"}`
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
