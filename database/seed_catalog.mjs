// Demo catalogue for the course sections: school (class 1–10), college (HSC),
// admission, university, upcoming batches and skills — each course with
// chapters (summary, outcomes, schedule), lessons, learning points and FAQs.
// Also links the existing demo courses to sections and adds blog articles.
// Idempotent (keyed by slug):  node --env-file=.env.local database/seed_catalog.mjs
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  socketPath: process.env.MYSQL_SOCKET || '/run/mysqld/mysqld.sock',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'e-learning',
  charset: 'utf8mb4_unicode_ci'
});
const q = async (sql, p = []) => (await db.query(sql, p))[0];

const SUBJECTS = [
  ['bangla', 'বাংলা', 'অ', 3], ['english', 'English', 'E', 4], ['math', 'গণিত', '∑', 5], ['higher-math', 'উচ্চতর গণিত', '∫', 6],
  ['science', 'বিজ্ঞান', '⚗', 7], ['chemistry', 'রসায়ন', '⚛', 8], ['biology', 'জীববিজ্ঞান', '🧬', 9], ['ict', 'আইসিটি', '⌘', 10],
  ['gk', 'সাধারণ জ্ঞান', '?', 11], ['accounting', 'হিসাববিজ্ঞান', '৳', 12]
];
for (const [slug, name, icon, pos] of SUBJECTS) {
  await q('INSERT INTO categories (name, slug, icon, position) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [name, slug, icon, pos]).catch(async () => {
    if (!(await q('SELECT id FROM categories WHERE slug = ?', [slug])).length) await q('INSERT INTO categories (name, slug, icon, position) VALUES (?,?,?,?)', [name, slug, icon, pos]);
  });
}
await q("INSERT IGNORE INTO class_levels (name, slug, position) VALUES ('বিশ্ববিদ্যালয়', 'university', 20), ('ভর্তি প্রস্তুতি', 'admission', 15)");

const classId = async (slug) => (slug ? (await q('SELECT id FROM class_levels WHERE slug = ?', [slug]))[0]?.id ?? null : null);
const ch = (title, summary, outcomes, when, lessons) => ({ title, summary, outcomes, when, lessons });
const L = (title, type = 'video', min = 12, free = 0) => ({ title, type, min, free });

const COURSES = [
  { slug: 'class-1-bangla', title: '১ম শ্রেণি বাংলা — অক্ষর থেকে গল্প', subject: 'bangla', cls: 'class-1', mode: 'recorded', price: 0, teacher: 1, sections: ['school'],
    tagline: 'ছবি, ছড়া আর খেলায় খেলায় বাংলা পড়তে ও লিখতে শেখা', duration: '৮ সপ্তাহ',
    points: ['স্বরবর্ণ ও ব্যঞ্জনবর্ণ চেনা ও লেখা', 'কার-চিহ্ন দিয়ে শব্দ গঠন', 'ছোট ছড়া ও গল্প পড়া', 'পরিষ্কার হাতের লেখা'],
    chapters: [
      ch('স্বরবর্ণ', 'অ থেকে ঔ — উচ্চারণ, লেখা ও ছবিসহ শব্দ', 'প্রতিটি স্বরবর্ণ দেখে চিনতে ও লিখতে পারবে\nস্বরবর্ণ দিয়ে শুরু হওয়া শব্দ বলতে পারবে', 'সপ্তাহ ১–২', [L('অ, আ, ই, ঈ', 'video', 10, 1), L('উ, ঊ, ঋ', 'video', 9), L('এ, ঐ, ও, ঔ', 'video', 11), L('স্বরবর্ণ অনুশীলনী', 'pdf', 5)]),
      ch('ব্যঞ্জনবর্ণ', 'ক থেকে ঁ — বর্ণ পরিচয় ও লেখার নিয়ম', 'ব্যঞ্জনবর্ণ সঠিক ক্রমে লিখতে পারবে\nএকই রকম দেখতে বর্ণের পার্থক্য বুঝবে', 'সপ্তাহ ৩–৫', [L('ক-বর্গ ও চ-বর্গ', 'video', 12), L('ট-বর্গ ও ত-বর্গ', 'video', 12), L('প-বর্গ ও বাকি বর্ণ', 'video', 13), L('বর্ণ চেনার কুইজ', 'quiz', 6)]),
      ch('কার-চিহ্ন ও শব্দ', 'আ-কার থেকে ঔ-কার — শব্দ গঠন', 'কার-চিহ্ন দিয়ে সহজ শব্দ পড়তে ও লিখতে পারবে', 'সপ্তাহ ৬–৭', [L('আ-কার, ই-কার, ঈ-কার', 'video', 11), L('উ-কার থেকে ঔ-কার', 'video', 12)]),
      ch('ছড়া ও গল্প', 'ছোট ছড়া আবৃত্তি ও গল্প পড়া', 'নিজে নিজে ছোট গল্প পড়তে পারবে', 'সপ্তাহ ৮', [L('আয় রে আয় টিয়ে', 'video', 8), L('মজার গল্প: খরগোশ ও কচ্ছপ', 'video', 10)])
    ] },
  { slug: 'class-1-math', title: '১ম শ্রেণি গণিত — সংখ্যা ও যোগ-বিয়োগ', subject: 'math', cls: 'class-1', mode: 'live', price: 500, teacher: 2, sections: ['school'],
    tagline: 'সপ্তাহে ২টি লাইভ ক্লাস — গুনে গুনে মজার গণিত', duration: '১০ সপ্তাহ · সপ্তাহে ২ দিন',
    points: ['১ থেকে ১০০ পর্যন্ত সংখ্যা', 'এক অঙ্কের যোগ ও বিয়োগ', 'আকার ও মাপ চেনা', 'সময় ও টাকা গোনা'],
    chapters: [
      ch('সংখ্যা চিনি', '১–১০০ গোনা, লেখা ও তুলনা', 'বড়-ছোট সংখ্যা তুলনা করতে পারবে', 'সপ্তাহ ১–৩ · শনি ও মঙ্গল সন্ধ্যা ৬টা', [L('১ থেকে ২০', 'video', 15, 1), L('২১ থেকে ১০০', 'video', 18), L('বড়-ছোট তুলনা', 'video', 14)]),
      ch('যোগ', 'হাতে-কলমে যোগ শেখা', 'এক অঙ্কের দুটি সংখ্যা যোগ করতে পারবে', 'সপ্তাহ ৪–৬', [L('যোগ মানে একসাথে', 'video', 15), L('যোগের খেলা', 'quiz', 8)]),
      ch('বিয়োগ', 'কমানো ও বাকি থাকা', 'এক অঙ্কের বিয়োগ করতে পারবে', 'সপ্তাহ ৭–৮', [L('বিয়োগ মানে নেওয়া', 'video', 15), L('বিয়োগ অনুশীলনী', 'pdf', 5)]),
      ch('আকার, সময় ও টাকা', 'বৃত্ত-ত্রিভুজ, ঘড়ি ও টাকা', 'ঘড়িতে ঘণ্টা বলতে ও টাকা গুনতে পারবে', 'সপ্তাহ ৯–১০', [L('আকার চিনি', 'video', 12), L('ঘড়ি ও টাকা', 'video', 14)])
    ] },
  { slug: 'class-5-english', title: 'Class 5 English — Grammar & Composition', subject: 'english', cls: 'class-5', mode: 'recorded', price: 700, teacher: 3, sections: ['school'],
    tagline: 'Parts of speech, tenses and paragraph writing for PEC-style exams', duration: '১২ সপ্তাহ',
    points: ['Parts of speech with examples', 'Present, past and future tense', 'Paragraph and letter writing', 'Reading comprehension'],
    chapters: [
      ch('Parts of Speech', 'Noun, pronoun, verb, adjective, adverb', 'Identify each part of speech in a sentence', 'Week 1–3', [L('Nouns and Pronouns', 'video', 14, 1), L('Verbs and Adjectives', 'video', 15), L('Quiz: parts of speech', 'quiz', 8)]),
      ch('Tenses', 'Simple, continuous and perfect forms', 'Write correct sentences in every simple tense', 'Week 4–7', [L('Present tense', 'video', 16), L('Past tense', 'video', 16), L('Future tense', 'video', 14)]),
      ch('Composition', 'Paragraphs, letters and stories', 'Write a 100-word paragraph and an informal letter', 'Week 8–12', [L('Paragraph writing', 'video', 18), L('Letter writing', 'video', 15), L('Model answers', 'pdf', 5)])
    ] },
  { slug: 'class-8-science', title: '৮ম শ্রেণি বিজ্ঞান — সম্পূর্ণ সিলেবাস', subject: 'science', cls: 'class-8', mode: 'hybrid', price: 1200, teacher: 1, sections: ['school'],
    tagline: 'লাইভ ক্লাস + রেকর্ডেড ভিডিও — প্রতিটি অধ্যায় শেষে পরীক্ষা', duration: '৬ মাস',
    points: ['প্রাণী ও উদ্ভিদের কোষ', 'বল, চাপ ও শক্তি', 'রাসায়নিক বিক্রিয়ার মূল ধারণা', 'অধ্যায়ভিত্তিক MCQ ও সৃজনশীল'],
    chapters: [
      ch('জীবন ও কোষ', 'কোষের গঠন ও কাজ', 'উদ্ভিদ ও প্রাণী কোষের পার্থক্য লিখতে পারবে', 'মাস ১', [L('কোষের গঠন', 'video', 20, 1), L('কোষ বিভাজন', 'video', 18)]),
      ch('বল ও চাপ', 'বল, ঘর্ষণ ও চাপের প্রয়োগ', 'চাপের অঙ্ক সমাধান করতে পারবে', 'মাস ২–৩', [L('বল ও এর প্রকার', 'video', 18), L('চাপের হিসাব', 'video', 20), L('অধ্যায় পরীক্ষা', 'quiz', 15)]),
      ch('রসায়নের ভূমিকা', 'পদার্থের অবস্থা ও বিক্রিয়া', 'ভৌত ও রাসায়নিক পরিবর্তন আলাদা করতে পারবে', 'মাস ৪–৬', [L('পদার্থের অবস্থা', 'video', 16), L('রাসায়নিক বিক্রিয়া', 'video', 19)])
    ] },
  { slug: 'hsc-higher-math', title: 'HSC উচ্চতর গণিত ১ম পত্র — লাইভ ব্যাচ', subject: 'higher-math', cls: 'hsc', mode: 'live', price: 2500, teacher: 2, sections: ['college'],
    tagline: 'ম্যাট্রিক্স থেকে ক্যালকুলাস — প্রতি সপ্তাহে ৩টি লাইভ ক্লাস', duration: '৬ মাস · সপ্তাহে ৩ দিন',
    points: ['ম্যাট্রিক্স ও নির্ণায়ক', 'সরলরেখা ও বৃত্ত', 'অন্তরীকরণ ও যোগজীকরণ', 'বোর্ড প্রশ্ন সমাধান'],
    chapters: [
      ch('ম্যাট্রিক্স ও নির্ণায়ক', 'ম্যাট্রিক্সের প্রকার, গুণ ও বিপরীত', 'নির্ণায়কের মান ও বিপরীত ম্যাট্রিক্স বের করতে পারবে', 'সপ্তাহ ১–৪ · রবি, মঙ্গল, বৃহস্পতি রাত ৮টা', [L('ম্যাট্রিক্সের ধারণা', 'video', 35, 1), L('নির্ণায়ক', 'video', 40), L('বিপরীত ম্যাট্রিক্স', 'video', 38), L('অধ্যায় পরীক্ষা', 'quiz', 20)]),
      ch('সরলরেখা', 'ঢাল, সমীকরণ ও দূরত্ব', 'দুটি রেখার ছেদবিন্দু ও কোণ বের করতে পারবে', 'সপ্তাহ ৫–৮', [L('রেখার ঢাল', 'video', 35), L('সরলরেখার সমীকরণ', 'video', 40)]),
      ch('বৃত্ত', 'বৃত্তের সমীকরণ ও স্পর্শক', 'স্পর্শকের সমীকরণ নির্ণয় করতে পারবে', 'সপ্তাহ ৯–১২', [L('বৃত্তের সমীকরণ', 'video', 38), L('স্পর্শক ও অভিলম্ব', 'video', 36)]),
      ch('অন্তরীকরণ', 'সীমা, অন্তরজ ও প্রয়োগ', 'গুরু-লঘু মান বের করতে পারবে', 'সপ্তাহ ১৩–২০', [L('সীমা', 'video', 40), L('অন্তরজের সূত্র', 'video', 42), L('গুরুমান ও লঘুমান', 'video', 40), L('বোর্ড প্রশ্ন সমাধান', 'pdf', 10)])
    ] },
  { slug: 'hsc-chemistry-1st', title: 'HSC রসায়ন ১ম পত্র — রেকর্ডেড কোর্স', subject: 'chemistry', cls: 'hsc', mode: 'recorded', price: 1800, teacher: 4, sections: ['college'],
    tagline: 'নিজের গতিতে — ১২০+ ভিডিও, নোট ও মডেল টেস্ট', duration: 'আজীবন অ্যাক্সেস',
    points: ['ল্যাবরেটরির নিরাপদ ব্যবহার', 'গুণগত রসায়ন', 'মৌলের পর্যায়বৃত্ত ধর্ম', 'রাসায়নিক পরিবর্তন'],
    chapters: [
      ch('গুণগত রসায়ন', 'পরমাণুর গঠন ও কোয়ান্টাম সংখ্যা', 'ইলেকট্রন বিন্যাস লিখতে পারবে', 'অধ্যায় ২', [L('পরমাণু মডেল', 'video', 25, 1), L('কোয়ান্টাম সংখ্যা', 'video', 28)]),
      ch('পর্যায় সারণি', 'পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন', 'আয়নিকরণ শক্তির ক্রম ব্যাখ্যা করতে পারবে', 'অধ্যায় ৩', [L('পর্যায়বৃত্ত ধর্ম', 'video', 30), L('রাসায়নিক বন্ধন', 'video', 32), L('মডেল টেস্ট', 'quiz', 25)])
    ] },
  { slug: 'du-ka-unit-admission', title: 'ঢাবি ক-ইউনিট ভর্তি প্রস্তুতি ২০২৭', subject: 'physics', cls: 'admission', mode: 'live', price: 4500, teacher: 1, sections: ['admission'],
    tagline: 'লাইভ ক্লাস, সাপ্তাহিক মডেল টেস্ট ও মেধাতালিকা', duration: '৪ মাস',
    points: ['পদার্থ, রসায়ন, গণিত, জীববিজ্ঞান', 'বিগত ১৫ বছরের প্রশ্ন সমাধান', 'সাপ্তাহিক মডেল টেস্ট', 'সময় ব্যবস্থাপনার কৌশল'],
    chapters: [
      ch('পদার্থবিজ্ঞান', 'ভেক্টর থেকে আধুনিক পদার্থবিজ্ঞান', 'ভর্তি পরীক্ষার MCQ দ্রুত সমাধান করতে পারবে', 'মাস ১', [L('ভেক্টর ও গতিবিদ্যা', 'video', 45, 1), L('তাপ ও শব্দ', 'video', 40)]),
      ch('রসায়ন', 'জৈব ও অজৈব রসায়ন', 'বিক্রিয়ার শর্টকাট মনে রাখতে পারবে', 'মাস ২', [L('জৈব রসায়ন', 'video', 45), L('মডেল টেস্ট ১', 'quiz', 60)]),
      ch('গণিত ও জীববিজ্ঞান', 'ক্যালকুলাস ও কোষবিদ্যা', 'দুই বিষয়ে ৮০% নম্বর তোলার কৌশল', 'মাস ৩–৪', [L('ক্যালকুলাস শর্টকাট', 'video', 45), L('কোষবিদ্যা', 'video', 40), L('ফাইনাল মডেল টেস্ট', 'quiz', 90)])
    ] },
  { slug: 'medical-admission-2027', title: 'মেডিকেল ভর্তি প্রস্তুতি ২০২৭ — নতুন ব্যাচ', subject: 'biology', cls: 'admission', mode: 'live', price: 6000, teacher: 4, sections: ['admission', 'upcoming'], upcoming: true, release: 45,
    tagline: 'নতুন ব্যাচ শীঘ্রই শুরু — আগেভাগে সিট নিশ্চিত করুন', duration: '৫ মাস',
    points: ['জীববিজ্ঞান ও রসায়নে গভীর প্রস্তুতি', 'দৈনিক MCQ', 'সাপ্তাহিক পূর্ণাঙ্গ পরীক্ষা'], chapters: [] },
  { slug: 'spoken-english-batch', title: 'স্পোকেন ইংলিশ — সন্ধ্যার লাইভ ব্যাচ', subject: 'english', cls: null, mode: 'live', price: 1500, teacher: 3, sections: ['upcoming', 'skills'], upcoming: true, release: 20,
    tagline: 'সপ্তাহে ৩ দিন — কথা বলার অভ্যাস, উচ্চারণ ও আত্মবিশ্বাস', duration: '৩ মাস',
    points: ['দৈনন্দিন কথোপকথন', 'উচ্চারণ ও শব্দভাণ্ডার', 'ইন্টারভিউ প্রস্তুতি'], chapters: [] },
  { slug: 'honours-accounting-basics', title: 'অনার্স হিসাববিজ্ঞান — মৌলিক ধারণা', subject: 'accounting', cls: 'university', mode: 'recorded', price: 1500, teacher: 2, sections: ['university'],
    tagline: 'জাতীয় বিশ্ববিদ্যালয়ের ১ম বর্ষের সিলেবাস অনুযায়ী', duration: '৩ মাস',
    points: ['হিসাব সমীকরণ', 'জাবেদা ও খতিয়ান', 'রেওয়ামিল ও আর্থিক বিবরণী'],
    chapters: [
      ch('হিসাবের ভিত্তি', 'হিসাব সমীকরণ ও লেনদেন', 'যেকোনো লেনদেনের প্রভাব বিশ্লেষণ করতে পারবে', 'মাস ১', [L('হিসাব সমীকরণ', 'video', 30, 1), L('লেনদেন বিশ্লেষণ', 'video', 32)]),
      ch('জাবেদা থেকে রেওয়ামিল', 'হিসাবচক্রের ধাপ', 'রেওয়ামিল প্রস্তুত করতে পারবে', 'মাস ২–৩', [L('জাবেদা', 'video', 30), L('খতিয়ান', 'video', 28), L('রেওয়ামিল', 'video', 30)])
    ] }
];

for (const c of COURSES) {
  const cid0 = (await q('SELECT id FROM courses WHERE slug = ?', [c.slug]))[0]?.id;
  const [teacher] = await q('SELECT id, name FROM teachers WHERE id = ?', [c.teacher]);
  const vals = {
    title: c.title, tagline: c.tagline, category: c.subject, class_id: await classId(c.cls), mode: c.mode, price: c.price, old_price: c.price ? Math.round(c.price * 1.4 / 100) * 100 : 0,
    instructor: teacher?.name || null, instructor_id: teacher?.id || null, language: c.slug.startsWith('class-5-english') ? 'English' : 'বাংলা', level: 'সকল শ্রেণি', duration: c.duration,
    description: `${c.tagline}\n\nএই কোর্সে প্রতিটি অধ্যায় ছোট ভিডিও, নোট ও অনুশীলনীতে ভাগ করা — যাতে নিজের গতিতে বা লাইভ ক্লাসে নিয়মিত এগোনো যায়।`,
    audience: 'যারা মূল ধারণা পরিষ্কার করে ভালো ফল করতে চায়',
    published: c.upcoming ? 0 : 1, is_upcoming: c.upcoming ? 1 : 0, review_status: c.upcoming ? 'draft' : 'published'
  };
  let cid = cid0;
  if (!cid) {
    const cols = Object.keys(vals);
    const r = await q(`INSERT INTO courses (slug, ${cols.join(', ')}, first_published_at, release_date) VALUES (?, ${cols.map(() => '?').join(', ')}, ${c.upcoming ? 'NULL' : 'NOW()'}, ${c.upcoming ? `CURDATE() + INTERVAL ${Number(c.release)} DAY` : 'NULL'})`, [c.slug, ...cols.map((k) => vals[k])]);
    cid = r.insertId;
    for (const [i, t] of c.points.entries()) await q('INSERT INTO course_learning_points (course_id, text, position) VALUES (?,?,?)', [cid, t, i]).catch(() => q('INSERT INTO course_learning_points (course_id, text) VALUES (?,?)', [cid, t]));
    for (const [mi, m] of c.chapters.entries()) {
      const mr = await q('INSERT INTO modules (course_id, title, summary, outcomes, schedule_label, position) VALUES (?,?,?,?,?,?)', [cid, m.title, m.summary, m.outcomes, m.when, mi]);
      for (const [li, l] of m.lessons.entries()) {
        await q('INSERT INTO lessons (module_id, title, type, duration, duration_seconds, is_free, position) VALUES (?,?,?,?,?,?,?)', [mr.insertId, l.title, l.type, `${l.min}:00`, l.min * 60, l.free, li]);
      }
    }
    console.log('  + course', c.slug);
  }
  for (const s of c.sections) {
    await q('INSERT IGNORE INTO course_section_courses (section_id, course_id, position) SELECT id, ?, 0 FROM course_sections WHERE slug = ?', [cid, s]);
  }
}

// existing demo courses → sections; existing chapters get a summary + timeline
const LINKS = { 'ssc-': 'school', 'hsc-': 'college' };
for (const row of await q('SELECT id, slug, category FROM courses')) {
  const sec = Object.entries(LINKS).find(([p]) => row.slug.startsWith(p))?.[1] || (['skills', 'web-development'].includes(row.category) || /react|php|web|programming/i.test(row.slug) ? 'skills' : null);
  if (sec) await q('INSERT IGNORE INTO course_section_courses (section_id, course_id) SELECT id, ? FROM course_sections WHERE slug = ?', [row.id, sec]);
}
await q(`UPDATE modules m SET schedule_label = CONCAT('সপ্তাহ ', m.position + 1),
         summary = COALESCE(m.summary, CONCAT(m.title, ' — মূল ধারণা, উদাহরণ ও অনুশীলন')),
         outcomes = COALESCE(m.outcomes, CONCAT('এই অধ্যায়ের মূল ধারণাগুলো নিজের ভাষায় ব্যাখ্যা করতে পারবে\nঅধ্যায় শেষের প্রশ্ন সমাধান করতে পারবে'))
         WHERE m.schedule_label IS NULL`);


// ---------- Leo Journal articles ----------
const ARTICLES = [
  ['hsc-physics-5-tips', 'HSC ফিজিক্সে ভালো করার ৫টি কৌশল', 'পড়াশোনা', 'HSC, পদার্থবিজ্ঞান, পরীক্ষা', 1],
  ['online-class-focus', 'অনলাইন ক্লাসে মনোযোগ ধরে রাখার উপায়', 'টিপস', 'অনলাইন ক্লাস, মনোযোগ', 0],
  ['admission-time-management', 'ভর্তি পরীক্ষার জন্য সময় ব্যবস্থাপনা', 'ভর্তি', 'ভর্তি, সময় ব্যবস্থাপনা', 1],
  ['ssc-math-mistakes', 'SSC গণিতে যে ৭টি ভুল সবচেয়ে বেশি হয়', 'পরীক্ষা', 'SSC, গণিত, পরীক্ষা', 0],
  ['class-1-reading-at-home', 'বাসায় শিশুকে বাংলা পড়তে শেখানোর সহজ পদ্ধতি', 'অভিভাবক', 'প্রাথমিক, বাংলা, অভিভাবক', 0],
  ['medical-admission-roadmap', 'মেডিকেল ভর্তি: ৫ মাসের রোডম্যাপ', 'ভর্তি', 'ভর্তি, মেডিকেল, জীববিজ্ঞান', 1],
  ['du-ka-unit-strategy', 'ঢাবি ক-ইউনিট: কোন বিষয়ে কত সময় দেবেন', 'ভর্তি', 'ভর্তি, ঢাবি, কৌশল', 0],
  ['spoken-english-daily', 'প্রতিদিন ১৫ মিনিটে স্পোকেন ইংলিশ', 'স্কিল', 'ইংরেজি, স্কিল', 0],
  ['higher-math-calculus-start', 'উচ্চতর গণিত: ক্যালকুলাস শুরু করবেন যেভাবে', 'পড়াশোনা', 'HSC, গণিত, ক্যালকুলাস', 0],
  ['exam-night-routine', 'পরীক্ষার আগের রাতে যা করবেন, যা করবেন না', 'পরীক্ষা', 'পরীক্ষা, ঘুম, টিপস', 0],
  ['freelancing-for-students', 'শিক্ষার্থীদের জন্য ফ্রিল্যান্সিং: শুরুর গাইড', 'ক্যারিয়ার', 'ক্যারিয়ার, ফ্রিল্যান্সিং, স্কিল', 0],
  ['note-taking-methods', 'ভালো নোট নেওয়ার ৩টি পরীক্ষিত পদ্ধতি', 'টিপস', 'নোট, পড়াশোনা, টিপস', 0],
  ['chemistry-periodic-table-trick', 'পর্যায় সারণি মনে রাখার মজার কৌশল', 'পড়াশোনা', 'HSC, রসায়ন', 0],
  ['university-first-year', 'বিশ্ববিদ্যালয়ের প্রথম বছর: যা জানা দরকার', 'ক্যারিয়ার', 'বিশ্ববিদ্যালয়, ক্যারিয়ার', 0]
];
const bodyFor = (title, tags) => `${title} — এই লেখায় আমরা ধাপে ধাপে দেখব কীভাবে অল্প সময়ে নিয়মিত অভ্যাস তৈরি করে ভালো ফল করা যায়। অনেক শিক্ষার্থী শুরুতে উৎসাহ নিয়ে পড়েন, কিন্তু কয়েক সপ্তাহ পরেই গতি হারিয়ে ফেলেন। সমস্যাটা মেধার নয় — পরিকল্পনার।

## কেন এটা গুরুত্বপূর্ণ

পরীক্ষায় ভালো করার জন্য সবচেয়ে জরুরি হলো **নিয়মিততা**। প্রতিদিন অল্প অল্প পড়া একদিনে অনেক পড়ার চেয়ে বেশি কাজে দেয়। গবেষণাও বলে, ছোট ছোট বিরতি দিয়ে পড়লে মনে থাকে অনেক বেশি।

## শুরু করবেন যেভাবে

1. সপ্তাহের শুরুতে একটি সহজ রুটিন লিখে ফেলুন
2. প্রতিটি পড়ার সেশন ২৫–৩০ মিনিটে ভাগ করুন
3. সেশন শেষে নিজেকে ৩টি প্রশ্ন করুন — কী শিখলাম?
4. সপ্তাহ শেষে একটি ছোট মডেল টেস্ট দিন

> যে প্রতিদিন একটু করে এগোয়, সে-ই শেষ পর্যন্ত সবচেয়ে বেশি দূর যায়।

## সাধারণ ভুলগুলো

- শুধু পড়া, কিন্তু অনুশীলন না করা
- রাত জেগে পড়ে ঘুমের ক্ষতি করা
- ভুল প্রশ্নগুলো আবার না দেখা

## শেষ কথা

আজ থেকেই একটি ছোট লক্ষ্য ঠিক করুন। আমাদের [কোর্সগুলোতে](/courses) প্রতিটি অধ্যায় ছোট ভিডিও আর কুইজে ভাগ করা — তাই নিয়মিত থাকা সহজ।

বিষয়: ${tags}`;
for (const [i, [slug, title, cat, tags, featured]] of ARTICLES.entries()) {
  const body = bodyFor(title, tags);
  const excerpt = `${title} — সহজ ভাষায় ধাপে ধাপে গাইড, সাধারণ ভুল আর কাজে লাগার মতো টিপস।`;
  const exists = (await q('SELECT id FROM blog_posts WHERE slug = ?', [slug]))[0];
  if (exists) {
    await q('UPDATE blog_posts SET category = ?, tags = ?, featured = ?, body = IF(CHAR_LENGTH(COALESCE(body, "")) < 400, ?, body), excerpt = COALESCE(excerpt, ?), read_minutes = 3 WHERE id = ?', [cat, tags, featured, body, excerpt, exists.id]);
  } else {
    await q(`INSERT INTO blog_posts (title, slug, excerpt, body, category, tags, author, status, featured, views, read_minutes, published_at)
             VALUES (?,?,?,?,?,?,?, 'published', ?, ?, 3, NOW() - INTERVAL ? DAY)`, [title, slug, excerpt, body, cat, tags, ['আবরার হায়দার', 'সৌরভ বড়ুয়া', 'মেহজাবিন রহমান'][i % 3], featured, (i * 37) % 400, i * 3 + 1]);
  }
}

console.log('catalog + journal seeded');
await db.end();
