#!/usr/bin/env python3
"""Replace the HSK 1-4 entries in src/data/hskGrammar.js with the freshly
pulled studycli.org data, while keeping the manually-compiled HSK 5-7
entries intact further down in the same file.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "hskGrammar.js"
BLOCK = ROOT / "scripts" / "cache" / "studycli" / "hsk-1-4-block.js"

src_text = SRC.read_text(encoding="utf-8")
block_text = BLOCK.read_text(encoding="utf-8").rstrip() + "\n"

# Update top comment: studycli sources HSK 1-4 directly.
new_header = '''// "10 High-Value HSK Grammar Patterns" — one place to see the most useful
// grammar points per HSK level.
//
// HSK 1-4 are pulled directly from studycli.org's per-level vocabulary
// pages (#grammar section): comparable phrasing, accurate pinyin, and a
// reliable English gloss. Each card carries a `source_url` link back to
// the original page. Thai translations are generated from the English
// gloss with Google Translate and reviewed for sense.
//
// HSK 5-7 are not separately published on studycli.org, so below the
// HSK 4 block we keep a manually curated set of 10 patterns per level
// drawn from standard HSK grammar references and tagged with provenance
// in the file.
//
// Each entry has:
//   structure  — the canonical Chinese pattern (e.g. "是...的")
//   pinyin     — pronunciation of the structure
//   english    — short English description of the function
//   thai       — short Thai description (parallel to english)
//   example_zh — example Chinese sentence (or first plural if multiple)
//   example_py — example pinyin
//   example_en — example English gloss
//   example_th — example Thai gloss
//   more_examples — array of {zh, py, en, th} for additional examples
//                    (rendered when the user expands the card)
//   source_url — original source page (when available)
'''

# Identify the slab of HSK 1-4 entries: everything between line `  {` (line 20)
# immediately after `const HSK_GRAMMAR = [` and the closing `},` of HSK 4
# pattern-10. The HSK 5 block always opens with `  {\n    level: 5,`.
start_marker = "const HSK_GRAMMAR = [\n"
end_marker = "  {\n    level: 5,\n"

i = src_text.find(start_marker)
if i < 0:
    raise SystemExit("start marker not found")
j = src_text.find(end_marker, i)
if j < 0:
    raise SystemExit("end marker not found")

# Compose new file: header + opening + new HSK 1-4 block + HSK 5-7 tail
prefix = src_text[: i + len(start_marker)]               # up to and including `const HSK_GRAMMAR = [`
suffix = src_text[j:]                                     # from `  {\n    level: 5,...` to the end

# Trim trailing comma issue: insert a comma after our new block so it parses
# with the next HSK 5 block. Block ends with `},\n` already.
new_body = block_text  # already ends in \n

new_file = new_header + prefix + new_body + suffix

# Sanity: ensure ", source_url:" extension was added or we don't break
# (old HSK 5-7 patterns don't have source_url but the renderer doesn't use it)

SRC.write_text(new_file, encoding="utf-8")
print(f"rewrote {SRC}: {len(src_text)} -> {len(new_file)} bytes")
