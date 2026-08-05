// Bulk Thai translation with comprehensive single-word dictionary
// Translates meanings by decomposing into individual English words.
// Usage: node scripts/add-thai-v2.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'src', 'data', 'hsk3');

// ── Single-word English → Thai dictionary ───────────────────────
const W = {};

function w(en, th) { W[en.toLowerCase()] = th; }

// Articles / particles (skip in translation)
w("a",""); w("an",""); w("the",""); w("to",""); w("of",""); w("for","");
w("in",""); w("on",""); w("at",""); w("with",""); w("by",""); w("from","");
w("and","และ"); w("or","หรือ"); w("but","แต่"); w("not","ไม่");

// Type annotations
w("(particle)",""); w("(conjunction)",""); w("(preposition)",""); w("(numeral)",""); w("(m.w.)","");
w("(suffix)",""); w("(prefix)",""); w("(interjection)","");

// Numbers
w("one","หนึ่ง"); w("two","สอง"); w("three","สาม"); w("four","สี่"); w("five","ห้า");
w("six","หก"); w("seven","เจ็ด"); w("eight","แปด"); w("nine","เก้า"); w("ten","สิบ");
w("hundred","ร้อย"); w("thousand","พัน"); w("ten thousand","หมื่น");
w("first","ที่หนึ่ง"); w("second","ที่สอง"); w("third","ที่สาม");
w("half","ครึ่ง"); w("quarter","เสี้ยว");

// Pronouns
w("i","ฉัน"); w("me","ฉัน"); w("my","ของฉัน"); w("you","คุณ"); w("your","ของคุณ");
w("he","เขา"); w("she","เธอ"); w("it","มัน"); w("we","เรา"); w("they","พวกเขา");
w("him","เขา"); w("her","เธอ"); w("us","เรา"); w("them","พวกเขา");
w("this","นี้"); w("that","นั้น"); w("these","เหล่านี้"); w("those","เหล่านั้น");
w("who","ใคร"); w("whom","ใคร"); w("whose","ของใคร");
w("what","อะไร"); w("which","ไหน"); w("where","ที่ไหน"); w("when","เมื่อไหร่");
w("why","ทำไม"); w("how","อย่างไร");
w("someone","ใครบางคน"); w("something","บางสิ่ง"); w("anything","อะไรก็ตาม");
w("nothing","ไม่มีอะไร"); w("everything","ทุกอย่าง"); w("everyone","ทุกคน");
w("anybody","ใครก็ได้"); w("nobody","ไม่มีใคร");

// Time
w("now","ตอนนี้"); w("then","ตอนนั้น"); w("today","วันนี้"); w("tomorrow","พรุ่งนี้");
w("yesterday","เมื่อวาน"); w("morning","เช้า"); w("afternoon","บ่าย");
w("evening","เย็น"); w("night","กลางคืน"); w("day","วัน"); w("week","สัปดาห์");
w("month","เดือน"); w("year","ปี"); w("hour","ชั่วโมง"); w("minute","นาที");
w("second","วินาที"); w("time","เวลา"); w("moment","ขณะ");
w("soon","เร็วๆนี้"); w("later","ทีหลัง"); w("before","ก่อน"); w("after","หลัง");
w("already","แล้ว"); w("yet","ยัง"); w("still","ยัง"); w("always","เสมอ");
w("never","ไม่เคย"); w("sometimes","บางครั้ง"); w("often","บ่อย");
w("usually","ปกติ"); w("always","ตลอด"); w("forever","ตลอดกาล");
w("recently","เร็วๆนี้"); w("lately","ช่วงนี้");
w("early","เช้า; แต่แรก"); w("late","สาย");
w("suddenly","ทันใด"); w("immediately","ทันที");
w("gradually","ค่อยๆ"); w("finally","ในที่สุด");
w("once","ครั้งหนึ่ง"); w("twice","สองครั้ง");
w("past","อดีต"); w("present","ปัจจุบัน"); w("future","อนาคต");
w("age","อายุ"); w("century","ศตวรรษ"); w("period","ช่วง");
w("season","ฤดู"); w("spring","ฤดูใบไม้ผลิ"); w("summer","ฤดูร้อน");
w("autumn","ฤดูใบไม้ร่วง"); w("winter","ฤดูหนาว");

// Days/Months
w("monday","วันจันทร์"); w("tuesday","วันอังคาร"); w("wednesday","วันพุธ");
w("thursday","วันพฤหัสบดี"); w("friday","วันศุกร์"); w("saturday","วันเสาร์");
w("sunday","วันอาทิตย์");
w("january","มกราคม"); w("february","กุมภาพันธ์"); w("march","มีนาคม");
w("april","เมษายน"); w("may","พฤษภาคม"); w("june","มิถุนายน");
w("july","กรกฎาคม"); w("august","สิงหาคม"); w("september","กันยายน");
w("october","ตุลาคม"); w("november","พฤศจิกายน"); w("december","ธันวาคม");

// Verbs
w("be","เป็น"); w("am","เป็น"); w("is","เป็น"); w("are","เป็น");
w("was","เป็น"); w("were","เป็น"); w("been","เป็น");
w("have","มี"); w("has","มี"); w("had","มี"); w("do","ทำ");
w("does","ทำ"); w("did","ทำ"); w("can","ได้");
w("will","จะ"); w("would","จะ"); w("shall","จะ"); w("should","ควร");
w("may","อาจ"); w("might","อาจ"); w("must","ต้อง"); w("could","สามารถ");
w("need","ต้องการ"); w("want","อยาก"); w("like","ชอบ"); w("love","รัก");
w("hate","เกลียด"); w("prefer","ชอบมากกว่า");
w("go","ไป"); w("come","มา"); w("arrive","ถึง"); w("leave","จากไป");
w("return","กลับ"); w("enter","เข้า"); w("exit","ออก");
w("walk","เดิน"); w("run","วิ่ง"); w("swim","ว่ายน้ำ"); w("fly","บิน");
w("drive","ขับ"); w("ride","ขี่"); w("sit","นั่ง"); w("stand","ยืน");
w("lie","นอน"); w("sleep","นอน"); w("wake","ตื่น");
w("eat","กิน"); w("drink","ดื่ม"); w("cook","ทำอาหาร"); w("taste","ชิม");
w("bite","กัด"); w("chew","เคี้ยว"); w("swallow","กลืน");
w("see","เห็น"); w("look","ดู"); w("watch","ดู"); w("read","อ่าน");
w("hear","ได้ยิน"); w("listen","ฟัง"); w("smell","ดม"); w("touch","สัมผัส");
w("feel","รู้สึก"); w("think","คิด"); w("know","รู้"); w("understand","เข้าใจ");
w("remember","จำ"); w("forget","ลืม"); w("believe","เชื่อ"); w("doubt","สงสัย");
w("guess","เดา"); w("suppose","สมมติ"); w("assume","สันนิษฐาน");
w("say","พูด"); w("tell","บอก"); w("speak","พูด"); w("talk","คุย");
w("ask","ถาม"); w("answer","ตอบ"); w("reply","ตอบ");
w("explain","อธิบาย"); w("describe","บรรยาย"); w("discuss","อภิปราย");
w("argue","โต้แย้ง"); w("agree","เห็นด้วย"); w("disagree","ไม่เห็นด้วย");
w("promise","สัญญา"); w("suggest","แนะนำ"); w("warn","เตือน");
w("complain","บ่น"); w("praise","ชม");
w("call","เรียก"); w("shout","ตะโกน"); w("whisper","กระซิบ");
w("laugh","หัวเราะ"); w("cry","ร้องไห้"); w("smile","ยิ้ม");
w("give","ให้"); w("take","เอา"); w("bring","นำมา"); w("send","ส่ง");
w("receive","รับ"); w("get","ได้รับ"); w("buy","ซื้อ"); w("sell","ขาย");
w("pay","จ่าย"); w("spend","ใช้จ่าย"); w("save","ประหยัด");
w("lend","ให้ยืม"); w("borrow","ยืม"); w("return","คืน");
w("keep","เก็บ"); w("hold","ถือ"); w("carry","ถือ; หิ้ว");
w("put","วาง"); w("place","วาง"); w("set","ตั้ง"); w("remove","เอาออก");
w("open","เปิด"); w("close","ปิด"); w("shut","ปิด"); w("lock","ล็อค");
w("turn","หมุน"); w("push","ผลัก"); w("pull","ดึง"); w("lift","ยก");
w("throw","ขว้าง"); w("catch","จับ"); w("drop","ตก; ปล่อย");
w("break","แตก; หัก"); w("cut","ตัด"); w("tear","ฉีก"); w("burn","เผา");
w("build","สร้าง"); w("make","ทำ"); w("create","สร้าง"); w("destroy","ทำลาย");
w("repair","ซ่อม"); w("fix","ซ่อม; แก้"); w("change","เปลี่ยน"); w("become","กลายเป็น");
w("grow","เติบโต"); w("develop","พัฒนา"); w("improve","ปรับปรุง");
w("increase","เพิ่ม"); w("decrease; reduce","ลด");
w("add","เพิ่ม"); w("remove","เอาออก");
w("begin","เริ่ม"); w("start","เริ่ม"); w("finish","เสร็จ"); w("end","จบ");
w("stop","หยุด"); w("continue","ต่อ"); w("pause","หยุดชั่วคราว");
w("win","ชนะ"); w("lose","แพ้"); w("succeed","สำเร็จ"); w("fail","ล้มเหลว");
w("try","ลอง"); w("attempt","พยายาม"); w("practice","ฝึก");
w("learn","เรียน"); w("study","เรียน"); w("teach","สอน");
w("train","ฝึก"); w("educate","ให้การศึกษา");
w("work","ทำงาน"); w("rest","พัก"); w("play","เล่น");
w("exercise","ออกกำลังกาย"); w("relax","ผ่อนคลาย");
w("live","อยู่"); w("die","ตาย"); w("born","เกิด");
w("marry","แต่งงาน"); w("divorce","หย่า");
w("meet","พบ; เจอ"); w("introduce","แนะนำ"); w("visit","เยี่ยม");
w("invite","เชิญ"); w("welcome","ต้อนรับ");
w("help","ช่วย"); w("support","สนับสนุน"); w("protect","ปกป้อง");
w("save","ช่วย; บันทึก"); w("rescue","ช่วยชีวิต");
w("attack","โจมตี"); w("defend","ป้องกัน"); w("fight","ต่อสู้");
w("win","ชนะ"); w("lose","แพ้"); w("escape","หนี");
w("follow","ตาม"); w("lead","นำ"); w("guide","นำทาง");
w("choose","เลือก"); w("select","เลือก"); w("decide","ตัดสินใจ");
w("accept","ยอมรับ"); w("refuse","ปฏิเสธ"); w("reject","ปฏิเสธ");
w("allow","อนุญาต"); w("forbid","ห้าม"); w("permit","อนุญาต");
w("hope","หวัง"); w("wish","ขอให้"); w("expect","คาดหวัง");
w("wait","รอ"); w("prepare","เตรียม"); w("plan","วางแผน");
w("organize","จัด"); w("arrange","จัด"); w("manage","จัดการ");
w("control","ควบคุม"); w("check; examine","ตรวจสอบ");
w("test","ทดสอบ"); w("measure","วัด");
w("count","นับ"); w("calculate","คำนวณ");
w("compare","เปรียบเทียบ"); w("match","ตรงกัน");
w("include","รวม"); w("contain","บรรจุ"); w("exclude","ยกเว้น");
w("connect","เชื่อมต่อ"); w("join","เข้าร่วม"); w("separate","แยก");
w("mix","ผสม"); w("combine","รวม"); w("divide","แบ่ง");
w("share","แบ่งปัน"); w("collect","เก็บรวบรวม");
w("find","หา; เจอ"); w("discover","ค้นพบ"); w("search","ค้นหา");
w("look for","มองหา"); w("seek","แสวงหา");
w("hide","ซ่อน"); w("appear","ปรากฏ"); w("disappear","หายไป");
w("show","แสดง"); w("display","แสดง"); w("demonstrate","สาธิต");
w("prove","พิสูจน์"); w("indicate","บ่งชี้");
w("move","เคลื่อน"); w("stay","อยู่"); w("remain","ยังคง");
w("happen","เกิดขึ้น"); w("occur","เกิด"); w("exist","มีอยู่");
w("cause","ทำให้เกิด"); w("affect","ส่งผล"); w("influence","มีอิทธิพล");
w("consider","พิจารณา"); w("regard","ถือว่า"); w("treat","ปฏิบัติ");
w("respect","เคารพ"); w("admire","ชื่นชม");
w("care","ดูแล"); w("worry","กังวล"); w("concern","กังวล");
w("relate","เกี่ยวข้อง"); w("depend","ขึ้นอยู่กับ"); w("belong","เป็นของ");
w("consist","ประกอบด้วย"); w("refer","อ้างถึง"); w("mean","หมายถึง");
w("represent","แทน"); w("symbolize","เป็นสัญลักษณ์");
w("express","แสดงออก"); w("translate","แปล"); w("interpret","ตีความ");
w("imagine","จินตนาการ"); w("realize","ตระหนัก"); w("recognize","จำได้");
w("notice","สังเกต"); w("ignore","เพิกเฉย"); w("pay attention","ใส่ใจ");
w("focus","มุ่งเน้น"); w("concentrate","มีสมาธิ");

// State verbs
w("seem","ดูเหมือน"); w("appear","ดูเหมือน"); w("look like","ดูเหมือน");
w("sound","ฟังดู"); w("feel","รู้สึก"); w("taste","มีรสชาติ");
w("smell","มีกลิ่น");

// Adjectives
w("good","ดี"); w("bad","แย่"); w("great","ดีมาก"); w("terrible","แย่มาก");
w("nice","ดี; น่ารัก"); w("kind","ใจดี"); w("mean","ใจร้าย");
w("happy","มีความสุข"); w("sad","เศร้า"); w("angry","โกรธ");
w("excited","ตื่นเต้น"); w("bored","เบื่อ"); w("tired","เหนื่อย");
w("afraid","กลัว"); w("brave","กล้าหาญ"); w("shy","ขี้อาย");
w("proud","ภูมิใจ"); w("ashamed","อาย");
w("confident","มั่นใจ"); w("nervous","ประหม่า; ตื่นเต้น");
w("surprised","ประหลาดใจ"); w("shocked","ตกใจ");
w("satisfied","พอใจ"); w("disappointed","ผิดหวัง");
w("grateful","ขอบคุณ"); w("thankful","ขอบคุณ");
w("big","ใหญ่"); w("large","ใหญ่"); w("small","เล็ก"); w("tiny","เล็กมาก");
w("tall","สูง"); w("short","เตี้ย; สั้น"); w("long","ยาว");
w("high","สูง"); w("low","ต่ำ");
w("wide","กว้าง"); w("narrow","แคบ"); w("broad","กว้าง");
w("thick","หนา"); w("thin","บาง");
w("deep","ลึก"); w("shallow","ตื้น");
w("heavy","หนัก"); w("light","เบา");
w("hard","แข็ง; ยาก"); w("soft","นุ่ม");
w("smooth","เรียบ"); w("rough","ขรุขระ");
w("sharp","คม"); w("blunt","ทื่อ");
w("strong","แข็งแรง"); w("weak","อ่อนแอ");
w("powerful","ทรงพลัง");
w("fast","เร็ว"); w("quick","เร็ว"); w("slow","ช้า");
w("early","เร็ว; แต่แรก"); w("late","สาย");
w("hot","ร้อน"); w("warm","อุ่น"); w("cool","เย็น"); w("cold","หนาว; เย็น");
w("dry","แห้ง"); w("wet","เปียก"); w("moist","ชื้น");
w("full","เต็ม"); w("empty","ว่าง");
w("rich","รวย"); w("poor","จน");
w("expensive","แพง"); w("cheap","ถูก");
w("clean","สะอาด"); w("dirty","สกปรก");
w("neat","เรียบร้อย"); w("messy","รก");
w("beautiful","สวย"); w("pretty","น่ารัก; สวย"); w("ugly","น่าเกลียด");
w("handsome","หล่อ"); w("cute","น่ารัก");
w("young","เด็ก; หนุ่มสาว"); w("old","แก่; เก่า");
w("new","ใหม่"); w("fresh","สด");
w("modern","ทันสมัย"); w("traditional","ดั้งเดิม");
w("ancient","โบราณ");
w("bright","สว่าง"); w("dark","มืด"); w("dim","สลัว");
w("loud","ดัง"); w("quiet","เงียบ"); w("noisy","เสียงดัง");
w("sweet","หวาน"); w("sour","เปรี้ยว"); w("bitter","ขม");
w("salty","เค็ม"); w("spicy","เผ็ด"); w("hot","เผ็ด; ร้อน");
w("delicious","อร่อย"); w("tasty","อร่อย");
w("right","ถูก; ขวา"); w("wrong","ผิด");
w("correct","ถูกต้อง"); w("incorrect","ไม่ถูกต้อง");
w("true","จริง"); w("false","เท็จ");
w("real","จริง"); w("fake","ปลอม");
w("natural","ธรรมชาติ"); w("artificial","เทียม");
w("possible","เป็นไปได้"); w("impossible","เป็นไปไม่ได้");
w("easy","ง่าย"); w("difficult","ยาก"); w("hard","ยาก");
w("simple","เรียบง่าย"); w("complex","ซับซ้อน");
w("safe","ปลอดภัย"); w("dangerous","อันตราย");
w("healthy","สุขภาพดี"); w("sick","ป่วย"); w("ill","ป่วย");
w("alive","มีชีวิต"); w("dead","ตาย");
w("free","ฟรี; ว่าง"); w("busy","ยุ่ง");
w("available","ว่าง"); w("unavailable","ไม่ว่าง");
w("open","เปิด"); w("closed","ปิด");
w("public","สาธารณะ"); w("private","ส่วนตัว");
w("common","ทั่วไป"); w("rare","หายาก");
w("ordinary","ธรรมดา"); w("special","พิเศษ");
w("normal","ปกติ"); w("strange","แปลก"); w("weird","แปลก");
w("interesting","น่าสนใจ"); w("boring","น่าเบื่อ");
w("fun","สนุก"); w("funny","ตลก");
w("serious","จริงจัง"); w("humorous","ตลก");
w("important","สำคัญ"); w("unimportant","ไม่สำคัญ");
w("necessary","จำเป็น"); w("unnecessary","ไม่จำเป็น");
w("useful","มีประโยชน์"); w("useless","ไร้ประโยชน์");
w("harmful","เป็นอันตราย"); w("harmless","ไม่เป็นอันตราย");
w("famous","มีชื่อเสียง"); w("popular","เป็นที่นิยม");
w("successful","ประสบความสำเร็จ");
w("excellent","ดีเยี่ยม"); w("perfect","สมบูรณ์แบบ");
w("wonderful","ยอดเยี่ยม"); w("fantastic","ยอดเยี่ยม");
w("terrible","แย่มาก"); w("awful","แย่มาก");
w("main","หลัก"); w("major","สำคัญ"); w("minor","เล็กน้อย");
w("basic","พื้นฐาน"); w("advanced","ขั้นสูง");
w("certain","แน่นอน"); w("sure","แน่ใจ"); w("uncertain","ไม่แน่นอน");
w("likely","น่าจะ"); w("unlikely","ไม่น่าจะ");
w("able","สามารถ"); w("unable","ไม่สามารถ");
w("willing","เต็มใจ"); w("unwilling","ไม่เต็มใจ");
w("polite","สุภาพ"); w("rude","หยาบคาย");
w("honest","ซื่อสัตย์"); w("dishonest","ไม่ซื่อสัตย์");
w("fair","ยุติธรรม"); w("unfair","ไม่ยุติธรรม");
w("generous","ใจกว้าง"); w("selfish","เห็นแก่ตัว");
w("patient","อดทน"); w("impatient","ไม่อดทน");
w("strict","เข้มงวด"); w("lenient","ผ่อนปรน");
w("active","กระตือรือร้น"); w("lazy","ขี้เกียจ");
w("hardworking","ขยัน"); w("careful","ระมัดระวัง"); w("careless","สะเพร่า");
w("round","กลม"); w("square","สี่เหลี่ยม"); w("flat","แบน");
w("straight","ตรง"); w("curved","โค้ง"); w("bent","งอ");
w("horizontal","แนวนอน"); w("vertical","แนวตั้ง");
w("front","หน้า"); w("back","หลัง"); w("side","ด้าน");
w("top","บน"); w("bottom","ล่าง"); w("middle","กลาง");
w("left","ซ้าย"); w("right","ขวา"); w("center","กลาง");
w("inner","ด้านใน"); w("outer","ด้านนอก");
w("near","ใกล้"); w("far","ไกล"); w("close","ใกล้");
w("next","ถัดไป"); w("previous","ก่อนหน้า"); w("following","ต่อไป");
w("same","เหมือน"); w("different","ต่าง");
w("similar","คล้าย"); w("opposite","ตรงข้าม");
w("full","เต็ม"); w("complete","สมบูรณ์"); w("entire","ทั้งหมด");
w("whole","ทั้งหมด"); w("partial","บางส่วน");
w("enough","พอ"); w("sufficient","เพียงพอ");
w("extra","พิเศษ"); w("additional","เพิ่มเติม");
w("single","เดี่ยว"); w("double","คู่");
w("alone","คนเดียว"); w("together","ด้วยกัน");
w("separate","แยก"); w("joint","ร่วม");
w("positive","บวก"); w("negative","ลบ");
w("direct","โดยตรง"); w("indirect","โดยอ้อม");
w("formal","ทางการ"); w("informal","ไม่เป็นทางการ");
w("official","ทางการ"); w("personal","ส่วนตัว");
w("local","ท้องถิ่น"); w("national","แห่งชาติ"); w("international","นานาชาติ");
w("physical","ทางกายภาพ"); w("mental","ทางจิตใจ"); w("emotional","ทางอารมณ์");

// Colors
w("red","แดง"); w("blue","น้ำเงิน"); w("green","เขียว"); w("yellow","เหลือง");
w("black","ดำ"); w("white","ขาว"); w("pink","ชมพู"); w("purple","ม่วง");
w("orange","ส้ม"); w("brown","น้ำตาล"); w("gray","เทา");
w("gold","ทอง"); w("silver","เงิน"); w("color","สี");

// Family
w("father","พ่อ"); w("dad","พ่อ"); w("daddy","พ่อ");
w("mother","แม่"); w("mom","แม่"); w("mommy","แม่");
w("parent","พ่อแม่"); w("parents","พ่อแม่");
w("son","ลูกชาย"); w("daughter","ลูกสาว"); w("child","เด็ก; ลูก");
w("brother","พี่ชาย; น้องชาย"); w("sister","พี่สาว; น้องสาว");
w("older brother","พี่ชาย"); w("younger brother","น้องชาย");
w("older sister","พี่สาว"); w("younger sister","น้องสาว");
w("husband","สามี"); w("wife","ภรรยา");
w("uncle","ลุง; อา"); w("aunt","ป้า; น้า");
w("grandfather","ปู่; ตา"); w("grandmother","ย่า; ยาย");
w("grandson","หลานชาย"); w("granddaughter","หลานสาว");
w("cousin","ลูกพี่ลูกน้อง");
w("relative","ญาติ"); w("family","ครอบครัว");
w("member","สมาชิก");

// Body
w("head","หัว"); w("hair","ผม"); w("face","หน้า"); w("eye","ตา");
w("nose","จมูก"); w("mouth","ปาก"); w("ear","หู");
w("tooth","ฟัน"); w("tongue","ลิ้น"); w("lip","ริมฝีปาก");
w("neck","คอ"); w("shoulder","ไหล่"); w("arm","แขน"); w("elbow","ข้อศอก");
w("hand","มือ"); w("finger","นิ้ว"); w("thumb","นิ้วหัวแม่มือ");
w("chest","หน้าอก"); w("back","หลัง"); w("stomach","ท้อง");
w("leg","ขา"); w("knee","เข่า"); w("foot","เท้า"); w("toe","นิ้วเท้า");
w("skin","ผิวหนัง"); w("bone","กระดูก"); w("blood","เลือด");
w("heart","หัวใจ"); w("brain","สมอง");
w("body","ร่างกาย"); w("health","สุขภาพ");

// Food & drink
w("food","อาหาร"); w("drink","เครื่องดื่ม"); w("water","น้ำ");
w("rice","ข้าว"); w("bread","ขนมปัง"); w("noodle","บะหมี่");
w("meat","เนื้อ"); w("beef","เนื้อวัว"); w("pork","เนื้อหมู");
w("chicken","ไก่"); w("fish","ปลา"); w("egg","ไข่");
w("vegetable","ผัก"); w("fruit","ผลไม้"); w("apple","แอปเปิ้ล");
w("banana","กล้วย"); w("orange","ส้ม"); w("grape","องุ่น");
w("milk","นม"); w("cheese","ชีส"); w("butter","เนย");
w("sugar","น้ำตาล"); w("salt","เกลือ"); w("oil","น้ำมัน");
w("soup","ซุป"); w("salad","สลัด");
w("tea","ชา"); w("coffee","กาแฟ"); w("juice","น้ำผลไม้");
w("beer","เบียร์"); w("wine","ไวน์");
w("cake","เค้ก"); w("cookie","คุกกี้"); w("candy","ขนม");
w("chocolate","ช็อกโกแลต"); w("ice cream","ไอศกรีม");
w("breakfast","อาหารเช้า"); w("lunch","อาหารกลางวัน");
w("dinner","อาหารเย็น"); w("meal","มื้ออาหาร");
w("snack","ขนม"); w("dessert","ของหวาน");
w("menu","เมนู"); w("restaurant","ร้านอาหาร");

// Animals
w("dog","หมา"); w("cat","แมว"); w("bird","นก"); w("fish","ปลา");
w("horse","ม้า"); w("cow","วัว"); w("pig","หมู"); w("sheep","แกะ");
w("chicken","ไก่"); w("duck","เป็ด"); w("rabbit","กระต่าย");
w("mouse","หนู"); w("rat","หนู"); w("snake","งู");
w("tiger","เสือ"); w("lion","สิงโต"); w("bear","หมี");
w("elephant","ช้าง"); w("monkey","ลิง");
w("insect","แมลง"); w("butterfly","ผีเสื้อ"); w("bee","ผึ้ง");
w("ant","มด"); w("spider","แมงมุม");
w("animal","สัตว์"); w("pet","สัตว์เลี้ยง");

// Nature
w("sun","พระอาทิตย์"); w("moon","พระจันทร์"); w("star","ดาว");
w("sky","ท้องฟ้า"); w("cloud","เมฆ"); w("rain","ฝน");
w("snow","หิมะ"); w("wind","ลม"); w("fog","หมอก");
w("thunder","ฟ้าร้อง"); w("lightning","ฟ้าผ่า");
w("weather","อากาศ"); w("temperature","อุณหภูมิ");
w("mountain","ภูเขา"); w("hill","เนินเขา"); w("river","แม่น้ำ");
w("lake","ทะเลสาบ"); w("sea","ทะเล"); w("ocean","มหาสมุทร");
w("forest","ป่า"); w("tree","ต้นไม้"); w("flower","ดอกไม้");
w("grass","หญ้า"); w("leaf","ใบไม้"); w("plant","พืช");
w("nature","ธรรมชาติ"); w("environment","สิ่งแวดล้อม");
w("earth","โลก"); w("world","โลก"); w("land","ดินแดน");
w("fire","ไฟ"); w("air","อากาศ"); w("water","น้ำ"); w("soil","ดิน");
w("stone","หิน"); w("rock","หิน"); w("sand","ทราย");
w("gold","ทอง"); w("iron","เหล็ก"); w("steel","เหล็กกล้า");
w("wood","ไม้"); w("paper","กระดาษ"); w("glass","แก้ว");
w("plastic","พลาสติก"); w("metal","โลหะ");

// Places
w("house","บ้าน"); w("home","บ้าน"); w("room","ห้อง");
w("kitchen","ครัว"); w("bathroom","ห้องน้ำ"); w("bedroom","ห้องนอน");
w("living room","ห้องนั่งเล่น");
w("door","ประตู"); w("window","หน้าต่าง"); w("wall","กำแพง");
w("floor","พื้น"); w("ceiling","เพดาน"); w("roof","หลังคา");
w("garden","สวน"); w("yard","สนาม");
w("building","อาคาร"); w("office","สำนักงาน");
w("school","โรงเรียน"); w("university","มหาวิทยาลัย");
w("college","วิทยาลัย"); w("classroom","ห้องเรียน");
w("library","ห้องสมุด"); w("bookstore","ร้านหนังสือ");
w("hospital","โรงพยาบาล"); w("clinic","คลินิก");
w("bank","ธนาคาร"); w("post office","ไปรษณีย์");
w("police station","สถานีตำรวจ");
w("store","ร้านค้า"); w("shop","ร้าน"); w("market","ตลาด");
w("supermarket","ซูเปอร์มาร์เก็ต"); w("mall","ห้าง");
w("hotel","โรงแรม"); w("airport","สนามบิน"); w("station","สถานี");
w("train station","สถานีรถไฟ"); w("bus stop","ป้ายรถเมล์");
w("park","สวนสาธารณะ"); w("street","ถนน"); w("road","ถนน");
w("bridge","สะพาน"); w("corner","มุม");
w("city","เมือง"); w("town","เมือง"); w("village","หมู่บ้าน");
w("country","ประเทศ"); w("nation","ชาติ");
w("capital","เมืองหลวง"); w("province","จังหวัด");
w("north","เหนือ"); w("south","ใต้"); w("east","ตะวันออก"); w("west","ตะวันตก");
w("center","กลาง; ศูนย์กลาง");
w("place","สถานที่"); w("location","ตำแหน่ง"); w("address","ที่อยู่");
w("direction","ทิศทาง");

// Transport
w("car","รถ"); w("bus","รถเมล์"); w("taxi","แท็กซี่");
w("train","รถไฟ"); w("subway","รถไฟใต้ดิน");
w("plane","เครื่องบิน"); w("airplane","เครื่องบิน"); w("flight","เที่ยวบิน");
w("ship","เรือ"); w("boat","เรือ"); w("bicycle","จักรยาน");
w("motorcycle","มอเตอร์ไซค์");
w("ticket","ตั๋ว"); w("passenger","ผู้โดยสาร"); w("driver","คนขับ");
w("traffic","จราจร"); w("accident","อุบัติเหตุ");
w("travel","ท่องเที่ยว"); w("trip","ทริป"); w("journey","การเดินทาง");
w("map","แผนที่"); w("guide","ไกด์");

// Objects / Things
w("thing","สิ่ง; ของ"); w("stuff","ของ");
w("bag","กระเป๋า"); w("box","กล่อง"); w("bottle","ขวด");
w("cup","ถ้วย"); w("glass","แก้ว"); w("plate","จาน"); w("bowl","ชาม");
w("knife","มีด"); w("fork","ส้อม"); w("spoon","ช้อน"); w("chopsticks","ตะเกียบ");
w("key","กุญแจ"); w("lock","แม่กุญแจ");
w("phone","โทรศัพท์"); w("computer","คอมพิวเตอร์");
w("television","โทรทัศน์"); w("radio","วิทยุ");
w("camera","กล้อง"); w("watch","นาฬิกาข้อมือ"); w("clock","นาฬิกา");
w("book","หนังสือ"); w("newspaper","หนังสือพิมพ์"); w("magazine","นิตยสาร");
w("letter","จดหมาย"); w("dictionary","พจนานุกรม");
w("pen","ปากกา"); w("pencil","ดินสอ");
w("table","โต๊ะ"); w("desk","โต๊ะ"); w("chair","เก้าอี้");
w("bed","เตียง"); w("sofa","โซฟา");
w("mirror","กระจก"); w("lamp","โคมไฟ"); w("light","ไฟ");
w("umbrella","ร่ม");
w("toy","ของเล่น"); w("gift","ของขวัญ"); w("present","ของขวัญ");
w("tool","เครื่องมือ"); w("machine","เครื่องจักร");

// Clothing
w("clothes","เสื้อผ้า"); w("clothing","เสื้อผ้า");
w("shirt","เสื้อ"); w("pants","กางเกง"); w("dress","ชุด");
w("skirt","กระโปรง"); w("jacket","แจ็คเก็ต"); w("coat","เสื้อโค้ท");
w("shoe","รองเท้า"); w("sock","ถุงเท้า"); w("hat","หมวก");
w("sweater","เสื้อกันหนาว"); w("scarf","ผ้าพันคอ");
w("glove","ถุงมือ"); w("belt","เข็มขัด");
w("pocket","กระเป๋า"); w("button","กระดุม");
w("wear","สวมใส่");

// School / Work
w("school","โรงเรียน"); w("class","ชั้นเรียน; บทเรียน"); w("lesson","บทเรียน");
w("homework","การบ้าน"); w("exam","สอบ"); w("test","สอบ");
w("grade","เกรด"); w("score","คะแนน");
w("student","นักเรียน"); w("teacher","ครู");
w("professor","ศาสตราจารย์"); w("principal","ผู้อำนวยการ");
w("subject","วิชา"); w("course","หลักสูตร");
w("math","คณิตศาสตร์"); w("science","วิทยาศาสตร์");
w("history","ประวัติศาสตร์"); w("geography","ภูมิศาสตร์");
w("language","ภาษา"); w("english","อังกฤษ"); w("chinese","จีน");
w("art","ศิลปะ"); w("music","ดนตรี"); w("sport","กีฬา");
w("knowledge","ความรู้"); w("education","การศึกษา");
w("work","งาน"); w("job","งาน"); w("career","อาชีพ");
w("company","บริษัท"); w("business","ธุรกิจ");
w("boss","เจ้านาย"); w("colleague","เพื่อนร่วมงาน");
w("meeting","ประชุม"); w("report","รายงาน");
w("salary","เงินเดือน"); w("promotion","เลื่อนตำแหน่ง");

// Money / Business
w("money","เงิน"); w("cash","เงินสด"); w("coin","เหรียญ");
w("price","ราคา"); w("cost","ราคา; ค่าใช้จ่าย");
w("value","มูลค่า"); w("worth","ค่า");
w("bill","บิล"); w("receipt","ใบเสร็จ");
w("tax","ภาษี"); w("income","รายได้");
w("market","ตลาด"); w("trade","การค้า");
w("sell","ขาย"); w("buy","ซื้อ"); w("pay","จ่าย");
w("spend","ใช้จ่าย"); w("earn","หาเงิน");
w("save","ประหยัด; ออม");
w("borrow","ยืม"); w("lend","ให้ยืม");
w("owe","เป็นหนี้"); w("debt","หนี้");
w("account","บัญชี"); w("card","บัตร");

// Communication / Media
w("news","ข่าว"); w("message","ข้อความ"); w("information","ข้อมูล");
w("internet","อินเทอร์เน็ต"); w("website","เว็บไซต์");
w("email","อีเมล"); w("address","ที่อยู่");
w("movie","หนัง"); w("film","ภาพยนตร์"); w("cinema","โรงหนัง");
w("music","ดนตรี"); w("song","เพลง"); w("concert","คอนเสิร์ต");
w("show","รายการ"); w("program","โปรแกรม");
w("story","เรื่องราว"); w("article","บทความ");
w("advertisement","โฆษณา");
w("sign","ป้าย"); w("notice","ประกาศ");

// Abstract concepts
w("idea","ความคิด"); w("thought","ความคิด"); w("opinion","ความคิดเห็น");
w("mind","จิตใจ"); w("memory","ความทรงจำ");
w("dream","ความฝัน"); w("hope","ความหวัง"); w("wish","ความปรารถนา");
w("fear","ความกลัว"); w("anger","ความโกรธ"); w("happiness","ความสุข");
w("sadness","ความเศร้า"); w("surprise","ความประหลาดใจ");
w("love","ความรัก"); w("hate","ความเกลียด");
w("feeling","ความรู้สึก"); w("emotion","อารมณ์");
w("problem","ปัญหา"); w("solution","วิธีแก้");
w("question","คำถาม"); w("answer","คำตอบ");
w("reason","เหตุผล"); w("cause","สาเหตุ"); w("result","ผลลัพธ์");
w("effect","ผล"); w("influence","อิทธิพล");
w("purpose","จุดประสงค์"); w("goal","เป้าหมาย");
w("plan","แผน"); w("method","วิธี"); w("way","ทาง; วิธี");
w("chance","โอกาส"); w("opportunity","โอกาส");
w("choice","ทางเลือก"); w("decision","การตัดสินใจ");
w("mistake","ความผิดพลาด"); w("error","ข้อผิดพลาด");
w("success","ความสำเร็จ"); w("failure","ความล้มเหลว");
w("experience","ประสบการณ์"); w("skill","ทักษะ");
w("habit","นิสัย"); w("custom","ประเพณี");
w("culture","วัฒนธรรม"); w("tradition","ประเพณี");
w("rule","กฎ"); w("law","กฎหมาย");
w("right","สิทธิ"); w("duty","หน้าที่");
w("power","อำนาจ"); w("force","แรง");
w("energy","พลังงาน"); w("strength","ความแข็งแรง");
w("peace","สันติภาพ"); w("war","สงคราม");
w("life","ชีวิต"); w("death","ความตาย");
w("birth","การเกิด"); w("age","อายุ");
w("name","ชื่อ"); w("word","คำ"); w("sentence","ประโยค");
w("language","ภาษา"); w("meaning","ความหมาย");
w("example","ตัวอย่าง"); w("type","ประเภท"); w("kind","ชนิด");
w("form","รูปแบบ"); w("shape","รูปร่าง");
w("size","ขนาด"); w("amount","จำนวน"); w("number","ตัวเลข");
w("quality","คุณภาพ"); w("quantity","ปริมาณ");
w("part","ส่วน"); w("piece","ชิ้น");
w("group","กลุ่ม"); w("team","ทีม");
w("list","รายการ"); w("order","ลำดับ");
w("system","ระบบ"); w("process","กระบวนการ");
w("condition","สภาพ"); w("situation","สถานการณ์");
w("case","กรณี"); w("event","เหตุการณ์");
w("fact","ข้อเท็จจริง"); w("truth","ความจริง");
w("detail","รายละเอียด"); w("point","ประเด็น; จุด");
w("level","ระดับ"); w("degree","ระดับ; องศา");
w("standard","มาตรฐาน"); w("rule","กฎ");
w("limit","ขีดจำกัด"); w("difference","ความแตกต่าง");
w("relationship","ความสัมพันธ์"); w("connection","ความเชื่อมโยง");
w("basis","พื้นฐาน"); w("foundation","รากฐาน");

// Prepositions (for when not dropped)
w("about","เกี่ยวกับ"); w("above","เหนือ"); w("across","ข้าม");
w("after","หลัง"); w("against","ต่อต้าน"); w("along","ตาม");
w("among","ท่ามกลาง"); w("around","รอบ"); w("before","ก่อน");
w("behind","ข้างหลัง"); w("below","ด้านล่าง"); w("beside","ข้าง");
w("between","ระหว่าง"); w("beyond","เกิน"); w("during","ระหว่าง");
w("except","ยกเว้น"); w("inside","ข้างใน"); w("into","เข้าไปใน");
w("near","ใกล้"); w("outside","ข้างนอก");
w("over","เหนือ"); w("through","ผ่าน"); w("throughout","ตลอด");
w("toward","ไปทาง"); w("under","ใต้"); w("until","จนกระทั่ง");
w("upon","บน"); w("within","ภายใน"); w("without","โดยไม่มี");
w("behind","ข้างหลัง"); w("including","รวมถึง");
w("regarding","เกี่ยวกับ"); w("concerning","เกี่ยวกับ");
w("according to","ตาม"); w("because of","เพราะ");
w("instead of","แทน"); w("due to","เนื่องจาก");
w("despite","แม้"); w("except for","ยกเว้น");

// Adverbs / Particles
w("very","มาก"); w("really","จริงๆ"); w("quite","ค่อนข้าง");
w("too","เกินไป; ด้วย"); w("also","ด้วย"); w("as well","ด้วย");
w("even","แม้แต่"); w("just","เพิ่ง; แค่"); w("only","เท่านั้น");
w("almost","เกือบ"); w("hardly","แทบจะไม่");
w("certainly","แน่นอน"); w("definitely","แน่นอน");
w("probably","น่าจะ"); w("perhaps","บางที"); w("maybe","อาจจะ");
w("especially","โดยเฉพาะ"); w("particularly","โดยเฉพาะ");
w("exactly","ตรง; เป๊ะ"); w("approximately","ประมาณ");
w("actually","จริงๆแล้ว"); w("basically","โดยพื้นฐาน");
w("generally","โดยทั่วไป"); w("normally","ปกติ");
w("absolutely","อย่างแน่นอน"); w("completely","อย่างสมบูรณ์");
w("partly","บางส่วน"); w("mostly","ส่วนใหญ่");
w("mainly","ส่วนใหญ่"); w("especially","โดยเฉพาะ");
w("together","ด้วยกัน"); w("apart","แยกจากกัน");
w("forward","ไปข้างหน้า"); w("backward","ถอยหลัง");
w("upward","ขึ้น"); w("downward","ลง");
w("ahead","ข้างหน้า"); w("behind","ข้างหลัง");
w("inside","ข้างใน"); w("outside","ข้างนอก");
w("abroad","ต่างประเทศ"); w("away","ออกไป");
w("there","ที่นั่น"); w("here","ที่นี่");
w("everywhere","ทุกที่"); w("nowhere","ไม่มีที่ไหน");
w("somewhere","ที่ไหนสักแห่ง"); w("anywhere","ที่ไหนก็ได้");
w("how","อย่างไร"); w("so","ดังนั้น"); w("such","เช่นนั้น");
w("more","มากกว่า"); w("less","น้อยกว่า"); w("most","มากที่สุด");
w("least","น้อยที่สุด");
w("not","ไม่"); w("no","ไม่; ไม่มี"); w("yes","ใช่");
w("please","กรุณา"); w("sorry","ขอโทษ"); w("excuse me","ขอโทษ");
w("thank you","ขอบคุณ"); w("thanks","ขอบคุณ");
w("hello","สวัสดี"); w("goodbye","ลาก่อน");
w("ok","ตกลง"); w("well","ดี; เอ่อ"); w("fine","ดี");

// Chinese-specific
w("surname","นามสกุล"); w("clan","ตระกูล");
w("particle","คำช่วย"); w("conjunction","คำสันธาน");
w("preposition","คำบุพบท"); w("measure word","ลักษณะนาม");
w("classifier","ลักษณะนาม");
w("interjection","คำอุทาน");
w("prefix","คำนำหน้า"); w("suffix","คำต่อท้าย");
w("radical","หมวดนำอักษร");
w("character","ตัวอักษร"); w("hanzi","ตัวอักษรจีน");
w("pinyin","พินอิน"); w("tone","วรรณยุกต์");
w("beijing","ปักกิ่ง"); w("shanghai","เซี่ยงไฮ้");
w("china","จีน"); w("chinese","จีน; ภาษาจีน");
w("mandarin","จีนกลาง"); w("cantonese","กวางตุ้ง");
w("hsk","HSK"); w("idiom","สำนวน");

// Numbers / quantifiers
w("each","แต่ละ"); w("every","ทุก"); w("all","ทั้งหมด"); w("both","ทั้งสอง");
w("few","น้อย"); w("several","หลาย"); w("many","หลาย; มาก");
w("much","มาก"); w("little","เล็กน้อย"); w("some","บาง");
w("any","ใด; บ้าง"); w("no","ไม่มี");
w("other","อื่น"); w("another","อื่น; อีก");
w("such","เช่น");
w("own","ของตัวเอง"); w("same","เดียวกัน"); w("whole","ทั้งหมด");

// ================================================================


// ── Batch patch: 500 entries ──
w("Asia","เอเชีย");
w("Mr.; sir; gentleman","คุณ; สุภาพบุรุษ");
w("Ms.; lady; madam","คุณผู้หญิง; สุภาพสตรี");
w("TV series; TV drama","ซีรีส์; ละครโทรทัศน์");
w("a step; a pace","ก้าว");
w("about to","กำลังจะ");
w("about; regarding (preposition)","เกี่ยวกับ (คำบุพบท)");
w("according to; in accordance with (preposition)","ตาม (คำบุพบท)");
w("accurate; exact","แม่นยำ; ถูกต้อง");
w("actor or actress; performer","นักแสดง");
w("adult","ผู้ใหญ่");
w("adverbial particle (particle)","คำช่วยกริยาวิเศษณ์");
w("ah; oh; sentence-final particle for emphasis or confirmation","อ้อ; นะ (คำเสริมประโยค)");
w("along with; following (preposition)","พร้อมกับ; ตาม (คำบุพบท)");
w("also; too","ด้วย; เช่นกัน");
w("altogether","ทั้งหมด");
w("among; amid","ท่ามกลาง");
w("angle; m.w.","มุม (ลน.)");
w("annoyed; troublesome; to bother","รำคาญ; กวนใจ");
w("apparently; it seems","ดูเหมือนว่า");
w("appearance; manner","ลักษณะ; ท่าทาง");
w("appointment; engagement","นัดหมาย");
w("area; district; region","พื้นที่; เขต");
w("as; to serve as; to act as","เป็น; ทำหน้าที่เป็น");
w("assignment; mission","ภารกิจ; งาน");
w("athlete","นักกีฬา");
w("audience; listeners","ผู้ฟัง; ผู้ชม");
w("auntie; nanny","ป้า; อา; พี่เลี้ยง");
w("author","ผู้เขียน");
w("author; writer","นักเขียน");
w("badminton","แบดมินตัน");
w("ball","ลูกบอล");
w("basketball","บาสเกตบอล");
w("because of; for (preposition)","เพราะ; เนื่องจาก (คำบุพบท)");
w("beforehand; prior to","ล่วงหน้า");
w("belly; abdomen","ท้อง");
w("benefit; advantage","ประโยชน์; ข้อดี");
w("besides; in addition (conjunction)","นอกจากนี้ (คำสันธาน)");
w("best; had better","ดีที่สุด; ควรจะ");
w("between-meal nibbles; snacks","ของว่าง; ขนม");
w("birthday","วันเกิด");
w("biscuit; cracker","บิสกิต; ขนมปังกรอบ");
w("blackboard","กระดานดำ");
w("broadcasting; to broadcast","ออกอากาศ");
w("bucket; barrel","ถัง");
w("by; passive marker (preposition)","โดย; ถูก (คำบุพบทกรรมวาจก)");
w("calm; cool-headed","ใจเย็น; สงบ");
w("campus","วิทยาเขต");
w("can only","ได้แค่; เท่านั้น");
w("can; may","สามารถ; อาจ");
w("cannot but; have to","จำเป็นต้อง; ต้อง");
w("capability","ความสามารถ");
w("catty (unit of weight)","ชั่ง (หน่วยน้ำหนัก)");
w("celebrity","คนดัง");
w("certificate; proof; evidence","ใบรับรอง; หลักฐาน");
w("cheerful; cheerily","ร่าเริง");
w("childhood","วัยเด็ก");
w("cipher; secret code","รหัสลับ");
w("clear; distinct","ชัดเจน");
w("clear; sunny","แจ่มใส");
w("climate","สภาพอากาศ");
w("commodity; goods","สินค้า");
w("commonly used","ใช้บ่อย");
w("companionship; fellowship","มิตรภาพ");
w("compassion; kindness","ความเมตตา");
w("complement particle (particle)","คำช่วยเสริม");
w("completion particle (particle)","คำช่วยแสดงการเสร็จสิ้น");
w("content; substance","เนื้อหา; สาระ");
w("continuously; unceasingly","ต่อเนื่อง");
w("conveniently; in passing","สะดวก; แวะผ่าน");
w("courtesy; politeness","มารยาท; ความสุภาพ");
w("crossing; intersection","ทางข้าม; ทางแยก");
w("crossroads; intersection","สี่แยก");
w("customer; client","ลูกค้า");
w("date","วันที่; นัด");
w("day-to-day; daily","ประจำวัน");
w("department; branch","แผนก; สาขา");
w("destination (location)","ปลายทาง");
w("dialogue; conversation","บทสนทนา");
w("diary","ไดอารี่");
w("dining hall; cafeteria","โรงอาหาร");
w("diverse; diversity","หลากหลาย");
w("doctorate; PhD","ปริญญาเอก");
w("document; certificate","เอกสาร; ใบรับรอง");
w("document; file","เอกสาร; ไฟล์");
w("don't","อย่า");
w("doorway; entrance","ทางเข้า");
w("e-book","อีบุ๊ค");
w("electric vehicle; electric bike or scooter","รถไฟฟ้า");
w("electricity; electric","ไฟฟ้า");
w("elevator","ลิฟต์");
w("embassy","สถานทูต");
w("enthusiastic; passion","กระตือรือร้น");
w("entrance; to import","ทางเข้า; นำเข้า");
w("environmental protection; environmentally friendly","รักษาสิ่งแวดล้อม");
w("environs; surroundings","บริเวณรอบๆ");
w("even if; even though (conjunction)","แม้ว่า (คำสันธาน)");
w("exactly; precisely","อย่างแม่นยำ; ตรง");
w("experienced-action particle (particle)","คำช่วยแสดงประสบการณ์");
w("extremely","อย่างยิ่ง");
w("factory","โรงงาน");
w("fan (ball sports)","แฟนกีฬา");
w("female","ผู้หญิง");
w("festival; m.w. for sections","เทศกาล; ตอน (ลน.)");
w("final; ultimate","สุดท้าย");
w("first; prior","ก่อนอื่น; แรก");
w("fluent","คล่อง");
w("friendly feelings; friendship","มิตรภาพ");
w("friendly; amicable","เป็นมิตร");
w("from childhood","ตั้งแต่เด็ก");
w("from within; therefrom","จากภายใน");
w("furniture","เฟอร์นิเจอร์");
w("garbage; trash","ขยะ");
w("gender; sex","เพศ");
w("giant panda","แพนด้ายักษ์");
w("goods; merchandise","สินค้า");
w("graduate","บัณฑิต");
w("graduation; to graduate","สำเร็จการศึกษา");
w("gram; to overcome; to restrain","กรัม; เอาชนะ");
w("grammar","ไวยากรณ์");
w("grand contest","การแข่งขันใหญ่");
w("grandma","ยาย; ย่า");
w("grandpa","ตา; ปู่");
w("greater than; to exceed","มากกว่า; เกิน");
w("guarantee; to ensure","รับประกัน");
w("gym; gymnasium","โรงยิม");
w("gym; stadium","สนามกีฬา");
w("hall; lounge","ห้องโถง");
w("harm; troubles","ความเสียหาย; ปัญหา");
w("headphones","หูฟัง");
w("height","ความสูง");
w("height; stature","ความสูง; รูปร่าง");
w("hereafter; henceforth","ต่อจากนี้");
w("high-speed rail","รถไฟความเร็วสูง");
w("holiday; festival","วันหยุด; เทศกาล");
w("how; how about","อย่างไร; เป็นไงบ้าง");
w("however; yet (conjunction)","อย่างไรก็ตาม (คำสันธาน)");
w("hungry; to starve","หิว");
w("hurriedly; without delay","รีบ; อย่างเร่งรีบ");
w("ice","น้ำแข็ง");
w("if (conjunction)","ถ้า (คำสันธาน)");
w("if (particle)","ถ้า (คำช่วย)");
w("if; is or isn't","หรือไม่; หรือเปล่า");
w("immediate; straightforward","โดยตรง; ทันที");
w("in advance; to shift to an earlier date","ล่วงหน้า");
w("in total; altogether","ทั้งหมด");
w("included among these; in","ในจำนวนนี้");
w("indeed; really","จริงๆ");
w("instant noodles","บะหมี่กึ่งสำเร็จรูป");
w("instructor; sports coach","ผู้สอน; โค้ช");
w("intense; severe","รุนแรง");
w("interest; hobby","ความสนใจ; งานอดิเรก");
w("interested","สนใจ");
w("interim; midterm","ระหว่างกาล; กลางภาค");
w("interview; to be interviewed (as a candidate)","สัมภาษณ์");
w("joke; jest","ตลก; มุก");
w("kilogram","กิโลกรัม");
w("kilometer","กิโลเมตร");
w("knapsack; rucksack","เป้สะพายหลัง");
w("lack; shortage of","ขาด; ขาดแคลน");
w("landlord","เจ้าของบ้าน");
w("landscape; scenery","ทิวทัศน์");
w("lawn; meadow","สนามหญ้า");
w("lawyer","ทนายความ");
w("leather shoes","รองเท้าหนัง");
w("luggage","กระเป๋าเดินทาง");
w("luncheon","อาหารกลางวัน");
w("m.w. for actions","ครั้ง (ลน.)");
w("m.w. for animals","ตัว (ลน.)");
w("m.w. for layers","ชั้น (ลน.)");
w("m.w. for letters","ฉบับ (ลน.)");
w("m.w. for people (polite)","ท่าน (ลน.)");
w("m.w. for rooms","ห้อง (ลน.)");
w("m.w. for sections","ตอน (ลน.)");
w("m.w. for sentences","ประโยค (ลน.)");
w("m.w. for types","ชนิด (ลน.)");
w("m.w. for vehicles","คัน (ลน.)");
w("majority; most","ส่วนใหญ่");
w("man; gentleman","ผู้ชาย; สุภาพบุรุษ");
w("manager; director","ผู้จัดการ");
w("mao (currency unit)","เหมา (สกุลเงิน)");
w("married couple","คู่สามีภรรยา");
w("master; qualified worker","ผู้เชี่ยวชาญ");
w("material; data; documents","ข้อมูล; เอกสาร");
w("material; resources","ทรัพยากร");
w("matter; affair","เรื่อง; กิจการ");
w("merit; benefit","คุณความดี; ประโยชน์");
w("mooncake (esp. for the Mid-Autumn Festival)","ขนมไหว้พระจันทร์");
w("more; even more","มากกว่า; ยิ่ง");
w("moreover; in addition (conjunction)","ยิ่งกว่านั้น (คำสันธาน)");
w("most; -est","ที่สุด");
w("movement; motion","การเคลื่อนไหว");
w("musical instrument, especially a stringed or keyboard instrument","เครื่องดนตรี");
w("must; to have to","ต้อง");
w("nationality","สัญชาติ");
w("nearby","ใกล้เคียง");
w("neighbor","เพื่อนบ้าน");
w("no matter what or how; regardless of whether... (conjunction)","ไม่ว่า (คำสันธาน)");
w("noon; midday","เที่ยง");
w("not equal to; inferior to","ไม่เท่ากับ; ด้อยกว่า");
w("not to have; there is not; did not","ไม่มี");
w("notebook","สมุดบันทึก");
w("notes; note-taking","บันทึก");
w("novel; fiction","นวนิยาย");
w("numeral; digital","ตัวเลข; ดิจิทัล");
w("nurse","พยาบาล");
w("occupation; professional","อาชีพ");
w("offline; in person","ออฟไลน์");
w("old person; the elderly","ผู้สูงอายุ");
w("old; former","เก่า; อดีต");
w("old; venerable","เก่าแก่; น่าเคารพ");
w("oneself","ตัวเอง");
w("ongoing-state particle (particle)","คำช่วยแสดงการดำเนินอยู่");
w("online","ออนไลน์");
w("or; possibly (conjunction)","หรือ; อาจจะ (คำสันธาน)");
w("or; still","หรือ; ยัง");
w("originally; at first","เดิมที");
w("originally; formerly","เดิม; แต่ก่อน");
w("otherwise; if not (conjunction)","ไม่เช่นนั้น (คำสันธาน)");
w("ought to; should","ควร");
w("outskirts; suburbs","ชานเมือง");
w("overcast; cloudy","มืดครึ้ม");
w("overcoat; cloak","เสื้อคลุม");
w("page","หน้า");
w("painful; sore","เจ็บ; ปวด");
w("painful; sore; severely","เจ็บ; ปวด; อย่างรุนแรง");
w("painter","จิตรกร");
w("party; gathering","ปาร์ตี้; งานสังสรรค์");
w("passport","หนังสือเดินทาง");
w("performance; to perform","การแสดง; แสดง");
w("person in charge","ผู้รับผิดชอบ");
w("perspiration; sweat","เหงื่อ");
w("pharmacy","ร้านขายยา");
w("photograph; picture","รูปถ่าย");
w("piano","เปียโน");
w("picture; photograph","รูปภาพ; รูปถ่าย");
w("plastics","พลาสติก");
w("playground; sports field","สนามเด็กเล่น; สนามกีฬา");
w("police officer","ตำรวจ");
w("president; headmaster","ประธานาธิบดี; ผู้อำนวยการ");
w("pressure","ความกดดัน");
w("printer","เครื่องพิมพ์");
w("prize; award","รางวัล");
w("proactive; energetic","กระตือรือร้น");
w("proof; certificate","หลักฐาน; ใบรับรอง");
w("pungent; to sting","ฉุน; แสบ");
w("qualified; eligible","มีคุณสมบัติ");
w("quite a while","นานทีเดียว");
w("quite; very","ค่อนข้าง; มาก");
w("raincoat","เสื้อกันฝน");
w("raw; uncooked; unfamiliar; unripe","ดิบ; ไม่คุ้นเคย");
w("reader","ผู้อ่าน");
w("refrigerator","ตู้เย็น");
w("regardless of; no matter (conjunction)","ไม่ว่า (คำสันธาน)");
w("reporter; journalist","นักข่าว");
w("resentful; discontented","ไม่พอใจ");
w("residential community","หมู่บ้านจัดสรร");
w("responsibility; blame","ความรับผิดชอบ");
w("restroom; washroom","ห้องน้ำ");
w("roadside","ข้างถนน");
w("romantic","โรแมนติก");
w("scenic area","สถานที่ท่องเที่ยว");
w("schedule; timetable","ตารางเวลา");
w("scholarship","ทุนการศึกษา");
w("schoolbag","กระเป๋านักเรียน");
w("seat","ที่นั่ง");
w("self-confidence; to have confidence in oneself","ความมั่นใจ");
w("shopping","ช้อปปิ้ง");
w("shorts","กางเกงขาสั้น");
w("should; ought to","ควร");
w("signal","สัญญาณ");
w("since; as (conjunction)","เนื่องจาก (คำสันธาน)");
w("singer","นักร้อง");
w("sisters; siblings","พี่น้อง");
w("skillful; clever; coincidental","ชำนาญ; เก่ง; บังเอิญ");
w("slightly; somewhat","เล็กน้อย");
w("smoke; mist","ควัน; หมอก");
w("so; therefore (conjunction)","ดังนั้น (คำสันธาน)");
w("soccer","ฟุตบอล");
w("socks; stockings","ถุงเท้า");
w("southeast","ตะวันออกเฉียงใต้");
w("southwest","ตะวันตกเฉียงใต้");
w("specialist; specialized","ผู้เชี่ยวชาญ");
w("specialty; specialized field","ความเชี่ยวชาญ; สาขาเฉพาะ");
w("spectacles; eyeglasses","แว่นตา");
w("spectators; audience","ผู้ชม");
w("speed; rate","ความเร็ว");
w("sports competition","แข่งขันกีฬา");
w("stadium; court","สนามกีฬา");
w("staff; crew","พนักงาน");
w("stair; staircase","บันได");
w("steamed roll; steamed bun","หมั่นโถว; ซาลาเปา");
w("still; yet","ยัง");
w("stupid; foolish","โง่");
w("sudden; unexpected","กะทันหัน");
w("suitable; fitting","เหมาะสม");
w("sung performance; to sing for an audience","การร้องเพลง");
w("sunshine; upbeat","แสงแดด; สดใส");
w("synopsis; (technical) manual","บทสรุป; คู่มือ");
w("temporary; provisional","ชั่วคราว");
w("tennis","เทนนิส");
w("term; expression","คำศัพท์; สำนวน");
w("term; semester","เทอม; ภาคเรียน");
w("text","ข้อความ");
w("textbook","หนังสือเรียน");
w("the male sex; a male","เพศชาย");
w("theater","โรงละคร");
w("thirsty","กระหายน้ำ");
w("thus; consequently (conjunction)","ดังนั้น (คำสันธาน)");
w("times; -fold (used for multiplication)","เท่า");
w("to accelerate; to speed up","เร่ง");
w("to accompany; to assist","ไปด้วย; ช่วย");
w("to accumulate; accumulation","สะสม");
w("to adapt; to fit","ปรับตัว");
w("to apologize","ขอโทษ");
w("to attract; to appeal to","ดึงดูด");
w("to bathe; to shower","อาบน้ำ");
w("to be a guest","เป็นแขก");
w("to be at; at or in; in progress","อยู่ที่; กำลัง");
w("to be capable of; can","สามารถ");
w("to be hospitalized","เข้าโรงพยาบาล");
w("to be lower than","ต่ำกว่า");
w("to be used for; used to","ใช้สำหรับ; เคย");
w("to be worried; to be distressed","กังวล");
w("to bloom","บาน");
w("to blow; to blast","เป่า; ระเบิด");
w("to blow; to scrape","พัด; ขูด");
w("to breathe in; to absorb; to suck","หายใจเข้า; ดูดซึม");
w("to brush; to swipe","แปรง; ปัด");
w("to cancel; cancellation","ยกเลิก");
w("to celebrate","ฉลอง");
w("to celebrate a holiday","ฉลองวันหยุด");
w("to charge a fee","คิดค่าธรรมเนียม");
w("to chat","คุย");
w("to check tickets","ตรวจตั๋ว");
w("to communicate; to exchange; communication","สื่อสาร");
w("to compete; competition","แข่งขัน");
w("to congratulate; congratulations","แสดงความยินดี");
w("to congregate; to assemble","รวมตัว");
w("to cough","ไอ");
w("to crawl; to climb","คลาน; ปีน");
w("to criticize; criticism","วิจารณ์");
w("to cultivate; to raise","เลี้ยง; ปลูก");
w("to dance","เต้นรำ");
w("to dare; daring","กล้า");
w("to defeat; to overpower","เอาชนะ");
w("to dislike; to loathe","ไม่ชอบ; รังเกียจ");
w("to disturb; to bother","รบกวน");
w("to draw; to paint; picture","วาด; ระบายสี; รูปภาพ");
w("to encourage","ให้กำลังใจ");
w("to estimate; to reckon","ประมาณ");
w("to examine; to inspect","ตรวจสอบ");
w("to excuse; to forgive","ยกโทษ; ให้อภัย");
w("to fit; to suit","เหมาะ; พอดี");
w("to flow; to disseminate","ไหล; เผยแพร่");
w("to grieve; to be broken-hearted","เสียใจ");
w("to handle; to transact","จัดการ; ดำเนินการ");
w("to have a fever","มีไข้");
w("to have a holiday","หยุด; มีวันหยุด");
w("to have no; without; not","ไม่มี");
w("to have to; to be forced to","ต้อง; จำเป็นต้อง");
w("to hire; to rent out","จ้าง; ให้เช่า");
w("to hit; to do","ตี; ทำ");
w("to hit; to strike","ตี; ชน");
w("to investigate; survey; investigation","สำรวจ; สอบสวน");
w("to judge; to determine","ตัดสิน");
w("to jump; to hop","กระโดด");
w("to kick","เตะ");
w("to lessen; to decrease","ลดลง");
w("to lighten; to ease","ทำให้เบาลง; ผ่อนคลาย");
w("to line up","เข้าแถว");
w("to lower; to decrease","ลด; ต่ำลง");
w("to miss","คิดถึง; พลาด");
w("to nod","พยักหน้า");
w("to notify; to inform","แจ้ง; บอก");
w("to offer; to supply","เสนอ; จัดหา");
w("to overtake; to hurry","แซง; เร่ง");
w("to pass by or through","ผ่าน");
w("to perform; performance","แสดง; การแสดง");
w("to perform; performance; behavior","แสดง; การแสดง; พฤติกรรม");
w("to persist; to stick to","ยืนหยัด; ยึดมั่น");
w("to photocopy; to duplicate a document","ถ่ายเอกสาร");
w("to pollute; contamination","ทำให้เป็นมลพิษ");
w("to pour; inverted; upside down","เท; กลับหัว");
w("to print","พิมพ์");
w("to reach; to achieve","บรรลุ; ถึง");
w("to recall; memories","ระลึกถึง; ความทรงจำ");
w("to record; to memorize","บันทึก; ท่องจำ");
w("to recount; to re-evaluate","เล่า; ทบทวน");
w("to reduce; to lower","ลด");
w("to reinforce; to strengthen","เสริมกำลัง");
w("to renounce; to abandon","ละทิ้ง");
w("to rent","เช่า");
w("to request; requirement","ขอ; ความต้องการ");
w("to review; revision","ทบทวน");
w("to rise","ขึ้น; ลุก");
w("to roast; to bake","ย่าง; อบ");
w("to rub; to scratch","ถู; เกา");
w("to scan a code; scan a QR code","สแกนคิวอาร์โค้ด");
w("to sense; perception","รู้สึก; การรับรู้");
w("to serve as; to act as; when; at","เป็น; เมื่อ");
w("to solve; to resolve","แก้ไข");
w("to stipulate; to specify","กำหนด");
w("to sum up; to conclude","สรุป");
w("to surpass; to exceed","เกิน");
w("to suspect that; to have doubts","สงสัยว่า");
w("to suspend; time-out","พัก; หยุดชั่วคราว");
w("to sustain injuries; wounded","บาดเจ็บ");
w("to sweep","กวาด");
w("to tidy up; to pack","เก็บ; จัด");
w("to transmit; to dispatch","ส่ง");
w("to use in; to use on","ใช้ใน");
w("to waste; to squander","สิ้นเปลือง");
w("to write an essay; composition (student essay)","เขียนเรียงความ");
w("toilet; lavatory","ห้องน้ำ");
w("tomato","มะเขือเทศ");
w("too; very","เกินไป; มาก");
w("toothbrush","แปรงสีฟัน");
w("toothpaste","ยาสีฟัน");
w("topic particle (particle)","คำช่วยแสดงหัวข้อ");
w("tourist attraction; scenic spot","สถานที่ท่องเที่ยว");
w("toward; to","ไปทาง; สู่");
w("toward; to (preposition)","ไปทาง; สู่ (คำบุพบท)");
w("towel","ผ้าเช็ดตัว");
w("trait; feature","ลักษณะ");
w("traveler; tourist","นักท่องเที่ยว");
w("troublesome; inconvenience","ลำบาก; ยุ่งยาก");
w("tuition fee","ค่าเทอม");
w("unforgettable","ไม่มีวันลืม");
w("universal; general","ทั่วไป; สากล");
w("urban district; downtown","เขตเมือง");
w("urgent; pressing","ด่วน");
w("vacation","วันหยุด");
w("vehicle speed","ความเร็วรถ");
w("video","วิดีโอ");
w("visa; to issue a visa","วีซ่า");
w("visitor; guest","แขก; ผู้เยี่ยมชม");
w("volleyball","วอลเลย์บอล");
w("watermelon","แตงโม");
w("web page","หน้าเว็บ");
w("weekday","วันธรรมดา");
w("weekend","สุดสัปดาห์");
w("what a pity; unfortunately","น่าเสียดาย");
w("what to do","ทำอย่างไร");
w("whatever; no matter what (conjunction)","อะไรก็ตาม (คำสันธาน)");
w("whatever; whatsoever","อะไรก็ตาม");
w("which ones","อันไหน");
w("will; shall","จะ");
w("within; among","ใน; ท่ามกลาง");
w("within; less than","ภายใน; น้อยกว่า");
w("woman","ผู้หญิง");
w("woman; the female sex","ผู้หญิง; เพศหญิง");
w("woods; grove","ป่า; ดง");
w("worker","คนงาน");
w("worried; anxious","กังวล");
w("wristwatch","นาฬิกาข้อมือ");
w("years old","ปี");
w("yogurt","โยเกิร์ต");
w("yuan","หยวน");
w("zero","ศูนย์");
w("zoo","สวนสัตว์");
w("°C (degrees Celsius)","องศาเซลเซียส");
w("to persist; to stick to; to insist on","ยืนหยัด; ยึดมั่น");
w("concert","คอนเสิร์ต");
w("siblings","พี่น้อง");
w("interjectory particle (particle)","คำอุทาน");
w("exclamatory particle (particle)","คำอุทาน");
w("dormitory","หอพัก");
w("northeast","ตะวันออกเฉียงเหนือ");
w("northwest","ตะวันตกเฉียงเหนือ");
w("Hong Kong","ฮ่องกง");
w("Taiwan","ไต้หวัน");
w("Macau","มาเก๊า");
w("Japan","ญี่ปุ่น");
w("Korea","เกาหลี");
w("Thailand","ประเทศไทย");
w("America; USA","อเมริกา; สหรัฐฯ");
w("England; UK","อังกฤษ; สหราชอาณาจักร");
w("France","ฝรั่งเศส");
w("Germany","เยอรมนี");
w("Russia","รัสเซีย");
w("Australia","ออสเตรเลีย");
w("Europe","ยุโรป");
w("Africa","แอฟริกา");
w("to click","คลิก");
w("to download","ดาวน์โหลด");
w("to upload","อัปโหลด");
w("app","แอป");
w("software","ซอฟต์แวร์");
w("hardware","ฮาร์ดแวร์");
w("data","ข้อมูล");
w("to log in","เข้าสู่ระบบ");
w("to register","ลงทะเบียน");
w("account; username","บัญชี; ชื่อผู้ใช้");
w("password","รหัสผ่าน");
w("to search; lookup","ค้นหา");
w("sentence","ประโยค");
w("grammar (variant)","ไวยากรณ์");
w("tonal mark","เครื่องหมายวรรณยุกต์");
w("stroke; brushstroke","ขีด; ลายเส้น");

// ── Final fix: stripped-type entries ──
w("about; regarding","เกี่ยวกับ");
w("according to; in accordance with","ตาม");
w("adverbial particle","คำช่วยกริยาวิเศษณ์");
w("along with; following","พร้อมกับ; ตาม");
w("because of; for","เพราะ; เนื่องจาก");
w("besides; in addition","นอกจากนี้");
w("by; passive marker","โดย; ถูก");
w("complement particle","คำช่วยเสริม");
w("completion particle","คำช่วยแสดงการเสร็จสิ้น");
w("even if; even though","แม้ว่า");
w("experienced-action particle","คำช่วยแสดงประสบการณ์");
w("however; yet","อย่างไรก็ตาม");
w("if","ถ้า");
w("moreover; in addition","ยิ่งกว่านั้น");
w("no matter what or how; regardless of whether","ไม่ว่า");
w("ongoing-state particle","คำช่วยแสดงการดำเนินอยู่");
w("or; possibly","หรือ; อาจจะ");
w("otherwise; if not","ไม่เช่นนั้น");
w("regardless of; no matter","ไม่ว่า");
w("since; as","เนื่องจาก");
w("so; therefore","ดังนั้น");
w("thus; consequently","ดังนั้น");
w("topic particle","คำช่วยแสดงหัวข้อ");
w("whatever; no matter what","อะไรก็ตาม");

w("if; is or isn't","หรือไม่; หรือเปล่า");
w("if; is or isn&#x27;t","หรือไม่; หรือเปล่า");

w("no matter what or how; regardless of whether...","ไม่ว่า");
w("no matter what or how; regardless of whether","ไม่ว่า");
w("no matter what or how; regardless of whether... (conjunction)","ไม่ว่า");
function translateWord(word) {
  const w = word.toLowerCase().trim();
  // Skip empty or function words
  if (!w || w === "a" || w === "an" || w === "the" || w === "is" || w === "are" ||
      w === "was" || w === "were" || w === "be" || w === "been" || w === "being" ||
      w === "to" || w === "of" || w === "for" || w === "in" || w === "on" ||
      w === "at" || w === "by" || w === "with" || w === "from" ||
      w === "or" || w === "it" || w === "its" || w === "that" || w === "this" ||
      w === "these" || w === "those" || w === "as" || w === "so" ||
      w === "has" || w === "have" || w === "had" || w === "do" || w === "does" || w === "did" ||
      w === "will" || w === "would" || w === "can" || w === "could" ||
      w === "may" || w === "might" || w === "shall" || w === "should" ||
      w === "must" || w === "used" || w === "etc" || w === "etc." ||
      w === "also" || w === "still" || w === "just" || w === "only" || w === "even" ||
      w === "than" || w === "then" || w === "if" || w === "when" || w === "while" ||
      w === "but" || w === "however" || w === "therefore" || w === "thus" ||
      w === "yet" || w === "already" || w === "not" || w === "no" || w === "yes" ||
      w === "commonly" || w === "often" || w === "usually" || w === "sometimes" ||
      w === "more" || w === "most" || w === "less" || w === "least" ||
      w === "very" || w === "really" || w === "quite" || w === "too" ||
      w === "especially" || w === "particularly" || w === "exactly" ||
      w === "already" || w === "yet" || w === "still" || w === "already" ||
      w === "there" || w === "here" || w === "where" ||
      w === "what" || w === "which" || w === "who" || w === "whom" ||
      w === "how" || w === "why" || w === "when" || w === "where" ||
      w === "about" || w === "regarding" || w === "concerning" ||
      w === "according" || w === "during" || w === "between" ||
      w === "among" || w === "within" || w === "without" || w === "through" ||
      w === "around" || w === "across" || w === "along" ||
      w === "toward" || w === "towards" || w === "onto" || w === "into" ||
      w === "first" || w === "second" || w === "third" || w === "last" ||
      w === "next" || w === "previous" || w === "following" ||
      w === "old" || w === "new" || w === "big" || w === "small" ||
      w === "good" || w === "bad" || w === "great" || w === "nice" ||
      w === "particle" || w === "(particle)" || w === "(conjunction)" ||
      w === "(preposition)" || w === "(suffix)" || w === "(prefix)" ||
      w === "(interjection)" || w === "(m.w.)" || w === "(numeral)" ||
      w === "meaning" || w === "sense" || w === "form") {
    return "";
  }
  if (W[w]) return W[w];
  // Remove trailing punctuation
  const clean = w.replace(/[.,;:!?()]+$/, '').trim();
  if (clean !== w && W[clean]) return W[clean];
  // Remove 's
  const noS = w.replace(/'s$/, '').trim();
  if (noS !== w && W[noS]) return W[noS];
  // Remove -ing, -ed, -ly suffixes
  if (w.endsWith('ing') && W[w.slice(0, -3)]) return W[w.slice(0, -3)];
  if (w.endsWith('ed') && W[w.slice(0, -2)]) return W[w.slice(0, -2)];
  if (w.endsWith('ly') && W[w.slice(0, -2)]) return W[w.slice(0, -2)];
  // Try removing 's'
  if (w.endsWith("'s") && W[w.slice(0, -2)]) return W[w.slice(0, -2)];
  return "";
}

function translateMeaning(meaning) {
  const original = meaning;
  let m = meaning.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Remove parenthetical type annotations: "... (particle)" → "..."
  m = m.replace(/\s*\((?:particle|conjunction|preposition|suffix|prefix|interjection|numeral|m\.w\.|measure word)\)\s*/gi, ' ');
  m = m.trim();
  
  // Direct lookup (can't hurt)
  if (W[m]) return W[m];
  
  // Split on semicolons to get meaning parts
  const parts = m.split(/\s*;\s*/);
  const results = [];
  
  for (const part of parts) {
    // Split into individual words and translate each significant one
    const words = part.split(/[\s,]+/).filter(w => w.length > 0);
    const translated = words.map(w => translateWord(w)).filter(t => t.length > 0);
    if (translated.length > 0) {
      results.push(translated.join(''));
    }
  }
  
  if (results.length > 0) {
    // Deduplicate consecutive identical results
    const unique = [...new Set(results)];
    return unique.join('; ');
  }
  
  return '';
}

// ── Process ──────────────────────────────────────────────────────
import { resolve as pathResolve } from 'node:path';

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let updated = 0, failed = 0;
  
  const result = content.replace(
    /"meaning":"([^"]*)","meaningThai":"([^"]*)","category":"hsk"/g,
    (match, meaning, existingThai) => {
      if (existingThai && existingThai.trim()) return match;
      const thai = translateMeaning(meaning);
      if (thai) { updated++; return `"meaning":"${meaning}","meaningThai":"${thai}","category":"hsk"`; }
      failed++; return match;
    }
  );
  
  console.log(`  Updated: ${updated}, Unmatched: ${failed}`);
  writeFileSync(filePath, result, 'utf-8');
  return { updated, failed };
}

// ── Main ─────────────────────────────────────────────────────────
const args = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 4);
const levels = args.length ? args.sort((a, b) => a - b) : [1, 2, 3, 4];
let totalUpdated = 0, totalFailed = 0;

for (const level of levels) {
  const fp = pathResolve(DATA_DIR, `hsk${level}-words.js`);
  console.log(`HSK ${level}:`);
  const { updated, failed } = processFile(fp);
  totalUpdated += updated; totalFailed += failed;
}

console.log(`\n✅ Total updated: ${totalUpdated}, Still unmatched: ${totalFailed}`);
