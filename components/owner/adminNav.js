// Admin navigation: groups, icons, labels and one-line descriptions.
export const ADMIN_GROUPS = [
  { key: 'overview', bn: 'ওভারভিউ', en: 'Overview', items: ['dash', 'analytics', 'activity'] },
  { key: 'catalog', bn: 'কনটেন্ট', en: 'Content', items: ['courses', 'sections', 'categories', 'levels', 'paths', 'homepage', 'blog'] },
  { key: 'sales', bn: 'বিক্রি ও প্রচার', en: 'Sales & promotion', items: ['payments', 'offers', 'coupons', 'campaigns', 'affiliates'] },
  { key: 'learners', bn: 'শিক্ষার্থী', en: 'Learners', items: ['students', 'enroll', 'reviews', 'messages'] },
  { key: 'teaching', bn: 'ক্লাস ও মূল্যায়ন', en: 'Teaching', items: ['batches', 'teachers', 'classes', 'attendance', 'submissions', 'quizzes', 'fees'] },
  { key: 'system', bn: 'সিস্টেম', en: 'System', items: ['reports', 'users', 'access', 'security', 'announce', 'settings', 'profile'] }
];

export const ADMIN_SECTIONS = {
  analytics:   { icon: 'bar', bn: ['অ্যানালিটিক্স', 'আয়, ভর্তি, শেখা, ট্রাফিক ও বিজ্ঞাপনের ফলাফল'], en: ['Analytics', 'Revenue, enrollment, learning, traffic and ad results'] },
  activity:    { icon: 'clock', bn: ['সাম্প্রতিক কার্যক্রম', 'প্ল্যাটফর্মে কী ঘটছে — এক টাইমলাইনে'], en: ['Recent activity', 'Everything happening on the platform, in one timeline'] },
  sections:    { icon: 'layers', bn: ['কোর্স সেকশন', 'স্কুল, কলেজ, ভর্তি, আসন্ন ব্যাচ — চালু/বন্ধ, হোমপেজে দেখানো ও ক্রম'], en: ['Course sections', 'School, College, Admission, Upcoming — on/off, home page and order'] },
  profile:     { icon: 'user', bn: ['আমার প্রোফাইল', 'প্রোফাইল ছবি ও পাসওয়ার্ড'], en: ['My profile', 'Profile photo and password'] },
  security:    { icon: 'shield', bn: ['নিরাপত্তা', 'ব্লক করা IP ও অ্যাকাউন্ট, রেট লিমিট ও সন্দেহজনক কার্যকলাপ'], en: ['Security', 'Blocked IPs and accounts, rate limits and suspicious activity'] },
  access:      { icon: 'lock', bn: ['অ্যাক্সেস ও অনুমতি', 'অ্যাকাউন্ট তৈরি ও কে কী দেখবে / করবে'], en: ['Access & permissions', 'Create accounts and decide who sees and does what'] },
  dash:        { icon: 'grid', bn: ['ড্যাশবোর্ড', 'প্ল্যাটফর্মের বর্তমান অবস্থা'], en: ['Dashboard', 'Where the platform stands today'] },
  courses:     { icon: 'book', bn: ['কোর্স', 'কোর্স তৈরি, পাঠ্যক্রম, মিডিয়া, মূল্য ও প্রকাশ'], en: ['Courses', 'Create courses, curriculum, media, pricing and publishing'] },
  categories:  { icon: 'layers', bn: ['বিষয়', 'বিষয়ভিত্তিক কোর্স — ক্যাটালগ ও হোমপেজে দেখানো হয়'], en: ['Subjects', 'Subjects shown in the catalog and homepage'] },
  levels:      { icon: 'cap', bn: ['শ্রেণি', 'শ্রেণিভিত্তিক কোর্স — একাডেমিক লেভেল'], en: ['Classes', 'Academic classes / levels'] },
  paths:       { icon: 'compass', bn: ['লার্নিং পাথ', 'কোর্সের সাজানো ধারাবাহিক তালিকা'], en: ['Learning paths', 'Curated course sequences'] },
  homepage:    { icon: 'home', bn: ['হোমপেজ', 'হিরো লেখা ও সাধারণ প্রশ্ন'], en: ['Homepage', 'Hero copy and FAQ'] },
  blog:        { icon: 'file', bn: ['ব্লগ', 'আর্টিকেল প্রকাশ'], en: ['Blog', 'Articles'] },
  payments:    { icon: 'receipt', bn: ['অর্ডার ও পেমেন্ট', 'bKash অর্ডার, যাচাই ও রিফান্ড'], en: ['Orders & payments', 'bKash orders, verification and refunds'] },
  offers:      { icon: 'zap', bn: ['অফার ও ছাড়', 'স্বয়ংক্রিয় ছাড় — কোর্স পেজ ও চেকআউটে একই দাম'], en: ['Offers', 'Automatic discounts applied at checkout'] },
  coupons:     { icon: 'gift', bn: ['কুপন', 'কোড দিয়ে ছাড়'], en: ['Coupons', 'Code-based discounts'] },
  campaigns:   { icon: 'megaphone', bn: ['ক্যাম্পেইন', 'হোমপেজ ক্যারোসেল ও পপআপ'], en: ['Campaigns', 'Homepage carousel and popups'] },
  affiliates:  { icon: 'link', bn: ['অ্যাফিলিয়েট', 'রেফারেল কমিশন'], en: ['Affiliates', 'Referral commission'] },
  students:    { icon: 'users', bn: ['শিক্ষার্থী', 'শিক্ষার্থীদের তালিকা ও যোগাযোগ'], en: ['Students', 'Student records'] },
  enroll:      { icon: 'checkCircle', bn: ['ভর্তি', 'কোর্স ও ব্যাচ ভর্তি'], en: ['Enrollments', 'Course and batch enrollments'] },
  reviews:     { icon: 'star', bn: ['রিভিউ', 'রিভিউ যাচাই ও প্রকাশ'], en: ['Reviews', 'Moderate and publish reviews'] },
  messages:    { icon: 'mail', bn: ['বার্তা', 'যোগাযোগ ফর্মের বার্তা'], en: ['Messages', 'Contact form messages'] },
  batches:     { icon: 'list', bn: ['ব্যাচ', 'লাইভ ব্যাচ'], en: ['Batches', 'Live cohorts'] },
  teachers:    { icon: 'user', bn: ['শিক্ষক', 'শিক্ষক ও ইন্সট্রাক্টর'], en: ['Teachers', 'Teachers and instructors'] },
  classes:     { icon: 'video', bn: ['লাইভ ক্লাস', 'ক্লাসের সময়সূচি'], en: ['Live classes', 'Class schedule'] },
  attendance:  { icon: 'check', bn: ['উপস্থিতি', 'ক্লাস উপস্থিতি'], en: ['Attendance', 'Class attendance'] },
  submissions: { icon: 'edit', bn: ['মূল্যায়ন', 'অ্যাসাইনমেন্ট মূল্যায়ন'], en: ['Grading', 'Assignment grading'] },
  quizzes:     { icon: 'help', bn: ['কুইজ', 'কুইজ তৈরি ও ফলাফল'], en: ['Quizzes', 'Quizzes and results'] },
  fees:        { icon: 'card', bn: ['ব্যাচ ফি', 'ব্যাচ ফি আদায়'], en: ['Batch fees', 'Batch fee collection'] },
  reports:     { icon: 'bar', bn: ['রিপোর্ট', 'আয়, ভর্তি ও অগ্রগতি'], en: ['Reports', 'Revenue, enrollment and progress'] },
  users:       { icon: 'shield', bn: ['ইউজার', 'অ্যাকাউন্ট ও ভূমিকা'], en: ['Users', 'Accounts and roles'] },
  announce:    { icon: 'bell', bn: ['ঘোষণা', 'শিক্ষার্থীদের নোটিফিকেশন'], en: ['Announcements', 'Notify students'] },
  settings:    { icon: 'settings', bn: ['সেটিংস', 'সাইট, সাপোর্ট ও ব্যাজের নিয়ম'], en: ['Settings', 'Site, support and badge rules'] }
};

export const sectionText = (key, lang) => {
  const m = ADMIN_SECTIONS[key];
  const [label, desc] = m ? (lang === 'en' ? m.en : m.bn) : [key, ''];
  return { label, desc, icon: m?.icon || 'dot' };
};
