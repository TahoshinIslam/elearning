'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';
import { modeLabel, modeChip, catLabel } from '@/lib/catalog';

function Stars({ rating }) {
  const full = Math.round(rating || 0);
  return <span style={{ color: '#f59e0b' }}>{'★'.repeat(full)}<span style={{ color: 'var(--line)' }}>{'★'.repeat(5 - full)}</span></span>;
}

export default function InstructorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, loaded, teachers, courses } = useApp();

  if (!loaded) {
    return (<><SiteNav /><div style={{ maxWidth: 900, margin: '60px auto', textAlign: 'center', color: 'var(--faint)' }}>…</div></>);
  }

  const tr = teachers.find((x) => x.id === Number(id));
  if (!tr) {
    return (
      <>
        <SiteNav />
        <div style={{ maxWidth: 700, margin: '80px auto', textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>{t.instNotFound}</div>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => router.push('/courses')}>{t.catalogTitle}</button>
        </div>
      </>
    );
  }

  const taught = courses.filter((c) => c.published && c.instructorId === tr.id);

  return (
    <>
      <SiteNav />
      <div className="anim-in" style={{ maxWidth: 960, margin: '0 auto', padding: '26px 20px 80px' }}>
        {/* header */}
        <div className="panel" style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="avatar" style={{ width: 76, height: 76, flex: 'none', background: 'var(--brand)', color: '#fff', fontSize: 30 }}>{tr.name[0]}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{tr.name}</h1>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 2 }}>{tr.title} · {tr.subject}</div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 10, fontSize: 13.5, color: 'var(--muted)' }}>
              <span><Stars rating={tr.rating} /> <b style={{ color: 'var(--coal)' }}>{tr.rating}</b> ({tr.ratingCount})</span>
              <span>👥 {tr.studentsTaught?.toLocaleString('en-IN')} {t.instStudents}</span>
            </div>
          </div>
        </div>

        {/* about */}
        {tr.bio && (
          <div style={{ marginTop: 26 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>{t.instAbout}</h2>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-soft)' }}>{tr.bio}</p>
          </div>
        )}

        {/* expertise */}
        {tr.expertise?.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>{t.instExpertise}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tr.expertise.map((e) => <span key={e} className="tag chip-orange" style={{ fontSize: 12.5, padding: '5px 12px' }}>{e}</span>)}
            </div>
          </div>
        )}

        {/* courses */}
        <div style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 14px' }}>{t.instCourses}</h2>
          {taught.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--faint)' }}>{t.instNoCourses}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(240px,100%),1fr))', gap: 16 }}>
              {taught.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/course/${c.slug}`)}
                  className="card"
                  style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                >
                  <div className="placeholder-art" style={{ height: 110, fontSize: 11 }}>{c.thumb} · banner</div>
                  <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {c.mode && <span className={`tag ${modeChip(c.mode)}`}>{modeLabel(t, c.mode)}</span>}
                      {c.category && <span className="tag chip-stone">{catLabel(t, c.category)}</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>{c.title}</div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span className="display" style={{ fontSize: 16 }}>{c.price === 0 ? t.cdFree : `৳${c.price}`}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {c.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
