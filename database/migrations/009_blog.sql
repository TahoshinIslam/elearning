-- ============================================================
-- Leo Learning — blog / articles (migration 009)
--   mysql -u root e-learning < database/migrations/009_blog.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS blog_posts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(191) NOT NULL,
  slug         VARCHAR(191) NOT NULL UNIQUE,
  excerpt      VARCHAR(500),
  body         MEDIUMTEXT,
  category     VARCHAR(64),
  cover        VARCHAR(64),                 -- placeholder art label
  author       VARCHAR(191),
  status       ENUM('draft','published') NOT NULL DEFAULT 'published',
  published_at DATE,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO blog_posts (title, slug, excerpt, body, category, cover, author, status, published_at) VALUES
  ('HSC ফিজিক্সে ভালো করার ৫টি কৌশল', 'hsc-physics-5-tips',
   'পরীক্ষার আগে শেষ মুহূর্তের প্রস্তুতি কীভাবে নেবে — ৫টি কার্যকর কৌশল।',
   'ফিজিক্স অনেকের কাছেই ভীতিকর একটি বিষয়। কিন্তু সঠিক কৌশল জানা থাকলে এই বিষয়েই সবচেয়ে ভালো নম্বর তোলা সম্ভব।\n\n১. সূত্রগুলো মুখস্থ না করে বোঝার চেষ্টা করো।\n২. প্রতিদিন অন্তত ৫টি গাণিতিক সমস্যা সমাধান করো।\n৩. বোর্ড প্রশ্নের প্যাটার্ন বিশ্লেষণ করো।\n৪. দুর্বল অধ্যায়গুলো আলাদা খাতায় নোট করো।\n৫. নিয়মিত মডেল টেস্ট দাও।',
   'পড়াশোনা', 'physics', 'আবরার হায়দার', 'published', '2026-07-01'),
  ('অনলাইন ক্লাসে মনোযোগ ধরে রাখার উপায়', 'online-class-focus',
   'ঘরে বসে ক্লাস করার সময় মনোযোগ ধরে রাখা কঠিন — এই টিপসগুলো কাজে লাগবে।',
   'অনলাইন ক্লাসের সবচেয়ে বড় চ্যালেঞ্জ হলো মনোযোগ। কিছু সহজ অভ্যাস তোমাকে সাহায্য করতে পারে।\n\nএকটি নির্দিষ্ট পড়ার জায়গা তৈরি করো, ফোন দূরে রাখো, এবং প্রতি ৪৫ মিনিট পরপর ৫ মিনিট বিরতি নাও।',
   'টিপস', 'laptop', 'মেহজাবিন রহমান', 'published', '2026-06-25'),
  ('ভর্তি পরীক্ষার জন্য সময় ব্যবস্থাপনা', 'admission-time-management',
   'সীমিত সময়ে সর্বোচ্চ প্রস্তুতি — একটি বাস্তবসম্মত রুটিন।',
   'ভর্তি পরীক্ষার প্রস্তুতিতে সময় ব্যবস্থাপনাই মূল চাবিকাঠি। একটি সাপ্তাহিক রুটিন তৈরি করো এবং তা কঠোরভাবে অনুসরণ করো।',
   'ক্যারিয়ার', 'clock', 'Leo HQ', 'published', '2026-06-18')
ON DUPLICATE KEY UPDATE title=VALUES(title);
