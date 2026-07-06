'use client';

import { useApp } from '@/context/AppContext';
import { todayClasses, teacherTasks } from '@/lib/teacherData';

export default function TeacherOverview({ onGoTab }) {
  const { t, lang, auth, showToast } = useApp();
  const bn = lang === 'bn';
  const name = auth?.role === 'teacher' && auth.name ? auth.name : 'আবরার হায়দার';
  const classes = todayClasses(bn);
  const tasks = teacherTasks(bn);
  const pending = tasks.filter((x) => !x.done).length;

  const stat = (label, value, color) => (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div className="stat-label">{label}</div>
      <div className="display" style={{ fontSize: 34, marginTop: 4, color }}>{value}</div>
    </div>
  );

  return (
    <div className="anim-in">
      <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>{t.tGreet}, {name}!</h2>
      <div style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 22 }}>{t.tTodayClasses}</div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 26 }}>
        <div style={{ background: 'var(--coal)', color: '#fff', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{t.tMyStudents}</div>
          <div className="display" style={{ fontSize: 34, marginTop: 4 }}>32</div>
        </div>
        {stat(t.tMyBatches, 1)}
        {stat(t.tClassesWeek, 4)}
        {stat(t.tPendingTasks, pending, 'var(--brand)')}
      </div>

      {/* today's classes */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t.tTodayClasses}</div>
          <button className="btn-ghost-sm" onClick={() => onGoTab('routine')}>{t.tWeeklyRoutine} →</button>
        </div>
        {classes.length === 0 && (
          <div style={{ padding: '20px', color: 'var(--faint)', fontSize: 14 }}>{t.tNoClassToday}</div>
        )}
        {classes.map((c) => (
          <div key={c.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 74, fontWeight: 700, fontSize: 13.5, color: 'var(--ink-soft)' }}>{c.time}</div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                {c.live && (
                  <span className="live-badge"><span className="live-dot" />LIVE</span>
                )}
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>{c.title}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>{c.batch} · {t.tRoom}: {c.room}</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => showToast(bn ? 'ক্লাস শুরু হচ্ছে…' : 'Starting class…')}
            >
              {t.tStartClass} →
            </button>
          </div>
        ))}
      </div>

      {/* pending tasks preview */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t.tPendingTasks}</div>
          <button className="btn-ghost-sm" onClick={() => onGoTab('tasks')}>{t.tTasks} →</button>
        </div>
        {tasks.filter((x) => !x.done).slice(0, 3).map((x) => (
          <div key={x.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{x.title}</div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>{x.batch}</div>
            </div>
            <span className="chip chip-due">{t.tDue}: {x.due}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
