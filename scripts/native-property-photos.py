#!/usr/bin/env python3
"""Replace vendored stay JPEGs with the hotel file at its original pixel size."""
import json, subprocess
from pathlib import Path

ROOT = Path("/tmp/tripweave")
PUBLIC = ROOT / "public"
INDEX = json.loads((ROOT / "data/stay-photo-sources/index.json").read_text())
REFERERS = INDEX["referers"]

def native(url: str) -> str:
    if "assets.simplotel.com" in url and "/upload/" in url:
        bits = url.split("/upload/", 1)[1].split("/")
        keep, started = [], False
        for b in bits:
            transform = "," in b or b.startswith(("q_", "w_", "x_", "f_", "c_", "dpr", "fl_", "h_", "r_"))
            if not started and transform:
                continue
            started = True
            keep.append(b)
        return "https://assets.simplotel.com/simplotel/image/upload/" + "/".join(keep)
    if "cdn.sanity.io" in url:
        return url.split("?")[0]
    return url

def referer(url: str) -> str:
    host = url.split("/")[2]
    return REFERERS.get(host, "https://www.mayfairhotels.com/")

def fetch(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    cmd = ["curl", "-fsSL", "-A", "Mozilla/5.0", "-e", referer(url), "-o", str(tmp), native(url)]
    if subprocess.run(cmd).returncode != 0 or not tmp.exists() or tmp.stat().st_size < 4000:
        if tmp.exists():
            tmp.unlink()
        return False
    tmp.replace(dest)
    return True

def main():
    n = 0
    for stay in INDEX["stays"]:
        spec = json.loads((ROOT / "data/stay-photo-sources" / f"{stay}.json").read_text())
        items = list(spec.get("images") or [])
        rooms = spec.get("rooms") or {}
        for room in rooms.values():
            if isinstance(room, dict) and room.get("url"):
                items.append(room)
        for item in items:
            dest = PUBLIC / item["path"]
            if fetch(item["url"], dest):
                n += 1
                print("ok", item["path"], dest.stat().st_size)
            else:
                print("FAIL", item["path"])
    print("property files", n)

if __name__ == "__main__":
    main()
