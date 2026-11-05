'use client';

import Icon from '@/components/Icon';

// Light ↔ dark. With no choice saved the site follows the system setting;
// a click saves the choice in the leo_theme cookie (read by the root layout,
// so the server renders the right theme — no flash on the next visit).
export function toggleTheme() {
  const root = document.documentElement;
  const current = root.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.classList.add('theme-anim');
  root.dataset.theme = next;
  document.cookie = `leo_theme=${next}; path=/; max-age=31536000; samesite=lax`;
  setTimeout(() => root.classList.remove('theme-anim'), 300);
  return next;
}

export default function ThemeToggle({ lang, className = 'theme-btn', withLabel = false }) {
  const en = lang === 'en';
  const label = en ? 'Switch light / dark mode' : 'লাইট / ডার্ক মোড বদলান';
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label={label} title={label} data-confirm="off">
      <Icon name="moon" size={withLabel ? 19 : 18} className="ic-moon" />
      <Icon name="sun" size={withLabel ? 19 : 18} className="ic-sun" />
      {withLabel && <span>{en ? 'Light / dark mode' : 'লাইট / ডার্ক মোড'}</span>}
    </button>
  );
}
