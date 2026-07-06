'use client';

import { useApp } from '@/context/AppContext';

const STUDENT_ID = 1;

export default function ClassesTab({ onOpenPay }) {
  const { t, lang, centerDisplay, studentPaid, showToast, enrollments, liveClasses, api } = useApp();

  // classes for the batches this student is enrolled in
  const myBatchIds = new Set(enrollments.filter((e) => e.studentId === STUDENT_ID).map((e) => e.batchId));
  const myClasses = liveClasses.filter((c) => myBatchIds.has(c.batchId));
  const live = myClasses.filter((c) => c.status === 'live');
  const upcoming = myClasses.filter((c) => c.status === 'scheduled');
  const past = myClasses.filter((c) => c.status === 'ended');

  const join = async (c) => {
    // server verifies: authenticated → enrolled → class is LIVE, then returns the Zoom URL
    try {
      const { url } = await api.joinClass(c.id, STUDENT_ID);
      showToast(t.lcJoinToast);
      if (url) window.open(url, '_blank', 'noopener');
    } catch (err) {
      const reason = err?.data?.error;
      showToast(reason === 'not_enrolled' ? t.lcErrNotEnrolled : t.lcErrNotStarted);
    }
  };

  const watchRec = (c) => {
    if (c.recordingUrl) { showToast(t.playRec); window.open(c.recordingUrl, '_blank', 'noopener'); }
    else showToast(t.lcNoRec);
  };

  const Card = ({ c }) => (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          {c.status === 'live' && <span className="live-badge"><span className="live-dot" />{t.lcLive}</span>}
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{c.classDate} · {c.startTime}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.4 }}>{c.title}</div>
      </div>
      {c.status === 'live' && (
        <button className="btn-primary" style={{ padding: '12px 22px' }} onClick={() => join(c)}>{t.lcJoin} →</button>
      )}
      {c.status === 'scheduled' && (
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', background: 'var(--line-softer)', borderRadius: 10, padding: '10px 16px' }}>
          {t.lcStartsAt} {c.startTime}
        </span>
      )}
      {c.status === 'ended' && (
        c.recordingUrl
          ? <button className="btn-ghost-sm" onClick={() => watchRec(c)}>▶ {t.lcWatchRec}</button>
          : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-deep)' }}>{t.classDone}</span>
      )}
    </div>
  );

  return (
    <div className="anim-in">
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>{t.greet}</div>
        <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 6 }}>{centerDisplay} · {t.sModuleNow}</div>
      </div>

      {/* fee due banner / paid confirmation */}
      {!studentPaid ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--coal)', color: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t.dueNotice}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>জুলাই {new Date().getFullYear()} · HSC ফিজিক্স — ব্যাচ ৩</div>
          </div>
          <div className="display" style={{ fontSize: 26 }}>৳1,500</div>
          <button
            onClick={onOpenPay}
            style={{ border: 'none', background: 'var(--bkash)', color: '#fff', borderRadius: 11, padding: '12px 22px', fontSize: 14.5, fontWeight: 700 }}
          >
            {t.payNow} (bKash)
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--green-chip-bg)', color: 'var(--green-chip-fg)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, fontWeight: 700, fontSize: 14.5 }}>
          ✓ {t.paySuccess}
        </div>
      )}

      {/* live now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '24px 0 12px' }}>
        <span className="live-badge"><span className="live-dot" />{t.lcLive}</span>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{t.liveClasses}</h3>
      </div>
      {live.length ? live.map((c) => <Card key={c.id} c={c} />) : <div className="card" style={{ padding: 16, textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>{t.lcNoClasses}</div>}

      {/* upcoming */}
      <h3 style={{ margin: '26px 0 12px', fontSize: 17, fontWeight: 700 }}>{t.lcUpcoming}</h3>
      {upcoming.length ? upcoming.map((c) => <Card key={c.id} c={c} />) : <div className="card" style={{ padding: 16, textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>{t.lcNoClasses}</div>}

      {/* past */}
      {past.length > 0 && (
        <>
          <h3 style={{ margin: '26px 0 12px', fontSize: 17, fontWeight: 700 }}>{t.lcPast}</h3>
          {past.map((c) => <Card key={c.id} c={c} />)}
        </>
      )}
    </div>
  );
}
