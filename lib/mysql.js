import mysql from 'mysql2/promise';

// Singleton pool (survives Next.js dev hot-reload via globalThis).
const g = globalThis;

if (!g.__LEO_POOL__) {
  g.__LEO_POOL__ = mysql.createPool({
    // XAMPP MySQL listens on a unix socket, not TCP by default.
    socketPath: process.env.MYSQL_SOCKET || '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
    host: process.env.MYSQL_HOST || undefined,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : undefined,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'e-learning',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4_unicode_ci',
    dateStrings: true // return DATE columns as 'YYYY-MM-DD' strings, not JS Date
  });
}

export const pool = g.__LEO_POOL__;

// Parameterized query helper. Returns rows for SELECT, ResultSetHeader for writes.
export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
