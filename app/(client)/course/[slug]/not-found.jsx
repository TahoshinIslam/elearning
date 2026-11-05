import StatusScreen from '@/components/site/StatusScreen';
import { getCopy } from '@/lib/lang';

export default async function CourseNotFound() {
  const { lang } = await getCopy();
  const en = lang === 'en';
  return (
    <StatusScreen code={404} lang={lang}
      title={en ? 'This course isn’t available' : 'এই কোর্সটি পাওয়া যাচ্ছে না'}
      message={en ? 'It may have been unpublished or the link changed. Browse the catalog for similar courses.' : 'কোর্সটি হয়তো সরানো হয়েছে বা লিংক বদলেছে। একই ধরনের কোর্স ক্যাটালগে দেখুন।'} />
  );
}
