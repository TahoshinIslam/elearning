'use client';

import { useApp } from '@/context/AppContext';
import LegalPage from '@/components/LegalPage';

export default function AboutPage() {
  const { lang, centerDisplay } = useApp();
  const bn = lang === 'bn';

  return (
    <LegalPage
      title={bn ? 'আমাদের সম্পর্কে' : 'About us'}
      intro={bn
        ? `${centerDisplay} একটি আধুনিক শিক্ষা প্রতিষ্ঠান, যেখানে লাইভ ক্লাস, রেকর্ডেড কোর্স এবং ব্যক্তিগত মেন্টরিং একসাথে পাওয়া যায়।`
        : `${centerDisplay} is a modern learning center bringing live classes, recorded courses and personal mentoring together in one place.`}
      sections={[
        {
          heading: bn ? 'আমাদের লক্ষ্য' : 'Our mission',
          paras: [bn
            ? 'প্রতিটি শিক্ষার্থীর কাছে মানসম্মত শিক্ষা সহজলভ্য করে তোলা — ভৌগোলিক অবস্থান বা আর্থিক সীমাবদ্ধতা যাই হোক না কেন।'
            : 'To make quality education accessible to every student — regardless of location or budget.']
        },
        {
          heading: bn ? 'আমরা যা করি' : 'What we do',
          paras: [bn
            ? 'HSC, SSC এবং ভর্তি পরীক্ষার জন্য লাইভ ও রেকর্ডেড কোর্স, নিয়মিত মডেল টেস্ট, কুইজ এবং অ্যাসাইনমেন্ট রিভিউ।'
            : 'Live and recorded courses for HSC, SSC and admission tests, regular model tests, quizzes and assignment reviews.']
        }
      ]}
    />
  );
}
