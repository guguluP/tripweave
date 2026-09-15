import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PackageReviewConsensus, Sentiment } from "./types.ts";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEntry = {
  consensus: PackageReviewConsensus;
  videoHash: string;
  storedAt: number;
};

const g = globalThis as typeof globalThis & {
  __twConsensusCache__?: Map<string, CacheEntry>;
};
if (!g.__twConsensusCache__) g.__twConsensusCache__ = new Map();

function mem() {
  return g.__twConsensusCache__!;
}

function isFresh(entry: CacheEntry, hash: string) {
  if (entry.videoHash !== hash) return false;
  return Date.now() - entry.storedAt < TTL_MS;
}

function asConsensus(row: unknown): PackageReviewConsensus | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const sentiment = r.overall_sentiment ?? r.overallSentiment;
  if (sentiment !== "positive" && sentiment !== "mixed" && sentiment !== "negative") {
    return null;
  }
  const packageId = typeof r.package_id === "string" ? r.package_id : typeof r.packageId === "string" ? r.packageId : "";
  if (!packageId) return null;
  const sources = Array.isArray(r.sources) ? r.sources : [];
  return {
    packageId,
    overallSentiment: sentiment as Sentiment,
    keyPositives: Array.isArray(r.key_positives)
      ? (r.key_positives as string[])
      : Array.isArray(r.keyPositives)
        ? (r.keyPositives as string[])
        : [],
    keyNegatives: Array.isArray(r.key_negatives)
      ? (r.key_negatives as string[])
      : Array.isArray(r.keyNegatives)
        ? (r.keyNegatives as string[])
        : [],
    caveats: Array.isArray(r.caveats) ? (r.caveats as string[]) : [],
    consensusSummary:
      typeof r.consensus_summary === "string"
        ? r.consensus_summary
        : typeof r.consensusSummary === "string"
          ? r.consensusSummary
          : "",
    sources: sources as PackageReviewConsensus["sources"],
    updatedAt:
      typeof r.updated_at === "string"
        ? r.updated_at
        : typeof r.updatedAt === "string"
          ? r.updatedAt
          : new Date().toISOString(),
    origin: r.origin === "live" || r.origin === "empty" || r.origin === "seed" ? r.origin : "live",
  };
}

export function readMemoryCache(packageId: string, hash: string): PackageReviewConsensus | null {
  const entry = mem().get(packageId);
  if (!entry || !isFresh(entry, hash)) return null;
  return entry.consensus;
}

export function writeMemoryCache(
  consensus: PackageReviewConsensus,
  hash: string,
) {
  mem().set(consensus.packageId, {
    consensus,
    videoHash: hash,
    storedAt: Date.now(),
  });
}

export async function readDurableCache(
  packageId: string,
  hash: string,
): Promise<PackageReviewConsensus | null> {
  const hit = readMemoryCache(packageId, hash);
  if (hit) return hit;
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("reviewer_consensus")
      .select("*")
      .eq("package_id", packageId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as {
      video_hash?: string;
      updated_at?: string;
      overall_sentiment: string;
      key_positives: string[];
      key_negatives: string[];
      caveats: string[];
      consensus_summary: string;
      sources: PackageReviewConsensus["sources"];
      origin?: string;
      package_id: string;
    };
    if (row.video_hash && row.video_hash !== hash) return null;
    if (row.updated_at) {
      const age = Date.now() - new Date(row.updated_at).getTime();
      if (Number.isFinite(age) && age > TTL_MS) return null;
    }
    const consensus = asConsensus(row);
    if (!consensus) return null;
    writeMemoryCache(consensus, hash);
    return consensus;
  } catch (err) {
    console.warn("[reviewer-consensus] supabase read failed", err);
    return null;
  }
}

export async function writeDurableCache(
  consensus: PackageReviewConsensus,
  hash: string,
) {
  writeMemoryCache(consensus, hash);
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    const { error } = await sb.from("reviewer_consensus").upsert(
      {
        package_id: consensus.packageId,
        overall_sentiment: consensus.overallSentiment,
        key_positives: consensus.keyPositives,
        key_negatives: consensus.keyNegatives,
        caveats: consensus.caveats,
        consensus_summary: consensus.consensusSummary,
        sources: consensus.sources,
        origin: consensus.origin,
        video_hash: hash,
        updated_at: consensus.updatedAt,
      },
      { onConflict: "package_id" },
    );
    if (error) console.warn("[reviewer-consensus] supabase write", error.message);
  } catch (err) {
    console.warn("[reviewer-consensus] supabase write failed", err);
  }
}

export function logConsensusEvent(
  event: "hit" | "seed" | "live" | "empty" | "fail",
  packageId: string,
  extra?: Record<string, unknown>,
) {
  console.info("[reviewer-consensus]", event, packageId, extra ?? {});
}
