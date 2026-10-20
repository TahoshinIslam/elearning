'use client';

import Icon from '@/components/Icon';

// App-wide fallback (e.g. the database is unreachable). Server details are
// logged on the server; the visitor gets an honest message and a retry.
export default function AppError({ reset }) {
  const en = typeof document !== 'undefined' && document.documentElement.lang === 'en';
  return (
    <main id="main" className="container section">
      <div className="surface state" role="alert">
        <div className="state-icon"><Icon name="alert" size={24} /></div>
        <h1 className="h3">{en ? 'Something went wrong on our side' : 'আমাদের দিকে একটি সমস্যা হয়েছে'}</h1>
        <p>{en ? 'Please try again in a moment.' : 'কিছুক্ষণ পর আবার চেষ্টা করুন।'}</p>
        <button type="button" className="btn btn-primary" onClick={() => reset()}><Icon name="refresh" size={16} />{en ? 'Try again' : 'আবার চেষ্টা করুন'}</button>
      </div>
    </main>
  );
}
