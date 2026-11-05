'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';

export default function DemoClassPage() {
  const { t, auth, api, showToast } = useApp();
  const { slug } = useParams();
  const router = useRouter();
  const [dc, setDc] = useState(undefined); // undefined=loading, null=not found
  const [busy, setBusy] = useState(false);

  const load = () => api.getDemoClass(slug).then(setDc).catch(() => setDc(null));
  useEffect(() => { load(); }, [slug]);

  const register = async () => {
    if (!auth) { router.push(`/register?ref=`); return; }
    setBusy(true);
    try { const updated = await api.registerDemoClass(slug); setDc(updated); showToast(t.dcRegisteredMsg); }
    catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  const recorded = dc && dc.status === 'recorded';

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 90px' }}>
        <Link href="/landing" style={{ color: 'var(--muted)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>{t.dcBack}</Link>

        {dc === undefined ? (
          <div style={{ color: 'var(--faint)', textAlign: 'center', padding: 60 }}>…</div>
        ) : dc === null ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>{t.dcNotFound}</div>
            <button className="btn-primary" style={{ marginTop: 18 }} onClick={() => router.push('/landing')}>{t.dcBack}</button>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <span className={`tag ${recorded ? 'chip-stone' : 'chip-orange'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {recorded ? `📺 ${t.dcRecordedBadge}` : <>🔴 {t.dcUpcomingBadge}</>}
            </span>
            <h1 style={{ fontSize: 'clamp(23px,3.6vw,32px)', fontWeight: 700, lineHeight: 1.25, margin: '12px 0 8px' }}>{dc.title}</h1>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 20 }}>
              👤 {dc.instructor} · 📅 {dc.schedule} · 👥 {(dc.learners || 0).toLocaleString('en-IN')}
            </div>

            {/* video (recorded) or schedule banner (upcoming) */}
            {recorded ? (
              auth ? (
                <video controls playsInline preload="metadata" style={{ width: '100%', borderRadius: 0, background: '#000', aspectRatio: '16 / 9' }} src={dc.videoUrl}>
                  {t.dcWatchRec}
                </video>
              ) : (
                <div className="placeholder-art" style={{ height: 300, borderRadius: 0, display: 'grid', placeItems: 'center', textAlign: 'center', gap: 10 }}>
                  <div style={{ fontSize: 34 }}>🔒</div>
                  <div style={{ fontWeight: 700 }}>{t.dcJoinToWatch}</div>
                  <button className="btn-primary" onClick={() => router.push('/login?returnTo=' + encodeURIComponent(`/demo/${slug}`))}>{t.loginBtn} →</button>
                </div>
              )
            ) : (
              <div style={{ background: 'var(--coal)', color: '#fff', borderRadius: 0, padding: '26px 28px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>{t.dcSchedule}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{dc.schedule}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>{dc.registrations} {t.dcRegisterCount}</div>
                </div>
                <button
                  onClick={register}
                  disabled={busy || dc.registered}
                  style={{ border: 'none', background: dc.registered ? 'rgba(255,255,255,.18)' : 'var(--brand)', color: '#fff', borderRadius: 0, padding: '14px 26px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: dc.registered ? 'default' : 'pointer' }}
                >
                  {dc.registered ? t.dcRegistered : `${t.dcRegister} →`}
                </button>
              </div>
            )}

            {/* description */}
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>{t.dcAbout}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: '#292524', whiteSpace: 'pre-line' }}>{dc.description}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
