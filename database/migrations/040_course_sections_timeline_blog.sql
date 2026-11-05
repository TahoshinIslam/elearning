-- Dynamic course sections (School, College, University, Admission, Upcoming,
-- Skills…). Admins enable/disable them, choose which appear on the home page
-- (max 4 shown) and put courses into one or more sections.
CREATE TABLE IF NOT EXISTS course_sections (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  name_bn VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  blurb_bn VARCHAR(255) NULL,
  blurb_en VARCHAR(255) NULL,
  badge_bn VARCHAR(60) NULL,
  badge_en VARCHAR(60) NULL,
  icon VARCHAR(24) NOT NULL DEFAULT 'book',
  tone VARCHAR(16) NOT NULL DEFAULT 'yellow',
  position INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  show_on_home TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_course_sections_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_section_courses (
  section_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, course_id),
  KEY idx_csc_course (course_id),
  CONSTRAINT fk_csc_section FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_csc_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO course_sections (slug, name_bn, name_en, blurb_bn, blurb_en, badge_bn, badge_en, icon, tone, position, enabled, show_on_home) VALUES
 ('school',     'স্কুলের কোর্স',        'School courses',      '১ম থেকে ১০ম শ্রেণি ও SSC — বাংলা, ইংরেজি, গণিত, বিজ্ঞান', 'Class 1 to 10 and SSC — Bangla, English, Maths, Science', NULL, NULL, 'book', 'yellow', 1, 1, 1),
 ('college',    'কলেজের কোর্স',        'College courses',     'একাদশ–দ্বাদশ ও HSC — উচ্চতর গণিত, পদার্থ, রসায়ন, জীববিজ্ঞান', 'Class 11–12 and HSC — Higher Maths, Physics, Chemistry, Biology', NULL, NULL, 'cap', 'cyan', 2, 1, 1),
 ('admission',  'ভর্তি চলছে',           'Admission open',      'বিশ্ববিদ্যালয়, মেডিকেল ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি', 'University, medical and engineering admission prep', 'ভর্তি চলছে', 'Enrolling now', 'flag', 'pink', 3, 1, 1),
 ('upcoming',   'আসন্ন ব্যাচ',          'Upcoming batches',    'নতুন ব্যাচ শুরু হচ্ছে — আগেভাগে সিট নিশ্চিত করুন', 'New batches starting soon — reserve your seat', 'শীঘ্রই', 'Soon', 'calendar', 'lime', 4, 1, 1),
 ('university', 'বিশ্ববিদ্যালয়',        'University',          'অনার্স ও বিশ্ববিদ্যালয় পর্যায়ের কোর্স', 'Honours and university-level courses', NULL, NULL, 'cap', 'violet', 5, 1, 0),
 ('skills',     'স্কিল ও ক্যারিয়ার',   'Skills & career',     'প্রোগ্রামিং, ডিজাইন, ফ্রিল্যান্সিং', 'Programming, design, freelancing', NULL, NULL, 'code', 'orange', 6, 1, 0);

-- Course timeline: each chapter (module) can say when it runs and what the
-- learner will be able to do after it.
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS summary VARCHAR(500) NULL AFTER title,
  ADD COLUMN IF NOT EXISTS outcomes TEXT NULL AFTER summary,
  ADD COLUMN IF NOT EXISTS schedule_label VARCHAR(80) NULL AFTER outcomes;

-- Newspaper-style blog.
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS cover_key VARCHAR(255) NULL AFTER cover,
  ADD COLUMN IF NOT EXISTS tags VARCHAR(255) NULL AFTER category,
  ADD COLUMN IF NOT EXISTS featured TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN IF NOT EXISTS views INT UNSIGNED NOT NULL DEFAULT 0 AFTER featured,
  ADD COLUMN IF NOT EXISTS read_minutes SMALLINT UNSIGNED NULL AFTER views,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  MODIFY published_at DATETIME NULL;
CREATE INDEX IF NOT EXISTS idx_blog_status_pub ON blog_posts (status, published_at);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts (category);
