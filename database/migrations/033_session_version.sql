-- Sessions are re-validated against the users row on every request
-- (lib/auth.js currentSession). Bumping session_version signs the user out
-- everywhere (password change / reset); role, sections and disabled status
-- are read fresh, so access changes take effect on the next request.
ALTER TABLE users ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0;
