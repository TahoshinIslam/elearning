// Category display name: the admin-managed categories table first, then the
// built-in labels below, then the raw slug. Kept tiny on purpose — it ships
// to the browser with every course card (the full dictionary does not).
const BUILT_IN = {
  bn: { physics: 'ফিজিক্স', math: 'গণিত', skills: 'স্কিল' },
  en: { physics: 'Physics', math: 'Math', skills: 'Skills' }
};

export function categoryLabel(lang, slug, name) {
  if (name) return name;
  if (!slug) return '';
  return BUILT_IN[lang]?.[slug] || BUILT_IN.bn[slug] || slug.replace(/-/g, ' ');
}
