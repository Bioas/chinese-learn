// Lightweight category metadata — ~2 kB, no word data.
// Import this instead of vocabulary.js when you only need category/icons, not the 3000+ word array.

export const CATEGORIES = [
  {
    id: 'hsk',
    name: 'HSK',
    nameThai: 'HSK',
    icon: 'library',
    subcategories: [
      { id: 'hsk1', name: 'HSK 1', nameThai: 'HSK 1', icon: 'circle' },
      { id: 'hsk2', name: 'HSK 2', nameThai: 'HSK 2', icon: 'circle' },
      { id: 'hsk3', name: 'HSK 3', nameThai: 'HSK 3', icon: 'circle' },
      { id: 'hsk4', name: 'HSK 4', nameThai: 'HSK 4', icon: 'circle' },
      { id: 'hsk5', name: 'HSK 5', nameThai: 'HSK 5', icon: 'circle' },
      { id: 'hsk6', name: 'HSK 6', nameThai: 'HSK 6', icon: 'circle' },
    ]
  },
  {
    id: 'daily',
    name: 'Daily Life',
    nameThai: 'ชีวิตประจำวัน',
    icon: 'cloud',
    subcategories: [
      { id: 'greetings', name: 'Greetings', nameThai: 'การทักทาย', icon: 'wave' },
      { id: 'food', name: 'Food & Drink', nameThai: 'อาหารและเครื่องดื่ม', icon: 'food' },
      { id: 'shopping', name: 'Shopping', nameThai: 'ช้อปปิ้ง', icon: 'shopping' },
      { id: 'travel', name: 'Travel', nameThai: 'การเดินทาง', icon: 'travel' },
    ]
  },
  {
    id: 'topics',
    name: 'Topics',
    nameThai: 'หัวข้อ',
    icon: 'bookmark',
    subcategories: [
      { id: 'weather', name: 'Weather', nameThai: 'สภาพอากาศ', icon: 'cloud' },
      { id: 'time', name: 'Time & Date', nameThai: 'เวลาและวันที่', icon: 'time' },
      { id: 'family', name: 'Family', nameThai: 'ครอบครัว', icon: 'family' },
      { id: 'colors', name: 'Colors', nameThai: 'สี', icon: 'colors' },
      { id: 'numbers', name: 'Numbers', nameThai: 'ตัวเลข', icon: 'numbers' },
    ]
  },
  {
    id: 'health',
    name: 'Health',
    nameThai: 'สุขภาพ',
    icon: 'heart',
    subcategories: [
      { id: 'body', name: 'Body & Anatomy', nameThai: 'ร่างกายและอวัยวะ', icon: 'body' },
      { id: 'illness', name: 'Illness & Symptoms', nameThai: 'โรคและอาการ', icon: 'illness' },
      { id: 'exercise', name: 'Exercise & Fitness', nameThai: 'การออกกำลังกาย', icon: 'dumbbell' },
      { id: 'nutrition', name: 'Food & Nutrition', nameThai: 'อาหารและโภชนาการ', icon: 'food' },
    ]
  },
  {
    id: 'education',
    name: 'Education',
    nameThai: 'การศึกษา',
    icon: 'library',
    subcategories: [
      { id: 'school', name: 'School & Subjects', nameThai: 'โรงเรียนและวิชา', icon: 'school' },
      { id: 'study', name: 'Learning & Study', nameThai: 'การเรียนรู้', icon: 'study' },
      { id: 'exams', name: 'Exams & Grades', nameThai: 'การสอบและคะแนน', icon: 'exams' },
      { id: 'research', name: 'Research & Academia', nameThai: 'การวิจัยและวิชาการ', icon: 'research' },
    ]
  },
  {
    id: 'technology',
    name: 'Technology',
    nameThai: 'เทคโนโลยี',
    icon: 'cog',
    subcategories: [
      { id: 'computers', name: 'Computers & Internet', nameThai: 'คอมพิวเตอร์และอินเทอร์เน็ต', icon: 'computers' },
      { id: 'communication', name: 'Communication', nameThai: 'การสื่อสาร', icon: 'messageDetail' },
      { id: 'digital', name: 'Digital & Media', nameThai: 'ดิจิทัลและสื่อ', icon: 'digital' },
      { id: 'ai', name: 'AI & Data', nameThai: 'AI และข้อมูล', icon: 'ai' },
    ]
  },
  {
    id: 'business',
    name: 'Business',
    nameThai: 'ธุรกิจ',
    icon: 'barChart',
    subcategories: [
      { id: 'work', name: 'Work & Career', nameThai: 'การงานและอาชีพ', icon: 'work' },
      { id: 'finance', name: 'Finance & Economy', nameThai: 'การเงินและเศรษฐกิจ', icon: 'finance' },
      { id: 'office', name: 'Office & Company', nameThai: 'สำนักงานและบริษัท', icon: 'office' },
      { id: 'market', name: 'Marketing & Trade', nameThai: 'การตลาดและการค้า', icon: 'market' },
    ]
  },
  {
    id: 'nature',
    name: 'Nature',
    nameThai: 'ธรรมชาติ',
    icon: 'cloud',
    subcategories: [
      { id: 'animals', name: 'Animals', nameThai: 'สัตว์', icon: 'animals' },
      { id: 'plants', name: 'Plants & Nature', nameThai: 'พืชและธรรมชาติ', icon: 'plants' },
      { id: 'geography', name: 'Geography', nameThai: 'ภูมิศาสตร์', icon: 'geography' },
      { id: 'environment', name: 'Environment', nameThai: 'สิ่งแวดล้อม', icon: 'environment' },
    ]
  },
];

const SUBCATEGORY_ICONS = {
  hsk1: 'circle',
  hsk2: 'circle',
  hsk3: 'circle',
  hsk4: 'circle',
  hsk5: 'circle',
  hsk6: 'circle',
  greetings: 'wave',
  food: 'food',
  shopping: 'shopping',
  travel: 'travel',
  weather: 'cloud',
  time: 'time',
  family: 'family',
  colors: 'colors',
  numbers: 'numbers',
  body: 'body',
  illness: 'illness',
  exercise: 'dumbbell',
  nutrition: 'food',
  school: 'school',
  study: 'study',
  exams: 'exams',
  research: 'research',
  computers: 'computers',
  communication: 'messageDetail',
  digital: 'digital',
  ai: 'ai',
  work: 'work',
  finance: 'finance',
  office: 'office',
  market: 'market',
  animals: 'animals',
  plants: 'plants',
  geography: 'geography',
  environment: 'environment',
};

export function getSubcategoryIcon(subId) {
  return SUBCATEGORY_ICONS[subId] || 'circle';
}

// Total number of words in VOCABULARY (from vocabulary.js).
// Kept here as a lightweight constant so Dashboard can display the count
// without pulling in the 1.1 MB word array.
export const TOTAL_VOCAB_COUNT = 3018;
