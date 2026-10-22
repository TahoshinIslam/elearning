-- ============================================================
-- Leo Learning — progress save ordering (migration 029)
-- A resume position is only overwritten by a newer save from the same
-- playback session (position_session + position_client_ms as a sequence),
-- so a delayed request (e.g. a page-hide beacon racing a periodic save)
-- can't move the student back. A save from a different session (another
-- tab or device) always wins — device clocks can't be compared.
--   node database/migrate.mjs 029_progress_session.sql
-- ============================================================

USE `e-learning`;

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS position_session VARCHAR(40) NULL AFTER position_client_ms;
