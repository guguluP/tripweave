// Test-only module hooks: resolve the app's "@/..." alias and extensionless .ts imports so
// `node --test` can load server modules directly. Not used by the app build.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = new URL("../src/", import.meta.url);
const EXTS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function candidate(base) {
  const path = fileURLToPath(base);
  if (existsSync(path) && statSync(path).isFile()) return base;
  for (const ext of EXTS) {
    const next = `${path}${ext}`;
    if (existsSync(next)) return pathToFileURL(next).href;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const hit = candidate(new URL(specifier.slice(2), SRC).href);
    if (hit) return { url: hit, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const hit = candidate(new URL(specifier, context.parentURL).href);
    if (hit) return { url: hit, shortCircuit: true };
  }
  return next(specifier, context);
}
