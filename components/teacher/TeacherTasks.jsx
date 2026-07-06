'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { teacherTasks } from '@/lib/teacherData';

const ICON = { grade: '📝', upload: '🎬', prep: '📚' };

export default function TeacherTasks() {
  const { t, lang, showToast } = useApp();
  const bn = lang === 'bn';
  const [tasks, setTasks] = useState(() => teacherTasks(bn));
  // reset when language changes
  const [prevBn, setPrevBn] = useState(bn);
  if (prevBn !== bn) {
    setPrevBn(bn);
    setTasks((cur) => teacherTasks(bn).map((x) => ({ ...x, done: cur.find((c) => c.id === x.id)?.done ?? x.done })));
  }

  const markDone = (id) => {
    setTasks((cur) => cur.map((x) => (x.id === id ? { ...x, done: true } : x)));
    showToast(bn ? 'টাস্ক সম্পন্ন হয়েছে ✓' : 'Task marked done ✓');
  };

  const typeLabel = (type) => (type === 'grade' ? t.tTaskGrade : type === 'upload' ? t.tTaskUpload : t.tTaskPrep);
  const pending = tasks.filter((x) => !x.done);
  const done = tasks.filter((x) => x.done);

  return (
    <div className="anim-in">
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700 }}>{t.tTasks}</h2>

      {pending.length === 0 && (
        <div className="card" style={{ padding: '28px', textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--green-ink)' }}>
          {t.tAllDone}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pending.map((x) => (
          <div key={x.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 22 }}>{ICON[x.type]}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                <span className="tag chip-stone">{typeLabel(x.type)}</span>
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>{x.title}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>{x.batch} · {t.tDue}: {x.due}</div>
            </div>
            <button className="btn btn-dark" onClick={() => markDone(x.id)}>{t.tMarkDone}</button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--faint)', marginBottom: 10, letterSpacing: '.04em' }}>
            {t.tDone.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {done.map((x) => (
              <div key={x.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', opacity: 0.7 }}>
                <div style={{ fontSize: 20 }}>{ICON[x.type]}</div>
                <div style={{ flex: 1, minWidth: 0, textDecoration: 'line-through', color: 'var(--muted)' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{x.title}</span>
                </div>
                <span className="chip chip-paid">✓ {t.tDone}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
