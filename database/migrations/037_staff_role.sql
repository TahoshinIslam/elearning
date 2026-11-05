-- Non-teaching staff accounts (office / accounts / support) that see only the
-- admin sections an owner grants them (users.sections = "section:level,…").
ALTER TABLE users MODIFY role ENUM('student','teacher','staff','owner','superadmin') NOT NULL DEFAULT 'student';
