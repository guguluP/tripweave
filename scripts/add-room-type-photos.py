#!/usr/bin/env python3
"""Add official photos for one stay's catalog room types.

Usage: python3 scripts/add-room-type-photos.py SPEC.json [SPEC.json ...]

SPEC = {
  "stay": "golden-tree-puri",
  "rooms": {
    "<roomId>": {
      "label": "Super Deluxe Room",          # category name exactly as shown at the source
      "page": "https://hotel.example/rooms/x",  # page the photos are published on
      "generic": true,                         # catalog room is a generic slot ("Standard room")
      "basis": "why this category is this slot", # required when generic
      "urls": ["https://.../1.jpg", ...]
    }
  },
  "floors": { "<roomId>": { "floors": "Top floor", "source": "url or note path", "quote": "..." } }
}

Each frame is downloaded with the source's own Referer, checked to be a real photo,
resized to at most 1600px and saved as progressive JPEG under
public/stays/{stay}/rooms/{roomId}[-N].jpg. Near-duplicate frames (same shot at another
size or crop) are skipped. The source URL, page and label are recorded in
data/stay-photo-sources/{stay}.json and the frames are wired into src/lib/stay-media.json.
"""
import io, json, subprocess, sys
from pathlib import Path
from urllib.parse import urlparse, quote

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SOURCES = ROOT / "data/stay-photo-sources"
MEDIA_PATH = ROOT / "src/lib/stay-media.json"
META_PATH = ROOT / "src/lib/room-photo-meta.json"
MAX_EDGE = 1600
MIN_EDGE = 360
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def curl(url: str, referer: str):
    args = ["curl", "-sSL", "--fail", "--max-time", "60", "-A", UA, "-o", "-"]
    args += ["-e", referer] if referer else ["-H", "Referer:"]
    r = subprocess.run(args + [url], capture_output=True)
    return r.stdout if r.returncode == 0 and len(r.stdout) > 2000 else None


def fetch(url: str, page: str):
    origin = f"{urlparse(page).scheme}://{urlparse(page).netloc}/" if page else ""
    buf = curl(url, origin) or curl(url, "")
    if not buf:
        buf = curl(f"https://wsrv.nl/?url={quote(url, safe='')}&output=jpg", "")
    return buf


def dhash(im: Image.Image) -> int:
    g = im.convert("L").resize((9, 8), Image.LANCZOS)
    px = list(g.getdata())
    bits = 0
    for row in range(8):
        for col in range(8):
            bits = (bits << 1) | (px[row * 9 + col] > px[row * 9 + col + 1])
    return bits


def near(a: int, b: int) -> bool:
    return bin(a ^ b).count("1") <= 5


def load_json(path: Path, default):
    return json.loads(path.read_text()) if path.exists() else default


def main(spec_path: str):
    spec = json.loads(Path(spec_path).read_text())
    stay = spec["stay"]
    media = load_json(MEDIA_PATH, {})
    meta = load_json(META_PATH, {"ROOMS": {}})
    stay_media = media["STAY_MEDIA"].get(stay)
    created_empty = False
    if stay_media is None:
        stay_media = {"images": [], "rooms": {}}
        created_empty = True
    src_path = SOURCES / f"{stay}.json"
    sources = load_json(src_path, {"images": [], "rooms": {}})
    sources.setdefault("rooms", {})
    index = load_json(SOURCES / "index.json", {"referers": {}, "proxy_hosts": [], "stays": []})
    summary = {}

    for rid, room in spec.get("rooms", {}).items():
        if room.get("generic") and not room.get("basis"):
            raise SystemExit(f"{stay}/{rid}: generic slot needs a basis")
        current = stay_media["rooms"].get(rid) or []
        current = current if isinstance(current, list) else [current]
        hashes = []
        for rel in current:
            p = PUBLIC / rel.lstrip("/")
            if p.exists():
                hashes.append(dhash(Image.open(p)))
        recorded = {v["url"] for v in sources["rooms"].values() if isinstance(v, dict)}
        added = 0
        for url in room.get("urls", []):
            if url in recorded:
                continue
            buf = fetch(url, room.get("page", ""))
            if not buf:
                print(f"FAIL {stay}/{rid} {url}")
                continue
            try:
                im = Image.open(io.BytesIO(buf))
                im.load()
            except Exception:
                print(f"NOT-IMAGE {stay}/{rid} {url}")
                continue
            if min(im.size) < MIN_EDGE:
                print(f"TOO-SMALL {stay}/{rid} {im.size} {url}")
                continue
            im = im.convert("RGB")
            h = dhash(im)
            if any(near(h, o) for o in hashes):
                print(f"DUP {stay}/{rid} {url}")
                continue
            n = len(current) + 1
            name = f"{rid}.jpg" if n == 1 else f"{rid}-{n}.jpg"
            while (PUBLIC / "stays" / stay / "rooms" / name).exists():
                n += 1
                name = f"{rid}-{n}.jpg"
            rel = f"stays/{stay}/rooms/{name}"
            dest = PUBLIC / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
            im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
            key = name[:-4]
            entry = {"url": url, "path": rel}
            if room.get("page"):
                entry["page"] = room["page"]
            if room.get("label"):
                entry["label"] = room["label"]
            sources["rooms"][key] = entry
            current.append("/" + rel)
            hashes.append(h)
            added += 1
            host = urlparse(url).hostname or ""
            if host and host not in index["referers"] and room.get("page"):
                p = urlparse(room["page"])
                index["referers"][host] = f"{p.scheme}://{p.netloc}/"
        if current:
            stay_media["rooms"][rid] = current
        if room.get("generic") and room.get("label") and current:
            m = meta["ROOMS"].setdefault(stay, {}).setdefault(rid, {})
            m["sourceName"] = room["label"]
            m["basis"] = room["basis"]
        summary[rid] = (added, len(current))

    for rid, fl in spec.get("floors", {}).items():
        m = meta["ROOMS"].setdefault(stay, {}).setdefault(rid, {})
        m["floors"] = fl["floors"]
        m["floorSource"] = fl["source"]
        if fl.get("quote"):
            m["floorQuote"] = fl["quote"]

    if stay not in index["stays"] and sources["rooms"]:
        index["stays"].append(stay)
    src_path.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n")
    (SOURCES / "index.json").write_text(json.dumps(index, indent=2) + "\n")
    if created_empty and (stay_media.get("rooms") or stay_media.get("images")):
        media["STAY_MEDIA"][stay] = stay_media
    elif not created_empty:
        # Drop a previously written empty stub (e.g. floors-only apply).
        if stay in media["STAY_MEDIA"] and not stay_media.get("rooms") and not stay_media.get("images"):
            del media["STAY_MEDIA"][stay]
    MEDIA_PATH.write_text(json.dumps(media, indent=2, ensure_ascii=False) + "\n")
    META_PATH.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    print(stay, {k: f"+{a} -> {t}" for k, (a, t) in summary.items()})


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        main(arg)
