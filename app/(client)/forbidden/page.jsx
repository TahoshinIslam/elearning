import StatusScreen from '@/components/site/StatusScreen';
import { getCopy } from '@/lib/lang';
import { currentSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/rbac';

export const metadata = { title: 'No access', robots: { index: false } };

// 403: signed in, but this area isn't part of the account's role.
export default async function Forbidden() {
  const { lang } = await getCopy();
  const session = await currentSession();
  const en = lang === 'en';
  return (
    <StatusScreen code={403} lang={lang} homeHref={ROLE_HOME[session?.role] || '/'}
      title={en ? 'This area isn’t open to your account' : 'এই অংশে আপনার অ্যাকাউন্টের প্রবেশাধিকার নেই'}
      message={en ? 'If you think you should have access, ask an owner to grant it from Admin → Access & permissions.' : 'প্রবেশাধিকার পাওয়া উচিত মনে হলে মালিককে অ্যাডমিন → অ্যাক্সেস ও অনুমতি থেকে অনুমতি দিতে বলুন।'} />
  );
}
