-- 031: school classes 1–12 as class levels (additive, idempotent).
-- Existing levels (e.g. SSC, HSC) and their course assignments are kept;
-- they move after class 12 only if they still sit at the original 1/2
-- positions, so an admin-chosen order is never overwritten.

INSERT IGNORE INTO class_levels (name, slug, position) VALUES
  ('প্রথম শ্রেণি',   'class-1',  1),
  ('দ্বিতীয় শ্রেণি', 'class-2',  2),
  ('তৃতীয় শ্রেণি',   'class-3',  3),
  ('চতুর্থ শ্রেণি',  'class-4',  4),
  ('পঞ্চম শ্রেণি',   'class-5',  5),
  ('ষষ্ঠ শ্রেণি',    'class-6',  6),
  ('সপ্তম শ্রেণি',   'class-7',  7),
  ('অষ্টম শ্রেণি',   'class-8',  8),
  ('নবম শ্রেণি',     'class-9',  9),
  ('দশম শ্রেণি',     'class-10', 10),
  ('একাদশ শ্রেণি',   'class-11', 11),
  ('দ্বাদশ শ্রেণি',  'class-12', 12);

UPDATE class_levels SET position = 13 WHERE slug = 'ssc' AND position = 1;
UPDATE class_levels SET position = 14 WHERE slug = 'hsc' AND position = 2;
