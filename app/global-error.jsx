'use client';

// Last-resort boundary for errors thrown by the root layout itself. It
// replaces the whole document, so it carries its own <html>/<body> and
// inline styles (globals.css may not have loaded).
export default function GlobalError({ reset }) {
  return (
    <html lang="bn">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#FBF8F1', color: '#0A0A0A', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <main style={{ border: '3px solid #0A0A0A', boxShadow: '8px 8px 0 #0A0A0A', background: '#fff', padding: 32, maxWidth: 440, textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px', textTransform: 'uppercase' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 20px' }}>আমাদের দিকে একটি সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
          <button type="button" onClick={() => reset()} style={{ font: 'inherit', fontWeight: 700, padding: '12px 22px', border: '3px solid #0A0A0A', background: '#6EEB83', boxShadow: '4px 4px 0 #0A0A0A', cursor: 'pointer' }}>Try again / আবার চেষ্টা করুন</button>
        </main>
      </body>
    </html>
  );
}
