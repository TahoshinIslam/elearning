import { getLang } from '@/lib/lang';
import LegalPage from '@/components/LegalPage';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
  const lang = getLang();
  const bn = lang === 'bn';

  return (
    <LegalPage
      title={bn ? 'শর্তাবলী' : 'Terms & Conditions'}
      intro={bn
        ? 'আমাদের প্ল্যাটফর্ম ব্যবহার করার আগে অনুগ্রহ করে নিচের শর্তগুলো পড়ে নিন।'
        : 'Please read these terms carefully before using our platform.'}
      sections={[
        {
          heading: bn ? 'এনরোলমেন্ট ও পেমেন্ট' : 'Enrollment & payment',
          paras: [bn
            ? 'কোর্সে ভর্তি নিশ্চিত হয় পেমেন্ট সম্পন্ন হওয়ার পর। ফ্রি কোর্সে কোনো পেমেন্ট প্রয়োজন নেই।'
            : 'Enrollment is confirmed after payment is completed. Free courses require no payment.']
        },
        {
          id: 'refund',
          heading: bn ? 'রিফান্ড নীতি' : 'Refund policy',
          paras: [bn
            ? 'কোর্স শুরুর ৭ দিনের মধ্যে রিফান্ডের জন্য আবেদন করা যাবে, শর্তসাপেক্ষে।'
            : 'Refunds may be requested within 7 days of the course start, subject to conditions.']
        },
        {
          heading: bn ? 'আচরণবিধি' : 'Code of conduct',
          paras: [bn
            ? 'কোর্স কন্টেন্ট শেয়ার বা পুনর্বিতরণ নিষিদ্ধ। লঙ্ঘন করলে অ্যাকাউন্ট বাতিল হতে পারে।'
            : 'Sharing or redistributing course content is prohibited. Violations may result in account suspension.']
        }
      ]}
    />
  );
}
