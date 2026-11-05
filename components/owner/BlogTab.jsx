'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import ImageDropzone from '@/components/ui/ImageDropzone';
import { IMAGE_SPECS } from '@/lib/imageSpecs';
import { putFile, api } from '@/components/owner/builder/upload';
import { renderMarkdown } from '@/lib/markdown';
import { dateLabel, num } from '@/lib/copy';

const L = {
  bn: {
    new: 'নতুন লেখা', search: 'শিরোনাম, বিভাগ বা ট্যাগ', all: 'সব', published: 'প্রকাশিত', draft: 'খসড়া', scheduled: 'নির্ধারিত',
    title: 'শিরোনাম', slug: 'URL (স্লাগ)', excerpt: 'সারসংক্ষেপ (কার্ড ও শেয়ারে দেখাবে)', body: 'লেখা', category: 'বিভাগ', tags: 'ট্যাগ (কমা দিয়ে আলাদা)', author: 'লেখক',
    featured: 'প্রচ্ছদে প্রধান খবর হিসেবে দেখান', status: 'অবস্থা', when: 'প্রকাশের সময়', whenHint: 'ভবিষ্যতের সময় দিলে তখন নিজে থেকে প্রকাশ হবে', cover: 'কভার ছবি', removeCover: 'ছবি সরান',
    save: 'সংরক্ষণ', publish: 'প্রকাশ করুন', back: 'সব লেখা', write: 'লিখুন', preview: 'প্রিভিউ', view: 'পেজ দেখুন', del: 'মুছুন', edit: 'সম্পাদনা',
    saved: 'লেখা সংরক্ষণ হয়েছে', deleted: 'লেখা মুছে ফেলা হয়েছে', none: 'কোনো লেখা নেই', views: 'পড়া', words: 'শব্দ', minutes: 'মিনিটে পড়া',
    title_required: 'শিরোনাম দিন', slug_taken: 'এই URL আগেই ব্যবহৃত', invalid_date: 'সঠিক তারিখ দিন', confirmDel: (t) => `“${t}” মুছবেন? এটি ফেরত আনা যাবে না।`,
    tb: { h2: 'বড় শিরোনাম', h3: 'ছোট শিরোনাম', b: 'বোল্ড', i: 'ইটালিক', link: 'লিংক', ul: 'তালিকা', ol: 'নম্বর তালিকা', quote: 'উদ্ধৃতি', hr: 'বিভাজক' }
  },
  en: {
    new: 'New article', search: 'Title, category or tag', all: 'All', published: 'Published', draft: 'Draft', scheduled: 'Scheduled',
    title: 'Title', slug: 'URL (slug)', excerpt: 'Summary (shown on cards and shares)', body: 'Article', category: 'Category', tags: 'Tags (comma separated)', author: 'Author',
    featured: 'Feature as the lead story on the front page', status: 'Status', when: 'Publish time', whenHint: 'A future time publishes it automatically then', cover: 'Cover image', removeCover: 'Remove image',
    save: 'Save', publish: 'Publish', back: 'All articles', write: 'Write', preview: 'Preview', view: 'View page', del: 'Delete', edit: 'Edit',
    saved: 'Article saved', deleted: 'Article deleted', none: 'No articles', views: 'reads', words: 'words', minutes: 'min read',
    title_required: 'Enter a title', slug_taken: 'That URL is already used', invalid_date: 'Enter a valid date', confirmDel: (t) => `Delete “${t}”? This can’t be undone.`,
    tb: { h2: 'Heading', h3: 'Subheading', b: 'Bold', i: 'Italic', link: 'Link', ul: 'Bullet list', ol: 'Numbered list', quote: 'Quote', hr: 'Divider' }
  }
};
const BLANK = { id: null, title: '', slug: '', excerpt: '', body: '', category: '', tags: '', author: '', featured: false, status: 'draft', publishedLocal: '', coverKey: null, coverUrl: null };

function Toolbar({ taRef, value, onChange, l }) {
  const wrap = (before, after = before, ph = '') => {
    const ta = taRef.current; if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const sel = value.slice(a, b) || ph;
    onChange(value.slice(0, a) + before + sel + after + value.slice(b));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(a + before.length, a + before.length + sel.length); });
  };
  const line = (prefix) => {
    const ta = taRef.current; if (!ta) return;
    const a = value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    onChange(value.slice(0, a) + prefix + value.slice(a));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(ta.selectionStart + prefix.length, ta.selectionStart + prefix.length); });
  };
  const B = [['h2', 'H2', () => line('## ')], ['h3', 'H3', () => line('### ')], ['b', 'B', () => wrap('**', '**', 'text')], ['i', 'I', () => wrap('*', '*', 'text')],
    ['link', '🔗', () => wrap('[', '](https://)', 'link')], ['ul', '•', () => line('- ')], ['ol', '1.', () => line('1. ')], ['quote', '❝', () => line('> ')], ['hr', '—', () => wrap('\n---\n', '', '')]];
  return (
    <div className="md-toolbar" role="toolbar" aria-label="Formatting">
      {B.map(([k, txt, fn]) => <button key={k} type="button" data-confirm="off" className="md-btn" onClick={fn} title={l.tb[k]} aria-label={l.tb[k]}>{txt}</button>)}
    </div>
  );
}

function Editor({ initial, l, lang, onDone }) {
  const { showToast } = useApp();
  const en = lang === 'en';
  const [f, setF] = useState(initial);
  const [tab, setTab] = useState('write');
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState(null);
  const [err, setErr] = useState({});
  const taRef = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const words = f.body.trim() ? f.body.trim().split(/\s+/).length : 0;

  const uploadCover = async (file) => {
    setUpload(0);
    try {
      const up = await api('/api/blog/cover', { method: 'POST', body: { contentType: file.type, size: file.size, fileName: file.name } });
      await putFile(up.uploadUrl, file, file.type, setUpload);
      const ok = await api('/api/blog/cover', { method: 'PUT', body: { key: up.key } });
      setF((x) => ({ ...x, coverKey: ok.key, coverUrl: ok.url }));
    } catch (e) { showToast(e.data?.error === 'storage_not_configured' ? (en ? 'Storage isn’t configured' : 'স্টোরেজ সেট করা নেই') : (en ? 'Upload failed' : 'আপলোড হয়নি'), 'error'); }
    finally { setUpload(null); }
  };

  const save = async (status) => {
    if (!f.title.trim()) { setErr({ title: l.title_required }); return; }
    setBusy(true); setErr({});
    const body = { id: f.id || undefined, title: f.title, excerpt: f.excerpt, body: f.body, category: f.category, tags: f.tags, author: f.author || undefined,
      featured: f.featured, status: status || f.status, coverKey: f.coverKey, publishedAt: f.publishedLocal || undefined, ...(f.slug ? { slug: f.slug } : {}) };
    try {
      const saved = await api('/api/blog', { method: f.id ? 'PATCH' : 'POST', body });
      setF({ ...BLANK, ...saved, tags: saved.tags.join(', ') });
      showToast(l.saved, 'success');
      onDone?.(saved, false);
    } catch (e) {
      const code = e.data?.error || e.message;
      if (code === 'slug_taken') setErr({ slug: l.slug_taken }); else if (code === 'invalid_date') setErr({ when: l.invalid_date });
      showToast(l[code] || code, 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="stack" style={{ '--gap': '16px' }}>
      <div className="cluster" style={{ '--gap': '8px', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-ghost" data-confirm="off" onClick={() => onDone?.(null, true)}><Icon name="arrowLeft" size={16} />{l.back}</button>
        <div className="cluster" style={{ '--gap': '8px' }}>
          {f.id && f.slug && <a className="btn btn-ghost" href={`/blog/${encodeURIComponent(f.slug)}`} target="_blank" rel="noreferrer"><Icon name="eye" size={16} />{l.view}</a>}
          <button type="button" className="btn btn-secondary" disabled={busy} data-confirm="off" onClick={() => save()}>{l.save}</button>
          {f.status === 'draft' && <button type="button" className="btn btn-primary" disabled={busy} data-confirm="off" onClick={() => save('published')}><Icon name="send" size={16} />{l.publish}</button>}
        </div>
      </div>
      <div className="editor-grid">
        <div className="stack" style={{ '--gap': '14px' }}>
          <div className="field"><label className="req" htmlFor="bp-title">{l.title}</label>
            <input id="bp-title" className="input input-lg" value={f.title} onChange={set('title')} maxLength={191} aria-invalid={!!err.title} />
            {err.title && <p className="field-error">{err.title}</p>}</div>
          <div className="field"><label htmlFor="bp-ex">{l.excerpt}</label><textarea id="bp-ex" className="textarea" rows={2} value={f.excerpt} onChange={set('excerpt')} maxLength={500} /></div>
          <div className="field">
            <div className="md-head">
              <span className="label" style={{ margin: 0 }}>{l.body}</span>
              <div className="segmented" role="tablist">
                <button type="button" role="tab" aria-selected={tab === 'write'} aria-pressed={tab === 'write'} data-confirm="off" onClick={() => setTab('write')}>{l.write}</button>
                <button type="button" role="tab" aria-selected={tab === 'preview'} aria-pressed={tab === 'preview'} data-confirm="off" onClick={() => setTab('preview')}>{l.preview}</button>
              </div>
            </div>
            {tab === 'write' ? (
              <>
                <Toolbar taRef={taRef} value={f.body} onChange={(v) => setF((x) => ({ ...x, body: v }))} l={l} />
                <textarea ref={taRef} id="bp-body" className="textarea md-area" rows={18} value={f.body} onChange={set('body')} aria-label={l.body}
                  placeholder={en ? '## Heading\n\nWrite paragraphs separated by a blank line. **bold**, *italic*, [link](https://…), - lists, > quotes' : '## শিরোনাম\n\nএকটি ফাঁকা লাইন দিয়ে অনুচ্ছেদ আলাদা করুন। **বোল্ড**, *ইটালিক*, [লিংক](https://…), - তালিকা, > উদ্ধৃতি'} />
              </>
            ) : <div className="prose md-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(f.body).html || '<p class="muted">—</p>' }} />}
            <p className="help">{num(lang, words)} {l.words} · {num(lang, Math.max(1, Math.round(words / 180)))} {l.minutes}</p>
          </div>
        </div>
        <aside className="stack editor-side" style={{ '--gap': '14px' }}>
          <section className="surface surface-pad stack" style={{ '--gap': '12px' }}>
            <div className="field"><label htmlFor="bp-status">{l.status}</label>
              <select id="bp-status" className="select" value={f.status} onChange={set('status')}><option value="draft">{l.draft}</option><option value="published">{l.published}</option></select></div>
            <div className="field"><label htmlFor="bp-when">{l.when}</label>
              <input id="bp-when" type="datetime-local" className="input" value={f.publishedLocal || ''} onChange={set('publishedLocal')} aria-describedby="bp-when-h" />
              <p id="bp-when-h" className="help">{l.whenHint}</p>{err.when && <p className="field-error">{err.when}</p>}</div>
            <label className="switch"><input type="checkbox" checked={!!f.featured} onChange={set('featured')} /><span aria-hidden="true" />{l.featured}</label>
          </section>
          <section className="surface surface-pad stack" style={{ '--gap': '10px' }}>
            <span className="label" style={{ margin: 0 }}>{l.cover}</span>
            <ImageDropzone spec={IMAGE_SPECS.article} imageUrl={f.coverUrl} lang={lang} progress={upload} onFile={uploadCover} />
            {f.coverKey && <button type="button" className="btn btn-ghost btn-sm" data-confirm="off" onClick={() => setF((x) => ({ ...x, coverKey: null, coverUrl: null }))}><Icon name="trash" size={14} />{l.removeCover}</button>}
          </section>
          <section className="surface surface-pad stack" style={{ '--gap': '12px' }}>
            <div className="field"><label htmlFor="bp-cat">{l.category}</label><input id="bp-cat" className="input" value={f.category || ''} onChange={set('category')} maxLength={64} list="bp-cats" /></div>
            <datalist id="bp-cats">{['পড়াশোনা', 'পরীক্ষা', 'ভর্তি', 'ক্যারিয়ার', 'টিপস', 'প্রযুক্তি'].map((c) => <option key={c} value={c} />)}</datalist>
            <div className="field"><label htmlFor="bp-tags">{l.tags}</label><input id="bp-tags" className="input" value={f.tags} onChange={set('tags')} maxLength={300} /></div>
            <div className="field"><label htmlFor="bp-auth">{l.author}</label><input id="bp-auth" className="input" value={f.author || ''} onChange={set('author')} maxLength={191} /></div>
            <div className="field"><label htmlFor="bp-slug">{l.slug}</label><input id="bp-slug" className="input" value={f.slug} onChange={set('slug')} maxLength={120} aria-invalid={!!err.slug} />{err.slug && <p className="field-error">{err.slug}</p>}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}

// Admin → Blog: paginated, searchable list + full article editor.
export default function BlogTab({ readOnly }) {
  const { lang, showToast } = useApp();
  const en = lang === 'en';
  const l = L[en ? 'en' : 'bn'];
  const [list, setList] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try { setList(await api(`/api/blog?all=1&page=${page}&status=${status}&q=${encodeURIComponent(query)}`)); }
    catch { setList({ items: [], total: 0, page: 1, pages: 1 }); }
  }, [page, status, query]);
  useEffect(() => { const t = setTimeout(load, query ? 250 : 0); return () => clearTimeout(t); }, [load, query]);

  const open = async (id) => {
    if (!id) { setEditing({ ...BLANK }); return; }
    const p = await api(`/api/blog?id=${id}`);
    setEditing({ ...BLANK, ...p, tags: p.tags.join(', ') });
  };
  const remove = async (p) => {
    try { await api('/api/blog', { method: 'DELETE', body: { id: p.id } }); showToast(l.deleted, 'success'); load(); }
    catch { showToast(en ? 'Couldn’t delete' : 'মোছা যায়নি', 'error'); }
  };

  if (editing) return <Editor initial={editing} l={l} lang={lang} onDone={(_, close) => { if (close) setEditing(null); load(); }} />;

  const stateOf = (p) => (p.status === 'draft' ? ['badge', l.draft] : p.scheduled ? ['badge badge-info', l.scheduled] : ['badge badge-success', l.published]);
  return (
    <div className="stack" style={{ '--gap': '14px' }}>
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
        {!readOnly && <button type="button" className="btn btn-primary" data-confirm="off" onClick={() => open(null)}><Icon name="plus" size={16} />{l.new}</button>}
        <div className="segmented" role="group" aria-label={l.status}>
          {[['', l.all], ['published', l.published], ['scheduled', l.scheduled], ['draft', l.draft]].map(([v, t]) => (
            <button key={v || 'all'} type="button" aria-pressed={status === v} data-confirm="off" onClick={() => { setStatus(v); setPage(1); }}>{t}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="bl-q">{l.search}</label>
        <input id="bl-q" type="search" className="input" style={{ maxWidth: 280, marginLeft: 'auto' }} placeholder={l.search} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
      </div>
      {list === null ? <div className="stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 76 }} />)}</div> : !list.items.length ? (
        <div className="surface state"><div className="state-icon"><Icon name="newspaper" size={24} /></div><p>{l.none}</p></div>
      ) : (
        <ul className="blog-admin-list">
          {list.items.map((p) => {
            const [cls, label] = stateOf(p);
            return (
              <li key={p.id} className="blog-admin-row">
                <span className="blog-admin-thumb" aria-hidden="true">{p.coverUrl ? <img src={p.coverUrl} alt="" /> : <Icon name="newspaper" size={20} />}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <p className="strong clamp-1" style={{ margin: 0 }}>{p.featured && <Icon name="star" size={14} />} {p.title}</p>
                  <p className="xsmall muted" style={{ margin: 0 }}>{[p.category, p.publishedAt ? dateLabel(lang, p.publishedAt) : null, `${num(lang, p.views)} ${l.views}`].filter(Boolean).join(' · ')}</p>
                </div>
                <span className={cls}>{label}</span>
                <div className="cluster" style={{ '--gap': '4px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" data-confirm="off" onClick={() => open(p.id)}><Icon name="edit" size={14} />{l.edit}</button>
                  {!readOnly && <button type="button" className="btn btn-ghost btn-icon btn-sm" data-confirm={l.confirmDel(p.title)} aria-label={l.del} onClick={() => remove(p)}><Icon name="trash" size={15} /></button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list && list.pages > 1 && (
        <nav className="pagination" aria-label={en ? 'Pages' : 'পৃষ্ঠা'}>
          <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label={en ? 'Previous' : 'আগের'}><Icon name="chevronLeft" size={16} /></button>
          {Array.from({ length: list.pages }, (_, i) => i + 1).map((n) => <button key={n} type="button" className="page-btn" aria-current={n === list.page ? 'page' : undefined} onClick={() => setPage(n)}>{num(lang, n)}</button>)}
          <button type="button" className="page-btn" disabled={page >= list.pages} onClick={() => setPage(page + 1)} aria-label={en ? 'Next' : 'পরের'}><Icon name="chevronRight" size={16} /></button>
        </nav>
      )}
    </div>
  );
}
