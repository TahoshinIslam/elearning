'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { copy, num, dateLabel } from '@/lib/copy';

// Certificates are issued by the server only when the course's completion
// requirement is genuinely met (POST /api/certificates re-checks).
export default function CertificatesView({ lang, courses, certificates }) {
  const c = copy(lang);
  const en = lang === 'en';
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const eligible = courses.filter((x) => !x.certified && x.completionPct != null && x.completionPct >= x.certificateThreshold);
  const claim = async (courseId) => {
    setBusy(courseId); setError(null);
    try {
      const res = await fetch('/api/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch { setError(c.err_generic); } finally { setBusy(null); }
  };
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>{c.certificates}</h1><p>{en ? 'Earned by completing the required share of a course.' : 'কোর্সের নির্ধারিত অংশ সম্পন্ন করলে পাওয়া যায়।'}</p></div></div>
      {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
      {eligible.length > 0 && (
        <section className="stack" style={{ '--gap': '10px' }}>
          <h2 className="h4">{en ? 'Ready to claim' : 'নেওয়ার জন্য প্রস্তুত'}</h2>
          {eligible.map((x) => (
            <div key={x.courseId} className="surface surface-pad row between" style={{ flexWrap: 'wrap' }}>
              <div><div className="strong">{x.title}</div><div className="small muted">{c.percentDone(x.completionPct)}</div></div>
              <button type="button" className="btn btn-primary" onClick={() => claim(x.courseId)} disabled={busy === x.courseId}>{busy === x.courseId ? <span className="spinner" aria-hidden="true" /> : <Icon name="award" size={16} />}{c.getCertificate}</button>
            </div>
          ))}
        </section>
      )}
      {certificates.length ? (
        <ul className="grid-cards" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {certificates.map((cert) => (
            <li key={cert.id} className="surface surface-pad stack" style={{ '--gap': '8px' }}>
              <Icon name="award" size={28} style={{ color: 'var(--brand)' }} />
              <h3 className="h4">{cert.courseTitle}</h3>
              <p className="small muted">{dateLabel(lang, cert.issuedAt)} · {num(lang, cert.completion)}%</p>
              <p className="xsmall mono">{cert.certNo}</p>
              <Link href={`/verify/${cert.certNo}`} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>{c.viewCertificate}</Link>
            </li>
          ))}
        </ul>
      ) : !eligible.length && (
        <div className="surface state"><div className="state-icon"><Icon name="award" size={24} /></div><p>{en ? 'No certificates yet — keep learning!' : 'এখনো কোনো সার্টিফিকেট নেই — শেখা চালিয়ে যান!'}</p><Link href="/student" className="btn btn-secondary">{c.myLearning}</Link></div>
      )}
    </div>
  );
}
