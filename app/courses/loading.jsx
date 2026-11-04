import { HeaderSkeleton, CardGridSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <main id="main" className="container section-tight" style={{ paddingTop: 40 }} aria-busy="true">
        <div className="skeleton" style={{ height: 44, width: 280, marginBottom: 10 }} />
        <div className="skeleton sk-cyan" style={{ height: 16, width: 180, marginBottom: 28 }} />
        <div className="catalog-layout">
          <div className="sk-card desktop-only" style={{ display: 'grid', alignSelf: 'start' }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`skeleton ${i % 4 === 0 ? 'sk-yellow' : ''}`} style={{ height: i % 4 === 0 ? 24 : 18, margin: 0 }} />)}
          </div>
          <CardGridSkeleton n={9} />
        </div>
      </main>
    </>
  );
}
