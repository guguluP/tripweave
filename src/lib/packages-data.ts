import type { RawStay } from "./packages-data-a.ts";
import { RAW_A } from "./packages-data-a.ts";
import { RAW_B } from "./packages-data-b.ts";

export type { RawStay } from "./packages-data-a.ts";

/** Catalog rows omit images — media is derived from each stay's curated YouTube videos. */
export const RAW: RawStay[] = [...RAW_A, ...RAW_B];
