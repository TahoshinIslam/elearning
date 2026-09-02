-- ============================================================
-- Leo Learning — backfill the users↔students identity link (migration 022)
-- Self-registration (lib/authRepo.js createUser) used to insert only into
-- `users`, leaving `users.student_id` NULL for every self-registered
-- student — they could never enroll, submit, or be certified. That code
-- path is fixed in this same change; this migration repairs any accounts
-- created before the fix.
--
-- Idempotent: only touches rows where role='student' AND student_id IS NULL,
-- so running it more than once is a no-op for already-linked rows.
--   mysql -u root e-learning < database/migrations/022_link_orphan_students.sql
-- ============================================================

USE `e-learning`;

DELIMITER $$

CREATE PROCEDURE leo_backfill_student_links()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE uid INT UNSIGNED;
  DECLARE uname VARCHAR(191);
  DECLARE uphone VARCHAR(32);
  DECLARE new_student_id INT UNSIGNED;
  DECLARE cur CURSOR FOR
    SELECT id, name, phone FROM users WHERE role = 'student' AND student_id IS NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO uid, uname, uphone;
    IF done THEN
      LEAVE read_loop;
    END IF;

    INSERT INTO students (name, phone, batch_id, amount, paid)
    VALUES (uname, COALESCE(uphone, '—'), NULL, 0, 0);
    SET new_student_id = LAST_INSERT_ID();

    UPDATE users SET student_id = new_student_id WHERE id = uid;
  END LOOP;
  CLOSE cur;
END$$

DELIMITER ;

CALL leo_backfill_student_links();
DROP PROCEDURE leo_backfill_student_links;
