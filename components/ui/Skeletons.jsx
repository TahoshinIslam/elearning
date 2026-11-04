// Route-level loading states in the neo-brutalist style: outlined blocks
// with sliding stripes (.skeleton). Purely presentational and server-safe.
const TINTS = ['sk-yellow', 'sk-cyan', 'sk-pink', ''];

export function HeaderSkeleton() {
  return (
    <div className="site-header" aria-hidden="true">
      <div className="container site-header-inner">
        <div className="skeleton sk-yellow" style={{ width: 190, height: 36 }} />
        <div className="skeleton desktop-only" style={{ flex: 1, maxWidth: 460, height: 44 }} />
        <div className="skeleton" style={{ width: 120, height: 40, marginLeft: 'auto' }} />
      </div>
    </div>
  );
}

export function CardSkeleton({ i = 0 }) {
  return (
    <div className="sk-card" aria-hidden="true">
      <div className={`skeleton ${TINTS[i % TINTS.length]}`} style={{ aspectRatio: '4 / 3' }} />
      <div className="skeleton" style={{ height: 14, width: '40%' }} />
      <div className="skeleton" style={{ height: 20, width: '85%' }} />
      <div className="skeleton" style={{ height: 14, width: '55%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <div className="skeleton" style={{ height: 22, width: 80 }} />
        <div className="skeleton sk-yellow" style={{ height: 34, width: 34 }} />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ n = 8 }) {
  return (
    <div className="grid-cards">
      {Array.from({ length: n }).map((_, i) => <CardSkeleton key={i} i={i} />)}
    </div>
  );
}

export function PageSkeleton({ label = 'Loading' }) {
  return (
    <>
      <HeaderSkeleton />
      <main id="main" className="container section" aria-busy="true" aria-label={label}>
        <div className="skeleton sk-cyan" style={{ height: 30, width: 160, marginBottom: 18 }} />
        <div className="skeleton" style={{ height: 'clamp(44px, 6vw, 84px)', width: 'min(820px, 100%)', marginBottom: 14 }} />
        <div className="skeleton sk-yellow" style={{ height: 'clamp(44px, 6vw, 84px)', width: 'min(520px, 80%)', marginBottom: 36, transform: 'rotate(-1.5deg)' }} />
        <CardGridSkeleton n={8} />
      </main>
    </>
  );
}

export function WorkspaceSkeleton({ label = 'Loading' }) {
  return (
    <>
      <HeaderSkeleton />
      <div className="shell" aria-busy="true" aria-label={label}>
        <aside className="sidebar desktop-only" style={{ display: 'flex', flexDirection: 'column' }} aria-hidden="true">
          <div className="skeleton sk-cyan" style={{ height: 92, marginBottom: 14 }} />
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className={`skeleton ${i === 0 ? 'sk-yellow' : ''}`} style={{ height: 44, marginBottom: 6 }} />)}
        </aside>
        <main id="main" className="dash-main">
          <div className="skeleton" style={{ height: 14, width: 140, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 42, width: 'min(360px, 80%)', marginBottom: 26 }} />
          <div className="stat-tiles" style={{ marginBottom: 26 }}>
            {TINTS.map((t, i) => <div key={i} className="sk-card"><div className={`skeleton ${t}`} style={{ height: 34, width: '45%', margin: 0, border: 0 }} /><div className="skeleton" style={{ height: 12, width: '70%' }} /></div>)}
          </div>
          <div className="sk-card" style={{ padding: 0, gap: 0 }}>
            <div className="skeleton sk-yellow" style={{ height: 46, margin: 0, borderWidth: '0 0 3px 0' }} />
            {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 16px', borderTop: i ? '1.5px solid var(--ink)' : 0 }}><div className="skeleton" style={{ height: 14, flex: 2 }} /><div className="skeleton" style={{ height: 14, flex: 1 }} /><div className="skeleton" style={{ height: 14, flex: 1 }} /></div>)}
          </div>
        </main>
      </div>
    </>
  );
}

export function CourseSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <main id="main" aria-busy="true">
        <div className="course-hero"><div className="container">
          <div className="skeleton" style={{ height: 14, width: 220, marginBottom: 18, opacity: .5 }} />
          <div className="skeleton sk-yellow" style={{ height: 48, width: 'min(680px, 90%)', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 18, width: 'min(520px, 80%)', opacity: .5 }} />
        </div></div>
        <div className="container section"><div className="course-layout">
          <div className="stack" style={{ '--gap': '18px' }}>
            {[0, 1, 2].map((i) => <div key={i} className="sk-card"><div className="skeleton" style={{ height: 22, width: '40%', margin: 0, border: 0 }} /><div className="skeleton" style={{ height: 14 }} /><div className="skeleton" style={{ height: 14, width: '80%' }} /></div>)}
          </div>
          <div className="sk-card"><div className="skeleton sk-pink" style={{ aspectRatio: '4 / 3' }} /><div className="skeleton" style={{ height: 36, width: '50%' }} /><div className="skeleton sk-yellow" style={{ height: 50 }} /></div>
        </div></div>
      </main>
    </>
  );
}
