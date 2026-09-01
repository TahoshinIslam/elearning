'use client';

import { useApp } from '@/context/AppContext';
import LegalPage from '@/components/LegalPage';

export default function PrivacyPage() {
  const { lang } = useApp();
  const bn = lang === 'bn';

  return (
    <LegalPage
      title={bn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
      intro={bn
        ? 'আপনার তথ্যের গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ। এই নীতিতে আমরা কীভাবে তথ্য সংগ্রহ ও ব্যবহার করি তা ব্যাখ্যা করা হয়েছে।'
        : 'Your privacy matters to us. This policy explains how we collect and use your information.'}
      sections={[
        {
          heading: bn ? 'তথ্য সংগ্রহ' : 'Information we collect',
          paras: [bn
            ? 'আমরা শুধুমাত্র প্রয়োজনীয় তথ্য সংগ্রহ করি — নাম, ফোন নম্বর, ইমেইল এবং কোর্স সংক্রান্ত অগ্রগতি।'
            : 'We collect only what is needed — name, phone number, email and course-related progress.']
        },
        {
          heading: bn ? 'তথ্যের ব্যবহার' : 'How we use it',
          paras: [bn
            ? 'আপনার তথ্য শুধুমাত্র সেবা প্রদান, পেমেন্ট প্রক্রিয়া এবং প্রয়োজনীয় নোটিফিকেশন পাঠাতে ব্যবহৃত হয়। আমরা তৃতীয় পক্ষের কাছে তথ্য বিক্রি করি না।'
            : 'Your data is used only to provide the service, process payments and send necessary notifications. We never sell your data to third parties.']
        }
      ]}
    />
  );
}
