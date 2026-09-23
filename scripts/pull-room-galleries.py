#!/usr/bin/env python3
"""Download every official room photo we already scraped and wire stay-media.json."""
import json, os, re, subprocess, hashlib
from pathlib import Path

ROOT = Path("/tmp/tripweave")
PUBLIC = ROOT / "public"
MEDIA = json.loads((ROOT / "src/lib/stay-media.json").read_text())

def norm(s):
    s = s.lower()
    s = s.replace("–", " ").replace("—", " ")
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\b(rooms?|with|and|the)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def best_url(url: str) -> str:
    if "assets.simplotel.com" in url and "/upload/" in url:
        bits = url.split("/upload/", 1)[1].split("/")
        keep = []
        started = False
        for b in bits:
            transform = "," in b or b.startswith(("q_", "w_", "x_", "f_", "c_", "dpr", "fl_", "h_", "r_"))
            if not started and transform:
                continue
            started = True
            keep.append(b)
        public_id = "/".join(keep) if keep else bits[-1]
        return f"https://assets.simplotel.com/simplotel/image/upload/{public_id}"
    if "cdn.sanity.io" in url:
        return url.split("?")[0]
    return url

def score(a, b):
    ta, tb = set(norm(a).split()), set(norm(b).split())
    if not ta or not tb:
        return 0
    return len(ta & tb) / len(ta | tb)

def load_catalog_ids():
    out = {}
    for p in (ROOT / "src/lib/official-rooms").glob("*.ts"):
        text = p.read_text()
        stay = p.stem
        pairs = re.findall(r'id: "([^"]+)",\s*\n\s*name: "([^"]+)"', text)
        out[stay] = pairs
    # taj lives in packages-data
    text = (ROOT / "src/lib/packages-data-a.ts").read_text()
    # taj rooms are inline; read stay-media keys
    taj = MEDIA["STAY_MEDIA"]["taj-puri-resort-spa"]["rooms"]
    names = {
        "executive-sea-suite": "EXECUTIVE SEA VIEW SUITE WITH BALCONY",
        "luxury-sea-suite": "LUXURY SEA VIEW SUITE WITH BALCONY",
        "presidential-sea-pool": "PRESIDENTIAL SEA VIEW SUITE WITH PRIVATE POOL",
        "superior-king-balcony": "SUPERIOR ROOM KING BED WITH BALCONY",
        "superior-twin-balcony": "SUPERIOR ROOM TWIN BED WITH BALCONY",
        "superior-sea-king": "SUPERIOR SEA VIEW ROOM KING BED WITH BALCONY",
        "superior-sea-twin": "SUPERIOR SEA VIEW ROOM TWIN BED WITH BALCONY",
        "deluxe-sea-king": "DELUXE SEA VIEW ROOM KING BED WITH BALCONY",
        "deluxe-sea-twin": "DELUXE SEA VIEW ROOM TWIN BED WITH BALCONY",
        "luxury-sea-king": "LUXURY SEA VIEW ROOM KING BED WITH BALCONY",
        "grand-plunge-king": "GRAND LUXURY ROOM KING BED WITH PLUNGE POOL",
        "grand-plunge-twin": "GRAND LUXURY ROOM TWIN BED WITH PLUNGE POOL",
    }
    out["taj-puri-resort-spa"] = [(k, v) for k, v in names.items() if k in taj]
    return out

def download(url, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    r = subprocess.run(
        ["curl", "-fsSL", "-A", "Mozilla/5.0", "-e", "https://www.mayfairhotels.com/", "-o", str(tmp), url],
        capture_output=True,
    )
    if r.returncode != 0 or not tmp.exists() or tmp.stat().st_size < 8000:
        if tmp.exists():
            tmp.unlink()
        # retry original url
        r = subprocess.run(
            ["curl", "-fsSL", "-A", "Mozilla/5.0", "-o", str(tmp), url],
            capture_output=True,
        )
    if r.returncode != 0 or not tmp.exists() or tmp.stat().st_size < 8000:
        if tmp.exists():
            tmp.unlink()
        return False
    # jpeg magic
    head = tmp.read_bytes()[:3]
    if head not in (b"\xff\xd8\xff", b"\x89PN"):
        # sanity webp sometimes
        tmp.rename(dest)
        return True
    tmp.rename(dest)
    return True

def main():
    catalog = load_catalog_ids()
    sources = {}
    for p in (ROOT / "data/official-rooms").glob("*.json"):
        if p.name.startswith("_"):
            continue
        sources[p.stem] = json.load(p.open())
    sources["taj-puri-resort-spa"] = json.load((ROOT / "data/taj-puri-rooms.json").open())

    for stay, rooms in sources.items():
        ids = catalog.get(stay, [])
        used = set()
        mapping = {}
        for room in rooms:
            best_id, best_s = None, 0
            for rid, name in ids:
                if rid in used:
                    continue
                s = score(room["name"], name)
                if s > best_s:
                    best_id, best_s = rid, s
            if best_id and best_s >= 0.34:
                used.add(best_id)
                mapping[best_id] = room["images"]
            else:
                print("UNMATCHED", stay, room["name"], "best", best_id, best_s)
        spec = MEDIA["STAY_MEDIA"][stay]
        new_rooms = {}
        for rid, current in spec["rooms"].items():
            urls = mapping.get(rid) or []
            if not urls:
                new_rooms[rid] = current if isinstance(current, list) else [current]
                continue
            paths = []
            for i, url in enumerate(urls, start=1):
                rel = f"stays/{stay}/rooms/{rid}-{i}.jpg"
                dest = PUBLIC / rel
                ok = download(best_url(url), dest)
                if not ok:
                    ok = download(url, dest)
                if ok:
                    paths.append("/" + rel)
                    print("ok", rel, dest.stat().st_size)
                else:
                    print("FAIL", stay, rid, url[:80])
            if not paths:
                new_rooms[rid] = current if isinstance(current, list) else [current]
            else:
                new_rooms[rid] = paths
        spec["rooms"] = new_rooms
        print(stay, {k: len(v) for k, v in new_rooms.items()})
    (ROOT / "src/lib/stay-media.json").write_text(json.dumps(MEDIA, indent=2) + "\n")

if __name__ == "__main__":
    main()
