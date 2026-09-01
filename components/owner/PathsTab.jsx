'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};

export default function PathsTab() {
  const { t, api, showToast, courses } = useApp();
  const [paths, setPaths] = useState([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [addSel, setAddSel] = useState({}); // { [pathId]: courseId }

  const load = () => api.getPaths().then(setPaths).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) { showToast(t.pathTitle); return; }
    try { setPaths(await api.createPath(form)); setForm({ title: '', description: '' }); showToast(t.pathCreated); }
    catch { showToast(t.errGeneric); }
  };
  const addCourse = async (pathId) => {
    const courseId = Number(addSel[pathId]);
    if (!courseId) return;
    setPaths(await api.setPathCourse(pathId, courseId, false));
  };
  const removeCourse = async (pathId, courseId) => setPaths(await api.setPathCourse(pathId, courseId, true));
  const remove = async (id) => setPaths(await api.deletePath(id));

  const published = courses.filter((c) => c.published);

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.pathMgmt}</div>

      {/* create */}
      <div className="panel" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{t.pathNew}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 12, alignItems: 'end' }}>
          <div><label className="label">{t.pathTitle}</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={fieldStyle} /></div>
          <div><label className="label">{t.pathDesc}</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={fieldStyle} /></div>
          <button className="btn-primary" style={{ borderRadius: 10, height: 38 }} onClick={create}>＋ {t.pathCreate}</button>
        </div>
      </div>

      {/* list */}
      {paths.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.pathsEmpty}</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {paths.map((p) => {
            const inPath = new Set(p.courses.map((c) => c.id));
            const available = published.filter((c) => !inPath.has(c.id));
            return (
              <div key={p.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.title}</div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{p.slug}</span>
                  <button onClick={() => remove(p.id)} className="chip" style={{ marginLeft: 'auto', cursor: 'pointer', border: '1.5px solid var(--line)', color: 'var(--danger,#c92a2a)' }}>{t.pathDelete}</button>
                </div>

                {p.courses.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--faint)', marginBottom: 10 }}>{t.pathNoCourses}</div>
                ) : (
                  <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
                    {p.courses.map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                        <span style={{ width: 20, color: 'var(--brand-deep)', fontWeight: 800 }}>{i + 1}.</span>
                        <span style={{ flex: 1 }}>{c.title}</span>
                        <button onClick={() => removeCourse(p.id, c.id)} className="btn-ghost-sm" aria-label="remove">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={addSel[p.id] || ''} onChange={(e) => setAddSel((s) => ({ ...s, [p.id]: e.target.value }))} style={{ ...fieldStyle, width: 'auto', flex: 1 }}>
                    <option value="">— {t.pathAddCourse} —</option>
                    {available.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button className="btn-dark" style={{ borderRadius: 9 }} onClick={() => addCourse(p.id)}>＋</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
