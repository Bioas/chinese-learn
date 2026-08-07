#!/usr/bin/env node
// Expand terse one-line descriptions on HSK 5/6/7-9 grammar patterns into
// proper teaching-style explanations (English + Thai) matching the voice
// of HSK 1-4, which were pulled from studycli.org.
//
// Replaces `english` and `thai` strings inside each `{ rank, structure,
// english, thai, ... }` block. Pattern-style usage explanation oriented
// to a learner ("Use X when…"), parallel to HSK 1-4.
//
// Run with: node scripts/expand-hsk57-descriptions.mjs
// Idempotent: replaces based on `old english + thai` pairs that exist
// once in the file, so re-running after a previous successful run is a
// no-op. Backs up src/data/hskGrammar.js to scripts/cache/ once.

import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname.replace(/\/$/, ''), '..');
const FILE = path.join(ROOT, 'src/data/hskGrammar.js');
const BACKUP_DIR = path.join(ROOT, 'scripts/cache');
const BACKUP = path.join(BACKUP_DIR, 'hskGrammar.before-expand.js');

// -------------------------------------------------------------------------
// Mapping: structure -> { english, thai }
// -------------------------------------------------------------------------
const TABLE = {
  // ---------------- HSK 5 ----------------
  '不管…都/也…': {
    english:
      'Use 不管 + clause/phrase, followed by 都 or 也, to express that B is true or happens regardless of what A is. Works for any type of condition (time, weather, place, difficulty, opinion, identity). Pairs naturally with multi/adverbs like 多 / 怎么 / 谁 / 什么 — never followed by 要, 会, 能, 想, etc.',
    thai:
      'ใช้ 不管 + วลี/ประโยค แล้วตามด้วย 都 หรือ 也 เพื่อบอกว่า B ยังคงเป็นจริงหรือเกิดขึ้น ไม่ว่า A จะเป็นอย่างไร (ใช้ได้กับเงื่อนไขทุกประเภท เช่น เวลา อากาศ สถานที่ ความยาก ความคิดเห็น ตัวบุคคล) มักใช้คู่กับ 多 / 怎么 / 谁 / เป็นต้น ไม่ตามด้วย 要 / 会 / 能 / 想',
  },
  '一旦…就…': {
    english:
      'Use 一旦 + condition, then 就 + result, to express that the moment A happens — even hypothetically — B is immediate and inevitable. Carries a strong tone of warning, rule, or advice; emphasises that there is no buffer time between cause and effect.',
    thai:
      'ใช้ 一旦 + เงื่อนไข แล้วตามด้วย 就 + ผลลัพธ์ เพื่อบอกว่าทันทีที่ A เกิดขึ้น (แม้แต่ในกรณีสมมุติ) B จะตามมาทันทีอย่างหลีกเลี่ยงไม่ได้ มีน้ำเสียงเตือน กฎ หรือคำแนะนำ เน้นว่าไม่มีเวลากันชนระหว่างเหตุกับผล',
  },
  '宁可…也不…': {
    english:
      'Use 宁可 + A, 也不 + B to express strong, deliberate refusal: "would rather do A than do B at all." Used for stubborn or principled rejection; the subject consciously chooses A and rejects B entirely. Often paired with 也不 (not 也) to keep the refusal sharp.',
    thai:
      'ใช้ 宁可 + A, 也不 + B เพื่อแสดงการปฏิเสธอย่างแน่วแน่และตั้งใจ: "ยอมทำ A ดีกว่าก็ไม่ยอมทำ B เลย" ใช้เวลาปฏิเสธอย่างหนักแน่นหรือยึดมั่นในหลักการ ผู้พูดเลือก A อย่างรู้ตัวและปฏิเสธ B โดยสิ้นเชิง มักใช้คู่กับ 也不 (ไม่ใช่ 也) เพื่อความหนักแน่น',
  },
  '要么…要么…': {
    english:
      'Use 要么 + A, 要么 + B to present two mutually exclusive alternatives — exactly one of them applies, never both. Often used in choices, warnings, or rules ("you either do A or do B"). The second 要么 is sometimes dropped colloquially when context already implies the alternative.',
    thai:
      'ใช้ 要么 + A, 要么 + B เพื่อเสนอทางเลือกสองอย่างที่เลือกได้ข้างใดข้างหนึ่งเท่านั้น (ไม่เลือกทั้งสองอย่าง) ใช้บ่อยในการเลือก คำเตือน หรือกฎเกณฑ์ ("ทำ A หรือไม่ก็ B") ในภาษาพูดอาจละ 要么 ในอนุประโยคหลังได้เมื่อบริบทชัดเจน',
  },
  '甚至 (shènzhì)': {
    english:
      'Use 甚至 before an item to mark the most extreme point in a progression — "even X". Often paired with 都 / 也 to emphasise that the most extreme case still follows the same rule. Sits immediately before the emphasised item, not at the start of the sentence. Use sparingly: too much 甚至 weakens the impact.',
    thai:
      'ใช้ 甚至 วางหน้าสิ่งที่ต้องการเน้นเพื่อระบุจุดสุดขั้วในลำดับ — "แม้แต่ X" มักใช้คู่กับ 都 / 也 เพื่อเน้นว่าแม้แต่กรณีสุดขั้วก็ยังเป็นไปตามกฎเดียวกัน ไม่ได้วางไว้ต้นประโยค ใช้อย่างระมัดระวัง: ใช้ 甚至 บ่อยเกินไปจะลดน้ำหนัก',
  },
  '顺便 (shùnbiàn)': {
    english:
      'Place 顺便 before a verb to mean "while you’re at it" / "by the way, do this too" — a small action done in addition to the main one. Tone is conversational and suggests efficiency. Not a topic change; the small action must connect to the context the other person is already involved in.',
    thai:
      'วาง 顺便 ไว้หน้ากริยาเพื่อแสดงว่า "ระหว่างทาง / ขอถือโอกาสทำอันนี้ด้วย" — เป็นการกระทำเล็ก ๆ ที่ทำเพิ่มจากการกระทำหลัก น้ำเสียงสบาย ๆ เป็นกันเอง แสดงถึงการใช้โอกาส ไม่ใช่การเปลี่ยนเรื่องใหม่ การกระทำเล็ก ๆ ต้องเกี่ยวข้องกับสถานการณ์เดิมที่อีกฝ่ายกำลังทำอยู่',
  },
  '凡是…都…': {
    english:
      'Use 凡是 + category/condition, then 都 + result, to state a universal rule: every single instance of X has Y. Stricter and more emphatic than 所有 — implies "without exception" across the entire scope of X, often used in rules, notices, and moral statements.',
    thai:
      'ใช้ 凡是 + หมวดหมู่/เงื่อนไข แล้วตามด้วย 都 + ผลลัพธ์ เพื่อระบุกฎเกณฑ์สากล: ทุกกรณีของ X ล้วนมี Y เข้มงวดและหนักแน่นกว่า 所有 — แปลว่า "ไม่มีข้อยกเว้น" ตลอดขอบเขตทั้งหมดของ X ใช้บ่อยในกฎ ประกาศ และคำกล่าวทางศีลธรรม',
  },
  '罢了 (bàle)': {
    english:
      'Place 罢了 at the end of a statement to soften it — "that’s all / only / merely". Reduces the weight of the previous claim, used to dismiss concerns or downplay significance. Pairs with 不过 / 只是 / 罢了 for a casual under-statement, or with 而已 for a slightly more formal tone than 而已 vs 罢了 are nearly interchangeable in casual register.',
    thai:
      'วาง 罢了 ไว้ท้ายประโยคเพื่อลดน้ำหนักข้อความ — "แค่นั้นเอง / เท่านั้น" ทำให้ข้อกล่าวอ่อนลง มักใช้เพื่อปลดเปลื้องความกังวลหรือลดความสำคัญ มักใช้คู่กับ 不过 / 只是 / 罢了 เพื่อสำนวนพูดแบบสบาย ๆ 而已 มีน้ำเสียงทางการกว่าเล็กน้อย แต่ทั้งสองคำใช้สลับกันได้ในชีวิตประจำวัน',
  },
  'V 着 V 着 — gradual change': {
    english:
      'Repeat a verb with 着 to show an in-progress action that gradually transitions into something else mid-stream: "while V-ing, (unconsciously) V-ed". Marks a soft, in-the-moment shift caught in the act — not a deliberate change of plan. The second V often has a different aspect (start, finish, change) from the first.',
    thai:
      'ใช้กริยาเดิมซ้ำกับ 着 เพื่อแสดงการกระทำที่กำลังดำเนินอยู่แล้วค่อย ๆ เปลี่ยนเป็นอีกอย่างกลางทาง: "ขณะกำลัง V อยู่ ๆ ก็ V (โดยไม่รู้ตัว)" แสดงการเปลี่ยนแปลงที่เกิดขึ้นระหว่างทำ ไม่ใช่การเปลี่ยนใจที่ตั้งใจ กริยาตัวหลังมักมีลักษณะทางไวยากรณ์ต่างจากตัวแรก (เริ่ม เสร็จ เปลี่ยน)',
  },
  '通过 (tōngguò)': {
    english:
      'Use 通过 + means/method/agent to mean "through / via", indicating the channel or instrument by which something is achieved or accomplished. Common in formal contexts: 通过考试 (pass an exam), 通过练习 (master a skill through practice), 通过…方式 (by means of). Distinct from 经过 (passing through a place/time).',
    thai:
      'ใช้ 通过 + วิธีการ/เครื่องมือ/ตัวกลาง แปลว่า "ผ่าน / โดย" บอกช่องทางหรือเครื่องมือที่ทำให้สำเร็จ ใช้บ่อยในบริบททางการ เช่น สอบผ่าน (通过考试) ฝึกฝนจนเชี่ยวชาญ (通过练习) ด้วยวิธีการ… (通过…方式) ต่างจาก 经过 ที่หมายถึงผ่านสถานที่/ช่วงเวลา',
  },

  // ---------------- HSK 6 ----------------
  '连…都/也… (lián)': {
    english:
      'Use 连 + item + 都 / 也 + … to emphasise an extreme example the listener might not expect — "even X". Differs from 甚至 in that 连 specifically targets a single noun (often a pronoun or short phrase), and 都/也 is placed after the noun, not at the end of the sentence.',
    thai:
      'ใช้ 连 + คำนาม + 都 / 也 + … เพื่อเน้นตัวอย่างที่สุดขั้วที่ผู้ฟังอาจไม่คาดคิด — "แม้แต่ X" ต่างจาก 甚至 ตรงที่ 连 ใช้เน้นคำนามเดียว (มักเป็นสรรพนามหรือวลีสั้น ๆ) และวาง 都/也 หลังคำนาม ไม่ใช่ท้ายประโยค',
  },
  '只是…而已 / 罢了': {
    english:
      'Use just … only (only … little function word). Place 只是 + content, then 而已 (spoken, slightly bookish) or 罢了 (colloquial, slightly softer) at the end to mean "that’s all". Use to downplay importance, brush off a problem, or limit a claim — the "don’t worry" move. 而已 is more written; 罢了 more spoken.',
    thai:
      'วาง 只是 + เนื้อหา แล้วตามท้ายด้วย 而已 (หนังสือ ทางการเล็กน้อย) หรือ 罢了 (พูด อ่อนกว่า) แปลว่า "แค่นั้นเอง" ใช้เพื่อลดความสำคัญ ปัดป้องปัญหาเล็ก ๆ หรือจำกัดขอบเขตการกล่าวอ้าง 而已 มีน้ำเสียงทางการ 罢了 มีน้ำเสียงพูด',
  },
  '何况 (hékuàng)': {
    english:
      'Use 何况 + B (a stronger case) at the start or after A to mean "let alone / not to mention B". Implies that since A (an easier case) is true/unlikely, B (a harder case) is even more so. Used to draw a concession by comparison. The rhetorical version 何况…呢 comes at sentence end as a challenge (see HSK 6 #7).',
    thai:
      'ใช้ 何况 + B (กรณีที่ยิ่งกว่า) ที่ต้นประโยคหรือหลัง A เพื่อแสดงว่า "ยิ่งไม่ต้องพูดถึง B เลย" หมายถึง: เมื่อ A (กรณีง่าย) เป็นอย่างนั้น B (กรณียากกว่า) ยิ่งเป็นไปได้มากกว่า ใช้เพื่อเปรียบเทียบเพื่อขมวดความ เวอร์ชันคำถามเชิงโต้แย้ง 何况…ね ใช้ท้ายประโยคเป็นคำท้า (ดู HSK 6 #7)',
  },
  '只有…才…': {
    english:
      'Use 只有 + strict condition, then 才 + result, to express "only when …, then and only then …". Stricter than 只要 (只要 = sufficient condition; 只有 = necessary and sufficient). 才对 can be replaced by 才能/会 for "only then is/the result possible".',
    thai:
      'ใช้ 只有 + เงื่อนไขที่เข้มงวด แล้วตามด้วย 才 + ผลลัพธ์ เพื่อแสดงว่า "มีเพียง … เท่านั้นที่จะ …" เข้มงวดกว่า 只要 (只要 = เงื่อนไขพอเพียง; 只有 = จำเป็นและเพียงพอ) สามารถใช้ 才能 / 会 แทน 才 ได้โดยยังความหมาย "จึงจะ"',
  },
  '之所以…是因为…': {
    english:
      'Use 之所以 + X, 是因为 + Y to emphasise the cause-effect connection: "the reason X exists/happens is because Y". Places Y in the position of emphasis (after 是 because) instead of before the verb. Common in formal register when explaining decisions or outcomes.',
    thai:
      'ใช้ 之所以 + X, 是因为 + Y เพื่อเน้นความเชื่อมโยงเหตุ-ผล: "เหตุที่ X เป็นเช่นนั้น เพราะ Y" วาง Y ไว้ในตำแหน่งเน้น (หลัง 是因为) แทนที่จะวางไว้ก่อนกริยา ใช้บ่อยในสำนวนทางการเมื่ออธิบายการตัดสินใจหรือผลลัพธ์',
  },
  'V 也 V 不 / V 都 V 不': {
    english:
      'Use V 也 V 不 or V 都 V 不 to express strong impossibility: "even with effort, can’t do V" — captures inability, refusal, or being out of reach. 都 is slightly more emphatic than 也. Often used to express desperation (想也想不出来, 找都找不到) or fundamental limits.',
    thai:
      'ใช้ V 也 V 不 หรือ V 都 V 不 เพื่อแสดงความเป็นไปไม่ได้อย่างหนักแน่น: "แม้พยายาม ก็ยังทำ V ไม่ได้" — จับความไม่สามารถ การปฏิเสธ หรือการเกินเอื้อม 都 เน้นกว่า 也 เล็กน้อย ใช้บ่อยในการแสดงความสิ้นหวัง (想也想不出来) หรือขีดจำกัดพื้นฐาน (找都找不到)',
  },
  '何况…呢（反问）': {
    english:
      'Use 何况 + B + 呢 at the end of a sentence to form a rhetorical challenge: "let alone B, (how could it be possible?)". Implies that even A (the stated case) is hard, so how could B be possible? Tone is surprise or disbelief. Common in argumentation and complaints.',
    thai:
      'ใช้ 何况 + B + ね ที่ท้ายประโยคเพื่อสร้างคำถามเชิงโต้แย้ง: "ยิ่ง B เลย (จะเป็นไปได้อย่างไร?)" บอกเป็นนัยว่าแม้แต่ A (กรณีที่กล่าวถึง) ยังยาก ดังนั้น B จะเป็นไปได้อย่างไร น้ำเสียงประหลาดใจหรือไม่เชื่อ ใช้บ่อยในการโต้แย้งและการบ่น',
  },
  '并非…而是…': {
    english:
      'Use 并非 + A, 而是 + B to give a written-style correction: "not A, but rather B".  并 softens (rather than "definitely not"), which keeps register neutral-formal rather than blunt.  而 is the connector emphasizing contrast. Common in academic and editorial prose.',
    thai:
      'ใช้ 并非 + A, 而是 + B เพื่อให้การแก้ไขในสำนวนทางการ: "มิใช่ A แต่เป็น B" 并 ลดน้ำหนักความรุนแรง (แทน "ไม่ใช่" ที่หนักแน่น) เพื่อให้ทำนองเป็นกลาง-ทางการ 而 เป็นคำเชื่อมเน้นความขัดแย้ง ใช้บ่อยในงานเขียนเชิงวิชาการและบทความ',
  },
  '以便 / 以免': {
    english:
      'Use 以便 + result-clause to mean "so that / in order that" — purpose, hoping for the result. Use 以免 + bad-result-clause to mean "lest / so as to avoid" — purpose by avoiding negative outcome. They mirror each other (positive vs negative result). Both are formal/書面 register.',
    thai:
      'ใช้ 以便 + อนุประโยคผลลัพธ์ เพื่อแสดงจุดประสงค์: "เพื่อที่จะ" — หวังผลดี ใช้ 以免 + อนุประโยคผลร้าย เพื่อแสดงจุดประสงค์โดยหลีกเลี่ยงสิ่งไม่ดี: "เพื่อไม่ให้เกิด …" ทั้งสองเป็นคู่ตรงข้าม (ผลบวก vs ผลลบ) ใช้ในสำนวนทางการ/หนังสือ',
  },
  '不但…还…': {
    english:
      'Use 不但 + A, 还 + B to "add on": "not only A, but also B", with B often being an upgrade or extension of A. In HSK 3 the related pattern used 而且; in higher register 还 raises the second clause — "moreover B". Common for stacking praise or escalating progression.',
    thai:
      'ใช้ 不但 + A, 还 + B เพื่อ "เพิ่มเติม": "ไม่เพียง A ยัง B" โดย B มักเป็นการยกระดับหรือขยายความของ A ใน HSK 3 ใช้ pattern ที่คล้ายกันโดยใช้ 而且; ในระดับสูงที่ขึ้น 还 ยกระดับอนุประโยคหลัง — "ยิ่งไปกว่านั้น B" ใช้บ่อยในการเรียงคำชมหรือเพิ่มความก้าวหน้า',
  },

  // ---------------- HSK 7-9 ----------------
  '倒 (dào) — contrary to expectation': {
    english:
      'Place 倒 before a comment (often an adjective or verb) to signal "contrary to expectation". The previous statement’s implication gets flipped — what would normally be a negative may turn out to read positively, or vice versa. Often pairs with 反倒 or 却 for stronger contrast. Carries a reflective, sometimes jokey tone.',
    thai:
      'วาง 倒 ไว้หน้าความเห็น (มักเป็นคำคุณศัพท์หรือกริยา) เพื่อบอกว่า "ตรงข้ามกับที่คาด" นัยของประโยคก่อนหน้าถูกพลิก — สิ่งที่ปกติจะเป็นลบอาจกลับเป็นบวก หรือกลับกัน มักใช้คู่กับ 反倒 หรือ 却 เพื่อเน้นความขัดแย้งมากขึ้น น้ำเสียงไตร่ตรอง บางครั้งติดขำขัน',
  },
  '竟 (jìng)': {
    english:
      'Use 竟 (or 竟然) before a verb/adjective to mark "unexpectedly / to my surprise". Sets up a contrast between what was anticipated and what actually happened. Often pairs with the structure 的 to attach to a noun phrase (竟敢 / 竟忘了 / 他竟然 …). Tone is disbelief or mild reproach.',
    thai:
      'ใช้ 竟 (หรือ 竟然) วางหน้ากริยา/คำคุณศัพท์ เพื่อบอกว่า "อย่างไม่คาดคิด / น่าประหลาดใจ" ตั้งความขัดแย้งระหว่างสิ่งที่คาดกับสิ่งที่เกิดขึ้นจริง มักใช้คู่กับ 的 เพื่อต่อกับวลีคำนาม (竟敢 / 竟忘了 / 他竟然 …) น้ำเสียงไม่เชื่อหรือติดตำหนิเบา ๆ',
  },
  '一方面…另一方面…': {
    english:
      'Use 一方面 + A, 另一方面 + B to present two complementary sides of the same situation: "on one hand A, on the other hand B". Similar to 一来…二来… but more formal/書面. Often used for balanced explanations, weighing pros and cons, or describing a complex situation from two angles.',
    thai:
      'ใช้ 一方面 + A, 另一方面 + B เพื่อแสดงสองด้านที่เสริมกันของสถานการณ์เดียวกัน: "ในด้านหนึ่ง A อีกด้านหนึ่ง B" คล้ายกับ 一来…二来… แต่ทางการกว่า/หนังสือกว่า ใช้บ่อยในการอธิบายอย่างสมดุล ชั่งน้ำหนักข้อดีข้อเสีย หรือบรรยายสถานการณ์ซับซ้อนจากสองมุม',
  },
  '倘若…则…': {
    english:
      'Use 倘若 + hypothetical, then 则 + result, in formal/written register: "if … were to happen, then …". Carries a conditional speculation tone, often used in proposals, instructions, logic problems, and literary text. Differs from 假如/如果 (spoken) and 如果 (neutral); it signals a higher, more detached register.',
    thai:
      'ใช้ 倘若 + เงื่อนไขสมมุติ แล้วตามด้วย 则 + ผลลัพธ์ ในสำนวนทางการ/หนังสือ: "หาก … เกิดขึ้น ก็ …" มีน้ำเสียงคาดการณ์แบบมีเงื่อนไข ใช้บ่อยในข้อเสนอ คำสั่ง ปัญหาตรรกะ และบทความเชิงวรรณกรรม ต่างจาก 假如/如果 (พูด) และ 如果 (กลาง) — บ่งบอกระดับภาษาที่สูงและเป็นทางการมากกว่า',
  },
  'A 归 A，B 归 B': {
    english:
      'Use A 归 A, B 归 B to draw a sharp separation: "A is A, B is B; the two are distinct and should not be confused". Often used to disclaim shared blame, separate a person/situation from another, or bluntly clarify that two things should be evaluated independently. Tone can be defensive or conclusive.',
    thai:
      'ใช้ A 归 A, B 归 B เพื่อแยกเส้นแบ่งอย่างชัดเจน: "A ก็คือ A B ก็คือ B ทั้งสองต่างกัน ไม่ควรสับสน" ใช้บ่อยเพื่อปฏิเสธความรับผิดชอบร่วม แยกบุคคล/สถานการณ์ออกจากกัน หรือชี้แจงอย่างหนักแน่นว่าสองสิ่งควรถูกประเมินแยกกัน น้ำเสียงอาจเป็นการป้องกันตัวหรือขมวดความ',
  },
  '不难看出 / 由此可见': {
    english:
      'Use 不难看出 (literally "it is not hard to see") or 由此可见 ("from this one can see") as a writer-style adverbial phrase before a conclusion.  不难看出 softens the claim with a "you can see it if you look" tone;  由此可见 is more direct and assertive, building the case from the preceding context. Both belong in academic or editorial prose.',
    thai:
      'ใช้ 不难看出 (ตามตัวอักษร "ไม่ยากเลยที่จะเห็นว่า") หรือ 由此可见 ("จากตรงนี้พอจะเห็นได้ว่า") เป็น adverbial phrase สไตล์งานเขียนก่อนข้อสรุป 不难看出 ทำให้ข้อกล่าวอ่อนลง ด้วยน้ำเสียงว่า "ถ้ามองดูก็จะเห็น" 由此可见 ตรงและหนักแน่นกว่า สร้างคำอ้างจากบริบทก่อนหน้า ทั้งสองใช้ในงานเขียนเชิงวิชาการหรือบทความ',
  },
  '既然…就…': {
    english:
      'Use 既然 + established fact, then 就 + result, to draw a logical conclusion: "given that A is already the case, then naturally B follows". Tempts the listener / reader to accept the premise so that the conclusion feels inevitable. Common in advice and reasoning.',
    thai:
      'ใช้ 既然 + ข้อเท็จจริงที่ยอมรับได้ แล้วตามด้วย 就 + ผลลัพธ์ เพื่อลากข้อสรุปทางตรรกะ: "เมื่อ A เป็นอย่างนั้นแล้ว B ก็เป็นธรรมดา" ชักชวนให้ผู้ฟัง/ผู้อ่านยอมรับข้อตั้งต้น เพื่อให้ข้อสรุปรู้สึกหลีกเลี่ยงไม่ได้ ใช้บ่อยในคำแนะนำและการให้เหตุผล',
  },
  'A 与其…不如…': {
    english:
      'Use A 与其 + X, 不如 + Y to weigh options: "rather than doing X, it is better to do Y". 与其 sets up the rejected, less-effective alternative; 不如 introduces the chosen, more rational or practical one. Common in advice and decision-making — softer than 宁可 (which is more about stubborn refusal).',
    thai:
      'ใช้ 与其 + X, 不如 + Y เพื่อชั่งน้ำหนักทางเลือก: "แทนที่จะ X ดีกว่า Y" 与其 ตั้งทางเลือกที่ถูกปฏิเสธเพราะไม่ค่อยมีประสิทธิภาพ 不如 แนะนำทางเลือกที่เลือก เพราะสมเหตุสมผลกว่าหรือใช้งานได้จริงกว่า ใช้บ่อยในคำแนะนำและการตัดสินใจ อ่อนกว่า 宁可 (ซึ่งหนักแน่นกว่าเรื่องการปฏิเสธ)',
  },
  '凡是…均…': {
    english:
      'Use 凡是 + condition/category, then 均 + result, to state a universal rule in formal register: "all / every X (without exception) …". Differs from 凡…都… by stronger formality (均 instead of 都). Often seen in regulations, contracts, notices, and academic / literary prose.',
    thai:
      'ใช้ 凡是 + เงื่อนไข/หมวดหมู่ แล้วตามด้วย 均 + ผลลัพธ์ เพื่อระบุกฎเกณฑ์สากลในสำนวนทางการ: "ทุก … (โดยไม่มีข้อยกเว้น) …" ต่างจาก 凡…都… ตรงที่ทางการกว่า (ใช้均 แทน 都) พบบ่อยในกฎระเบียบ สัญญา ประกาศ และงานเขียนเชิงวิชาการ/หนังสือ',
  },
  '若非…则…': {
    english:
      'Use 若非 + counterfactual, then 则 + result, in formal register: "were it not for A, then B". A is the imagined absent condition; B is the consequence of its absence. Used in counterfactual reasoning (logical arguments, regrets, hypotheses). Tone is reflective and often literary.',
    thai:
      'ใช้ 若非 + เงื่อนไขที่ขาดไป (สมมุติ) แล้วตามด้วย 则 + ผลลัพธ์ ในสำนวนทางการ: "ถ้าไม่ใช่ A ก็ B" A คือเงื่อนไขที่สมมุติว่าขาดไป B คือผลที่ตามมาจากการขาดนั้น ใช้ในการให้เหตุผลแบบ counterfactual (การโต้แย้งทางตรรกะ ความเสียใจ สมมุติฐาน) น้ำเสียงไตร่ตรอง มักมีน้ำเสียงวรรณกรรม',
  },
};

// Strict pair to literal-match-and-replace (rank, structure) → old en/th
// strings as currently in the file. We'll do textual replace so we don't
// need to track line numbers.
const CURRENT = [
  { name: '不管…都/也…',    en: '"No matter A, B (still)."'    , th: '"ไม่ว่า A ก็ตาม B ก็ยังคงเป็นเช่นนั้น"' },
  { name: '一旦…就…',       en: '"Once A, then B (inevitable)."', th: '"เมื่อ A ปุ๊บ ก็ B ทันที"' },
  { name: '宁可…也不…',     en: '"Would rather A than B" — emphatic preference.', th: '"ยอม A ดีกว่า B" — เน้นความตั้งใจ' },
  { name: '要么…要么…',     en: '"Either A or B" — two alternatives.', th: '"ไม่ A ก็ B" — ทางเลือกสองอย่าง' },
  { name: '甚至 (shènzhì)', en: '"Even" — emphasises an extreme point.', th: '"แม้แต่" / "ถึงขนาด"' },
  { name: '顺便 (shùnbiàn)', en: '"By the way / conveniently while at it."', th: '"ระหว่างทาง / ขอถือโอกาส"' },
  { name: '凡是…都…',       en: '"All / every … are …" — universal quantifier.', th: '"ไม่ว่าเป็น … อะไรก็ตาม ล้วน …"' },
  { name: '罢了 (bàle)',     en: '"That\'s all / only / merely" — softens the claim.', th: '"แค่นั้นเอง / เท่านั้น"' },
  { name: 'V 着 V 着 — gradual change', en: 'Continued state: V + 着 + V + 着 — something happens as it goes.', th: '"ขณะกำลัง … อยู่ ๆ ก็ …"' },
  { name: '通过 (tōngguò)',  en: '"Through / via" — a learning, mastery, or method marker.', th: '"ผ่าน / โดย" — วิธีการ' },

  { name: '连…都/也… (lián)', en: '"Even X is / does…" — emphasizes an extreme example.', th: '"แม้แต่ X ก็ยัง …"' },
  { name: '只是…而已 / 罢了',  en: '"Only / just …" — softens a statement.', th: '"เพียง … เท่านั้น"' },
  { name: '何况 (hékuàng)',    en: '"Let alone / not to mention."', th: '"ยิ่งไม่ต้องพูดถึง … เลย"' },
  { name: '只有…才…',         en: '"Only if …, then …" — strict condition.', th: '"มีเพียง … เท่านั้นที่จะ …"' },
  { name: '之所以…是因为…',    en: '"The reason X is … is because Y."', th: '"เหตุที่ … เป็นเพราะ …"' },
  { name: 'V 也 V 不 / V 都 V 不', en: '"Even V cannot V / cannot even V" — strong impossibility.', th: '"แม้แต่จะ … ก็ยังทำไม่ได้"' },
  { name: '何况…呢（反问）',    en: '"Let alone… (rhetorical)" — emphasises that B is impossible.', th: '"ยิ่ง … เลย (คำถามเชิงโต้แย้ง)"' },
  { name: '并非…而是…',        en: '"Not A, but B" — written-style contrast.', th: '"มิใช่ A แต่เป็น B" — สำนวนทางการ' },
  { name: '以便 / 以免',        en: '"So that / in order to / lest."', th: '"เพื่อที่จะ / เพื่อหลีกเลี่ยง"' },
  { name: '不但…还…',          en: '"Not only A but also B" — adds a stronger second point.', th: '"ไม่เพียง A ยัง B"' },

  { name: '倒 (dào) — contrary to expectation', en: '"On the contrary / actually" — flips expectation.', th: '"กลับกลายเป็นว่า …" — สวนทางกับที่คาด' },
  { name: '竟 (jìng)',         en: '"Unexpectedly" — emphasises surprise.', th: '"อย่างไม่คาดคิด"' },
  { name: '一方面…另一方面…',  en: '"On one hand… on the other hand…"', th: '"ในด้านหนึ่ง … อีกด้านหนึ่ง …"' },
  { name: '倘若…则…',          en: '"If …, then …" — formal / written register.', th: '"หาก … ก็ …" — ทางการ' },
  { name: 'A 归 A，B 归 B',     en: '"A is A, B is B" — sharp separation of cases.', th: '"A ก็คือ A B ก็คือ B" — แยกแยะชัดเจน' },
  { name: '不难看出 / 由此可见', en: '"It is not hard to see / hence it is evident."', th: '"ไม่ยากเลยที่จะเห็นว่า … / จากตรงนี้พอจะเห็นได้ว่า …"' },
  { name: '既然…就…',          en: '"Since A is true, then B follows naturally."', th: '"เมื่อเป็นเช่นนี้แล้ว ก็ …"' },
  { name: 'A 与其…不如…',      en: '"Rather than A, (it is) better to B."', th: '"แทนที่จะ A ดีกว่า B"' },
  { name: '凡是…均…',          en: '"All / every X (literary) …" — formal registers.', th: '"ไม่ว่า … ล้วน …" — สำนวนทางการ' },
  { name: '若非…则…',          en: '"Were it not for A, then B."', th: '"ถ้าไม่ใช่ A ก็ B" — สำนวนทางการ' },
];

const keys = Object.keys(TABLE);
const missing = CURRENT.filter(({ name }) => !TABLE[name]);
if (missing.length) {
  console.error('[missing TABLE entries for]', missing.map(m => m.name).join(', '));
  process.exit(2);
}

// expose for ad-hoc checking
export { TABLE, CURRENT };

async function main() {
  if (!existsSync(BACKUP_DIR)) await mkdir(BACKUP_DIR, { recursive: true });
  await copyFile(FILE, BACKUP);
  console.log('[backup]', BACKUP);

  let src = await readFile(FILE, 'utf8');

  for (const cur of CURRENT) {
    const next = TABLE[cur.name];
    if (!next) continue;

    // The english + thai lines sit inside a `{ rank, structure, ..., english: '...', thai: '...', ... }` block.
    // We match the exact current pair so a re-run that already succeeded won't hit anything.
    // The file uses single-quoted JS strings whose CONTENT contains double quotes (e.g. `english: '"No matter A, B (still)."'`).
    // cur.en / cur.th holds the unquoted payload.
    const oldEn = `        english: '${cur.en}',`;
    const oldTh = `        thai: '${cur.th}',`;
    const newEn = `        english: ${JSON.stringify(next.english)},`;
    const newTh = `        thai: ${JSON.stringify(next.thai)},`;

    const beforeEn = src.length;
    src = src.replace(oldEn, newEn);
    src = src.replace(oldTh, newTh);
    if (src.length === beforeEn) {
      // Different shapes sometimes appear (already-JSON-stringified)
      // Try alternate already-quoted form:
      src = src.replace(
        `        english: ${JSON.stringify(cur.en)}`,
        newEn,
      ).replace(
        `        thai: ${JSON.stringify(cur.th)}`,
        newTh,
      );
    }
  }

  await writeFile(FILE, src, 'utf8');

  // Verify: count remaining old strings.
  let remaining = 0;
  for (const cur of CURRENT) {
    const oldEn = `english: ${cur.en}`;
    const oldTh = `thai: ${cur.th}`;
    if (src.includes(oldEn) || src.includes(oldTh)) remaining += 1;
  }
  if (remaining > 0) {
    console.error(`[warn] ${remaining} patterns still contain old strings — check formatting`);
    process.exitCode = 3;
  } else {
    console.log(`[ok] all ${CURRENT.length} patterns updated`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
