// Seed demo accounts for the auth system.
// Standalone (no @/ aliases) so it runs directly:  node database/seed_users.mjs
// Password for every demo account: demo1234
import { scryptSync, randomBytes } from 'node:crypto';
import mysql from 'mysql2/promise';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

const STAFF_ALL = 'dash,students,classes,attendance,submissions,quizzes,announce';
const DEMO = [
  { name: 'তানভীর আহমেদ',   email: 'student@leolearning.app',    role: 'student',    tenant_id: 1, student_id: 1 },
  { name: 'আবরার হায়দার',   email: 'teacher@leolearning.app',    role: 'teacher',    tenant_id: 1, teacher_id: 1, sections: STAFF_ALL },
  { name: 'কেন্দ্র অ্যাডমিন', email: 'owner@leolearning.app',      role: 'owner',      tenant_id: 1 },
  { name: 'Leo HQ',          email: 'superadmin@leolearning.app', role: 'superadmin' }
];

const pool = mysql.createPool({
  socketPath: process.env.MYSQL_SOCKET || '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  host: process.env.MYSQL_HOST || undefined,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : undefined,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'e-learning',
  charset: 'utf8mb4_unicode_ci'
});

try {
  for (const u of DEMO) {
    await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, tenant_id, student_id, teacher_id, sections)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name),
         role = VALUES(role), tenant_id = VALUES(tenant_id),
         student_id = VALUES(student_id), teacher_id = VALUES(teacher_id), sections = VALUES(sections)`,
      [u.name, u.email, null, hashPassword('demo1234'), u.role,
       u.tenant_id ?? null, u.student_id ?? null, u.teacher_id ?? null, u.sections ?? null]
    );
    console.log(`  ✓ ${u.role.padEnd(11)} ${u.email}`);
  }

  console.log('\nDone. All demo accounts use password: demo1234');
} catch (e) {
  console.error('Seed failed:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
