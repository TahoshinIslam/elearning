'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { useAdminData, send } from '@/components/owner/useAdminData';
import { num } from '@/lib/copy';

const T = {
  bn: { name: 'নাম', add: 'যোগ করুন', courses: 'কোর্স', published: 'প্রকাশিত', rename: 'নাম বদলান', save: 'সংরক্ষণ', cancel: 'বাতিল', del: 'মুছুন', up: 'উপরে', down: 'নিচে', view: 'ক্যাটালগে দেখুন', loadErr: 'লোড করা যায়নি।', retry: 'আবার চেষ্টা', inUse: (n) => `${n}টি কোর্স এখনও এটি ব্যবহার করছে — আগে কোর্সগুলো অন্য জায়গায় সরান।`, confirmDel: 'মুছে ফেলবেন?', saved: 'সংরক্ষিত', err: 'কাজটি করা যায়নি', icon: 'আইকন' },
  en: { name: 'Name', add: 'Add', courses: 'courses', published: 'published', rename: 'Rename', save: 'Save', cancel: 'Cancel', del: 'Delete', up: 'Move up', down: 'Move down', view: 'View in catalog', loadErr: 'Couldn’t load.', retry: 'Try again', inUse: (n) => `${n} course(s) still use this — reassign them first.`, confirmDel: 'Delete this?', saved: 'Saved', err: 'That didn’t work', icon: 'Icon' }
};

// Ordered list editor shared by Subjects (categories) and Classes. Order
// here is the order shown on the homepage and catalog filters.
export default function TaxonomyManager({ lang, url, catalogParam, withIcon = false, addLabel, emptyText, showToast, deleteNote }) {
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const { data, loading, error, reload, setData } = useAdminData(url);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📗');
  const [editing, setEditing] = useState(null); // { id, name, icon }
  const [busy, setBusy] = useState(false);

  const run = async (method, body, ok) => {
    setBusy(true);
    try { setData(await send(url, method, body)); if (ok) showToast(ok, 'success'); return true; }
    catch (e) { showToast(e.message === 'category_in_use' ? t.inUse(e.data?.courses) : t.err, 'error'); return false; }
    finally { setBusy(false); }
  };
  const add = async (e) => { e.preventDefault(); if (name.trim() && await run('POST', { name: name.trim(), icon }, t.saved)) setName(''); };
  const rename = async (e) => { e.preventDefault(); if (await run('PATCH', { id: editing.id, name: editing.name, ...(withIcon ? { icon: editing.icon } : {}) }, t.saved)) setEditing(null); };

  const list = data || [];
  return (
    <div className="ws-split">
      <section className="surface" aria-busy={loading || undefined}>
        {loading ? <div className="surface-pad stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}</div>
          : error ? <div className="state" role="alert"><p>{t.loadErr}</p><button type="button" className="btn btn-secondary btn-sm" onClick={reload}>{t.retry}</button></div>
          : !list.length ? <div className="state"><p>{emptyText}</p></div>
          : (
          <ol className="tx-list">
            {list.map((x, i) => (
              <li key={x.id} className="tx-row">
                <span className="badge tabular" aria-hidden="true">{num(lang, i + 1)}</span>
                {editing?.id === x.id ? (
                  <form className="row grow" style={{ '--gap': '8px' }} onSubmit={rename}>
                    {withIcon && <input aria-label={t.icon} className="input" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} style={{ width: 64, textAlign: 'center' }} />}
                    <input aria-label={t.name} className="input grow" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus required maxLength={120} />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{t.save}</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>{t.cancel}</button>
                  </form>
                ) : (<>
                  {withIcon && <span style={{ fontSize: 20 }} aria-hidden="true">{x.icon}</span>}
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="strong">{x.name}</div>
                    <div className="xsmall muted"><span className="mono">{x.slug}</span> · {num(lang, x.courseCount)} {t.courses} · {num(lang, x.publishedCount)} {t.published}</div>
                  </div>
                  <a href={`/courses?${catalogParam}=${encodeURIComponent(x.slug)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm" aria-label={`${t.view}: ${x.name}`} data-tooltip={t.view}><Icon name="external" size={15} /></a>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy || i === 0} onClick={() => run('PATCH', { id: x.id, dir: 'up' })} aria-label={`${t.up}: ${x.name}`} data-tooltip={t.up}><Icon name="arrowUp" size={15} /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy || i === list.length - 1} onClick={() => run('PATCH', { id: x.id, dir: 'down' })} aria-label={`${t.down}: ${x.name}`} data-tooltip={t.down}><Icon name="arrowDown" size={15} /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing({ id: x.id, name: x.name, icon: x.icon })} aria-label={`${t.rename}: ${x.name}`} data-tooltip={t.rename}><Icon name="edit" size={15} /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy} onClick={() => window.confirm(t.confirmDel) && run('DELETE', { id: x.id }, t.saved)} aria-label={`${t.del}: ${x.name}`} data-tooltip={t.del}><Icon name="trash" size={15} /></button>
                </>)}
              </li>
            ))}
          </ol>
        )}
      </section>

      <aside className="surface surface-pad stack" style={{ '--gap': '12px' }}>
        <h2 className="h4">{addLabel}</h2>
        <form className="stack" style={{ '--gap': '10px' }} onSubmit={add}>
          {withIcon && <div className="field"><label htmlFor={`${url}-icon`}>{t.icon}</label><input id={`${url}-icon`} className="input" value={icon} onChange={(e) => setIcon(e.target.value)} style={{ width: 80, textAlign: 'center' }} /></div>}
          <div className="field"><label htmlFor={`${url}-name`}>{t.name}</label><input id={`${url}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></div>
          <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}><Icon name="plus" size={15} />{t.add}</button>
        </form>
        {deleteNote && <p className="xsmall muted">{deleteNote}</p>}
      </aside>
    </div>
  );
}
