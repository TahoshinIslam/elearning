// Catalog helpers — learning-mode and category labels/chips.

export const MODES = ['live', 'recorded', 'hybrid', 'free', 'workshop', 'webinar'];

export const modeLabel = (t, m) => t[`mode_${m}`] || m;
export const modeChip = (m) =>
  ({ live: 'chip-orange', recorded: 'chip-violet', hybrid: 'chip-green', free: 'chip-stone', workshop: 'chip-orange', webinar: 'chip-violet' }[m] || 'chip-stone');

export const catLabel = (t, c) => t[`cat_${c}`] || c;

// icon (Icon component name) + accent per category, used by the mega-menu / category panels
export const CAT_META = {
  physics: { icon: 'zap', color: '#1D4ED8' },
  math:    { icon: 'compass', color: '#0E9F6E' },
  skills:  { icon: 'bulb', color: '#E8590C' }
};
export const catMeta = (c) => CAT_META[c] || { icon: 'book', color: '#7C3AED' };

// group published courses by category → [{ key, courses }]; 'all' bucket first
export function courseCategories(published) {
  const map = new Map();
  for (const c of published) {
    const k = c.category || 'skills';
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(c);
  }
  return [{ key: 'all', courses: published }, ...[...map.entries()].map(([key, courses]) => ({ key, courses }))];
}
