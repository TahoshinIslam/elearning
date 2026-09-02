import mysql from 'mysql2/promise';
import { logger } from '@/lib/logger';

// Singleton pool (survives Next.js dev hot-reload via globalThis).
const g = globalThis;

// Resolve pool config from the environment only — no hardcoded local path.
// MYSQL_HOST  -> TCP connection (managed/cloud MySQL: PlanetScale, RDS, DO, ...)
// MYSQL_SOCKET -> local Unix-socket dev connection (set this in .env.local)
// Neither set  -> fail loudly at first use instead of silently trying a
//                 path that only ever existed on one developer's laptop.
function resolvePoolConfig() {
  const host = process.env.MYSQL_HOST;
  const socketPath = process.env.MYSQL_SOCKET;

  if (!host && !socketPath) {
    throw new Error(
      'MySQL is not configured. Set MYSQL_HOST (+ MYSQL_PORT/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DB) ' +
      'for a TCP connection to managed/cloud MySQL, or MYSQL_SOCKET for a local Unix-socket ' +
      'connection during development. See .env.example.'
    );
  }

  const base = {
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'e-learning',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE) || 10,
    charset: 'utf8mb4_unicode_ci',
    dateStrings: true // return DATE columns as 'YYYY-MM-DD' strings, not JS Date
  };

  if (host) {
    return {
      ...base,
      host,
      port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
      // Most managed providers require TLS. Set MYSQL_SSL=false to disable
      // (local/dev only) and MYSQL_SSL_REJECT_UNAUTHORIZED=false only if a
      // provider needs a relaxed cert check.
      ssl: process.env.MYSQL_SSL === 'false'
        ? undefined
        : { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false' }
    };
  }
  return { ...base, socketPath };
}

if (!g.__LEO_POOL__) {
  g.__LEO_POOL__ = mysql.createPool(resolvePoolConfig());
}

export const pool = g.__LEO_POOL__;

// A managed DB's connection proxy (or a cold pool after idle) can drop the
// first attempt. Retry a small, fixed number of times with a short backoff
// before surfacing the error, instead of failing every request on a blip.
const RETRYABLE_CODES = new Set(['ECONNREFUSED', 'ENOENT', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'ECONNRESET']);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 150;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Parameterized query helper. Returns rows for SELECT, ResultSetHeader for writes.
export async function q(sql, params = []) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (e) {
      lastErr = e;
      if (!RETRYABLE_CODES.has(e.code) || attempt === MAX_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  logger.error('mysql_query_failed', { code: lastErr?.code, message: lastErr?.message });
  throw lastErr;
}

// Run a series of writes atomically. `fn` receives a `query(sql, params)`
// bound to one dedicated connection — use it instead of the pooled `q()` for
// every statement inside the callback so they share one transaction. Commits
// on success, rolls back and rethrows on any error.
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const txQuery = async (sql, params = []) => {
      const [rows] = await conn.query(sql, params);
      return rows;
    };
    const result = await fn(txQuery);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Cheap readiness check for the health endpoint. Never throws.
export async function checkDb() {
  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (e) {
    logger.error('mysql_health_check_failed', { code: e.code, message: e.message });
    return { ok: false };
  }
}
