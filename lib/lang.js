// Server-side language resolution for server components: the `leo_lang`
// cookie (set by the language toggle), defaulting to Bangla.
import { cookies } from 'next/headers';
import { copy } from '@/lib/copy';

export const LANG_COOKIE = 'leo_lang';

export function getLang() {
  try {
    return cookies().get(LANG_COOKIE)?.value === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn';
  }
}

export function getCopy() {
  const lang = getLang();
  return { lang, c: copy(lang) };
}
