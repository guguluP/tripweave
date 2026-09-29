/**
 * Shared guard for Vercel cron routes.
 * When CRON_SECRET is set, Vercel sends Authorization: Bearer <CRON_SECRET>.
 * Local/dev without the secret is allowed so curl can exercise the job.
 */
export function unauthorizedCron(request: Request): Response | null {
  const secret = process.env.CRON_SECRET?.trim() || "";
  const auth = request.headers.get("authorization") || "";

  if (secret) {
    if (auth === `Bearer ${secret}`) return null;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "CRON_SECRET is not configured. Set it on Vercel before enabling crons." },
      { status: 401 },
    );
  }

  return null;
}

export function opsAlertEmail(): string {
  return (
    process.env.OPS_ALERT_EMAIL?.trim() ||
    process.env.SES_FROM?.trim() ||
    "ops@tripweave.app"
  );
}
