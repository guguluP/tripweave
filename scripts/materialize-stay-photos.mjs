#!/usr/bin/env node
/**
 * Ensure public/stays JPEGs exist for catalog media.
 * Order: keep existing files; else decode data/vendored-stays-chunks when present;
 * else download from data/stay-photo-sources/ (or .json) (official hotel URLs / wsrv proxy).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destRoot = path.join(root, "public/stays");
const chunkRoot = path.join(root, "data/vendored-stays-chunks");
const sourcesPath = path.join(root, "data/stay-photo-sources.json");
const sourcesDir = path.join(root, "data/stay-photo-sources");
const MIN = 1024;

async function loadSources() {
  if (existsSync(sourcesPath)) {
    return JSON.parse(await readFile(sourcesPath, "utf8"));
  }
  const index = JSON.parse(await readFile(path.join(sourcesDir, "index.json"), "utf8"));
  const stays = {};
  for (const sid of index.stays) {
    stays[sid] = JSON.parse(await readFile(path.join(sourcesDir, `${sid}.json`), "utf8"));
  }
  return { referers: index.referers, proxy_hosts: index.proxy_hosts, stays };
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, pred) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e && e.code === "ENOENT") return out;
    throw e;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(full, pred)));
    else if (ent.isFile() && pred(ent.name)) out.push(full);
  }
  return out;
}

async function writeJpeg(rel, buf) {
  if (buf.length < MIN) throw new Error(`photo too small: ${rel} (${buf.length})`);
  const dest = path.join(destRoot, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  const sha = createHash("sha256").update(buf).digest("hex").slice(0, 12);
  console.log(`wrote stays/${rel} (${buf.length}b sha=${sha})`);
}

function jobsFromSources(sources) {
  const jobs = [];
  for (const spec of Object.values(sources.stays || {})) {
    for (const img of spec.images || []) jobs.push(img);
    for (const room of Object.values(spec.rooms || {})) jobs.push(room);
  }
  return jobs;
}

async function missingJobs(sources) {
  const missing = [];
  for (const job of jobsFromSources(sources)) {
    const rel = job.path.replace(/^stays\//, "");
    if (!(await fileExists(path.join(destRoot, rel)))) missing.push(rel);
  }
  return missing;
}

async function catalogComplete(sources) {
  return (await missingJobs(sources)).length === 0;
}

function refererFor(url, referers) {
  try {
    return referers[new URL(url).hostname] || "";
  } catch {
    return "";
  }
}

function download(url, referer, proxyHosts) {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  const tryCurl = (u, ref) => {
    const args = ["-sS", "-L", "--fail", "--max-time", "60", "-A", "Mozilla/5.0", "-o", "-"];
    if (ref) args.push("-e", ref);
    else args.push("-H", "Referer:");
    args.push(u);
    const r = spawnSync("curl", args, { encoding: "buffer", maxBuffer: 20 * 1024 * 1024 });
    if (r.status === 0 && r.stdout && r.stdout.length >= MIN) return r.stdout;
    return null;
  };
  let buf = tryCurl(url, referer);
  if (!buf && proxyHosts.includes(host)) {
    const proxied = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1600&output=jpg`;
    buf = tryCurl(proxied, "");
  }
  if (!buf) {
    const proxied = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1600&output=jpg`;
    buf = tryCurl(proxied, "");
  }
  return buf;
}

const sources = await loadSources();
if (await catalogComplete(sources)) {
  console.log("stay photos: public/stays already complete");
  process.exit(0);
}

let written = 0;
const indexPath = path.join(chunkRoot, "index.json");
if (existsSync(indexPath)) {
  try {
    const index = JSON.parse(await readFile(indexPath, "utf8"));
    const tmp = mkdtempSync(path.join(tmpdir(), "stay-photos-"));
    try {
      let anyChunk = false;
      for (const name of index.chunks) {
        const chunkFile = path.join(chunkRoot, name);
        if (!existsSync(chunkFile)) continue;
        anyChunk = true;
        const b64 = (await readFile(chunkFile, "utf8")).trim();
        const tarPath = path.join(tmp, name.replace(/\.b64$/, ""));
        writeFileSync(tarPath, Buffer.from(b64, "base64"));
        execFileSync("tar", ["-xf", tarPath, "-C", tmp], { stdio: "pipe" });
      }
      if (anyChunk) {
        const extracted = await walk(tmp, (n) => n.endsWith(".jpg.b64"));
        for (const file of extracted) {
          const rel = path.relative(tmp, file).replace(/\.b64$/, "");
          if (await fileExists(path.join(destRoot, rel))) continue;
          const buf = Buffer.from((await readFile(file, "utf8")).trim(), "base64");
          await writeJpeg(rel, buf);
          written += 1;
        }
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn("chunk materialize failed, falling back to download:", e.message || e);
  }
}

if (await catalogComplete(sources)) {
  console.log(`stay photos: ok via chunks (${written} written)`);
  process.exit(0);
}

const seen = new Map();
for (const job of jobsFromSources(sources)) {
  const rel = job.path.replace(/^stays\//, "");
  if (await fileExists(path.join(destRoot, rel))) continue;
  let buf = seen.get(job.url);
  if (!buf) {
    const ref = refererFor(job.url, sources.referers || {});
    buf = download(job.url, ref, sources.proxy_hosts || []);
    if (!buf) {
      console.warn(`FAIL download ${job.url}`);
      continue;
    }
    const head = buf.subarray(0, 32).toString("utf8").trim().toLowerCase();
    if (head.startsWith("<!doctype") || head.startsWith("<html")) {
      console.warn(`FAIL html body ${job.url}`);
      continue;
    }
    seen.set(job.url, buf);
  }
  await writeJpeg(rel, buf);
  written += 1;
}

const missing = await missingJobs(sources);
if (missing.length) {
  for (const rel of missing) console.error(`missing stays/${rel}`);
  console.error(`stay photos: catalog still incomplete (${missing.length} missing)`);
  process.exit(1);
}
console.log(`stay photos: ok via download (${written} written)`);
