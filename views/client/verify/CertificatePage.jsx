'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

export default function VerifyPage() {
  const { t, lang } = useApp();
  const { certNo } = useParams();
  const [result, setResult] = useState(undefined); // undefined=loading
  const bn = lang === 'bn';

  useEffect(() => {
    fetch(`/api/certificates/verify/${certNo}`).then((r) => r.json()).then(setResult).catch(() => setResult({ valid: false }));
  }, [certNo]);

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 90px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{bn ? 'সার্টিফিকেট যাচাই' : 'Certificate verification'}</h1>
        <div className="mono" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>{certNo}</div>

        {result === undefined ? (
          <div style={{ color: 'var(--faint)', padding: 40, textAlign: 'center' }}>…</div>
        ) : result.valid ? (
          <div className="panel" style={{ padding: 30, textAlign: 'center', border: '2px solid var(--green)' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--green-chip-bg)', color: '#16a34a', display: 'grid', placeItems: 'center', fontSize: 26, margin: '0 auto 14px' }}>✓</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)', marginBottom: 18 }}>{bn ? 'বৈধ সার্টিফিকেট' : 'Valid certificate'}</div>
            <div style={{ display: 'grid', gap: 10, textAlign: 'left', maxWidth: 340, margin: '0 auto' }}>
              <Row label={bn ? 'শিক্ষার্থী' : 'Student'} value={result.studentName} />
              <Row label={bn ? 'কোর্স' : 'Course'} value={result.courseTitle} />
              <Row label={bn ? 'ইস্যুর তারিখ' : 'Issued'} value={result.issuedAt} />
              <Row label={bn ? 'সম্পূর্ণতা' : 'Completion'} value={`${result.completion}%`} />
            </div>
          </div>
        ) : (
          <div className="panel" style={{ padding: 30, textAlign: 'center', border: '2px solid #dc2626' }}>
            <div style={{ fontSize: 40 }}>✕</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#dc2626', marginTop: 8 }}>{bn ? 'সার্টিফিকেটটি পাওয়া যায়নি' : 'Certificate not found'}</div>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
      <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 13.5, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
