'use client';

import { useApp } from '@/context/AppContext';
import TaxonomyManager from '@/components/owner/TaxonomyManager';

export default function ClassLevelsTab() {
  const { lang, showToast } = useApp();
  const en = lang === 'en';
  return (
    <TaxonomyManager lang={lang} url="/api/classes" catalogParam="class" showToast={showToast}
      addLabel={en ? 'New class' : 'নতুন শ্রেণি'}
      emptyText={en ? 'No classes yet.' : 'এখনও কোনো শ্রেণি নেই।'}
      deleteNote={en ? 'Assign a class in each course’s Details tab. Deleting a class keeps its courses — they just become “other courses”.' : 'প্রতিটি কোর্সের “বিবরণ” ট্যাবে শ্রেণি নির্ধারণ করুন। শ্রেণি মুছলে কোর্স থাকবে — শুধু “অন্যান্য কোর্স” হিসেবে দেখাবে।'} />
  );
}
