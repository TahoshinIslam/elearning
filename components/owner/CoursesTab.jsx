'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import CourseCover from '@/components/ui/CourseCover';
import DataTable from '@/components/ui/DataTable';
import Dialog from '@/components/ui/Dialog';
import CourseEditor from '@/components/owner/builder/CourseEditor';
import { S, errText } from '@/components/owner/builder/strings';
import { taka, num, dateLabel } from '@/lib/copy';

// Course administration: list (status, price, lessons, purchasers, rating,
// featured order) → editor. The open course is in the URL (?course=id) so
// refresh and back/forward keep the editor open.
export default function CoursesTab() {
  const { lang, courses, api, showToast, loaded } = useApp();
  const s = S(lang);
  const en = lang === 'en';
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openId = Number(params.get('course')) || null;
  const setOpen = (id) => {
    const sp = new URLSearchParams(params.toString());
    if (id) sp.set('course', String(id)); else sp.delete('course');
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [cats, setCats] = useState([]);
  useEffect(() => { fetch('/api/categories').then((r) => r.json()).then((d) => setCats(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const before = new Set(courses.map((c) => c.id));
      const after = await api.addCourse(title.trim());
      const created = after.find((c) => !before.has(c.id));
      setTitle(''); setCreating(false);
      showToast(s.saved, 'success');
      if (created) setOpen(created.id);
    } catch (err) { showToast(errText(s, err), 'error'); } finally { setBusy(false); }
  };
  const op = async (body) => { try { await api.courseOp(body); } catch (err) { showToast(errText(s, err), 'error'); } };

  const open = courses.find((c) => c.id === openId);
  if (openId && open) return <CourseEditor course={open} onBack={() => setOpen(null)} />;

  const statusOf = (c) => (c.published ? 'published' : c.isUpcoming ? 'upcoming' : c.reviewStatus === 'pending_review' ? 'pending' : 'draft');
  const STATUS = { published: ['badge-success', s.published], upcoming: ['badge-info', en ? 'Upcoming' : 'আসন্ন'], pending: ['badge-warning', s.pending], draft: ['', s.draft] };
  const featured = courses.filter((c) => c.featured).sort((a, b) => (a.featuredOrder ?? 1e9) - (b.featuredOrder ?? 1e9));
  const catName = (slug) => cats.find((x) => x.slug === slug)?.name || slug || '—';

  return (
    <div className="ws-split">
      <DataTable
        lang={lang} caption={s.courses} rows={courses} loading={!loaded}
        searchText={(c) => `${c.title} ${c.instructor || ''} ${c.slug}`}
        filters={[
          { key: 'status', label: s.colStatus, options: Object.entries(STATUS).map(([value, [, label]]) => ({ value, label })), test: (c, v) => statusOf(c) === v },
          { key: 'subject', label: en ? 'Subject' : 'বিষয়', options: cats.map((x) => ({ value: x.slug, label: x.name })), test: (c, v) => c.category === v }
        ]}
        initialSort={{ key: 'updatedAt', dir: 'desc' }}
        toolbar={<button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Icon name="plus" size={15} />{s.newCourse}</button>}
        emptyState={<><p>{s.empty}</p><button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>{s.newCourse}</button></>}
        columns={[
          { key: 'title', label: s.colCourse, minWidth: 280, render: (c) => (
            <div className="row" style={{ '--gap': '12px' }}>
              <div style={{ width: 76, flex: 'none' }}><CourseCover id={c.id} title={c.title} category={c.category} thumbnailUrl={c.thumbnailUrl} size="sm" /></div>
              <div style={{ minWidth: 0 }}>
                <button type="button" onClick={() => setOpen(c.id)} className="strong" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', fontSize: 15, color: 'var(--ink)' }}>{c.title}</button>
                <div className="xsmall muted">{catName(c.category)}{c.instructor ? ` · ${c.instructor}` : ''}</div>
              </div>
            </div>) },
          { key: 'status', label: s.colStatus, sort: statusOf, render: (c) => {
            const [cls, label] = STATUS[statusOf(c)];
            return <div className="cluster" style={{ '--gap': '4px' }}><span className={`badge ${cls}`}>{label}</span>{c.featured && <span className="badge badge-brand"><Icon name="star" size={11} />{en ? 'Featured' : 'নির্বাচিত'}</span>}</div>;
          } },
          { key: 'price', label: s.colPrice, align: 'right', render: (c) => <span className="tabular">{c.price ? taka(lang, c.price) : (en ? 'Free' : 'ফ্রি')}</span> },
          { key: 'lessons', label: s.colLessons, align: 'right', sort: (c) => c.modules.reduce((n, m) => n + m.lessons.length, 0), render: (c) => {
            const all = c.modules.flatMap((m) => m.lessons);
            const missing = all.filter((l) => l.type === 'video' && l.videoStatus !== 'ready').length;
            return <span className="tabular">{num(lang, all.length)}{missing > 0 && <span className="badge badge-warning" style={{ marginLeft: 6 }} title={en ? 'Videos not ready' : 'ভিডিও প্রস্তুত নয়'}>{num(lang, missing)}</span>}</span>;
          } },
          { key: 'purchaseCount', label: en ? 'Purchasers' : 'ক্রেতা', align: 'right', render: (c) => <span className="tabular">{num(lang, c.purchaseCount)}{!c.price && c.enrollmentCount > 0 ? <span className="xsmall muted"> ({num(lang, c.enrollmentCount)} {en ? 'enrolled' : 'ভর্তি'})</span> : null}</span> },
          { key: 'rating', label: en ? 'Rating' : 'রেটিং', align: 'right', nowrap: true, sort: (c) => c.rating ?? -1, render: (c) => (c.rating != null ? <span className="tabular">★ {num(lang, c.rating.toFixed(1))} <span className="xsmall muted">({num(lang, c.reviewCount)})</span></span> : <span className="xsmall muted">{en ? 'No reviews' : 'রিভিউ নেই'}</span>) },
          { key: 'updatedAt', label: s.colUpdated, render: (c) => <span className="small muted nowrap">{dateLabel(lang, c.updatedAt)}</span> }
        ]}
        rowActions={(c) => (<>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(c.id)}><Icon name="edit" size={14} />{s.edit}</button>
          {(c.published || c.isUpcoming) && <Link href={`/course/${c.slug}`} target="_blank" className="btn btn-ghost btn-icon btn-sm" aria-label={`${s.view}: ${c.title}`} data-tooltip={s.view}><Icon name="external" size={15} /></Link>}
        </>)}
      />

      <aside className="surface surface-pad stack" aria-labelledby="feat-h" style={{ '--gap': '12px' }}>
        <h2 id="feat-h" className="h4">{en ? 'Featured order' : 'নির্বাচিত কোর্সের ক্রম'}</h2>
        <p className="small muted">{en ? 'Shown on the homepage in this order. Toggle “Featured” in a course’s Publishing tab.' : 'হোমপেজে এই ক্রমে দেখানো হয়। কোর্সের “প্রকাশ” ট্যাব থেকে নির্বাচন করুন।'}</p>
        {!featured.length ? <p className="small muted">{en ? 'No featured courses.' : 'কোনো নির্বাচিত কোর্স নেই।'}</p> : (
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {featured.map((c, i) => (
              <li key={c.id} className="row" style={{ '--gap': '8px', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <span className="badge">{num(lang, i + 1)}</span>
                <span className="grow small strong clamp-2">{c.title}</span>
                <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={i === 0} onClick={() => op({ op: 'moveFeatured', courseId: c.id, dir: 'up' })} aria-label={`${s.moveUp}: ${c.title}`} data-tooltip={s.moveUp}><Icon name="arrowUp" size={15} /></button>
                <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={i === featured.length - 1} onClick={() => op({ op: 'moveFeatured', courseId: c.id, dir: 'down' })} aria-label={`${s.moveDown}: ${c.title}`} data-tooltip={s.moveDown}><Icon name="arrowDown" size={15} /></button>
              </li>
            ))}
          </ol>
        )}
      </aside>

      <Dialog open={creating} onClose={() => setCreating(false)} title={s.newCourse} closeLabel={s.close}>
        <form className="stack" onSubmit={create}>
          <div className="field"><label htmlFor="new-course">{s.newCoursePh}</label><input id="new-course" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={191} required autoFocus /></div>
          <div className="row" style={{ justifyContent: 'flex-end' }}><button type="submit" className="btn btn-primary" disabled={busy || !title.trim()}>{busy && <span className="spinner" aria-hidden="true" />}{s.create}</button></div>
        </form>
      </Dialog>
    </div>
  );
}
