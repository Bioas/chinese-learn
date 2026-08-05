// Translates example sentence meanings (meaningThai) to Thai
// Reuses the same word-level dictionary from add-thai-v2.mjs
// Usage: node scripts/add-thai-examples.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'src', 'data', 'hsk3');

// ── Core word dictionary (simplified, same words as add-thai-v2) ──
const DICT = {};
function w(k, v) { DICT[k.toLowerCase().trim()] = v; }

// Key vocabulary
w("i","ฉัน"); w("me","ฉัน"); w("my","ของฉัน"); w("you","คุณ"); w("your","ของคุณ");
w("he","เขา"); w("she","เธอ"); w("we","เรา"); w("they","พวกเขา");
w("this","นี้"); w("that","นั้น"); w("these","เหล่านี้"); w("those","เหล่านั้น");
w("what","อะไร"); w("who","ใคร"); w("where","ที่ไหน"); w("when","เมื่อไหร่"); w("how","อย่างไร");
w("is","เป็น"); w("are","เป็น"); w("am","เป็น"); w("was","เป็น"); w("be","เป็น");
w("have","มี"); w("has","มี"); w("do","ทำ"); w("does","ทำ");
w("can","ได้"); w("will","จะ"); w("would","จะ"); w("should","ควร"); w("must","ต้อง");
w("go","ไป"); w("come","มา"); w("arrive","ถึง"); w("return","กลับ");
w("eat","กิน"); w("drink","ดื่ม"); w("cook","ทำอาหาร"); w("make","ทำ");
w("see","เห็น"); w("look","ดู"); w("watch","ดู"); w("read","อ่าน");
w("hear","ได้ยิน"); w("listen","ฟัง"); w("speak","พูด"); w("talk","คุย"); w("say","พูด"); w("tell","บอก");
w("think","คิด"); w("know","รู้"); w("want","อยาก"); w("like","ชอบ"); w("love","รัก");
w("give","ให้"); w("take","เอา"); w("buy","ซื้อ"); w("sell","ขาย");
w("help","ช่วย"); w("need","ต้องการ"); w("find","หา"); w("use","ใช้");
w("learn","เรียน"); w("study","เรียน"); w("teach","สอน"); w("write","เขียน");
w("open","เปิด"); w("close","ปิด"); w("start","เริ่ม"); w("stop","หยุด");
w("live","อยู่"); w("work","ทำงาน"); w("play","เล่น"); w("rest","พัก");
w("sleep","นอน"); w("wake","ตื่น"); w("stand","ยืน"); w("sit","นั่ง"); w("walk","เดิน"); w("run","วิ่ง");
w("call","โทร; เรียก"); w("ask","ถาม"); w("answer","ตอบ");
w("feel","รู้สึก"); w("believe","เชื่อ");

// Nouns
w("book","หนังสือ"); w("water","น้ำ"); w("tea","ชา"); w("coffee","กาแฟ"); w("milk","นม");
w("food","อาหาร"); w("rice","ข้าว"); w("bread","ขนมปัง"); w("meat","เนื้อ"); w("fish","ปลา");
w("fruit","ผลไม้"); w("vegetable","ผัก"); w("apple","แอปเปิ้ล"); w("egg","ไข่");
w("table","โต๊ะ"); w("chair","เก้าอี้"); w("door","ประตู"); w("window","หน้าต่าง");
w("house","บ้าน"); w("room","ห้อง"); w("school","โรงเรียน"); w("university","มหาวิทยาลัย");
w("hospital","โรงพยาบาล"); w("store","ร้านค้า"); w("restaurant","ร้านอาหาร"); w("hotel","โรงแรม");
w("supermarket","ซูเปอร์มาร์เก็ต"); w("market","ตลาด"); w("bank","ธนาคาร");
w("car","รถ"); w("bus","รถเมล์"); w("train","รถไฟ"); w("plane","เครื่องบิน"); w("taxi","แท็กซี่");
w("phone","โทรศัพท์"); w("computer","คอมพิวเตอร์"); w("television","โทรทัศน์");
w("dog","หมา"); w("cat","แมว"); w("bird","นก"); w("horse","ม้า");
w("person","คน"); w("people","คน"); w("man","ผู้ชาย"); w("woman","ผู้หญิง"); w("child","เด็ก");
w("father","พ่อ"); w("mother","แม่"); w("brother","พี่ชาย;น้องชาย"); w("sister","พี่สาว;น้องสาว");
w("son","ลูกชาย"); w("daughter","ลูกสาว"); w("husband","สามี"); w("wife","ภรรยา");
w("friend","เพื่อน"); w("teacher","ครู"); w("student","นักเรียน"); w("doctor","หมอ");
w("name","ชื่อ"); w("time","เวลา"); w("day","วัน"); w("week","สัปดาห์"); w("month","เดือน"); w("year","ปี");
w("morning","เช้า"); w("afternoon","บ่าย"); w("evening","เย็น"); w("night","กลางคืน");
w("today","วันนี้"); w("tomorrow","พรุ่งนี้"); w("yesterday","เมื่อวาน"); w("now","ตอนนี้");
w("weather","อากาศ"); w("money","เงิน"); w("work","งาน"); w("job","งาน");
w("country","ประเทศ"); w("city","เมือง"); w("street","ถนน"); w("road","ถนน");
w("flower","ดอกไม้"); w("tree","ต้นไม้"); w("mountain","ภูเขา"); w("river","แม่น้ำ"); w("sea","ทะเล");
w("rain","ฝน"); w("snow","หิมะ"); w("wind","ลม"); w("sun","พระอาทิตย์"); w("moon","พระจันทร์");
w("clothes","เสื้อผ้า"); w("shirt","เสื้อ"); w("pants","กางเกง");
w("color","สี"); w("song","เพลง"); w("movie","หนัง"); w("film","หนัง"); w("music","ดนตรี");
w("letter","จดหมาย"); w("ticket","ตั๋ว"); w("passport","หนังสือเดินทาง");
w("language","ภาษา"); w("chinese","จีน"); w("english","อังกฤษ"); w("word","คำ");

// Adjectives
w("good","ดี"); w("bad","แย่"); w("big","ใหญ่"); w("small","เล็ก"); w("new","ใหม่"); w("old","เก่า;แก่");
w("hot","ร้อน"); w("cold","หนาว;เย็น"); w("warm","อุ่น"); w("cool","เย็น");
w("beautiful","สวย"); w("pretty","สวย"); w("ugly","น่าเกลียด");
w("happy","มีความสุข"); w("sad","เศร้า"); w("tired","เหนื่อย"); w("hungry","หิว"); w("thirsty","กระหาย");
w("fast","เร็ว"); w("slow","ช้า"); w("easy","ง่าย"); w("difficult","ยาก"); w("hard","ยาก");
w("clean","สะอาด"); w("dirty","สกปรก"); w("rich","รวย"); w("poor","จน");
w("expensive","แพง"); w("cheap","ถูก"); w("free","ฟรี");
w("important","สำคัญ"); w("interesting","น่าสนใจ"); w("boring","น่าเบื่อ");
w("long","ยาว"); w("short","สั้น"); w("tall","สูง"); w("high","สูง"); w("low","ต่ำ");
w("right","ถูก;ขวา"); w("wrong","ผิด"); w("true","จริง"); w("real","จริง");
w("full","เต็ม"); w("empty","ว่าง"); w("strong","แข็งแรง"); w("weak","อ่อนแอ");
w("red","แดง"); w("blue","น้ำเงิน"); w("green","เขียว"); w("yellow","เหลือง"); w("black","ดำ"); w("white","ขาว");
w("many","หลาย;มาก"); w("much","มาก"); w("few","น้อย"); w("some","บาง"); w("all","ทั้งหมด");
w("same","เหมือน"); w("different","ต่าง"); w("other","อื่น"); w("another","อีก");

// Adverbs/Other
w("very","มาก"); w("really","จริงๆ"); w("quite","ค่อนข้าง"); w("too","เกินไป;ด้วย");
w("not","ไม่"); w("no","ไม่;ไม่มี"); w("yes","ใช่");
w("here","ที่นี่"); w("there","ที่นั่น"); w("also","ด้วย"); w("still","ยัง");
w("only","เท่านั้น"); w("just","เพิ่ง;แค่"); w("already","แล้ว"); w("yet","ยัง");
w("always","เสมอ"); w("never","ไม่เคย"); w("sometimes","บางครั้ง"); w("often","บ่อย");
w("please","กรุณา"); w("thank","ขอบคุณ"); w("thanks","ขอบคุณ"); w("sorry","ขอโทษ");
w("hello","สวัสดี"); w("goodbye","ลาก่อน");
w("maybe","อาจจะ"); w("perhaps","บางที"); w("probably","น่าจะ");
w("together","ด้วยกัน"); w("alone","คนเดียว");
w("again","อีกครั้ง"); w("more","มากกว่า"); w("less","น้อยกว่า");
w("and","และ"); w("but","แต่"); w("or","หรือ"); w("because","เพราะ");
w("if","ถ้า"); w("then","แล้ว;ก็"); w("so","ดังนั้น"); w("well","ดี;เอ่อ");
w("about","เกี่ยวกับ"); w("for","สำหรับ"); w("with","กับ"); w("without","ไม่มี");
w("before","ก่อน"); w("after","หลัง"); w("during","ระหว่าง");
w("in","ใน"); w("on","บน"); w("at","ที่"); w("from","จาก"); w("to","ไป;ถึง");
w("of","ของ"); w("by","โดย");

// Numbers
w("one","หนึ่ง"); w("two","สอง"); w("three","สาม"); w("four","สี่"); w("five","ห้า");
w("six","หก"); w("seven","เจ็ด"); w("eight","แปด"); w("nine","เก้า"); w("ten","สิบ");
w("hundred","ร้อย"); w("thousand","พัน");
w("first","แรก;ที่หนึ่ง"); w("second","ที่สอง"); w("third","ที่สาม");
w("half","ครึ่ง"); w("quarter","หนึ่งในสี่");

// Helpers for common phrases
const PHRASES = {
  "i'm":"ฉัน", "i am":"ฉัน", "i've":"ฉัน", "i'll":"ฉันจะ",
  "you're":"คุณ", "you are":"คุณ", "you've":"คุณ", "you'll":"คุณจะ",
  "he's":"เขา", "he is":"เขา", "she's":"เธอ", "she is":"เธอ",
  "we're":"เรา", "we are":"เรา", "they're":"พวกเขา",
  "it's":"มัน", "it is":"มัน",
  "that's":"นั่นคือ", "this is":"นี่คือ",
  "don't":"ไม่", "doesn't":"ไม่", "didn't":"ไม่", "can't":"ไม่สามารถ", "won't":"จะไม่",
  "let's":"...กันเถอะ",
  "there is":"มี", "there are":"มี", "there's":"มี",
  "a lot of":"มาก", "lots of":"มาก",
  "a little":"นิดหน่อย", "a bit":"นิดหน่อย",
  "each other":"กัน",
  "would like":"อยาก", "want to":"อยาก",
  "going to":"จะ", "gonna":"จะ",
  "have to":"ต้อง", "has to":"ต้อง",
  "used to":"เคย",
  "need to":"ต้อง",
};

// Translate a single word
function tw(word) {
  const w = word.toLowerCase().replace(/[.,!?;:'"]+$/, '').trim();
  if (!w) return '';
  if (DICT[w]) return DICT[w];
  // Try removing 's
  if (w.endsWith("'s") && DICT[w.slice(0, -2)]) return DICT[w.slice(0, -2)] + '';
  // Try removing -ing, -ed, -ly
  if (w.endsWith('ing') && DICT[w.slice(0, -3)]) return DICT[w.slice(0, -3)];
  if (w.endsWith('ed') && DICT[w.slice(0, -2)]) return DICT[w.slice(0, -2)];
  if (w.endsWith('ly') && DICT[w.slice(0, -2)]) return DICT[w.slice(0, -2)];
  // Plural: remove trailing 's'
  if (w.endsWith('s') && w.length > 3 && DICT[w.slice(0, -1)]) return DICT[w.slice(0, -1)];
  return '';
}

// Simple English → Thai translation for sentences
function translateSentence(en) {
  let s = en.trim();
  
  // Try common phrase replacements first
  const lowerS = ' ' + s.toLowerCase().replace(/[.,!?;:]+/g, ' ') + ' ';
  
  // Quick translation: break into words, translate each, reassemble
  const words = s.split(/\s+/);
  const translated = [];
  
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const lw = w.toLowerCase();
    
    // Skip articles and common function words
    if (['a','an','the','to','is','are','was','were','be','been','being',
         'has','have','had','do','does','did','will','would','shall',
         'may','might','can','could','must','should',
         'of','in','on','at','by','for','with','from',
         'and','or','but','if','then','so','as','than',
         'that','this','it','its','not','no','yes','yet',
         'just','only','even','also','too','very',
         'there','here','when','what','how','which','who',
         'i','me','my','you','your','he','she','we','they',
         'his','her','our','their','its','him','us','them',
        ].includes(lw)) continue;
    
    const t = tw(lw);
    if (t) translated.push(t);
  }
  
  if (translated.length === 0) return '';
  return translated.join(' ');
}

// ── Process files ────────────────────────────────────────────────
function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let updated = 0, skipped = 0;
  
  // Replace example-level meaningThai (NOT word-level which have ,\"category\" after)
  content = content.replace(
    /"meaning":"([^"]+)","meaningThai":"([^"]*)"/g,
    (match, meaning, existingThai) => {
      // Skip if this is a word-level entry (followed by ,\"category\")
      const pos = content.indexOf(match);
      const after = content.slice(pos + match.length, pos + match.length + 15);
      if (after.startsWith(',"category"')) return match;
      
      if (existingThai && existingThai.trim()) { skipped++; return match; }
      
      const thai = translateSentence(meaning);
      if (thai) { updated++; return `"meaning":"${meaning}","meaningThai":"${thai}"`; }
      skipped++; return match;
    }
  );
  
  console.log(`  Examples updated: ${updated}, kept/skipped: ${skipped}`);
  writeFileSync(filePath, content, 'utf-8');
  return { updated, skipped };
}

// ── Main ─────────────────────────────────────────────────────────
const args = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 4);
const levels = args.length ? args.sort((a, b) => a - b) : [1, 2, 3, 4];
let totalUpdated = 0, totalSkipped = 0;

for (const level of levels) {
  const fp = resolve(DATA_DIR, `hsk${level}-words.js`);
  console.log(`HSK ${level}:`);
  const { updated, skipped } = processFile(fp);
  totalUpdated += updated;
  totalSkipped += skipped;
}

console.log(`\n✅ Examples translated: ${totalUpdated}, already had/skipped: ${totalSkipped}`);
