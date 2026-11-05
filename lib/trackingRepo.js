// ============================================================
// First-party visitor tracking and ad attribution.
//
// A random visitor id lives in the `leo_vid` cookie (set by middleware.js).
// Every page view / event is recorded against it with its traffic source:
//   1. utm_source / utm_medium / utm_campaign on the URL (ads, emails…)
//   2. click ids (gclid → google/cpc, fbclid → facebook/paid-social)
//   3. otherwise the referrer, classified (search / social / referral)
//   4. otherwise "direct"
// The visitor keeps its FIRST touch (how they found us) and LAST non-direct
// touch (what brought them back). Sign-ups and orders copy that attribution,
// so revenue can be reported per ad campaign without any third-party script.
// Interests: course views add weight to that course's category; popups use
// it to target "people interested in Physics", for example.
// ============================================================

import { cookies } from 'next/headers';
import { q } from '@/lib/mysql';

export const VISITOR_COOKIE = 'leo_vid';
export const EVENT_TYPES = ['pageview', 'course_view', 'signup', 'login', 'purchase', 'checkout_start', 'popup_impression', 'popup_click', 'popup_dismiss', 'search'];
const SESSION_GAP_MS = 30 * 60 * 1000;

const clip = (v, n) => (v == null || v === '' ? null : String(v).slice(0, n));
export const validVisitorId = (v) => typeof v === 'string' && /^[0-9A-Z]{26}$/.test(v);

export function visitorIdFromCookies() {
  try {
    const v = cookies().get(VISITOR_COOKIE)?.value;
    return validVisitorId(v) ? v : null;
  } catch { return null; }
}

const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia)\./i;
const SOCIAL = /(^|\.)(facebook|fb|instagram|t\.co|twitter|x|linkedin|youtube|tiktok|pinterest|reddit|whatsapp|messenger|telegram)\./i;

// Work out where a hit came from. `siteHost` excludes internal referrers.
export function classifySource({ utmSource, utmMedium, utmCampaign, gclid, fbclid, referrer, siteHost }) {
  if (utmSource) {
    return { source: clip(utmSource.toLowerCase(), 100), medium: clip((utmMedium || 'campaign').toLowerCase(), 100), campaign: clip(utmCampaign, 150) };
  }
  if (gclid) return { source: 'google', medium: 'cpc', campaign: clip(utmCampaign, 150) };
  if (fbclid) return { source: 'facebook', medium: 'paid-social', campaign: clip(utmCampaign, 150) };
  if (referrer) {
    let host = '';
    try { host = new URL(referrer).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
    if (host && (!siteHost || host !== siteHost.replace(/^www\./, ''))) {
      if (SEARCH.test(`.${host}`)) return { source: host.split('.').slice(-2, -1)[0] || host, medium: 'organic', campaign: null };
      if (SOCIAL.test(`.${host}`)) return { source: host.split('.').slice(-2, -1)[0] || host, medium: 'social', campaign: null };
      return { source: clip(host, 100), medium: 'referral', campaign: null };
    }
  }
  return { source: 'direct', medium: 'none', campaign: null };
}

export async function getVisitor(visitorId) {
  if (!validVisitorId(visitorId)) return null;
  const rows = await q('SELECT * FROM visitors WHERE id = ? LIMIT 1', [visitorId]);
  const v = rows[0];
  if (!v) return null;
  let interests = {};
  try { interests = v.interests ? JSON.parse(v.interests) : {}; } catch { interests = {}; }
  return { ...v, interests };
}

// Record one event. Creates the visitor on first sight and keeps first/last
// touch, visit and pageview counters up to date.
export async function recordEvent(visitorId, evt) {
  if (!validVisitorId(visitorId)) return null;
  const type = EVENT_TYPES.includes(evt.type) ? evt.type : 'pageview';
  const src = classifySource(evt);
  const path = clip(evt.path, 255);
  const device = ['mobile', 'tablet', 'desktop'].includes(evt.device) ? evt.device : null;
  const isTouch = src.source !== 'direct';

  const existing = (await q('SELECT id, last_seen_at, interests FROM visitors WHERE id = ? LIMIT 1', [visitorId]))[0];
  if (!existing) {
    await q(
      `INSERT IGNORE INTO visitors (id, pageviews, ft_source, ft_medium, ft_campaign, ft_referrer, ft_landing, lt_source, lt_medium, lt_campaign, device)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [visitorId, type === 'pageview' ? 1 : 0, src.source, src.medium, src.campaign, clip(evt.referrer, 255), path,
        isTouch ? src.source : null, isTouch ? src.medium : null, isTouch ? src.campaign : null, device]
    );
  } else {
    const newVisit = Date.now() - new Date(existing.last_seen_at).getTime() > SESSION_GAP_MS;
    await q(
      `UPDATE visitors SET last_seen_at = NOW(), visits = visits + ?, pageviews = pageviews + ?,
         lt_source = COALESCE(?, lt_source), lt_medium = COALESCE(?, lt_medium), lt_campaign = IF(? IS NULL, lt_campaign, ?),
         device = COALESCE(?, device)
       WHERE id = ?`,
      [newVisit ? 1 : 0, type === 'pageview' ? 1 : 0, isTouch ? src.source : null, isTouch ? src.medium : null,
        isTouch ? src.source : null, isTouch ? src.campaign : null, device, visitorId]
    );
  }

  // interest scoring: a course view adds 3, a search adds 1 to that category
  if ((type === 'course_view' || type === 'search') && evt.category) {
    let interests = {};
    try { interests = existing?.interests ? JSON.parse(existing.interests) : {}; } catch { interests = {}; }
    const key = clip(evt.category, 60);
    interests[key] = (interests[key] || 0) + (type === 'course_view' ? 3 : 1);
    const top = Object.fromEntries(Object.entries(interests).sort((a, b) => b[1] - a[1]).slice(0, 12));
    await q('UPDATE visitors SET interests = ? WHERE id = ?', [JSON.stringify(top), visitorId]);
  }

  await q(
    'INSERT INTO visit_events (visitor_id, type, path, source, medium, campaign, ref_id, value) VALUES (?,?,?,?,?,?,?,?)',
    [visitorId, type, path, src.source, src.medium, src.campaign, clip(evt.refId, 64), evt.value != null ? Math.max(0, Math.round(Number(evt.value) || 0)) : null]
  );
  return { type, ...src };
}

// The attribution to copy onto a user or order: last non-direct touch,
// falling back to the first touch.
export async function attributionFor(visitorId) {
  const v = await getVisitor(visitorId);
  if (!v) return { visitorId: null, source: null, medium: null, campaign: null };
  const useLast = v.lt_source && v.lt_source !== 'direct';
  return {
    visitorId: v.id,
    source: useLast ? v.lt_source : v.ft_source,
    medium: useLast ? v.lt_medium : v.ft_medium,
    campaign: useLast ? v.lt_campaign : v.ft_campaign
  };
}

// Link a visitor to the account that just signed up / logged in.
export async function linkVisitorToUser(visitorId, userId, { signup = false } = {}) {
  if (!validVisitorId(visitorId) || !userId) return;
  await q('UPDATE visitors SET user_id = ? WHERE id = ?', [userId, visitorId]);
  if (signup) {
    const a = await attributionFor(visitorId);
    await q('UPDATE users SET visitor_id = ?, signup_source = ?, signup_campaign = ? WHERE id = ?', [visitorId, a.source, a.campaign, userId]);
    await q('INSERT INTO visit_events (visitor_id, type, source, medium, campaign, ref_id) VALUES (?,?,?,?,?,?)',
      [visitorId, 'signup', a.source, a.medium, a.campaign, String(userId)]);
  }
}

// Stamp an order with the buyer's attribution (called when the order is created).
export async function attributeOrder(orderId, visitorId) {
  if (!orderId || !validVisitorId(visitorId)) return;
  const a = await attributionFor(visitorId);
  await q('UPDATE orders SET visitor_id = ?, attr_source = ?, attr_medium = ?, attr_campaign = ? WHERE id = ? AND visitor_id IS NULL',
    [visitorId, a.source, a.medium, a.campaign, orderId]);
}

// ---------- reporting (owner/superadmin) ----------
const n = (v) => Number(v) || 0;
const rate = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export async function getTrafficReport({ days = 30 } = {}) {
  const D = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 30;
  const since = `NOW() - INTERVAL ${D} DAY`;
  const [[totals], sources, daily, landing, devices, popups, [newRet]] = await Promise.all([
    q(`SELECT COUNT(DISTINCT visitor_id) AS visitors, SUM(type = 'pageview') AS pageviews, SUM(type = 'course_view') AS courseViews
       FROM visit_events WHERE created_at >= ${since}`),
    // acquisition: visitors first seen in the window, by first-touch source
    q(`SELECT v.ft_source AS source, v.ft_medium AS medium, COALESCE(v.ft_campaign, '') AS campaign,
              COUNT(*) AS visitors,
              COUNT(DISTINCT u.id) AS signups
       FROM visitors v LEFT JOIN users u ON u.visitor_id = v.id
       WHERE v.first_seen_at >= ${since}
       GROUP BY v.ft_source, v.ft_medium, COALESCE(v.ft_campaign, '')`),
    q(`SELECT DATE(created_at) AS d, COUNT(DISTINCT visitor_id) AS visitors, SUM(type = 'pageview') AS pageviews
       FROM visit_events WHERE created_at >= CURDATE() - INTERVAL ${D - 1} DAY GROUP BY DATE(created_at) ORDER BY d`),
    q(`SELECT ft_landing AS path, COUNT(*) AS visitors FROM visitors WHERE first_seen_at >= ${since} AND ft_landing IS NOT NULL
       GROUP BY ft_landing ORDER BY visitors DESC LIMIT 8`),
    q(`SELECT COALESCE(device, 'unknown') AS device, COUNT(*) AS visitors FROM visitors WHERE last_seen_at >= ${since} GROUP BY COALESCE(device, 'unknown')`),
    q(`SELECT c.id, c.title, c.kind, c.trigger_type AS triggerType, c.audience,
              SUM(e.type = 'popup_impression') AS impressions, SUM(e.type = 'popup_click') AS clicks, SUM(e.type = 'popup_dismiss') AS dismissals,
              COUNT(DISTINCT CASE WHEN e.type = 'popup_click' THEN e.visitor_id END) AS clickers
       FROM campaigns c JOIN visit_events e ON e.ref_id = CAST(c.id AS CHAR) AND e.type LIKE 'popup_%' AND e.created_at >= ${since}
       GROUP BY c.id, c.title, c.kind, c.trigger_type, c.audience ORDER BY impressions DESC LIMIT 20`),
    q(`SELECT SUM(visits = 1) AS newVisitors, SUM(visits > 1) AS returningVisitors FROM visitors WHERE last_seen_at >= ${since}`)
  ]);

  // revenue + orders per source/campaign (orders stamped at creation)
  const orderRows = await q(
    `SELECT COALESCE(attr_source, 'unknown') AS source, COALESCE(attr_medium, '') AS medium, COALESCE(attr_campaign, '') AS campaign,
            COUNT(*) AS orders, COALESCE(SUM(amount), 0) AS revenue
     FROM orders WHERE status = 'paid' AND paid_at >= ${since} GROUP BY COALESCE(attr_source, 'unknown'), COALESCE(attr_medium, ''), COALESCE(attr_campaign, '')`);

  // purchases by visitors who clicked a popup (within 7 days after the click)
  const popupConv = popups.length ? await q(
    `SELECT e.ref_id AS id, COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(o.amount), 0) AS revenue
     FROM visit_events e JOIN orders o ON o.visitor_id = e.visitor_id AND o.status = 'paid'
       AND o.paid_at >= e.created_at AND o.paid_at <= e.created_at + INTERVAL 7 DAY
     WHERE e.type = 'popup_click' AND e.created_at >= ${since} GROUP BY e.ref_id`) : [];

  const key = (r) => `${r.source}|${r.medium || ''}|${r.campaign || ''}`;
  const merged = new Map();
  for (const r of sources) merged.set(key(r), { source: r.source || 'direct', medium: r.medium || '', campaign: r.campaign || '', visitors: n(r.visitors), signups: n(r.signups), orders: 0, revenue: 0 });
  for (const r of orderRows) {
    const k = key(r);
    const row = merged.get(k) || { source: r.source, medium: r.medium, campaign: r.campaign, visitors: 0, signups: 0, orders: 0, revenue: 0 };
    row.orders += n(r.orders); row.revenue += n(r.revenue);
    merged.set(k, row);
  }
  const channels = [...merged.values()].map((r) => ({
    ...r,
    signupRate: rate(r.signups, r.visitors),
    purchaseRate: rate(r.orders, r.visitors),
    revenuePerVisitor: r.visitors ? Math.round(r.revenue / r.visitors) : 0
  })).sort((a, b) => b.revenue - a.revenue || b.visitors - a.visitors);

  // "best" ad campaign: paid/campaign traffic with ≥ 5 visitors, ranked by
  // revenue per visitor, then purchase rate, then signup rate
  const adRows = channels.filter((r) => r.campaign || ['cpc', 'paid-social', 'campaign', 'email'].includes(r.medium));
  const ranked = adRows.filter((r) => r.visitors >= 5).sort((a, b) => b.revenuePerVisitor - a.revenuePerVisitor || b.purchaseRate - a.purchaseRate || b.signupRate - a.signupRate);

  return {
    days: D,
    totals: {
      visitors: n(totals.visitors), pageviews: n(totals.pageviews), courseViews: n(totals.courseViews),
      newVisitors: n(newRet?.newVisitors), returning: n(newRet?.returningVisitors)
    },
    daily: Array.from({ length: D }, (_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (D - 1 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const r = daily.find((x) => String(x.d).slice(0, 10) === key);
      return { date: key, visitors: n(r?.visitors), pageviews: n(r?.pageviews) };
    }),
    channels,
    ads: adRows,
    bestAd: ranked[0] || null,
    landing: landing.map((r) => ({ path: r.path, visitors: n(r.visitors) })),
    devices: devices.map((r) => ({ device: r.device, visitors: n(r.visitors) })),
    popups: popups.map((r) => {
      const conv = popupConv.find((x) => String(x.id) === String(r.id));
      return {
        id: r.id, title: r.title, kind: r.kind, triggerType: r.triggerType, audience: r.audience,
        impressions: n(r.impressions), clicks: n(r.clicks), dismissals: n(r.dismissals),
        ctr: rate(n(r.clicks), n(r.impressions)), orders: n(conv?.orders), revenue: n(conv?.revenue)
      };
    })
  };
}
