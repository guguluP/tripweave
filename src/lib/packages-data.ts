import type { RawStay } from "./packages-data-a.ts";
import { RAW_A } from "./packages-data-a.ts";
import { RAW_B } from "./packages-data-b.ts";
import { RAW_C } from "./packages-data-c.ts";

export type { RawStay } from "./packages-data-a.ts";

/** Catalog rows omit images — media is attached from property-owned /stays/{id}/ files. */
export const RAW: RawStay[] = [...RAW_A, ...RAW_B, ...RAW_C];
