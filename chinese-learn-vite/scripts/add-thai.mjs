// Bulk Thai translation for HSK word files.
// Builds a comprehensive English→Thai dictionary and applies it.
// Usage: node scripts/add-thai.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'src', 'data', 'hsk3');

// ── Comprehensive English → Thai ─────────────────────────────────
const DICT = {};

function add(k, v) { DICT[k.toLowerCase().trim()] = v; }

// ==================== HSK 1 ====================
add("to love; to like","รัก; ชอบ"); add("eight","แปด"); add("father; dad","พ่อ");
add("suggestion particle (particle)","นะ (คำเสริม)");
add("daytime","กลางวัน"); add("hundred","ร้อย"); add("half","ครึ่ง");
add("bao; steamed bun","ซาลาเปา"); add("cup; glass","แก้ว; ถ้วย");
add("m.w. for books","เล่ม (ลน.)"); add("side; edge; location/direction suffix","ด้าน; ข้าง");
add("illness; to become ill","ป่วย; โรค"); add("no; not","ไม่");
add("you're welcome","ไม่เป็นไร"); add("don't; must not","อย่า");
add("dish; vegetable","กับข้าว; ผัก"); add("tea","ชา");
add("to sing","ร้องเพลง"); add("supermarket","ซูเปอร์มาร์เก็ต");
add("car; vehicle","รถ"); add("to eat","กิน"); add("taxi","แท็กซี่");
add("to wear; to put on","สวมใส่"); add("to make a phone call","โทรศัพท์หา");
add("big; large","ใหญ่"); add("everyone","ทุกคน"); add("university","มหาวิทยาลัย");
add("university student","นักศึกษา"); add("to arrive; to reach","ถึง; มาถึง");
add("linking particle (particle)","ของ (คำเชื่อม)"); add("ordinal prefix","ที่ (ลำดับ)");
add("younger brother","น้องชาย"); add("o'clock; point","โมง; จุด");
add("shop; store","ร้านค้า"); add("telephone","โทรศัพท์"); add("computer","คอมพิวเตอร์");
add("television","โทรทัศน์"); add("movie; film","ภาพยนตร์"); add("cinema","โรงหนัง");
add("thing; stuff","สิ่งของ"); add("all; both","ทั้งหมด; ทั้งสอง");
add("to read","อ่าน"); add("to read; to study","อ่าน; เรียน");
add("correct; toward; regarding","ถูก; ต่อ; เกี่ยวกับ"); add("sorry; excuse me","ขอโทษ");
add("many; much; more","มาก; หลาย"); add("how many; how much","เท่าไหร่");
add("son","ลูกชาย"); add("two","สอง"); add("meal; cooked rice","ข้าว; อาหาร");
add("restaurant; hotel","ร้านอาหาร; โรงแรม"); add("room","ห้อง");
add("very; really","มาก; จริงๆ"); add("very; quite","มาก");
add("airplane","เครื่องบิน"); add("minute; point; part","นาที; คะแนน");
add("minute","นาที"); add("happy; glad","ดีใจ"); add("song","เพลง");
add("older brother","พี่ชาย"); add("general m.w.","อัน (ลน.)");
add("to give; to; for","ให้; เพื่อ"); add("company","บริษัท");
add("to work; job","ทำงาน; งาน"); add("dog","หมา");
add("expensive","แพง"); add("country","ประเทศ"); add("still; also","ยัง; ด้วย");
add("child","เด็ก"); add("chinese language","ภาษาจีน");
add("chinese character","ตัวอักษรจีน"); add("good; well","ดี");
add("tasty; delicious","อร่อย"); add("attractive; enjoyable to watch or read","น่าดู; น่าอ่าน");
add("pleasant to hear","น่าฟัง"); add("fun; interesting","สนุก");
add("number; day of the month","เลข; วันที่"); add("to drink","ดื่ม");
add("and; with","และ; กับ"); add("after; behind","หลัง; ข้างหลัง");
add("to return","กลับ"); add("can; to know how to","ได้; เป็น");
add("train","รถไฟ"); add("home; family","บ้าน; ครอบครัว");
add("to know; to be aware of","รู้"); add("few; how many","กี่");
add("to see; to look","ดู; เห็น"); add("friend","เพื่อน");
add("old; aged (of people)","แก่"); add("teacher","ครู");
add("cold","หนาว; เย็น"); add("inside; in","ใน; ข้างใน");
add("six","หก"); add("mom; mother","แม่"); add("to buy","ซื้อ");
add("cat","แมว"); add("slow; unhurried","ช้า"); add("busy","ยุ่ง");
add("don't have; there isn't","ไม่มี"); add("it's okay; never mind","ไม่เป็นไร");
add("younger sister","น้องสาว"); add("question particle","ไหม");
add("door; gate","ประตู"); add("bread","ขนมปัง"); add("name","ชื่อ");
add("tomorrow","พรุ่งนี้"); add("mother","แม่"); add("which; where","ไหน");
add("that","นั้น"); add("there; over there","ที่นั่น");
add("boy","เด็กผู้ชาย"); add("male","ผู้ชาย"); add("south","ใต้");
add("difficult; hard","ยาก"); add("you (singular)","คุณ");
add("year","ปี"); add("milk","นม"); add("girl","เด็กผู้หญิง");
add("female; woman","ผู้หญิง"); add("daughter","ลูกสาว");
add("pretty; beautiful","สวย"); add("apple","แอปเปิ้ล");
add("seven","เจ็ด"); add("money","เงิน"); add("front; forward","หน้า; ข้างหน้า");
add("please; to request","กรุณา; ขอ"); add("excuse me; may i ask","ขอถามหน่อย");
add("to go","ไป"); add("hot; heat","ร้อน"); add("person; people","คน");
add("to know (a person)","รู้จัก"); add("three","สาม");
add("to go to work","ไปทำงาน"); add("to go to class","เข้าเรียน");
add("what","อะไร"); add("ten","สิบ"); add("time; hour","เวลา; ชั่วโมง");
add("thing; matter","เรื่อง"); add("is; to be","เป็น; คือ");
add("book","หนังสือ"); add("water","น้ำ"); add("fruit","ผลไม้");
add("to sleep","นอน"); add("to say; to speak","พูด; ว่า");
add("four","สี่"); add("he; him","เขา"); add("she; her","เธอ");
add("it","มัน"); add("sun; day","วัน"); add("weather","อากาศ");
add("to hear; to listen","ฟัง"); add("classmate","เพื่อนร่วมชั้น");
add("outside; outer","ข้างนอก"); add("to play","เล่น");
add("evening; night","เย็น; กลางคืน"); add("i; me","ฉัน; ผม");
add("we","เรา"); add("five","ห้า"); add("afternoon","บ่าย");
add("to rain","ฝนตก"); add("want; to think","อยาก; คิด");
add("small; little","เล็ก"); add("hour","ชั่วโมง");
add("miss; young lady","นางสาว"); add("to write","เขียน");
add("thank you","ขอบคุณ"); add("new","ใหม่"); add("week","สัปดาห์");
add("star","ดาว"); add("sunday","วันอาทิตย์");
add("to study; to learn","เรียน"); add("student","นักเรียน");
add("school","โรงเรียน"); add("eye","ตา"); add("one","หนึ่ง");
add("a little; a bit","นิดหน่อย"); add("clothes","เสื้อผ้า");
add("doctor","หมอ"); add("hospital","โรงพยาบาล");
add("chair","เก้าอี้"); add("moon; month","ดวงจันทร์; เดือน");
add("at; in; to be (at a place)","อยู่; ที่");
add("goodbye; see you again","ลาก่อน"); add("this","นี้");
add("real; true","จริง"); add("currently; right now","ตอนนี้");
add("chinese; chinese language","จีน; ภาษาจีน"); add("table","โต๊ะ");
add("character; word","ตัวอักษร; คำ"); add("yesterday","เมื่อวาน");
add("to sit","นั่ง"); add("to make; to do","ทำ"); add("to cook","ทำอาหาร");
add("morning","เช้า"); add("to get up","ตื่นนอน");
add("to find; to look for","หา"); add("breakfast","อาหารเช้า");
add("snow","หิมะ"); add("to live; to reside","อยู่; อาศัย");

// ── Remaining HSK 1 gaps ──
add("how many; several","กี่; หลาย"); add("family; home","ครอบครัว; บ้าน");
add("family member","สมาชิกครอบครัว"); add("to see; to meet","เจอ; พบ");
add("m.w. for items","ชิ้น (ลน.)"); add("dumpling","เกี๊ยว");
add("to call; to be called","เรียก; ชื่อ"); add("older sister","พี่สาว");
add("this year","ปีนี้"); add("egg","ไข่");
add("to find; to look for (variant)","หา");
add("to open (a door); to turn on","เปิด");
add("hello; how are you","สวัสดี");
add("to look at; to watch","ดู");
add("your","ของคุณ");
add("boyfriend","แฟนหนุ่ม");
add("girlfriend","แฟนสาว");
add("color; look","สี");
add("happy; joyful","ดีใจ");
add("clean","สะอาด");
add("tall; high","สูง");
add("to tell","บอก");
add("long","ยาว");
add("often","บ่อย");
add("again; once more","อีกครั้ง");
add("but","แต่");
add("city","เมือง");
add("from","จาก");
add("wrong; mistake","ผิด");
add("to answer","ตอบ");
add("to wait","รอ");
add("to give","ให้");
add("black","ดำ");
add("white","ขาว");
add("red","แดง");
add("yellow","เหลือง");
add("blue","น้ำเงิน");
add("green","เขียว");
add("flower","ดอกไม้");
add("public","สาธารณะ");
add("to close; to shut","ปิด");
add("dry","แห้ง");
add("eye","ตา");
add("mouth","ปาก");
add("hand","มือ");
add("foot","เท้า");
add("ear","หู");
add("nose","จมูก");
add("head","หัว");
add("face","หน้า");
add("body","ร่างกาย");
add("fish","ปลา");
add("horse","ม้า");
add("bird","นก");
add("pig","หมู");
add("cow","วัว");
add("sheep","แกะ");
add("chicken","ไก่");
add("rice","ข้าว");
add("meat","เนื้อ");
add("vegetable","ผัก");
add("soup","ซุป");
add("noodles","บะหมี่");
add("sugar","น้ำตาล");
add("salt","เกลือ");
add("oil","น้ำมัน");
add("sour","เปรี้ยว");
add("sweet","หวาน");
add("bitter","ขม");
add("spicy; hot (taste)","เผ็ด");
add("to love","รัก");
add("to like","ชอบ");
add("to want","อยาก");
add("to need","ต้องการ");
add("to have","มี");
add("to be","เป็น");
add("to come","มา");
add("to walk","เดิน");
add("to run","วิ่ง");
add("to swim","ว่ายน้ำ");
add("to fly","บิน");
add("to stand","ยืน");
add("to sit","นั่ง");
add("to lie down","นอน");
add("to laugh","หัวเราะ");
add("to cry","ร้องไห้");
add("to smile","ยิ้ม");
add("right; correct","ถูกต้อง");
add("left","ซ้าย");
add("near; close","ใกล้");
add("far","ไกล");
add("fast; quick","เร็ว");
add("beautiful","สวย");
add("ugly","น่าเกลียด");
add("fat","อ้วน");
add("thin; skinny","ผอม");
add("strong; powerful","แข็งแรง");
add("weak","อ่อนแอ");
add("light (weight)","เบา");
add("heavy","หนัก");
add("wide","กว้าง");
add("narrow","แคบ");
add("deep","ลึก");
add("shallow","ตื้น");
add("soft","นุ่ม");
add("hard","แข็ง");
add("smooth","เรียบ");
add("rough","ขรุขระ");
add("thick","หนา");
add("thin (thickness)","บาง");
add("round","กลม");
add("square","สี่เหลี่ยม");
add("straight","ตรง");
add("curved; bent","โค้ง");
add("flat","แบน");
add("sharp","คม");
add("blunt; dull","ทื่อ");
add("wet","เปียก");
add("empty","ว่าง");
add("full","เต็ม");
add("fresh","สด");
add("rotten; spoiled","เน่า");
add("delicious","อร่อย");
add("terrible (taste)","แย่มาก");
add("quiet","เงียบ");
add("loud; noisy","ดัง");
add("dark","มืด");
add("bright","สว่าง");
add("rich","รวย");
add("poor","จน");
add("cheap","ถูก");
add("comfortable","สบาย");
add("important","สำคัญ");
add("dangerous","อันตราย");
add("safe","ปลอดภัย");
add("same","เหมือน");
add("different","ต่าง");
add("true","จริง");
add("false","เท็จ");
add("possible","เป็นไปได้");
add("impossible","เป็นไปไม่ได้");
add("necessary","จำเป็น");
add("special","พิเศษ");
add("normal","ปกติ");
add("strange","แปลก");
add("popular","เป็นที่นิยม");
add("famous","มีชื่อเสียง");
add("interesting","น่าสนใจ");
add("boring","น่าเบื่อ");
add("simple","ง่าย");
add("difficult","ยาก");
add("easy","ง่าย");
add("complex","ซับซ้อน");
add("free","ฟรี; ว่าง");
add("expensive (variant)","แพง");
add("main","หลัก");
add("basic","พื้นฐาน");
add("modern","ทันสมัย");
add("traditional","ดั้งเดิม");

// ==================== HSK 2 ====================
add("egg","ไข่"); add("newspaper","หนังสือพิมพ์"); add("class; lesson","บทเรียน");
add("north","เหนือ"); add("ticket","ตั๋ว"); add("field; place","สนาม");
add("city","เมือง"); add("to answer","ตอบ"); add("but","แต่");
add("to wait","รอ"); add("short (in length)","สั้น");
add("restaurant","ร้านอาหาร"); add("to let go; to put","วาง; ปล่อย");
add("house","บ้าน"); add("dry","แห้ง"); add("clean","สะอาด");
add("tall; high","สูง"); add("to tell","บอก"); add("to give","ให้");
add("to close; to shut","ปิด"); add("black","ดำ"); add("red","แดง");
add("flower","ดอกไม้"); add("bad; broken","เสีย; ไม่ดี");
add("yellow","เหลือง"); add("to meet; meeting","ประชุม; เจอ");
add("chicken egg","ไข่ไก่"); add("to remember","จำได้");
add("between; among","ระหว่าง"); add("to introduce","แนะนำ");
add("quiet; calm","เงียบ; สงบ"); add("coffee","กาแฟ");
add("to start; beginning","เริ่ม"); add("exam; test","สอบ");
add("possible; maybe","อาจจะ"); add("quick; fast","เร็ว");
add("blue","น้ำเงิน"); add("old (not new)","เก่า");
add("to leave; to separate from","จาก; ออกจาก");
add("road; path","ถนน; ทาง"); add("green","เขียว");
add("to sell","ขาย"); add("full; satisfied","เต็ม; อิ่ม");
add("door","ประตู"); add("every; each","ทุก; แต่ละ");
add("clear; bright","ชัด; สว่าง"); add("mountain; hill","ภูเขา");
add("up; on top","บน; ขึ้น"); add("few; less","น้อย");
add("time","เวลา"); add("hand","มือ"); add("husband","สามี");
add("number","ตัวเลข"); add("speak; to talk","พูด; คุย");
add("to give as a gift","ให้เป็นของขวัญ");
add("although","แม้ว่า"); add("topic; problem","หัวข้อ; ปัญหา");
add("west","ตะวันตก"); add("hope; wish","หวัง");
add("to wash","ล้าง"); add("some","บาง");
add("think; to miss","คิดถึง"); add("like; similar","เหมือน; ชอบ");
add("smile; laugh","ยิ้ม; หัวเราะ"); add("surname","นามสกุล");
add("need","ต้องการ"); add("medicine","ยา");
add("meaning; idea","ความหมาย"); add("because","เพราะว่า");
add("should; must","ควร"); add("swim","ว่ายน้ำ");
add("sports","กีฬา"); add("fish","ปลา"); add("far","ไกล");
add("moon","ดวงจันทร์"); add("cloud","เมฆ");
add("again","อีกครั้ง"); add("early; morning","เช้า");
add("stand","ยืน"); add("really; truly","จริงๆ");
add("find","หา; เจอ"); add("heavy; weight","หนัก");
add("paper","กระดาษ"); add("middle; center","กลาง");
add("important","สำคัญ"); add("to help","ช่วย");
add("to prepare","เตรียม"); add("dictionary","พจนานุกรม");
add("left","ซ้าย"); add("exercise","ออกกำลังกาย");
add("to get; to obtain","ได้รับ"); add("light; easy","เบา; ง่าย");
add("to use","ใช้"); add("meaning","ความหมาย");
add("beer","เบียร์"); add("to think; to believe","คิดว่า");
add("tired","เหนื่อย"); add("walk","เดิน");
add("travel","ท่องเที่ยว"); add("health","สุขภาพ");
add("strong; healthy","แข็งแรง");

// ==================== HSK 3+ ====================
add("to change","เปลี่ยน"); add("to become","กลายเป็น");
add("to compare","เปรียบเทียบ"); add("must; have to","ต้อง");
add("not only","ไม่เพียงแต่"); add("to join; to participate","เข้าร่วม");
add("grass","หญ้า"); add("layer; floor","ชั้น");
add("difference","ความแตกต่าง"); add("long (time)","นาน");
add("spring (season)","ฤดูใบไม้ผลิ"); add("word; phrase","คำ; วลี");
add("smart; clever","ฉลาด"); add("from...to...","จาก...ถึง...");
add("to bring","นำมา"); add("to represent","แทน");
add("to arrive late","มาสาย"); add("next to; beside","ข้างๆ");
add("especially","โดยเฉพาะ"); add("nature","ธรรมชาติ");
add("to understand","เข้าใจ"); add("hair","ผม; ขน");
add("to discover","ค้นพบ"); add("to translate","แปล");
add("convenient","สะดวก"); add("direction","ทิศทาง");
add("wind","ลม"); add("feeling","ความรู้สึก");
add("to serve","บริการ"); add("parents","พ่อแม่");
add("story","เรื่องราว"); add("worry","กังวล");
add("past; former","อดีต"); add("trip; journey","การเดินทาง");
add("to care about","สนใจ"); add("environment","สิ่งแวดล้อม");
add("marry","แต่งงาน"); add("holiday; vacation","วันหยุด");
add("to check; to examine","ตรวจสอบ"); add("simple","เรียบง่าย");
add("healthy","สุขภาพดี"); add("to talk; to chat","คุย; สนทนา");
add("key","กุญแจ"); add("to teach","สอน");
add("to try","ลอง"); add("solution; method","วิธีแก้");
add("nervous","ตื่นเต้น"); add("to decide","ตัดสินใจ");
add("to refuse","ปฏิเสธ"); add("air","อากาศ");
add("history","ประวัติศาสตร์"); add("another","อื่น");
add("dream","ความฝัน"); add("bus","รถเมล์");
add("to forget","ลืม"); add("danger","อันตราย");
add("taste","รสชาติ"); add("position","ตำแหน่ง");
add("culture","วัฒนธรรม"); add("literature","วรรณกรรม");
add("art","ศิลปะ"); add("music","ดนตรี");
add("language","ภาษา"); add("science","วิทยาศาสตร์");
add("math","คณิตศาสตร์"); add("society","สังคม");
add("world","โลก"); add("life","ชีวิต");
add("future","อนาคต"); add("government","รัฐบาล");
add("economy","เศรษฐกิจ"); add("education","การศึกษา");
add("technology","เทคโนโลยี"); add("information","ข้อมูล");
add("news","ข่าว"); add("internet","อินเทอร์เน็ต");
add("phone; mobile","มือถือ"); add("market","ตลาด");
add("bank","ธนาคาร"); add("price","ราคา");
add("free (no cost)","ฟรี"); add("comfortable","สบาย");
add("popular","เป็นที่นิยม"); add("famous","มีชื่อเสียง");
add("special","พิเศษ"); add("normal; ordinary","ปกติ; ธรรมดา");
add("terrible","แย่มาก"); add("wonderful","ยอดเยี่ยม");
add("excellent","ดีเยี่ยม"); add("perfect","สมบูรณ์แบบ");
add("necessary","จำเป็น"); add("possible","เป็นไปได้");
add("main","หลัก"); add("basic","พื้นฐาน");
add("modern","ทันสมัย"); add("traditional","ดั้งเดิม");
add("international","นานาชาติ"); add("national","แห่งชาติ");
add("local","ท้องถิ่น"); add("private","ส่วนตัว");
add("whole; entire","ทั้งหมด"); add("complete","สมบูรณ์");
add("enough","พอ"); add("only","เท่านั้น");
add("almost","เกือบ"); add("perhaps","บางที");
add("certainly","แน่นอน"); add("probably","น่าจะ");
add("suddenly","ทันใด"); add("immediately","ทันที");
add("gradually","ค่อยๆ"); add("finally","ในที่สุด");
add("usually","ปกติ"); add("always","เสมอ");
add("never","ไม่เคย"); add("sometimes","บางครั้ง");
add("often; frequently","บ่อยๆ"); add("already","แล้ว");
add("just now","เมื่อกี้"); add("soon","เร็วๆนี้");
add("later","ทีหลัง"); add("early","แต่แรก");
add("late","สาย"); add("now","ตอนนี้");
add("before","ก่อน"); add("then","แล้ว");
add("finally; at last","ในที่สุด");
add("continue","ต่อ"); add("stop","หยุด");
add("begin","เริ่ม"); add("finish","เสร็จ");
add("succeed","สำเร็จ"); add("fail","ล้มเหลว");
add("win","ชนะ"); add("lose","แพ้");
add("choose","เลือก"); add("accept","ยอมรับ");
add("agree","เห็นด้วย"); add("believe","เชื่อ");
add("doubt","สงสัย"); add("guess","เดา");
add("prove","พิสูจน์"); add("explain","อธิบาย");
add("express","แสดงออก"); add("describe","บรรยาย");
add("discuss","อภิปราย"); add("argue","โต้แย้ง");
add("promise","สัญญา"); add("suggest","แนะนำ");
add("warn","เตือน"); add("encourage","ให้กำลังใจ");
add("support","สนับสนุน"); add("protect","ปกป้อง");
add("save","ประหยัด; บันทึก"); add("waste","เสีย");
add("share","แบ่งปัน"); add("connect","เชื่อมต่อ");
add("separate","แยก"); add("mix","ผสม");
add("include","รวม"); add("contain","บรรจุ");
add("add","เพิ่ม"); add("reduce","ลด");
add("increase","เพิ่มขึ้น"); add("develop","พัฒนา");
add("improve","ปรับปรุง"); add("grow","เติบโต");
add("produce","ผลิต"); add("create","สร้าง");
add("destroy","ทำลาย"); add("build","สร้าง");
add("repair","ซ่อม"); add("break","แตก; หัก");
add("cut","ตัด"); add("push","ผลัก");
add("pull","ดึง"); add("throw","ขว้าง");
add("catch","จับ"); add("hit","ตี");
add("beat","ชนะ; ตี"); add("attack","โจมตี");
add("defend","ปกป้อง"); add("fight","ต่อสู้");
add("escape","หนี"); add("hide","ซ่อน");
add("search","ค้นหา"); add("collect","เก็บ");
add("organize","จัด"); add("manage","จัดการ");
add("control","ควบคุม"); add("lead","นำ");
add("follow","ตาม"); add("obey","เชื่อฟัง");
add("avoid","หลีกเลี่ยง"); add("face; confront","เผชิญหน้า");
add("solve","แก้ปัญหา"); add("deal with; handle","จัดการ");
add("depend on","ขึ้นอยู่กับ"); add("belong to","เป็นของ");
add("consist of","ประกอบด้วย"); add("refer to","หมายถึง");
add("relate to","เกี่ยวข้องกับ"); add("similar to","คล้ายกับ");
add("different from","แตกต่างจาก"); add("same as","เหมือนกับ");

// ── Smart fallback: break meaning into parts and translate each ──
function translateMeaning(meaning) {
  const key = meaning.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Direct match
  if (DICT[key]) return DICT[key];
  
  // Remove parenthetical parts
  const noParen = key.replace(/\s*\([^)]*\)/g, '').trim();
  if (noParen !== key && DICT[noParen]) return DICT[noParen];
  
  // Try semicolon-separated parts
  const parts = key.split(/\s*[;,]\s*/);
  const translatedParts = parts.map(p => {
    const clean = p.trim();
    if (DICT[clean]) return DICT[clean];
    // Remove parenthetical from individual part
    const cleanNoParen = clean.replace(/\s*\([^)]*\)/g, '').trim();
    if (DICT[cleanNoParen]) return DICT[cleanNoParen];
    return null;
  }).filter(Boolean);
  
  if (translatedParts.length > 0) {
    return [...new Set(translatedParts)].join('; ');
  }
  
  return '';
}

// ── Process files ────────────────────────────────────────────────
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  let content = readFileSync(filePath, 'utf-8');
  let updated = 0;
  let failed = 0;
  
  // Replace word-level meaningThai (before "category":"hsk")
  content = content.replace(
    /"meaning":"([^"]*)","meaningThai":"([^"]*)","category":"hsk"/g,
    (match, meaning, existingThai) => {
      if (existingThai && existingThai.trim()) {
        return match;
      }
      const thai = translateMeaning(meaning);
      if (thai) {
        updated++;
        return `"meaning":"${meaning}","meaningThai":"${thai}","category":"hsk"`;
      }
      failed++;
      return match;
    }
  );
  
  console.log(`  Updated: ${updated}, Unmatched: ${failed}`);
  writeFileSync(filePath, content, 'utf-8');
  return { updated, failed };
}

// ── Main ─────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 4);
  const levels = args.length ? args.sort((a, b) => a - b) : [1, 2, 3, 4];
  
  let totalUpdated = 0, totalFailed = 0;
  
  for (const level of levels) {
    const { updated, failed } = processFile(resolve(DATA_DIR, `hsk${level}-words.js`));
    totalUpdated += updated;
    totalFailed += failed;
  }
  
  console.log(`\n✅ Done! Updated: ${totalUpdated}, Still unmatched: ${totalFailed}`);
  if (totalFailed > 0) {
    console.log('   Run `node scripts/find-missing-thai.mjs` to list remaining gaps.');
  }
}

main();
