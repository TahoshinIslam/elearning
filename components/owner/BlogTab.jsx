'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};
const blank = { id: null, title: '', excerpt: '', body: '', category: '', author: 'Leo', status: 'published' };

export default function BlogTab() {
  const { t, api, showToast } = useApp();
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // form object or null
  const [busy, setBusy] = useState(false);

  const load = () => api.getPosts(true).then(setPosts).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setEditing((s) => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    if (!editing.title.trim()) { showToast(t.blogTitleField); return; }
    setBusy(true);
    try {
      const updated = await api.savePost(editing);
      setPosts(updated);
      setEditing(null);
      showToast(t.blogSaved);
    } catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  const remove = async (id) => setPosts(await api.deletePost(id));

  // list rows omit the body — fetch the full post before editing
  const edit = async (p) => {
    const full = await api.getPost(p.slug);
    setEditing({ ...blank, ...p, ...(full || {}) });
  };

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{t.blogMgmt}</div>
        {!editing && <button className="btn-primary" style={{ borderRadius: 10 }} onClick={() => setEditing({ ...blank })}>＋ {t.blogNew}</button>}
      </div>

      {editing ? (
        <div className="panel" style={{ padding: 22, maxWidth: 640 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>{editing.id ? t.blogEdit : t.blogNew}</div>
          <label className="label">{t.blogTitleField}</label>
          <input value={editing.title} onChange={set('title')} style={{ ...fieldStyle, marginBottom: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label className="label">{t.blogCategory}</label><input value={editing.category || ''} onChange={set('category')} style={fieldStyle} /></div>
            <div><label className="label">{t.blogAuthor}</label><input value={editing.author || ''} onChange={set('author')} style={fieldStyle} /></div>
          </div>
          <label className="label">{t.blogExcerpt}</label>
          <textarea value={editing.excerpt || ''} onChange={set('excerpt')} rows={2} style={{ ...fieldStyle, marginBottom: 12, resize: 'vertical' }} />
          <label className="label">{t.blogBody}</label>
          <textarea value={editing.body || ''} onChange={set('body')} rows={7} style={{ ...fieldStyle, marginBottom: 12, resize: 'vertical' }} />
          <label className="label">{t.blogStatus}</label>
          <select value={editing.status} onChange={set('status')} style={{ ...fieldStyle, marginBottom: 18 }}>
            <option value="published">{t.blogPublished}</option>
            <option value="draft">{t.blogDraft}</option>
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" style={{ borderRadius: 10 }} disabled={busy} onClick={save}>{busy ? '…' : t.blogSave}</button>
            <button className="btn-dark" style={{ borderRadius: 10 }} onClick={() => setEditing(null)}>{t.cancel}</button>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.blogNoArticles}</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {posts.map((p) => (
            <div key={p.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--faint)' }}>{p.category || '—'} · {p.publishedAt}</div>
              </div>
              <span className={`chip ${p.status === 'published' ? 'chip-green' : ''}`} style={{ border: p.status === 'published' ? 'none' : '1.5px solid var(--line)' }}>
                {p.status === 'published' ? t.blogPublished : t.blogDraft}
              </span>
              <button onClick={() => edit(p)} className="chip" style={{ cursor: 'pointer', border: '1.5px solid var(--line)' }}>{t.blogEdit}</button>
              <button onClick={() => remove(p.id)} title={t.blogDelete} style={{ border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 16 }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
