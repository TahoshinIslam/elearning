export default function Loading() {
  return (
    <main id="main" className="container section-tight" style={{ paddingTop: 92 }} aria-busy="true">
      <div className="skeleton" style={{ height: 36, width: 260, marginBottom: 28 }} />
      <div className="grid-cards">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="course-card">
            <div className="skeleton" style={{ aspectRatio: '16/9' }} />
            <div className="skeleton" style={{ height: 18, width: '80%' }} />
            <div className="skeleton" style={{ height: 14, width: '50%' }} />
          </div>
        ))}
      </div>
    </main>
  );
}
