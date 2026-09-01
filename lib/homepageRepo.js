// ============================================================
// Homepage CMS data-access. Editable landing sections stored as JSON blobs;
// the landing page overlays these onto its built-in defaults.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const SECTIONS = ['hero', 'testimonials', 'partners', 'stats', 'faqs'];

// Returns { hero:{...}|null, testimonials:[...]|null, partners:[...]|null, stats:[...]|null }.
export async function getHomepage() {
  const rows = await q('SELECT section, data FROM homepage_content');
  const out = {};
  for (const s of SECTIONS) out[s] = null;
  for (const r of rows) {
    try { out[r.section] = JSON.parse(r.data); } catch { out[r.section] = null; }
  }
  return out;
}

export async function saveSection(body) {
  const section = body.section;
  if (!SECTIONS.includes(section)) throw new HttpError(400, { error: 'unknown_section' });
  // `data` may be an object (hero) or array (testimonials/partners/stats)
  const json = JSON.stringify(body.data ?? null);
  await q(
    'INSERT INTO homepage_content (section, data) VALUES (?,?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
    [section, json]
  );
  return getHomepage();
}
