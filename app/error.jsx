'use client';

import { useEffect } from 'react';
import StatusScreen from '@/components/site/StatusScreen';
import Icon from '@/components/Icon';

// App-wide 500 boundary. The server logs the real error; the visitor gets a
// plain message, a retry and a reference (digest) support can look up.
export default function AppError({ error, reset }) {
  const en = typeof document !== 'undefined' && document.documentElement.lang === 'en';
  useEffect(() => {
    try {
      navigator.sendBeacon?.('/api/log', new Blob([JSON.stringify({ kind: 'boundary', digest: error?.digest, path: location.pathname, message: error?.message })], { type: 'application/json' }));
    } catch { /* ignore */ }
  }, [error]);
  return (
    <StatusScreen code={500} lang={en ? 'en' : 'bn'} reference={error?.digest}
      title={en ? 'Something broke on our side' : 'আমাদের দিকে একটি সমস্যা হয়েছে'}
      message={en ? 'It’s not you. We’ve logged it — please try again in a moment.' : 'এটা আপনার ভুল নয়। আমরা সমস্যাটি নথিভুক্ত করেছি — একটু পরে আবার চেষ্টা করুন।'}
      actions={<button type="button" className="btn btn-dark btn-lg" onClick={() => reset()}><Icon name="refresh" size={18} />{en ? 'Try again' : 'আবার চেষ্টা করুন'}</button>} />
  );
}
