// Multi-turn dialogue content for the Conversations page.
// Each entry shares the same CATEGORIES + subcategory shape as vocabulary
// so filters and color theming cross-reference cleanly between pages.

export const CONVERSATIONS = [
  // ────────────────────────────────────────────────────────────────────
  // DAILY / FOOD — Ordering coffee
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-daily-001',
    title: 'Ordering coffee',
    titleThai: 'สั่งกาแฟ',
    category: 'daily',
    subcategory: 'food',
    hskLevel: 2,
    setting: 'At a coffee shop, afternoon',
    settingThai: 'ที่ร้านกาแฟ ตอนบ่าย',
    lines: [
      { role: 'A', chinese: '你好，我想要一杯美式咖啡。', pinyin: 'Nǐ hǎo, wǒ xiǎng yào yī bēi měi shì kā fēi.', meaning: 'Hello, I would like an Americano.', meaningThai: 'สวัสดีค่ะ ขออเมริกาโน่หนึ่งแก้ว' },
      { role: 'B', chinese: '好的，要加冰吗？', pinyin: 'Hǎo de, yào jiā bīng ma?', meaning: 'Alright, would you like ice?', meaningThai: 'ได้ค่ะ ต้องการเพิ่มน้ำแข็งไหม' },
      { role: 'A', chinese: '请加冰，谢谢。', pinyin: 'Qǐng jiā bīng, xiè xie.', meaning: 'Please add ice, thank you.', meaningThai: 'เพิ่มน้ำแข็งด้วยนะคะ ขอบคุณ' },
      { role: 'B', chinese: '大杯还是小杯？', pinyin: 'Dà bēi hái shì xiǎo bēi?', meaning: 'Large or small?', meaningThai: 'แก้วใหญ่หรือแก้วเล็กคะ' },
      { role: 'A', chinese: '大杯。一共多少钱？', pinyin: 'Dà bēi. Yī gòng duō shao qián?', meaning: 'Large. How much in total?', meaningThai: 'แก้วใหญ่ค่ะ รวมเท่าไหร่คะ' },
      { role: 'B', chinese: '二十五块。谢谢光临！', pinyin: 'Èr shí wǔ kuài. Xiè xie guāng lín!', meaning: 'Twenty-five yuan. Thanks for coming!', meaningThai: 'ยี่สิบห้าบาทค่ะ ขอบคุณที่มาใช้บริการ' },
    ],
    culturalNote: {
      en: 'In China, "美式" (měi shì = Americano) is one of the most common coffee orders. Baristas will often ask about size and temperature before anything else — these two questions ("大杯还是小杯?" and "要加冰吗?") are predictable first questions in any Chinese coffee shop.',
      th: 'ในจีน "美式" (อเมริกาโน่) เป็นเมนูที่สั่งบ่อยที่สุด บาริสต้ามักถามเรื่องขนาดแก้วและอุณหภูมิก่อนเสมอ ("ขนาดใหญ่หรือเล็ก?" และ "เพิ่มน้ำแข็งไหม?")',
    },
    tags: ['beginner', 'food', 'transaction'],
  },

  // ────────────────────────────────────────────────────────────────────
  // DAILY / SHOPPING — Buying clothes
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-daily-002',
    title: 'Buying clothes',
    titleThai: 'ซื้อเสื้อผ้า',
    category: 'daily',
    subcategory: 'shopping',
    hskLevel: 2,
    setting: 'In a clothing store',
    settingThai: 'ในร้านเสื้อผ้า',
    lines: [
      { role: 'A', chinese: '这件衣服有别的颜色吗？', pinyin: 'Zhè jiàn yī fu yǒu bié de yán sè ma?', meaning: 'Does this shirt come in other colors?', meaningThai: 'เสื้อตัวนี้มีสีอื่นไหมคะ' },
      { role: 'B', chinese: '有的。还有白色和蓝色。', pinyin: 'Yǒu de. Hái yǒu bái sè hé lán sè.', meaning: 'Yes, we have it in white and blue.', meaningThai: 'มีค่ะ มีสีขาวกับสีน้ำเงิน' },
      { role: 'A', chinese: '我可以试穿一下吗？', pinyin: 'Wǒ kě yǐ shì chuān yī xià ma?', meaning: 'May I try it on?', meaningThai: 'ลองใส่ได้ไหมคะ' },
      { role: 'B', chinese: '当然，试衣间在那边。', pinyin: 'Dāng rán, shì yī jiān zài nà biān.', meaning: 'Of course, the fitting room is over there.', meaningThai: 'ได้เลยค่ะ ห้องลองเสื้ออยู่ตรงนั้น' },
      { role: 'A', chinese: '蓝色的多少钱？', pinyin: 'Lán sè de duō shao qián?', meaning: 'How much is the blue one?', meaningThai: 'สีน้ำเงินราคาเท่าไหร่คะ' },
      { role: 'B', chinese: '一百二十块，标签上有写。', pinyin: 'Yī bǎi èr shí kuài, biāo qiān shàng yǒu xiě.', meaning: 'One hundred twenty yuan, it is written on the tag.', meaningThai: 'หนึ่งร้อยยี่สิบบาทค่ะ เขียนไว้บนป้ายแล้ว' },
    ],
    culturalNote: {
      en: 'In Chinese clothing stores, haggling is uncommon in malls but very common in street markets. Tailoring (改衣服 gǎi yī fu) is also popular — small alterations done in 10-30 minutes.',
      th: 'ในจีน การต่อราคาไม่ค่อยทำในห้างสรรพสินค้า แต่พบบ่อยในตลาด. บริการแก้เสื้อผ้า (改衣服) ก็นิยม ใช้เวลา 10-30 นาที',
    },
    tags: ['beginner', 'shopping', 'clothing'],
  },

  // ────────────────────────────────────────────────────────────────────
  // DAILY / TRAVEL — Asking for directions
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-daily-003',
    title: 'Asking for directions',
    titleThai: 'ถามทาง',
    category: 'daily',
    subcategory: 'travel',
    hskLevel: 3,
    setting: 'On a city street',
    settingThai: 'บนถนนในเมือง',
    lines: [
      { role: 'A', chinese: '请问，地铁站怎么走？', pinyin: 'Qǐng wèn, dì tiě zhàn zěn me zǒu?', meaning: 'Excuse me, how do I get to the subway station?', meaningThai: 'ขอถามหน่อยครับ ไปสถานีรถไฟใต้ดินยังไงครับ' },
      { role: 'B', chinese: '往前走两百米，在十字路口左转。', pinyin: 'Wǎng qián zǒu liǎng bǎi mǐ, zài shí zì lù kǒu zuǒ zhuǎn.', meaning: 'Walk straight for two hundred meters, then turn left at the intersection.', meaningThai: 'เดินตรงไปสองร้อยเมตร แล้วเลี้ยวซ้ายที่สี่แยกครับ' },
      { role: 'A', chinese: '要走多久？', pinyin: 'Yào zǒu duō jiǔ?', meaning: 'How long does it take to walk?', meaningThai: 'ต้องเดินนานไหมครับ' },
      { role: 'B', chinese: '大概五分钟。很近。', pinyin: 'Dà gài wǔ fēn zhōng. Hěn jìn.', meaning: 'About five minutes. It is very close.', meaningThai: 'ประมาณห้านาทีครับ ใกล้มาก' },
      { role: 'A', chinese: '谢谢你！', pinyin: 'Xiè xie nǐ!', meaning: 'Thank you!', meaningThai: 'ขอบคุณครับ!' },
    ],
    culturalNote: {
      en: '大城市 usually have signposted street numbers (东 E, 西 W, 南 S, 北 N). Asking "请问…" (qǐng wèn) is the polite way to start any question with a stranger. Mobile Maps (高德 gāo dé / 百度 bǎi dù) are also widely used.',
      th: 'เมืองใหญ่มักมีป้ายบอกทิศ (东 E, 西 W, 南 S, 北 N). การขึ้นต้นคำถามด้วย "请问…" คือมารยาท. แอปแผนที่ (高德 / 百度) ก็ใช้กันแพร่หลาย',
    },
    tags: ['intermediate', 'travel', 'directions'],
  },

  // ────────────────────────────────────────────────────────────────────
  // DAILY / GREETINGS — Meeting a new coworker
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-daily-004',
    title: 'Meeting a new coworker',
    titleThai: 'พบเพื่อนร่วมงานใหม่',
    category: 'daily',
    subcategory: 'greetings',
    hskLevel: 1,
    setting: 'First day at the office',
    settingThai: 'วันแรกที่ทำงาน',
    lines: [
      { role: 'A', chinese: '你好，我是新来的同事。', pinyin: 'Nǐ hǎo, wǒ shì xīn lái de tóng shì.', meaning: 'Hello, I am a new colleague.', meaningThai: 'สวัสดีครับ ผมเพิ่งมาใหม่' },
      { role: 'B', chinese: '你好，欢迎！请坐。', pinyin: 'Nǐ hǎo, huān yíng! Qǐng zuò.', meaning: 'Hello, welcome! Please sit down.', meaningThai: 'สวัสดีค่ะ ยินดีต้อนรับ! เชิญนั่ง' },
      { role: 'A', chinese: '我叫王明。你叫什么名字？', pinyin: 'Wǒ jiào Wáng Míng. Nǐ jiào shén me míng zì?', meaning: 'My name is Wang Ming. What is your name?', meaningThai: 'ผมชื่อหวังหมิง คุณชื่ออะไรครับ' },
      { role: 'B', chinese: '我叫李红。我是市场部的。', pinyin: 'Wǒ jiào Lǐ Hóng. Wǒ shì shì chǎng bù de.', meaning: 'I am Li Hong. I work in the marketing department.', meaningThai: 'หลี่หงค่ะ ทำงานแผนกการตลาด' },
      { role: 'A', chinese: '很高兴认识你！', pinyin: 'Hěn gāo xìng rèn shi nǐ!', meaning: 'Nice to meet you!', meaningThai: 'ยินดีที่ได้รู้จักครับ!' },
    ],
    culturalNote: {
      en: 'In Chinese workplaces, hierarchy is important. Address seniors by title (王经理 Wáng jīng lǐ = Manager Wang) rather than first name. Handshakes are common, but bowing is also acceptable.',
      th: 'ในที่ทำงานจีน ลำดับชั้นสำคัญ ควรเรียกรุ่นพี่ด้วยตำแหน่ง (王经理 = ผู้จัดการหวัง) แทนชื่อจริง การจับมือพบบ่อย แต่การโค้งคำนับก็ยอมรับได้',
    },
    tags: ['beginner', 'greetings', 'workplace'],
  },

  // ────────────────────────────────────────────────────────────────────
  // TOPICS / WEATHER — Discussing weather
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-topics-001',
    title: 'Discussing the weather',
    titleThai: 'คุยเรื่องสภาพอากาศ',
    category: 'topics',
    subcategory: 'weather',
    hskLevel: 2,
    setting: 'Two colleagues chatting in the morning',
    settingThai: 'เพื่อนร่วมงานคุยกันตอนเช้า',
    lines: [
      { role: 'A', chinese: '今天天气真不错！', pinyin: 'Jīn tiān tiān qì zhēn bú cuò!', meaning: 'The weather today is really nice!', meaningThai: 'วันนี้อากาศดีจังเลย!' },
      { role: 'B', chinese: '是啊，阳光很好。', pinyin: 'Shì a, yáng guāng hěn hǎo.', meaning: 'Yeah, the sunshine is lovely.', meaningThai: 'ใช่ พระอาทิตย์สดใสมาก' },
      { role: 'A', chinese: '明天要下雨，你带伞了吗？', pinyin: 'Míng tiān yào xià yǔ, nǐ dài sǎn le ma?', meaning: 'It will rain tomorrow, did you bring an umbrella?', meaningThai: 'พรุ่งนี้ฝนจะตก เอาร่มมาด้วยหรือเปล่า' },
      { role: 'B', chinese: '还没。下午我回家拿。', pinyin: 'Hái méi. Xià wǔ wǒ huí jiā ná.', meaning: 'Not yet. I will go home this afternoon to get one.', meaningThai: 'ยัง บ่ายนี้จะกลับบ้านเอา' },
      { role: 'A', chinese: '周末你想去哪儿玩？', pinyin: 'Zhōu mò nǐ xiǎng qù nǎr wán?', meaning: 'Where do you want to go on the weekend?', meaningThai: 'วันหยุดสุดสัปดาห์อยากไปไหนเล่น' },
      { role: 'B', chinese: '我想去公园走走。', pinyin: 'Wǒ xiǎng qù gōng yuán zǒu zou.', meaning: 'I want to go for a walk in the park.', meaningThai: 'อยากไปเดินเล่นที่สวนสาธารณะ' },
    ],
    culturalNote: {
      en: 'Weather conversations (今天天气怎么样?) are a common, easy way to start small-talk with Chinese coworkers or shopkeepers — similar to talking about the weather in English-speaking cultures.',
      th: 'การคุยเรื่องอากาศ (今天天气怎么样?) เป็นวิธีที่ง่ายและเป็นทางการในการเริ่มสนทนากับเพื่อนร่วมงานหรือเจ้าของร้านในจีน',
    },
    tags: ['beginner', 'weather', 'small-talk'],
  },

  // ────────────────────────────────────────────────────────────────────
  // TECHNOLOGY / COMPUTERS — Reporting a bug to IT
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-tech-001',
    title: 'Reporting a bug to IT',
    titleThai: 'แจ้งปัญหากับ IT',
    category: 'technology',
    subcategory: 'computers',
    hskLevel: 4,
    setting: 'Calling company IT helpdesk',
    settingThai: 'โทรหา IT helpdesk ของบริษัท',
    lines: [
      { role: 'A', chinese: '你好，我的电脑打不开软件。', pinyin: 'Nǐ hǎo, wǒ de diàn nǎo dǎ bù kāi ruǎn jiàn.', meaning: 'Hello, my computer cannot open the software.', meaningThai: 'สวัสดีครับ คอมของผมเปิดซอฟต์แวร์ไม่ได้' },
      { role: 'B', chinese: '请问是什么软件？', pinyin: 'Qǐng wèn shì shén me ruǎn jiàn?', meaning: 'May I ask which software?', meaningThai: 'ขอถามหน่อยว่าเป็นซอฟต์แวร์อะไรครับ' },
      { role: 'A', chinese: '是公司的项目管理软件。', pinyin: 'Shì gōng sī de xiàng mù guǎn lǐ ruǎn jiàn.', meaning: 'It is the company project management software.', meaningThai: 'เป็นซอฟต์แวร์จัดการโครงการของบริษัทครับ' },
      { role: 'B', chinese: '好的，请描述一下错误信息。', pinyin: 'Hǎo de, qǐng miáo shù yī xià cuò wù xìn xī.', meaning: 'OK, please describe the error message.', meaningThai: 'ได้ครับ กรุณาอธิบายข้อความแสดงข้อผิดพลาด' },
      { role: 'A', chinese: '屏幕上显示"无法连接服务器"。', pinyin: 'Yíng mù shàng xiǎn shì "wú fǎ lián jiē fú wù qì".', meaning: 'The screen shows "unable to connect to server".', meaningThai: 'บนหน้าจอขึ้นว่า "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์"' },
      { role: 'B', chinese: '请稍等，我先远程查看一下。', pinyin: 'Qǐng shāo děng, wǒ xiān yuǎn chéng chá kàn yī xià.', meaning: 'Please wait a moment, I will check remotely first.', meaningThai: 'รอสักครู่ครับ ผมจะตรวจดูระยะไกลก่อน' },
    ],
    culturalNote: {
      en: 'Tech vocabulary in Chinese has many English loanwords: 软件 (ruǎn jiàn = software), 电脑 (diàn nǎo = computer), 硬件 (yìng jiàn = hardware), 服务器 (fú wù qì = server), 远程 (yuǎn chéng = remote). Talking to IT in China sounds very similar to English IT-speak.',
      th: 'ศัพท์เทคในจีนยืมคำอังกฤษหลายคำ: 软件 (software), 电脑 (computer), 硬件 (hardware), 服务器 (server), 远程 (remote). การคุยกับ IT จีนฟังคล้าย IT-speak อังกฤษ',
    },
    tags: ['intermediate', 'tech', 'workplace'],
  },

  // ────────────────────────────────────────────────────────────────────
  // BUSINESS / WORK — Job interview intro
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-business-001',
    title: 'Job interview introduction',
    titleThai: 'แนะนำตัวในการสัมภาษณ์งาน',
    category: 'business',
    subcategory: 'work',
    hskLevel: 4,
    setting: 'Office interview room',
    settingThai: 'ห้องสัมภาษณ์ในออฟฟิศ',
    lines: [
      { role: 'B', chinese: '请先自我介绍一下。', pinyin: 'Qǐng xiān zì wǒ jiè shào yī xià.', meaning: 'Please introduce yourself first.', meaningThai: 'ขอแนะนำตัวเองก่อนครับ' },
      { role: 'A', chinese: '您好，我叫张伟，今年二十八岁。', pinyin: 'Nín hǎo, wǒ jiào Zhāng Wěi, jīn nián èr shí bā suì.', meaning: 'Hello, my name is Zhang Wei, I am twenty-eight years old.', meaningThai: 'สวัสดีครับ ผมชื่อจางเหวย อายุ 28 ปี' },
      { role: 'A', chinese: '我毕业于北京大学，主修市场营销。', pinyin: 'Wǒ bì yè yú Běi jīng Dà xué, zhǔ xiū shì chǎng yíng xiāo.', meaning: 'I graduated from Peking University, majoring in marketing.', meaningThai: 'จบจากมหาวิทยาลัยปักกิ่ง เอกการตลาด' },
      { role: 'B', chinese: '你有几年的工作经验？', pinyin: 'Nǐ yǒu jǐ nián de gōng zuò jīng yàn?', meaning: 'How many years of work experience do you have?', meaningThai: 'คุณมีประสบการณ์ทำงานกี่ปีครับ' },
      { role: 'A', chinese: '我有五年的市场推广经验。', pinyin: 'Wǒ yǒu wǔ nián de shì chǎng tuī guǎng jīng yàn.', meaning: 'I have five years of marketing experience.', meaningThai: 'มีประสบการณ์ทำการตลาด 5 ปีครับ' },
      { role: 'B', chinese: '好的，谢谢你。今天就到这里。', pinyin: 'Hǎo de, xiè xie nǐ. Jīn tiān jiù dào zhè lǐ.', meaning: 'OK, thank you. That is all for today.', meaningThai: 'ได้ครับ ขอบคุณ วันนี้ถึงตรงนี้ก่อน' },
    ],
    culturalNote: {
      en: 'Chinese job interviews typically begin with a self-introduction (自我介绍 zì wǒ jiè shào). Mentioning your university, major, and years of experience upfront is essential. Address interviewers with 您 (nín, formal "you") instead of 你 (nǐ) to show respect.',
      th: 'การสัมภาษณ์งานจีนมักเริ่มด้วยการแนะนำตัว (自我介绍). การบอกมหาวิทยาลัย สาขา และประสบการณ์ทำงานตั้งแต่ต้นเป็นสิ่งสำคัญ. ควรใช้ 您 (nín สุภาพ) แทน 你 (nǐ) กับผู้สัมภาษณ์',
    },
    tags: ['intermediate', 'work', 'formal'],
  },

  // ────────────────────────────────────────────────────────────────────
  // HEALTH / ILLNESS — At the doctor's office
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'cnv-health-001',
    title: 'At the doctor\'s office',
    titleThai: 'ที่คลินิกหมอ',
    category: 'health',
    subcategory: 'illness',
    hskLevel: 3,
    setting: 'Visiting a doctor for symptoms',
    settingThai: 'ไปหาหมอเรื่องอาการป่วย',
    lines: [
      { role: 'B', chinese: '你哪里不舒服？', pinyin: 'Nǐ nǎ lǐ bù shū fu?', meaning: 'Where do you feel uncomfortable?', meaningThai: 'คุณไม่สบายตรงไหนครับ' },
      { role: 'A', chinese: '我咳嗽已经三天了。', pinyin: 'Wǒ ké sòu yǐ jīng sān tiān le.', meaning: 'I have been coughing for three days already.', meaningThai: 'ผมไอมาสามวันแล้วครับ' },
      { role: 'B', chinese: '发烧吗？有没有流鼻涕？', pinyin: 'Fā shāo ma? Yǒu méi yǒu liú bí tì?', meaning: 'Do you have a fever? Any runny nose?', meaningThai: 'มีไข้ไหม? น้ำมูกไหลไหม?' },
      { role: 'A', chinese: '有点发烧，但是不流鼻涕。', pinyin: 'Yǒu diǎn fā shāo, dàn shì bù liú bí tì.', meaning: 'A little fever, but no runny nose.', meaningThai: 'มีไข้นิดหน่อย แต่ไม่มีน้ำมูก' },
      { role: 'B', chinese: '我给你开一些药，多喝水，好好休息。', pinyin: 'Wǒ gěi nǐ kāi yī xiē yào, duō hē shuǐ, hǎo hǎo xiū xi.', meaning: 'I will prescribe some medicine, drink more water, and rest well.', meaningThai: 'ผมจะจ่ายยาให้ ดื่มน้ำเยอะๆ แล้วก็พักผ่อนให้เพียงพอ' },
      { role: 'A', chinese: '谢谢你，医生！', pinyin: 'Xiè xie nǐ, yī shēng!', meaning: 'Thank you, doctor!', meaningThai: 'ขอบคุณครับ คุณหมอ!' },
    ],
    culturalNote: {
      en: 'In China, going to a hospital typically means first visiting a community clinic (社区诊所) or pharmacy (药店) for minor issues, or registering at a hospital counter (挂号 guà hào) for more serious cases. Prescriptions are often handwritten, and Chinese herbal medicine (中药 zhōng yào) is a common alternative.',
      th: 'ในจีน การไปโรงพยาบาลเล็กน้อยมักไปคลินิกชุมชน (社区诊所) หรือร้านขายยา. กรณีรุนแรงจะลงทะเบียนที่เคาน์เตอร์โรงพยาบาล (挂号). แพทย์แผนจีน (中药) เป็นทางเลือกที่พบบ่อย',
    },
    tags: ['intermediate', 'health', 'medical'],
  },
];

export const CONVERSATION_CATEGORIES = [
  { id: 'hsk', color: 'hsk' },         // shared with VOCABULARY category
  { id: 'daily', color: 'daily' },
  { id: 'topics', color: 'topics' },
  { id: 'health', color: 'health' },
  { id: 'education', color: 'education' },
  { id: 'technology', color: 'technology' },
  { id: 'business', color: 'business' },
  { id: 'nature', color: 'nature' },
];

export function getConversationById(id) {
  return CONVERSATIONS.find(c => c.id === id);
}
