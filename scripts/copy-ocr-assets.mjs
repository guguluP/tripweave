/**
 * Copy tesseract.js worker, LSTM cores and eng traineddata into public/ocr.
 * The browser loads these from /ocr/ so no OCR CDN is used at runtime.
 * LSTM_ONLY (the worker default) uses the best_int traineddata shipped in
 * @tesseract.js-data/eng, which is smaller than the legacy 4.0.0 file.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "ocr");
mkdirSync(out, { recursive: true });

const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract-core-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
  [
    "node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js",
    "tesseract-core-relaxedsimd-lstm.wasm.js",
  ],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "eng.traineddata.gz"],
];

for (const [from, name] of files) {
  copyFileSync(join(root, from), join(out, name));
  console.log(`[ocr] ${name}`);
}
