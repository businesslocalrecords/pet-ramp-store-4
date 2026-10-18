#!/usr/bin/env python3
"""Download Chewy listing photos, strip metadata, and write the shop catalog.

The source file is the desktop export. Chewy's listed price is stored as
`cost`. Selling price is applied in src/lib/catalog.ts.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image

SOURCE = Path("/home/ubuntu/.cursor/projects/workspace/uploads/chewy-catalog_d92c.json")
OUT_DIR = Path("/workspace/public/assets/chewy")
CATALOG = Path("/workspace/src/lib/chewy-products.json")
MAX_EDGE = 1400
WORKERS = 8


def image_key(url: str) -> str:
    base = url.split("/")[-1].split("?")[0]
    return re.sub(r"\._.*$", "", base)


def size_score(url: str) -> int:
    match = re.search(r"(?:SL|SS|SX)(\d+)", url)
    return int(match.group(1)) if match else 0


def best_urls(urls: list[str]) -> list[str]:
    chosen: dict[str, str] = {}
    for url in urls:
        key = image_key(url)
        current = chosen.get(key)
        if current is None or size_score(url) > size_score(current):
            chosen[key] = url
    return list(chosen.values())


def kind_and_use(name: str) -> tuple[str, str]:
    text = name.lower()
    if "hitch" in text:
        place = "cargo"
    elif any(word in text for word in ("car", "suv", "truck")):
        place = "car"
    else:
        place = "home"
    if "ramp" in text and "stair" not in text and "step" not in text:
        kind = "ramp"
    else:
        kind = "stairs"
    return kind, place


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read()


def save_jpeg(raw: bytes, dest: Path) -> None:
    image = Image.open(BytesIO(raw))
    image = image.convert("RGB")
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "JPEG", quality=85, optimize=True)


def main() -> int:
    data = json.loads(SOURCE.read_text())
    seen: set[str] = set()
    jobs: list[tuple[str, int, str]] = []
    products = []
    for item in data["products"]:
        match = re.search(r"/dp/(\d+)", item["url"])
        if not match:
            continue
        dp = match.group(1)
        if dp in seen:
            continue
        seen.add(dp)
        urls = best_urls(item["images"])
        frames = []
        for index, url in enumerate(urls, start=1):
            rel = f"assets/chewy/{dp}/{index}.jpg"
            jobs.append((url, index, rel))
            frames.append(f"/{rel}")
        kind, place = kind_and_use(item["name"])
        products.append(
            {
                "dp": dp,
                "name": item["name"],
                "cost": float(item["price"]),
                "kind": kind,
                "use": place,
                "images": frames,
            }
        )

    def run(job: tuple[str, int, str]) -> tuple[str, str | None]:
        url, _index, rel = job
        dest = Path("/workspace/public") / rel
        if dest.exists() and dest.stat().st_size > 0:
            return rel, None
        try:
            save_jpeg(fetch(url), dest)
            return rel, None
        except Exception as error:  # noqa: BLE001 — keep going through the batch
            return rel, str(error)

    failures: list[str] = []
    done = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(run, job) for job in jobs]
        for future in as_completed(futures):
            rel, error = future.result()
            done += 1
            if error:
                failures.append(f"{rel} {error}")
            if done % 40 == 0 or done == len(jobs):
                print(f"{done}/{len(jobs)}", flush=True)

    kept = []
    for product in products:
        product["images"] = [
            path
            for path in product["images"]
            if (Path("/workspace/public") / path.lstrip("/")).exists()
        ]
        if product["images"]:
            kept.append(product)

    CATALOG.write_text(json.dumps(kept, indent=2) + "\n")
    print(f"products {len(kept)} of {len(products)}; failures {len(failures)}")
    for line in failures[:20]:
        print("FAIL", line)
    return 1 if not kept else 0


if __name__ == "__main__":
    sys.exit(main())
