import StatusScreen from '@/components/site/StatusScreen';
import { getCopy } from '@/lib/lang';

export const metadata = { title: 'Page not found', robots: { index: false } };

// Site-wide 404: unknown URLs and notFound() calls without a closer boundary.
export default async function NotFound() {
  const { lang } = await getCopy();
  const en = lang === 'en';
  return (
    <StatusScreen code={404} lang={lang}
      title={en ? 'This page wandered off' : 'পেজটি খুঁজে পাওয়া যায়নি'}
      message={en ? 'The link may be old or mistyped. Try the course catalog — what you need is probably there.' : 'লিংকটি পুরোনো বা ভুল হতে পারে। কোর্স তালিকা দেখুন — যা খুঁজছেন সম্ভবত সেখানেই আছে।'} />
  );
}
