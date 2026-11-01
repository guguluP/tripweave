import { IMD_PURI_URL, type LocalBulletin } from "@/lib/ask-model";
import { parsePuriBulletin } from "@/lib/puri-bulletin";

const TTL_OK_MS = 30 * 60_000;
const TTL_FAIL_MS = 2 * 60_000;

let cache: { at: number; bulletin: LocalBulletin } | null = null;

async function loadBulletin(): Promise<LocalBulletin> {
  try {
    const response = await fetch(IMD_PURI_URL, {
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
      headers: { accept: "text/html", "user-agent": "TripWeave" },
    });
    if (response.status !== 200) return { ok: false };
    return parsePuriBulletin(await response.text());
  } catch {
    return { ok: false };
  }
}

/** One Puri forecast, shared by this process. Failures are remembered for two minutes. */
export async function puriBulletin(now = Date.now()): Promise<LocalBulletin> {
  if (cache) {
    const age = now - cache.at;
    const ttl = cache.bulletin.ok ? TTL_OK_MS : TTL_FAIL_MS;
    if (age >= 0 && age < ttl) return cache.bulletin;
  }
  const bulletin = await loadBulletin();
  cache = { at: now, bulletin };
  return bulletin;
}
