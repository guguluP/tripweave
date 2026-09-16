import { PACKAGES } from "./packages.ts";
import { trustScoreForPackage } from "./trust-score.ts";

/**
 * Keep catalog `trustScore` values aligned with the transparent formula in
 * `trust-score.ts`. Runs once on import (client + SSR entry).
 *
 * Prefer wiring `trustScoreForPackage` inside `PACKAGES` map when that file
 * is updated; this side-effect is the lightweight remote-safe path.
 */
for (const pkg of PACKAGES) {
  pkg.trustScore = trustScoreForPackage(pkg);
}
