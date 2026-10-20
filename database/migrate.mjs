// Apply one or more SQL migration files and record them in `schema_migrations`
// so a file is never applied twice. Standalone (no @/ aliases):
//
//   node database/migrate.mjs 028_commerce_learning.sql [029_x.sql ...]
//   node database/migrate.mjs --status
//
// Connection comes from the same env vars as the app (MYSQL_HOST or
// MYSQL_SOCKET, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB). It reads .env.local
// only when no MYSQL_* variable is set in the environment — it never picks
// up the shared `.env` on its own, so a local run can't silently target a
// remote database.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

if (!process.env.MYSQL_HOST && !process.env.MYSQL_SOCKET) {
  const envPath = path.join(root, '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  }
}

const target = process.env.MYSQL_HOST ? `${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT || 3306}` : process.env.MYSQL_SOCKET;
if (!target) {
  console.error('No database configured (set MYSQL_HOST or MYSQL_SOCKET).');
  process.exit(1);
}

const conn = await mysql.createConnection({
  ...(process.env.MYSQL_HOST
    ? { host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306), ssl: process.env.MYSQL_SSL === 'false' ? undefined : {} }
    : { socketPath: process.env.MYSQL_SOCKET }),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'e-learning',
  multipleStatements: true,
  charset: 'utf8mb4_unicode_ci'
});

await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(191) PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

const args = process.argv.slice(2);
const [applied] = await conn.query('SELECT name, applied_at FROM schema_migrations ORDER BY name');

if (!args.length || args[0] === '--status') {
  console.log(`Database: ${target}`);
  console.log(applied.length ? applied.map((r) => `  applied  ${r.name}  (${r.applied_at})`).join('\n') : '  (no tracked migrations yet)');
  await conn.end();
  process.exit(0);
}

const done = new Set(applied.map((r) => r.name));
console.log(`Database: ${target}`);
for (const name of args) {
  const file = path.join(here, 'migrations', path.basename(name));
  if (!fs.existsSync(file)) { console.error(`  missing  ${name}`); process.exitCode = 1; break; }
  if (done.has(path.basename(file))) { console.log(`  skipped  ${path.basename(file)} (already applied)`); continue; }
  // The migration files carry a `USE` line for phpMyAdmin imports; drop it
  // so the connection's configured database is always the one migrated.
  const sql = fs.readFileSync(file, 'utf8').replace(/^\s*USE\s+`?[\w-]+`?\s*;\s*$/gim, '');
  try {
    await conn.query(sql);
    await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [path.basename(file)]);
    console.log(`  applied  ${path.basename(file)}`);
  } catch (e) {
    console.error(`  FAILED   ${path.basename(file)}: ${e.message}`);
    process.exitCode = 1;
    break;
  }
}
await conn.end();
