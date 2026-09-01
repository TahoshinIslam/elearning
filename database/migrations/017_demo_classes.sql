-- ============================================================
-- Leo Learning — free live/recorded demo classes (migration 017)
-- Backs the two landing sections (upcoming live · previous recorded) with
-- real data + detail pages. `recorded` classes carry a playable video URL.
--   mysql -u root e-learning < database/migrations/017_demo_classes.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS demo_classes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(191) NOT NULL,
  slug        VARCHAR(191) NOT NULL UNIQUE,
  category    VARCHAR(32),
  instructor  VARCHAR(191),
  description TEXT,
  schedule    VARCHAR(128),                       -- human-readable date/time
  status      ENUM('upcoming','recorded') NOT NULL DEFAULT 'upcoming',
  video_url   VARCHAR(255),                        -- recording (for status='recorded')
  learners    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS demo_class_registrations (
  demo_class_id INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (demo_class_id, user_id),
  CONSTRAINT fk_dcr_class FOREIGN KEY (demo_class_id) REFERENCES demo_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_dcr_user  FOREIGN KEY (user_id)       REFERENCES users(id)        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sample video URL is a widely-used public test clip; swap for Bunny/Mux in prod.
INSERT INTO demo_classes (title, slug, category, instructor, description, schedule, status, video_url, learners) VALUES
  ('ভেক্টর: এক ক্লাসে বেসিক ক্লিয়ার', 'vector-basics-live', 'phy', 'আবরার হায়দার',
   'ভেক্টরের যোগ-বিয়োগ, উপাংশ ও প্রয়োগ — এক ক্লাসেই পুরো বেসিক পরিষ্কার হয়ে যাবে। লাইভ ক্লাসে সরাসরি প্রশ্ন করার সুযোগ থাকবে।',
   'শুক্রবার, ৪ জুলাই · রাত ৯:০০', 'upcoming', NULL, 713),
  ('ক্যালকুলাস শুরুর আগে যা জানতেই হবে', 'pre-calculus-live', 'math', 'মেহজাবিন রহমান',
   'লিমিট ও ধারাবাহিকতার ধারণা সহজ ভাষায়। ক্যালকুলাস শুরু করার আগে ভিত্তি মজবুত করে নাও।',
   'শনিবার, ৫ জুলাই · রাত ৮:০০', 'upcoming', NULL, 926),
  ('জৈব রসায়ন: ভয় নয়, মজায় শিখি', 'organic-chem-live', 'chem', 'সৌরভ বড়ুয়া',
   'জৈব রসায়নের রিয়েকশন মনে রাখার সহজ কৌশল ও প্যাটার্ন। মুখস্থ নয়, বুঝে শেখা।',
   'রবিবার, ৬ জুলাই · রাত ৯:০০', 'upcoming', NULL, 1139),
  ('নিউটনের সূত্র দিয়ে সমস্যা সমাধান', 'newton-problems-recorded', 'phy', 'আবরার হায়দার',
   'নিউটনের তিন সূত্র প্রয়োগ করে ধাপে ধাপে সমস্যা সমাধানের রেকর্ডেড ক্লাস।',
   'সোমবার, ৩০ জুন · রাত ৯:০০', 'recorded', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1543),
  ('লগারিদম: বেসিক থেকে বোর্ড প্রশ্ন', 'logarithm-recorded', 'math', 'মেহজাবিন রহমান',
   'লগারিদমের সূত্র, প্রয়োগ ও বিগত বছরের বোর্ড প্রশ্নের সমাধান।',
   'বৃহস্পতিবার, ২৬ জুন · রাত ৮:০০', 'recorded', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 1288),
  ('পর্যায় সারণি মনে রাখার কৌশল', 'periodic-table-recorded', 'chem', 'সৌরভ বড়ুয়া',
   'পর্যায় সারণির গ্রুপ ও পিরিয়ড সহজে মনে রাখার কৌশল ও শর্টকাট।',
   'মঙ্গলবার, ২৪ জুন · রাত ৯:০০', 'recorded', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 1002)
ON DUPLICATE KEY UPDATE title=VALUES(title);
