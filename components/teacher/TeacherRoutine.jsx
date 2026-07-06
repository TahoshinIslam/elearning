'use client';

import { useApp } from '@/context/AppContext';
import { weekRoutine } from '@/lib/teacherData';

export default function TeacherRoutine() {
  const { t, lang } = useApp();
  const bn = lang === 'bn';
  const routine = weekRoutine(bn);
  const todayIdx = 4; // Wednesday — prototype "today"

  return (
    <div className="anim-in">
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700 }}>{t.tWeeklyRoutine}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        {routine.map((col) => {
          const isToday = col.day === todayIdx;
          return (
            <div
              key={col.day}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: isToday ? '1.5px solid var(--brand)' : undefined
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  background: isToday ? 'var(--brand)' : 'var(--line-softer)',
                  color: isToday ? '#fff' : 'var(--ink-soft)'
                }}
              >
                {t.days[col.day]}
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 92 }}>
                {col.slots.length === 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '8px 0' }}>{t.tOff}</div>
                )}
                {col.slots.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 10,
                      padding: '10px 12px',
                      background: s.kind === 'live' ? 'var(--brand-wash)' : 'var(--line-soft)',
                      borderLeft: `3px solid ${s.kind === 'live' ? 'var(--brand)' : 'var(--muted)'}`
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>{s.time}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, margin: '3px 0', lineHeight: 1.35 }}>{s.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{t.tRoom}: {s.room}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
