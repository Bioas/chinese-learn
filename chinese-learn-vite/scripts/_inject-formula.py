#!/usr/bin/env python3
"""Inject `formula` and `formulaTh` into each pattern in hskGrammar.js.

Formula EN/TH is a one-line structure like "A + 比 + B + Adjective" rendered
in a colored "chip" badge between the description and the example sentence.
TH mirrors EN with Thai grammar-school abbreviations: ประธาน / กริยา /
วัตถุ / คำคุณศัพท์ / คำกริยาวิเศษณ์ / ผลลัพธ์ / เงื่อนไข.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "src", "data", "hskGrammar.js")

# Map: pattern.structure -> (formula_en, formula_th)
# Thai uses: ประธาน=Subject, กริยา=Verb, วัตถุ=Object, คำคุณศัพท์=Adjective,
# ผลลัพธ์=Resultat, เงื่อนไข=Condition, เหตุ=Cause, ข้อเท็จจริง=Fact
FORMULAS = {
    # ── HSK 1 ───────────────────────────────────────────────
    "Basic Word Order: Subject + Verb + Object":
        ("Subject + Verb + Object", "ประธาน + กริยา + วัตถุ"),
    "Identifying with 是 (shì)":
        ("A + 是 + B", "A + 是 + B"),
    "Adjective Predicates and 很 (hěn)":
        ("Subject + 很 + Adjective", "ประธาน + 很 + คำคุณศัพท์"),
    "Possession and Existence with 有 (yǒu)":
        ("Subject + 有 + Object", "ประธาน + 有 + วัตถุ"),
    "Yes-or-No Questions with 吗 (ma)":
        ("Statement + 吗", "ประโยคบอกเล่า + 吗"),
    "Question Words Stay in Place":
        ("Question Word + 在 sentence position",
         "คำถาม + อยู่ในตำแหน่งเดิมของประโยค"),
    "Negation with 不 and 没有":
        ("不 / 没 + Verb", "不 / 没 + กริยา"),
    "Completed Events and Changes with 了 (le)":
        ("Subject + Verb + 了", "ประธาน + กริยา + 了"),
    "Actions in Progress with 在 / 正在":
        ("Subject + 在 / 正在 + Verb", "ประธาน + 在 / 正在 + กริยา"),
    "Time, Place, and Purpose Before the Main Action":
        ("Time + Place + Subject + Verb",
         "เวลา + สถานที่ + ประธาน + กริยา"),

    # ── HSK 2 ───────────────────────────────────────────────
    "Comparisons with 比 (bǐ)":
        ("A + 比 + B + Adjective", "A + 比 + B + คำคุณศัพท์"),
    "Experience with 过 (guo)":
        ("Subject + Verb + 过", "ประธาน + กริยา + 过"),
    "Cause and Effect: 因为…所以 (yīnwèi…suǒyǐ)":
        ("因为 + Cause, 所以 + Result",
         "因为 + เหตุ, 所以 + ผล"),
    "Concession: 虽然…但是 (suīrán…dànshì)":
        ("虽然 + Concession, 但是 + Contrast",
         "虽然 + ข้อยกเว้น, 但是 + ข้อความขัดแย้ง"),
    "Directional Complements: 来/去 (lái/qù)":
        ("Verb + 来 / 去", "กริยา + 来 / 去"),
    "Distance with 离 (lí)":
        ("A + 离 + B + Distance", "A + 离 + B + ระยะทาง"),
    "The Degree Complement with 得 (de)":
        ("Verb + 得 + Adverbial", "กริยา + 得 + กริยาวิเศษณ์"),
    "Ongoing State with 着 (zhe)":
        ("Subject + Verb + 着", "ประธาน + กริยา + 着"),
    "Imminent Action: 快要…了 (kuàiyào…le)":
        ("快要 + Verb + 了", "快要 + กริยา + 了"),
    "每 (měi) + Measure Word: \"Every\"":
        ("每 + Measure Word + Noun", "每 + ลักษณนาม + คำนาม"),

    # ── HSK 3 ───────────────────────────────────────────────
    "The 把 (bǎ) Construction":
        ("Subject + 把 + Object + Verb + Complement",
         "ประธาน + 把 + วัตถุ + กริยา + ส่วนเติม"),
    "The Passive with 被 (bèi)":
        ("Object + 被 + (Agent) + Verb",
         "วัตถุ + 被 + (ผู้กระทำ) + กริยา"),
    "不但…而且… (búdàn…érqiě…): Not only…but also…":
        ("不但 + A, 而且 + B", "不但 + A, 而且 + B"),
    "如果…就… (rúguǒ…jiù…): If…then…":
        ("如果 + Condition, 就 + Result",
         "如果 + เงื่อนไข, 就 + ผล"),
    "The Complement of Degree: Verb + 得 (de)":
        ("Verb + 得 + Adverbial", "กริยา + 得 + กริยาวิเศษณ์"),
    "应该 (yīnggāi) and 必须 (bìxū): Should and Must":
        ("Subject + 应该 / 必须 + Verb",
         "ประธาน + 应该 / 必须 + กริยา"),
    "一边…一边… (yìbiān…yìbiān…): Doing Two Things at Once":
        ("Subject + 一边 + Verb₁, 一边 + Verb₂",
         "ประธาน + 一边 + กริยา₁, 一边 + กริยา₂"),
    "越来越 (yuè lái yuè): More and more":
        ("Subject + 越来越 + Adjective / Verb",
         "ประธาน + 越来越 + คำคุณศัพท์ / กริยา"),
    "除了…以外 (chúle…yǐwài): Besides / Except":
        ("除了 + A (以外), …", "除了 + A (以外), …"),

    # ── HSK 4 ───────────────────────────────────────────────
    "把: foregrounding what is affected":
        ("Subject + 把 + Object + Verb + Complement",
         "ประธาน + 把 + วัตถุ + กริยา + ส่วนเติม"),
    "被: the passive voice":
        ("Object + 被 + (Agent) + Verb",
         "วัตถุ + 被 + (ผู้กระทำ) + กริยา"),
    "越来越: an ongoing change":
        ("Subject + 越来越 + Adjective / Verb",
         "ประธาน + 越来越 + คำคุณศัพท์ / กริยา"),
    "越…越…: linked change":
        ("越 + A, 越 + B", "越 + A, 越 + B"),
    "除了…以外…: adding or excluding":
        ("除了 + A (以外), …", "除了 + A (以外), …"),
    "即使…也…: even if":
        ("即使 + Condition, 也 + Result",
         "即使 + เงื่อนไข, 也 + ผล"),
    "既然…就…: since that is the case":
        ("既然 + Fact, 就 + Conclusion",
         "既然 + ข้อเท็จจริง, 就 + ข้อสรุป"),
    "不但/不仅…而且…: not only…but also":
        ("不但 / 不仅 + A, 而且 + B",
         "不但 / 不仅 + A, 而且 + B"),
    "无论/不管…都…: no matter what":
        ("无论 / 不管 + Condition, 都 + Result",
         "无论 / 不管 + เงื่อนไข, 都 + ผล"),
    "只要…就…: one sufficient condition":
        ("只要 + Condition, 就 + Result",
         "只要 + เงื่อนไข, 就 + ผล"),

    # ── HSK 5 ───────────────────────────────────────────────
    "不管…都/也…":
        ("不管 + A, 都 / 也 + B", "不管 + A, 都 / 也 + B"),
    "一旦…就…":
        ("一旦 + Condition, 就 + Result",
         "一旦 + เงื่อนไข, 就 + ผล"),
    "宁可…也不…":
        ("宁可 + A, 也不 + B", "宁可 + A, 也不 + B"),
    "要么…要么…":
        ("要么 + A, 要么 + B", "要么 + A, 要么 + B"),
    "甚至 (shènzhì)":
        ("A + 甚至 + B", "A + 甚至 + B"),
    "顺便 (shùnbiàn)":
        ("顺便 + Verb", "顺便 + กริยา"),
    "凡是…都…":
        ("凡是 + A, 都 + B", "凡是 + A, 都 + B"),
    "罢了 (bàle)":
        ("A + 罢了", "A + 罢了"),
    "V 着 V 着 — gradual change":
        ("Verb₁ + 着 + Verb₁ + 着 + …",
         "กริยา₁ + 着 + กริยา₁ + 着 + …"),
    "通过 (tōngguò)":
        ("通过 + Method, + Achievement",
         "通过 + วิธี, + ผลสำเร็จ"),

    # ── HSK 6 ───────────────────────────────────────────────
    "连…都/也… (lián)":
        ("连 + A + 都 / 也 + B", "连 + A + 都 / 也 + B"),
    "只是…而已 / 罢了":
        ("只是 + A + 而已 / 罢了", "只是 + A + 而已 / 罢了"),
    "何况 (hékuàng)":
        ("A, 何况 + B", "A, 何况 + B"),
    "只有…才…":
        ("只有 + Condition, 才 + Result",
         "只有 + เงื่อนไข, 才 + ผล"),
    "之所以…是因为…":
        ("之所以 + Result, 是因为 + Cause",
         "之所以 + ผล, 是因为 + เหตุ"),
    "V 也 V 不 / V 都 V 不":
        ("Verb + 也 / 都 + Verb + 不",
         "กริยา + 也 / 都 + กริยา + 不"),
    "何况…呢（反问）":
        ("A, 何况 + B + 呢", "A, 何况 + B + 呢"),
    "并非…而是…":
        ("并非 + A, 而是 + B", "并非 + A, 而是 + B"),
    "以便 / 以免":
        ("以便 + Goal / 以免 + Risk",
         "以便 + เป้าหมาย / 以免 + ความเสี่ยง"),

    # ── HSK 7-9 ─────────────────────────────────────────────
    "不但…还…":
        ("不但 + A, 还 + B", "不但 + A, 还 + B"),
    "倒 (dào) — contrary to expectation":
        ("倒 + Verb", "倒 + กริยา"),
    "竟 (jìng)":
        ("竟 + Verb / Adj", "竟 + กริยา / คำคุณศัพท์"),
    "一方面…另一方面…":
        ("一方面 + A, 另一方面 + B",
         "一方面 + A, 另一方面 + B"),
    "倘若…则…":
        ("倘若 + Condition, 则 + Result",
         "倘若 + เงื่อนไข, 则 + ผล"),
    "A 归 A，B 归 B":
        ("A 归 A, B 归 B", "A 归 A, B 归 B"),
    "不难看出 / 由此可见":
        ("不难看出 / 由此可见 + Conclusion",
         "不难看出 / 由此可见 + ข้อสรุป"),
    "若非…则…":
        ("若非 + A, 则 + B", "若非 + A, 则 + B"),
    "A 与其…不如…":
        ("与其 + A, 不如 + B", "与其 + A, 不如 + B"),
    "凡是…均…":
        ("凡是 + A, 均 + B", "凡是 + A, 均 + B"),
    "既然…就…":
        ("既然 + Fact, 就 + Conclusion",
         "既然 + ข้อเท็จจริง, 就 + ข้อสรุป"),
}


def main():
    with io.open(PATH, "r", encoding="utf-8") as f:
        src = f.read()

    pattern_struct_re = re.compile(
        r"(\n\s*structure:\s*'([^']+)',\s*\n)"
        r"(\s*titleTh:\s*'[^']+',\s*\n)?"
    )

    hits = 0
    misses = []

    def replace(m):
        nonlocal hits
        full = m.group(0)
        struct = m.group(2)
        title_th_line = m.group(3) or ""
        if struct not in FORMULAS:
            misses.append(struct)
            return full
        f_en, f_th = FORMULAS[struct]
        # Build new block: structure + titleTh + formula + formulaTh
        new = m.group(1) + title_th_line
        if title_th_line:
            new += f"        formula: {f_en!r},\n"
            new += f"        formulaTh: {f_th!r},\n"
        else:
            new += f"        formula: {f_en!r},\n"
            new += f"        formulaTh: {f_th!r},\n"
        hits += 1
        return new

    new_src = pattern_struct_re.sub(replace, src)

    print(f"Injected {hits} formula entries")
    if misses:
        print(f"MISSED ({len(misses)}):", file=sys.stderr)
        for m in misses:
            print(f"  - {m!r}", file=sys.stderr)

    with io.open(PATH, "w", encoding="utf-8") as f:
        f.write(new_src)

    if misses:
        sys.exit(1)


if __name__ == "__main__":
    main()
