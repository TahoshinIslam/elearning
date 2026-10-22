import { T } from '@/lib/i18n';

// Category display name: the admin-managed categories table first, then the
// built-in dictionary labels, then the raw slug.
export function categoryLabel(lang, slug, name) {
  if (name) return name;
  if (!slug) return '';
  return T[lang]?.[`cat_${slug}`] || T.bn?.[`cat_${slug}`] || slug.replace(/-/g, ' ');
}
