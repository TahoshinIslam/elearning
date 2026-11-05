// ============================================================
// Security shield — runs in proxy.js in front of every request, plus hooks
// in the API error path and the session loader.
//
//  1. Rate limits per IP (API / writes / auth / pages), fixed windows.
//  2. Attack signatures: scanner paths (/wp-login.php, /.env, .git …),
//     path traversal, SQL-injection and script-injection probes.
//  3. Abuse score per IP: every violation or suspicious API failure
//     (401 / 403 / 429) adds points; points decay over 10 minutes.
//  4. Score ≥ 10 → automatic block that escalates for repeat offenders:
//     15 min → 1 h → 24 h → 7 days. Blocks persist in `security_blocks`
//     (so restarts don't forget them) and are cached in memory; admins can
//     add / lift blocks for an IP or an account (Admin → Security).
//  5. Cross-site write protection: state-changing API calls whose Origin is
//     another site are refused.
//
// State lives in process memory (shared by proxy + route handlers in one
// Node process). For several instances, back `store` with Redis/Upstash —
// the function signatures stay the same.
// ============================================================

import { q } from '@/lib/mysql';
import { logger } from '@/lib/logger';

const g = globalThis;
if (!g.__LEO_SHIELD__) {
  g.__LEO_SHIELD__ = { hits: new Map(), scores: new Map(), ipBlocks: new Map(), userBlocks: new Map(), strikes: new Map(), syncedAt: 0, syncing: null };
}
const store = g.__LEO_SHIELD__;

export const LIMITS = {
  api: { limit: 180, windowMs: 60_000 },
  write: { limit: 60, windowMs: 60_000 },
  auth: { limit: 25, windowMs: 60_000 },
  page: { limit: 300, windowMs: 60_000 }
};
export const BLOCK_SCORE = 10;
const DECAY_MS = 10 * 60_000;
const ESCALATION_MIN = [15, 60, 24 * 60, 7 * 24 * 60];
const SYNC_MS = 20_000;

// Client IP: a header your proxy/CDN sets (TRUSTED_IP_HEADER), else the
// RIGHT-most X-Forwarded-For entry (appended by our nearest proxy; anything to
// its left is client-controlled), else x-real-ip.
export function ipFromHeaders(h) {
  const trusted = process.env.TRUSTED_IP_HEADER && h.get(process.env.TRUSTED_IP_HEADER);
  if (trusted) return trusted.trim();
  const xff = (h.get('x-forwarded-for') || '').split(',').map((x) => x.trim()).filter(Boolean);
  return xff[xff.length - 1] || h.get('x-real-ip') || 'local';
}

// ---------- signatures ----------
const SCANNER_PATH = /(^|\/)(wp-admin|wp-login\.php|wp-content|wp-includes|xmlrpc\.php|phpmyadmin|pma|adminer(\.php)?|\.env(\.|$)|\.git(\/|$)|\.svn|\.htaccess|\.ds_store|server-status|cgi-bin|vendor\/phpunit|boaform|actuator|solr|owa|autodiscover|config\.(php|json|yml)|web\.config|id_rsa|backup\.(zip|sql|tar))/i;
const PHP_ETC = /\.(php\d?|asp|aspx|jsp|cgi|env|ini|sql|bak|old)$/i;
const TRAVERSAL = /(\.\.\/|\.\.\\|\.\.(%2f|%5c)|%2e%2e(%2f|%5c|\/)|%252e%252e)/i;
const SQLI = /(\bunion\b[\s\S]{0,20}\bselect\b|\bselect\b[\s\S]{0,40}\bfrom\b[\s\S]{0,40}\binformation_schema\b|'\s*or\s*'?\d+'?\s*=\s*'?\d|\bor\s+1\s*=\s*1\b|;\s*drop\s+table|\bsleep\s*\(\s*\d+\s*\)|benchmark\s*\(|waitfor\s+delay)/i;
const XSS = /(<\s*script\b|javascript\s*:|onerror\s*=|onload\s*=|<\s*iframe\b|<\s*svg[^>]*on\w+\s*=)/i;

// → { kind, points } or null
export function inspectRequest(pathname, search = '') {
  let decoded = `${pathname}${search}`;
  try { decoded = decodeURIComponent(decoded.replace(/\+/g, ' ')); } catch { /* malformed escapes are suspicious in themselves */ return { kind: 'malformed_url', points: 4 }; }
  if (SCANNER_PATH.test(pathname) || (PHP_ETC.test(pathname) && !pathname.startsWith('/api/storage/'))) return { kind: 'scanner_probe', points: BLOCK_SCORE };
  if (TRAVERSAL.test(pathname) || TRAVERSAL.test(search) || TRAVERSAL.test(decoded)) return { kind: 'path_traversal', points: BLOCK_SCORE };
  if (SQLI.test(decoded)) return { kind: 'sql_injection_probe', points: 6 };
  if (XSS.test(decoded)) return { kind: 'xss_probe', points: 5 };
  return null;
}

// Cross-site write check: a browser always sends Origin on POST/PUT/PATCH/
// DELETE; if it names another site, refuse. (No Origin = non-browser client,
// which can't carry the victim's cookies anyway.)
export function isCrossSiteWrite(method, origin, host) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;
  if (!origin || origin === 'null') return !!origin;
  try { return new URL(origin).host !== host; } catch { return true; }
}

// ---------- rate limiting ----------
export function hit(key, { limit, windowMs }, now = Date.now()) {
  let b = store.hits.get(key);
  if (!b || now >= b.reset) { b = { count: 0, reset: now + windowMs }; store.hits.set(key, b); }
  b.count += 1;
  if (store.hits.size > 100_000) for (const [k, v] of store.hits) if (now >= v.reset) store.hits.delete(k);
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.reset - now) / 1000), count: b.count };
}

// ---------- scoring + blocking ----------
export function scoreOf(ip, now = Date.now()) {
  const s = store.scores.get(ip);
  if (!s) return 0;
  const decayed = s.score * Math.max(0, 1 - (now - s.at) / DECAY_MS);
  return decayed < 0.5 ? 0 : decayed;
}

export function activeBlock(ip, now = Date.now()) {
  const b = ip ? store.ipBlocks.get(ip) : null;
  if (!b) return null;
  if (b.until && b.until <= now) { store.ipBlocks.delete(ip); return null; }
  return b;
}

export function userBlock(userId, now = Date.now()) {
  const b = userId ? store.userBlocks.get(Number(userId)) : null;
  if (!b) return null;
  if (b.until && b.until <= now) { store.userBlocks.delete(Number(userId)); return null; }
  return b;
}

async function persistBlock({ ip = null, userId = null, reason, minutes, source = 'auto', strikes = 1, by = null }) {
  const until = minutes ? new Date(Date.now() + minutes * 60_000) : null;
  try {
    await q('INSERT INTO security_blocks (ip, user_id, reason, source, strikes, until, created_by) VALUES (?,?,?,?,?,?,?)',
      [ip, userId, String(reason).slice(0, 255), source, strikes, until, by]);
    await q('INSERT INTO audit_log (actor_user_id, actor_role, action, target_type, target_id, detail) VALUES (?,?,?,?,?,?)',
      [by, by ? 'admin' : 'shield', source === 'auto' ? 'shield_auto_block' : 'shield_manual_block', ip ? 'ip' : 'user', String(ip || userId), `${reason}${minutes ? ` · ${minutes} min` : ' · until lifted'}`]);
  } catch (e) { logger.error('shield_persist_failed', { message: e.message }); }
  return until ? until.getTime() : null;
}

// Add points for an IP (and optionally the signed-in user). Crossing the
// threshold blocks the IP for an escalating period. Returns the block, if any.
export function report(ip, kind, points, { userId = null } = {}) {
  if (!ip) return null;
  if (process.env.VITEST && !process.env.SHIELD_TEST) return null; // other test files use fixed fake IPs
  if (ip === 'local' && process.env.NODE_ENV !== 'production' && !process.env.SHIELD_TEST) return null;
  const now = Date.now();
  if (activeBlock(ip, now)) return activeBlock(ip, now);
  const score = scoreOf(ip, now) + points;
  store.scores.set(ip, { score, at: now });
  if (score < BLOCK_SCORE) return null;
  const strikes = (store.strikes.get(ip) || 0) + 1;
  store.strikes.set(ip, strikes);
  const minutes = ESCALATION_MIN[Math.min(strikes, ESCALATION_MIN.length) - 1];
  const reason = `${kind} (score ${Math.round(score)})`;
  const block = { until: now + minutes * 60_000, reason, strikes, source: 'auto' };
  store.ipBlocks.set(ip, block);
  store.scores.delete(ip);
  logger.warn('shield_block', { ip, reason, minutes, strikes });
  void persistBlock({ ip, reason, minutes, strikes });
  if (userId && strikes >= 2) {
    // a signed-in account that keeps attacking gets the same block
    store.userBlocks.set(Number(userId), { ...block });
    void persistBlock({ userId, reason: `account used for ${kind}`, minutes, strikes });
  }
  return block;
}

// Refresh in-memory blocks from the database (so manual blocks, unblocks
// and other processes' blocks apply). Cheap and throttled.
export async function syncBlocks(force = false) {
  const now = Date.now();
  if (!force && now - store.syncedAt < SYNC_MS) return;
  if (store.syncing) return store.syncing;
  store.syncing = (async () => {
    try {
      const rows = await q('SELECT ip, user_id, reason, source, strikes, until FROM security_blocks WHERE lifted_at IS NULL AND (until IS NULL OR until > NOW())');
      const ips = new Map();
      const users = new Map();
      for (const r of rows) {
        const b = { until: r.until ? Date.parse(String(r.until).replace(' ', 'T')) : null, reason: r.reason, strikes: r.strikes, source: r.source };
        if (r.ip) ips.set(r.ip, b);
        if (r.user_id) users.set(Number(r.user_id), b);
      }
      store.ipBlocks = ips;
      store.userBlocks = users;
      store.syncedAt = Date.now();
    } catch (e) { logger.error('shield_sync_failed', { message: e.message }); store.syncedAt = Date.now(); }
    finally { store.syncing = null; }
  })();
  return store.syncing;
}

// ---------- admin ----------
export async function manualBlock({ ip, userId, minutes, reason, by }) {
  if (!ip && !userId) throw Object.assign(new Error('target_required'), { status: 400 });
  const until = await persistBlock({ ip: ip || null, userId: userId || null, reason: reason || 'manual', minutes: minutes || null, source: 'manual', by });
  const b = { until, reason: reason || 'manual', strikes: 0, source: 'manual' };
  if (ip) store.ipBlocks.set(ip, b);
  if (userId) store.userBlocks.set(Number(userId), b);
}

export async function liftBlock(id, by) {
  const [row] = await q('SELECT ip, user_id FROM security_blocks WHERE id = ?', [id]);
  if (!row) return false;
  await q('UPDATE security_blocks SET lifted_at = NOW(), lifted_by = ? WHERE id = ?', [by, id]);
  if (row.ip) { store.ipBlocks.delete(row.ip); store.scores.delete(row.ip); }
  if (row.user_id) store.userBlocks.delete(Number(row.user_id));
  await q('INSERT INTO audit_log (actor_user_id, actor_role, action, target_type, target_id) VALUES (?,?,?,?,?)', [by, 'admin', 'shield_unblock', row.ip ? 'ip' : 'user', String(row.ip || row.user_id)]);
  return true;
}

export async function securityOverview() {
  await syncBlocks(true);
  const [blocks, recent, [counts]] = await Promise.all([
    q(`SELECT b.id, b.ip, b.user_id AS userId, u.email, b.reason, b.source, b.strikes, b.until, b.created_at AS createdAt
       FROM security_blocks b LEFT JOIN users u ON u.id = b.user_id
       WHERE b.lifted_at IS NULL AND (b.until IS NULL OR b.until > NOW()) ORDER BY b.id DESC LIMIT 200`),
    q(`SELECT action, target_type AS targetType, target_id AS targetId, detail, created_at AS at FROM audit_log
       WHERE action IN ('shield_auto_block','shield_manual_block','shield_unblock','login_failed','login_blocked_disabled','role_change_blocked','status_change_blocked')
       ORDER BY id DESC LIMIT 60`),
    q(`SELECT SUM(created_at >= NOW() - INTERVAL 1 DAY) AS blocks24, SUM(source = 'auto' AND created_at >= NOW() - INTERVAL 7 DAY) AS auto7,
              (SELECT COUNT(*) FROM audit_log WHERE action = 'login_failed' AND created_at >= NOW() - INTERVAL 1 DAY) AS failedLogins24
       FROM security_blocks`)
  ]);
  const watch = [...store.scores.entries()].map(([ip, s]) => ({ ip, score: Math.round(scoreOf(ip) * 10) / 10 })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 15);
  return {
    stats: { activeBlocks: blocks.length, blocks24: Number(counts?.blocks24) || 0, auto7: Number(counts?.auto7) || 0, failedLogins24: Number(counts?.failedLogins24) || 0 },
    blocks, recent, watch, limits: LIMITS, threshold: BLOCK_SCORE
  };
}

// Test helper: wipe in-memory state.
export function _resetShield() {
  store.hits.clear(); store.scores.clear(); store.ipBlocks.clear(); store.userBlocks.clear(); store.strikes.clear(); store.syncedAt = 0;
}
