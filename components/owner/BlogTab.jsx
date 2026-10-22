'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import DataTable from '@/components/ui/DataTable';
import { dateLabel } from '@/lib/copy';

const blank = { id: null, title: '', excerpt: '', body: '', category: '', author: 'Leo', status: 'published' };

export default function BlogTab() {
  const { t, lang, api, showToast } = useApp();
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
      showToast(t.blogSaved, 'success');
    } catch { showToast(t.errGeneric, 'error'); } finally { setBusy(false); }
  };

  const remove = async (id) => setPosts(await api.deletePost(id));

  // list rows omit the body — fetch the full post before editing
  const edit = async (p) => {
    const full = await api.getPost(p.slug);
    setEditing({ ...blank, ...p, ...(full || {}) });
  };

  return editing ? (
    <form className="editor-grid" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <section className="surface surface-pad stack" aria-labelledby="blog-ed">
        <h2 id="blog-ed" className="h4">{editing.id ? t.blogEdit : t.blogNew}</h2>
        <div className="field"><label htmlFor="bl-title">{t.blogTitleField}</label><input id="bl-title" className="input" value={editing.title} onChange={set('title')} required maxLength={191} /></div>
        <div className="field"><label htmlFor="bl-ex">{t.blogExcerpt}</label><textarea id="bl-ex" className="textarea" rows={2} value={editing.excerpt || ''} onChange={set('excerpt')} /></div>
        <div className="field"><label htmlFor="bl-body">{t.blogBody}</label><textarea id="bl-body" className="textarea" rows={16} value={editing.body || ''} onChange={set('body')} /></div>
      </section>
      <aside className="surface surface-pad stack editor-side">
        <div className="field"><label htmlFor="bl-cat">{t.blogCategory}</label><input id="bl-cat" className="input" value={editing.category || ''} onChange={set('category')} /></div>
        <div className="field"><label htmlFor="bl-au">{t.blogAuthor}</label><input id="bl-au" className="input" value={editing.author || ''} onChange={set('author')} /></div>
        <div className="field"><label htmlFor="bl-st">{t.blogStatus}</label>
          <select id="bl-st" className="select" value={editing.status} onChange={set('status')}>
            <option value="published">{t.blogPublished}</option>
            <option value="draft">{t.blogDraft}</option>
          </select></div>
        <div className="row" style={{ '--gap': '8px' }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{t.blogSave}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t.cancel}</button>
        </div>
      </aside>
    </form>
  ) : (
    <DataTable lang={lang} caption={t.blogMgmt} rows={posts} searchText={(p) => `${p.title} ${p.category || ''}`}
      filters={[{ key: 'status', label: t.blogStatus, options: [{ value: 'published', label: t.blogPublished }, { value: 'draft', label: t.blogDraft }], test: (p, v) => p.status === v }]}
      toolbar={<button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ ...blank })}><Icon name="plus" size={15} />{t.blogNew}</button>}
      emptyState={<p>{t.blogNoArticles}</p>}
      initialSort={{ key: 'publishedAt', dir: 'desc' }}
      columns={[
        { key: 'title', label: t.blogTitleField, minWidth: 260, render: (p) => <span className="strong">{p.title}</span> },
        { key: 'category', label: t.blogCategory, render: (p) => <span className="small">{p.category || '—'}</span> },
        { key: 'publishedAt', label: lang === 'en' ? 'Date' : 'তারিখ', render: (p) => <span className="small muted nowrap">{dateLabel(lang, p.publishedAt)}</span> },
        { key: 'status', label: t.blogStatus, render: (p) => <span className={`badge ${p.status === 'published' ? 'badge-success' : ''}`}>{p.status === 'published' ? t.blogPublished : t.blogDraft}</span> }
      ]}
      rowActions={(p) => (<>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => edit(p)}><Icon name="edit" size={14} />{t.blogEdit}</button>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => window.confirm(`${t.blogDelete}?`) && remove(p.id)} aria-label={`${t.blogDelete}: ${p.title}`} data-tooltip={t.blogDelete}><Icon name="trash" size={15} /></button>
      </>)}
    />
  );
}
