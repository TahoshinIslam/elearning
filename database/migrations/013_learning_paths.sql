-- ============================================================
-- Leo Learning — learning paths / career tracks (migration 013)
-- Group multiple courses into an ordered track.
--   mysql -u root e-learning < database/migrations/013_learning_paths.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS learning_paths (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(191) NOT NULL,
  slug        VARCHAR(191) NOT NULL UNIQUE,
  description VARCHAR(500),
  thumb       VARCHAR(64),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS path_courses (
  path_id   INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  position  INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (path_id, course_id),
  CONSTRAINT fk_pc_path   FOREIGN KEY (path_id)   REFERENCES learning_paths(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_course FOREIGN KEY (course_id) REFERENCES courses(id)        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- demo track
INSERT INTO learning_paths (title, slug, description, thumb) VALUES
  ('HSC সায়েন্স ফুল ট্র্যাক', 'hsc-science-track', 'ফিজিক্স থেকে গণিত — HSC সায়েন্সের সম্পূর্ণ প্রস্তুতি এক ট্র্যাকে।', 'track')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO path_courses (path_id, course_id, position)
SELECT p.id, c.id, c.id
FROM learning_paths p JOIN courses c ON c.id IN (1,2)
WHERE p.slug='hsc-science-track'
ON DUPLICATE KEY UPDATE position=VALUES(position);
