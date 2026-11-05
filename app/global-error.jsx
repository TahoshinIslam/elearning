'use client';

import './globals.css';
import { useEffect } from 'react';
import StatusScreen from '@/components/site/StatusScreen';
import Icon from '@/components/Icon';

// Last-resort boundary for errors in the root layout itself: it replaces the
// whole document, so it brings its own <html>/<body> and stylesheet.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    try { navigator.sendBeacon?.('/api/log', new Blob([JSON.stringify({ kind: 'global', digest: error?.digest, path: location.pathname, message: error?.message })], { type: 'application/json' })); } catch { /* ignore */ }
  }, [error]);
  return (
    <html lang="bn">
      <body>
        <StatusScreen code={500} lang="bn" reference={error?.digest}
          title="আমাদের দিকে একটি সমস্যা হয়েছে · Something went wrong"
          message="কিছুক্ষণ পর আবার চেষ্টা করুন। Please try again in a moment."
          actions={<button type="button" className="btn btn-dark btn-lg" onClick={() => reset()}><Icon name="refresh" size={18} />আবার চেষ্টা · Retry</button>} />
      </body>
    </html>
  );
}
