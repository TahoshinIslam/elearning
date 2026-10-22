'use client';

import { useApp } from '@/context/AppContext';
import TaxonomyManager from '@/components/owner/TaxonomyManager';

export default function CategoriesTab() {
  const { lang, showToast } = useApp();
  const en = lang === 'en';
  return (
    <TaxonomyManager lang={lang} url="/api/categories" catalogParam="category" withIcon showToast={showToast}
      addLabel={en ? 'New subject' : 'নতুন বিষয়'}
      emptyText={en ? 'No subjects yet.' : 'এখনও কোনো বিষয় নেই।'}
      deleteNote={en ? 'Order here is the order on the homepage “Browse by subject” section. A subject still used by courses can’t be deleted.' : 'এখানকার ক্রমেই হোমপেজের “বিষয়ভিত্তিক কোর্স” অংশে দেখানো হয়। কোনো কোর্স ব্যবহার করলে বিষয়টি মোছা যাবে না।'} />
  );
}
