import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadConsensus } from "./pipeline.ts";
import type { ConsensusResponse } from "./types.ts";

const idSchema = z.object({ packageId: z.string().min(1).max(80) });

/** Read-only reviewer notes: the saved row, else the curated seed. Never rebuilds or calls a model. */
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
