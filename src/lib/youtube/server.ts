import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadConsensus, rebuildConsensus } from "./pipeline.ts";
import type { ConsensusResponse } from "./types.ts";

const idSchema = z.object({ packageId: z.string().min(1).max(80) });

/** Cached / seeded consensus. Safe to call on page load. */
export const getReviewerConsensus = createServerFn({ method: "POST" })
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }): Promise<ConsensusResponse> => {
    try {
      const consensus = await loadConsensus(data.packageId);
      return { ok: true, consensus };
    } catch (err) {
      console.warn("[reviewer-consensus] load", err);
      return { ok: false, message: "Could not load reviewer notes." };
    }
  });

/**
 * Force a YouTube + LLM rebuild. User-initiated (button) — not on page load.
 * Spends xAI quota only when XAI_API_KEY is present.
 */
export const refreshReviewerConsensus = createServerFn({ method: "POST" })
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }): Promise<ConsensusResponse> => {
    try {
      const consensus = await rebuildConsensus(data.packageId);
      return { ok: true, consensus };
    } catch (err) {
      console.warn("[reviewer-consensus] rebuild", err);
      const fallback = await loadConsensus(data.packageId).catch(() => undefined);
      return {
        ok: false,
        message: "Could not rebuild from videos. Showing the last saved notes.",
        consensus: fallback,
      };
    }
  });
