#!/usr/bin/env python3
"""Parse CLI "10 High-Value HSK N Grammar Patterns" section from cached HTML.

Reads /chinese-learn-vite/scripts/cache/studycli/hsk-N-vocab.html, finds the
#grammar block, and writes /chinese-learn-vite/scripts/cache/studycli/hsk-N-grammar.json.

Each pattern has:
  rank            int 1..10
  title           string (Pattern N: <title>)
  description     string (just after <h3>)
  structure       string (text of .grammar-pattern)
  examples        list of {zh, py, en}

English source citation is preserved in `source_url`. Thai translations are NOT
added here — they will be filled in a separate pass via Google Translate.
"""
import json
import re
import sys
from pathlib import Path

CACHE = Path(__file__).resolve().parent / "cache" / "studycli"

def extract_section(html: str) -> str:
    """Return the substring from id=\"grammar\" anchor up to the closing </div></section></div>."""
    m = re.search(r'<div\s+class="container section"\s+id="grammar"', html)
    if not m:
        m = re.search(r'<section\s+class="container section"\s+id="grammar"', html)
    if not m:
        return ""
    start = m.start()
    # find the next sibling section: look for next id="section" or id="categoryGrid" or <div class="info-grid"
    # to bound the slice we collect up to the next top-level container/section.
    rest = html[start:]
    end_m = re.search(
        r'<div\s+class="info-grid"[^>]*id="categoryGrid"|<section\s+class="container section"|<div\s+class="container section"',
        rest[10:],
    )
    if end_m:
        end = start + 10 + end_m.start()
    else:
        end = len(html)
    return html[start:end]

def parse_examples(card_html: str):
    """Return list of {zh, py, en} for one grammar-card."""
    items = []
    for ex in re.finditer(
        r'<div\s+class="example">\s*'
        r'<div\s+class="ex-cn[^"]*"[^>]*>([^<]+)</div>\s*'
        r'<div\s+class="ex-py[^"]*"[^>]*>([^<]+)</div>\s*'
        r'<div\s+class="ex-en">([^<]+)</div>\s*'
        r'</div>',
        card_html,
    ):
        zh, py, en = (
            ex.group(1).strip(),
            ex.group(2).strip(),
            ex.group(3).strip(),
        )
        items.append({"zh": zh, "py": py, "en": en})
    return items

def parse_card(card_html: str, rank: int):
    # title
    title_m = re.search(r'<h3>([^<]+)</h3>', card_html)
    title = title_m.group(1).strip() if title_m else f"Pattern {rank}"
    # description: <p> right after </h3>
    desc_m = re.search(r'</h3>\s*<p>([^<]+)</p>', card_html)
    desc = desc_m.group(1).strip() if desc_m else ""
    # structure
    struct_m = re.search(r'<div\s+class="grammar-pattern">([^<]+)</div>', card_html)
    struct = struct_m.group(1).strip() if struct_m else ""
    # examples
    examples = parse_examples(card_html)
    return {
        "rank": rank,
        "title": title,
        "description": desc,
        "structure": struct,
        "examples": examples,
    }

def parse_grammar_section(html: str):
    section = extract_section(html)
    if not section:
        return []
    # split by grammar-card or article.grammar-card
    cards = re.split(r'(?:<div\s+class="grammar-card">|<article\s+class="grammar-card">)', section)
    out = []
    rank = 0
    for chunk in cards[1:]:
        # chunk ends at first </div></article> closing relative to its opening;
        # find the corresponding close
        # for cards we use </div></div> closing (after examples)
        close_idx = chunk.find('<div class="info-grid"')
        if close_idx < 0:
            close_idx = chunk.find('<section class="container section"')
        if close_idx < 0:
            close_idx = len(chunk)
        chunk = chunk[:close_idx]
        rank += 1
        card = parse_card(chunk, rank)
        out.append(card)
        if rank >= 10:
            break
    return out

def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    for level in [1, 2, 3, 4]:
        src = CACHE / f"hsk-{level}-vocab.html"
        if not src.exists():
            print(f"missing: {src}", file=sys.stderr)
            continue
        html = src.read_text(encoding="utf-8")
        patterns = parse_grammar_section(html)
        data = {
            "level": level,
            "source_url": f"https://studycli.org/chinese-tools/hsk-{level}-vocabulary/",
            "heading": f"10 High-Value HSK {level} Grammar Patterns",
            "patterns": patterns,
        }
        out = CACHE / f"hsk-{level}-grammar.json"
        out.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"HSK {level}: {len(patterns)} patterns → {out.name} ({out.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
