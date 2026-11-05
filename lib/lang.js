// Server-side language resolution for server components: the `leo_lang`
// cookie (set by the language toggle), defaulting to Bangla.
import { cookies } from 'next/headers';
import { copy } from '@/lib/copy';

export const LANG_COOKIE = 'leo_lang';

export async function getLang() {
  try {
    return (await cookies()).get(LANG_COOKIE)?.value === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn';
  }
}

export async function getCopy() {
  const lang = await getLang();
  return { lang, c: copy(lang) };
}
