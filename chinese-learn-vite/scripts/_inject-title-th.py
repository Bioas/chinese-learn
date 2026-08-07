#!/usr/bin/env python3
"""Inject `titleTh` into each pattern in hskGrammar.js (per-card Thai title)."""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "src", "data", "hskGrammar.js")

# Map: pattern.structure -> Thai title
TITLES_TH = {
    # ── HSK 1 ───────────────────────────────────────────────
    "Basic Word Order: Subject + Verb + Object":
        "โครงสร้างประโยคพื้นฐาน: ประธาน + กริยา + วัตถุ",
    "Identifying with 是 (shì)": "ระบุตัวตนด้วย 是 (shì)",
    "Adjective Predicates and 很 (hěn)": "ภาคแสดงคำคุณศัพท์และ 很 (hěn)",
    "Possession and Existence with 有 (yǒu)": "การครอบครองและการดำรงอยู่ด้วย 有 (yǒu)",
    "Yes-or-No Questions with 吗 (ma)": "คำถามใช่/ไม่ใช่ด้วย 吗 (ma)",
    "Question Words Stay in Place": "คำถามอยู่ในตำแหน่งเดิม",
    "Negation with 不 and 没有": "การปฏิเสธด้วย 不 และ 没有",
    "Completed Events and Changes with 了 (le)":
        "เหตุการณ์ที่เสร็จสมบูรณ์และการเปลี่ยนแปลงด้วย 了 (le)",
    "Actions in Progress with 在 / 正在": "การกระทำที่กำลังดำเนินอยู่ด้วย 在 / 正在",
    "Time, Place, and Purpose Before the Main Action":
        "เวลา สถานที่ และจุดประสงค์ก่อนกริยาหลัก",

    # ── HSK 2 ───────────────────────────────────────────────
    "Comparisons with 比 (bǐ)": "การเปรียบเทียบด้วย 比 (bǐ)",
    "Experience with 过 (guo)": "ประสบการณ์ด้วย 过 (guo)",
    "Cause and Effect: 因为…所以 (yīnwèi…suǒyǐ)":
        "เหตุและผล: 因为…所以 (yīnwèi…suǒyǐ)",
    "Concession: 虽然…但是 (suīrán…dànshì)":
        "การยอมรับข้อยกเว้น: 虽然…但是 (suīrán…dànshì)",
    "Directional Complements: 来/去 (lái/qù)": "ส่วนเติมทิศทาง: 来/去 (lái/qù)",
    "Distance with 离 (lí)": "ระยะทางด้วย 离 (lí)",
    "The Degree Complement with 得 (de)": "ส่วนเติมระดับด้วย 得 (de)",
    "Ongoing State with 着 (zhe)": "สถานะที่ดำเนินอยู่ด้วย 着 (zhe)",
    "Imminent Action: 快要…了 (kuàiyào…le)":
        "การกระทำที่กำลังจะเกิด: 快要…了 (kuàiyào…le)",
    "每 (měi) + Measure Word: \"Every\"": "每 (měi) + ลักษณนาม: \"ทุกๆ\"",

    # ── HSK 3 ───────────────────────────────────────────────
    "The 把 (bǎ) Construction": "โครงสร้าง 把 (bǎ)",
    "The Passive with 被 (bèi)": "ประโยค passive ด้วย 被 (bèi)",
    "不但…而且… (búdàn…érqiě…): Not only…but also…":
        "不但…而且…: ไม่เพียงแต่…แต่ยัง…",
    "如果…就… (rúguǒ…jiù…): If…then…":
        "如果…就…: ถ้า…ก็…",
    "The Complement of Degree: Verb + 得 (de)":
        "ส่วนเติมระดับ: กริยา + 得 (de)",
    "应该 (yīnggāi) and 必须 (bìxū): Should and Must":
        "应该 และ 必须: ควร และ ต้อง",
    "一边…一边… (yìbiān…yìbiān…): Doing Two Things at Once":
        "一边…一边…: ทำสองอย่างพร้อมกัน",
    "越来越 (yuè lái yuè): More and more": "越来越: มากขึ้นเรื่อยๆ",
    "除了…以外 (chúle…yǐwài): Besides / Except":
        "除了…以外: นอกจาก / ยกเว้น",

    # ── HSK 4 ───────────────────────────────────────────────
    "把: foregrounding what is affected": "把: การเน้นสิ่งที่ได้รับผลกระทบ",
    "被: the passive voice": "被: ประโยค passive",
    "越来越: an ongoing change": "越来越: การเปลี่ยนแปลงที่ดำเนินต่อเนื่อง",
    "越…越…: linked change": "越…越…: การเปลี่ยนแปลงที่เชื่อมโยง",
    "除了…以外…: adding or excluding":
        "除了…以外…: การเพิ่มหรือยกเว้น",
    "即使…也…: even if": "即使…也…: แม้ว่า…ก็…",
    "既然…就…: since that is the case":
        "既然…就…: เมื่อเป็นเช่นนั้นแล้ว…ก็…",
    "不但/不仅…而且…: not only…but also":
        "不但/不仅…而且…: ไม่เพียงแต่…แต่ยัง…",
    "无论/不管…都…: no matter what":
        "无论/不管…都…: ไม่ว่าอย่างไรก็ตาม",
    "只要…就…: one sufficient condition":
        "只要…就…: เงื่อนไขที่เพียงพอ",

    # ── HSK 5 ───────────────────────────────────────────────
    "不管…都/也…": "不管…都/也…: ไม่ว่า…ก็ตาม…",
    "一旦…就…": "一旦…就…: เมื่อ…ก็ทันที",
    "宁可…也不…": "宁可…也不…: ยอม…ดีกว่า…",
    "要么…要么…": "要么…要么…: ไม่…ก็…",
    "甚至 (shènzhì)": "甚至 (shènzhì): แม้แต่",
    "顺便 (shùnbiàn)": "顺便 (shùnbiàn): ระหว่างทาง / ขอถือโอกาส",
    "凡是…都…": "凡是…都…: ไม่ว่า…ล้วน…",
    "罢了 (bàle)": "罢了 (bàle): เท่านั้น",
    "V 着 V 着 — gradual change": "V 着 V 着: การเปลี่ยนแปลงทีละน้อย",
    "通过 (tōngguò)": "通过 (tōngguò): ผ่าน / โดย",

    # ── HSK 6 ───────────────────────────────────────────────
    "连…都/也… (lián)": "连…都/也…: แม้แต่…",
    "只是…而已 / 罢了": "只是…而已 / 罢了: เพียงแค่…",
    "何况 (hékuàng)": "何况 (hékuàng): ยิ่งไม่ต้องพูดถึง",
    "只有…才…": "只有…才…: มีเพียง…จึง…",
    "之所以…是因为…": "之所以…是因为…: เหตุที่…เป็นเพราะ…",
    "V 也 V 不 / V 都 V 不": "V 也 V 不 / V 都 V 不: ทำ…ไม่ได้เลย",
    "何况…呢（反问）": "何况…呢: ไหนจะพูดถึง",
    "并非…而是…": "并非…而是…: ไม่ใช่…แต่เป็น…",
    "以便 / 以免": "以便 / 以免: เพื่อที่จะ / เพื่อหลีกเลี่ยง",

    # ── HSK 7-9 ─────────────────────────────────────────────
    "不但…还…": "不但…还…: ไม่เพียงแต่…ยัง…",
    "倒 (dào) — contrary to expectation": "倒 (dào): ตรงข้ามกับที่คาด",
    "竟 (jìng)": "竟 (jìng): น่าประหลาดใจ",
    "一方面…另一方面…": "一方面…另一方面…: ด้านหนึ่ง…อีกด้านหนึ่ง…",
    "倘若…则…": "倘若…则…: ถ้าหาก…ก็…",
    "A 归 A，B 归 B": "A 归 A, B 归 B: แยกกันเป็นเรื่องของแต่ละฝ่าย",
    "不难看出 / 由此可见": "不难看出 / 由此可见: จะเห็นได้ชัดว่า…",
    "既然…就…": "既然…就…: ตั้งแต่…เป็นที่ established…ก็…",
    "A 与其…不如…": "与其…不如…: สู้…ไม่ดีเท่า…",
    "凡是…均…": "凡是…均…: ไม่ว่า…ล้วนแต่…",
    "若非…则…": "若非…则…: ถ้าไม่ใช่…ก็…",
}


def main():
    with io.open(PATH, "r", encoding="utf-8") as f:
        src = f.read()

    pattern = re.compile(
        r"(\n\s*structure:\s*'([^']+)',\s*\n)"
    )

    hits, misses = 0, []

    def replace(m):
        nonlocal hits
        full = m.group(0)
        struct = m.group(2)
        if struct not in TITLES_TH:
            misses.append(struct)
            return full
        th = TITLES_TH[struct].replace("'", "\\'")
        new = full + f"        titleTh: '{th}',\n"
        hits += 1
        return new

    new_src = pattern.sub(replace, src)

    print(f"Injected {hits} titleTh entries")
    if misses:
        print(f"MISSED ({len(misses)}):", file=sys.stderr)
        for mm in misses:
            print(f"  - {mm!r}", file=sys.stderr)

    with io.open(PATH, "w", encoding="utf-8") as f:
        f.write(new_src)

    if misses:
        sys.exit(1)


if __name__ == "__main__":
    main()
