#!/usr/bin/env python3
"""Retry failed translations from the cache.

Walks the compiled JSON, identifies entries where translation equals the
source (i.e. failed before), then attempts them with longer backoff.
"""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

CACHE = Path(__file__).resolve().parent / "cache" / "studycli"
TRANSLATE_CACHE = CACHE / "translate-cache.json"
COMPILED = CACHE / "studycli-grammar-compiled.json"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)

def translate_google(text: str, retries: int = 4) -> str:
    if not text:
        return ""
    q = urllib.parse.quote(text)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q={q}"
    last = ""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.loads(r.read().decode("utf-8"))
            out = "".join(seg[0] for seg in data[0] if seg and seg[0])
            if out and out != text:
                return out
        except Exception as e:
            last = str(e)
        time.sleep(1.5 * (attempt + 1))
    print(f"  ! still failed: {text[:60]!r}")
    return text

def main():
    cache = json.loads(TRANSLATE_CACHE.read_text(encoding="utf-8"))
    compiled = json.loads(COMPILED.read_text(encoding="utf-8"))
    pending = []
    for level in compiled:
        for p in level["patterns"]:
            if p.get("description_th", "") == p.get("description", ""):
                pending.append(("desc", p["description"]))
            for ex in p["examples"]:
                if ex.get("th", "") == ex.get("en", ""):
                    pending.append(("ex", ex["en"]))
    # dedupe
    seen, unique = set(), []
    for kind, k in pending:
        if k in seen:
            continue
        seen.add(k)
        unique.append((kind, k))
    print(f"retrying {len(unique)} unique pending items")
    ops = 0
    for kind, k in unique:
        cache[k] = translate_google(k)
        ops += 1
        time.sleep(0.7)
    TRANSLATE_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=0), encoding="utf-8")

    # rewrite compiled from cache
    for level in compiled:
        for p in level["patterns"]:
            p["description_th"] = cache.get(p["description"], p["description"])
            for ex in p["examples"]:
                ex["th"] = cache.get(ex["en"], ex["en"])
    COMPILED.write_text(json.dumps(compiled, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"rewrote compiled JSON, ops={ops}")

if __name__ == "__main__":
    main()
