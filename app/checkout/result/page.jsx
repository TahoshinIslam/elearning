'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

const COPY = {
  paid: { bn: ['✓', 'পেমেন্ট সফল হয়েছে', 'আপনার কোর্সটি এখন My Courses-এ পাওয়া যাবে।'], en: ['✓', 'Payment successful', 'Your course is now available under My Courses.'] },
  failed: { bn: ['✕', 'পেমেন্ট ব্যর্থ হয়েছে', 'কোনো টাকা কাটা হয়নি। আবার চেষ্টা করুন।'], en: ['✕', 'Payment failed', 'No money was charged. Please try again.'] },
  cancelled: { bn: ['—', 'পেমেন্ট বাতিল করা হয়েছে', 'আপনি চেকআউট বাতিল করেছেন।'], en: ['—', 'Payment cancelled', 'You cancelled the checkout.'] },
  error: { bn: ['!', 'কিছু একটা ভুল হয়েছে', 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে। সাপোর্টে যোগাযোগ করুন।'], en: ['!', 'Something went wrong', 'We could not verify the payment. Please contact support.'] }
};

function Result() {
  const router = useRouter();
  const search = useSearchParams();
  const { lang } = useApp();
  const status = search.get('status') || 'error';
  const [icon, title, body] = (COPY[status] || COPY.error)[lang === 'bn' ? 'bn' : 'en'];
  const ok = status === 'paid';

  return (
    <>
      <SiteNav />
      <div style={{ maxWidth: 480, margin: '90px auto', padding: '0 20px', textAlign: 'center' }}>
        <div
          style={{
            width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', display: 'grid', placeItems: 'center',
            fontSize: 28, background: ok ? 'var(--green-chip-bg)' : 'var(--paper)', color: ok ? '#16a34a' : 'var(--muted)'
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>{body}</div>
        <button
          className="btn-primary"
          style={{ marginTop: 26, borderRadius: 11, padding: '11px 26px' }}
          onClick={() => router.push(ok ? '/student' : '/courses')}
        >
          {ok ? (lang === 'bn' ? 'আমার কোর্সে যান →' : 'Go to My Courses →') : (lang === 'bn' ? 'কোর্সে ফিরে যান' : 'Back to courses')}
        </button>
      </div>
    </>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<SiteNav />}>
      <Result />
    </Suspense>
  );
}
