'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};

export default function CategoriesTab() {
  const { t, api, showToast } = useApp();
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ name: '', icon: '📗' });

  const load = () => api.getCategories().then(setCats).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!f.name.trim()) { showToast(t.catName); return; }
    try { setCats(await api.createCategory(f)); setF({ name: '', icon: '📗' }); showToast(t.catCreated); }
    catch { showToast(t.errGeneric); }
  };
  const remove = async (id) => setCats(await api.deleteCategory(id));

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.catMgmt}</div>

      <div className="panel" style={{ padding: 20, marginBottom: 22, maxWidth: 480 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{t.catNew}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 10, alignItems: 'end' }}>
          <div><label className="label">{t.catIcon}</label><input value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} style={{ ...fieldStyle, textAlign: 'center' }} /></div>
          <div><label className="label">{t.catName}</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={fieldStyle} /></div>
          <button className="btn-primary" style={{ borderRadius: 10, height: 38 }} onClick={create}>＋ {t.catAdd}</button>
        </div>
      </div>

      {cats.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.catNoneYet}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(200px,100%),1fr))', gap: 12 }}>
          {cats.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{c.slug}</div>
              </div>
              <button onClick={() => remove(c.id)} title={t.catDelete} style={{ border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 16 }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
