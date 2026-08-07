#!/usr/bin/env python3
"""Translate studycli grammar JSONs from English to Thai using Google free
endpoints with local caching. Builds a single combined JSON that the JS
side can import.
"""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

CACHE = Path(__file__).resolve().parent / "cache" / "studycli"
TRANSLATE_CACHE = CACHE / "translate-cache.json"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)

def load_cache() -> dict:
    if TRANSLATE_CACHE.exists():
        return json.loads(TRANSLATE_CACHE.read_text(encoding="utf-8"))
    return {}

def save_cache(c: dict) -> None:
    TRANSLATE_CACHE.write_text(json.dumps(c, ensure_ascii=False, indent=0), encoding="utf-8")

def translate_google(text: str, retries: int = 3) -> str:
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
            return out
        except Exception as e:
            last = str(e)
            time.sleep(0.7 * (attempt + 1))
    print(f"  ! failed: {text[:60]!r} -> {last}", flush=True)
    return text

def main():
    cache = load_cache()
    combined = []
    total_calls = 0
    for level in (1, 2, 3, 4):
        src = CACHE / f"hsk-{level}-grammar.json"
        if not src.exists():
            continue
        data = json.loads(src.read_text(encoding="utf-8"))
        for p in data["patterns"]:
            key = p["description"]
            if key in cache:
                p["description_th"] = cache[key]
            else:
                p["description_th"] = translate_google(key)
                cache[key] = p["description_th"]
                total_calls += 1
                time.sleep(0.25)
            for ex in p["examples"]:
                k = ex["en"]
                if k in cache:
                    ex["th"] = cache[k]
                else:
                    ex["th"] = translate_google(k)
                    cache[k] = ex["th"]
                    total_calls += 1
                    time.sleep(0.25)
        combined.append(data)
    save_cache(cache)
    out = CACHE / "studycli-grammar-compiled.json"
    out.write_text(json.dumps(combined, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nwrote {out} - {len(combined)} levels, {total_calls} new translations")

if __name__ == "__main__":
    main()
