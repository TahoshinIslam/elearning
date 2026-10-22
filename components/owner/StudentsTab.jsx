'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import DataTable from '@/components/ui/DataTable';
import Drawer from '@/components/ui/Drawer';
import Dialog from '@/components/ui/Dialog';
import { useAdminData, send, parseCsv } from '@/components/owner/useAdminData';
import { taka, num, dateLabel } from '@/lib/copy';

// Student directory from real records (accounts, enrollments, paid orders,
// last learning activity) with a per-student record drawer.
export default function StudentsTab() {
  const { lang, showToast } = useApp();
  const en = lang === 'en';
  const dir = useAdminData('/api/students?view=directory');
  const [open, setOpen] = useState(null);
  const [record, setRecord] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const view = async (s) => {
    setOpen(s); setRecord(null);
    try { setRecord(await send(`/api/students/${s.id}`, 'GET')); } catch { setRecord({ error: true }); }
  };
  const add = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try { await send('/api/students', 'POST', { name: form.name.trim(), phone: form.phone.trim() }); setAdding(false); setForm({ name: '', phone: '' }); showToast(en ? 'Student added' : 'শিক্ষার্থী যোগ হয়েছে', 'success'); dir.reload(); }
    catch { showToast(en ? 'Couldn’t add the student' : 'যোগ করা যায়নি', 'error'); } finally { setBusy(false); }
  };
  // Real CSV import: columns name, phone[, batch]
  const importCsv = async (file) => {
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const hasHeader = header.includes('name') || header.includes('নাম');
      const body = (hasHeader ? rows.slice(1) : rows).map((r) => ({ name: (r[0] || '').trim(), phone: (r[1] || '').trim(), batch: (r[2] || '').trim() || undefined })).filter((r) => r.name);
      if (!body.length) throw new Error('empty');
      await send('/api/students', 'POST', { import: body.slice(0, 500) });
      showToast(en ? `${body.length} students imported` : `${num(lang, body.length)} জন শিক্ষার্থী ইমপোর্ট হয়েছে`, 'success');
      dir.reload();
    } catch { showToast(en ? 'Couldn’t read that CSV (name, phone, batch)' : 'CSV পড়া যায়নি (name, phone, batch কলাম দিন)', 'error'); }
  };

  const columns = [
    { key: 'name', label: en ? 'Student' : 'শিক্ষার্থী', render: (s) => <button type="button" className="link" style={{ border: 0, background: 'none', padding: 0, textDecoration: 'none', color: 'var(--ink)' }} onClick={() => view(s)}>{s.name}</button> },
    { key: 'email', label: en ? 'Email / phone' : 'ইমেইল / ফোন', sort: (s) => s.email || s.phone, render: (s) => <span className="small">{s.email || '—'}{s.phone && <span className="muted"> · {s.phone}</span>}</span> },
    { key: 'activeCourses', label: en ? 'Active courses' : 'চলমান কোর্স', align: 'right', render: (s) => num(lang, s.activeCourses) },
    { key: 'paidTotal', label: en ? 'Paid' : 'পরিশোধ', align: 'right', render: (s) => (s.paidTotal ? taka(lang, s.paidTotal) : '—') },
    { key: 'lastActivity', label: en ? 'Last learning' : 'সর্বশেষ শেখা', sort: (s) => s.lastActivity || '', render: (s) => <span className="small muted">{s.lastActivity ? dateLabel(lang, s.lastActivity) : '—'}</span> },
    { key: 'joinedAt', label: en ? 'Joined' : 'যোগদান', render: (s) => <span className="small muted">{dateLabel(lang, s.joinedAt)}</span> }
  ];

  return (
    <>
      <div className="stat-tiles" style={{ marginBottom: 20 }}>
        <div className="surface stat-tile"><div className="v">{num(lang, dir.data?.length || 0)}</div><div className="l">{en ? 'Students' : 'মোট শিক্ষার্থী'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, (dir.data || []).filter((s) => s.activeCourses > 0).length)}</div><div className="l">{en ? 'With an active course' : 'চলমান কোর্সে আছেন'}</div></div>
        <div className="surface stat-tile"><div className="v">{num(lang, (dir.data || []).filter((s) => s.paidOrders > 0).length)}</div><div className="l">{en ? 'Paying students' : 'পেমেন্ট করেছেন'}</div></div>
      </div>
      <DataTable lang={lang} caption={en ? 'Students' : 'শিক্ষার্থী'} columns={columns} rows={dir.data || []} loading={dir.loading} error={dir.error} onRetry={dir.reload}
        searchText={(s) => `${s.name} ${s.email || ''} ${s.phone || ''}`}
        filters={[{ key: 'act', label: en ? 'Status' : 'অবস্থা', options: [{ value: 'active', label: en ? 'Active learners' : 'চলমান' }, { value: 'paid', label: en ? 'Paying' : 'পেমেন্টকারী' }, { value: 'none', label: en ? 'No course' : 'কোর্স নেই' }],
          test: (s, v) => (v === 'active' ? s.activeCourses > 0 : v === 'paid' ? s.paidOrders > 0 : s.activeCourses === 0) }]}
        initialSort={{ key: 'joinedAt', dir: 'desc' }}
        toolbar={<>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = ''; }} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} />{en ? 'Import CSV' : 'CSV ইমপোর্ট'}</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={15} />{en ? 'Add student' : 'শিক্ষার্থী যোগ করুন'}</button>
        </>}
        rowActions={(s) => <button type="button" className="btn btn-ghost btn-sm" onClick={() => view(s)}>{en ? 'View' : 'বিস্তারিত'}</button>}
      />

      <Dialog open={adding} onClose={() => setAdding(false)} title={en ? 'Add student' : 'শিক্ষার্থী যোগ করুন'} closeLabel={en ? 'Close' : 'বন্ধ করুন'}>
        <form className="stack" onSubmit={add}>
          <div className="field"><label htmlFor="ns-name">{en ? 'Name' : 'নাম'}</label><input id="ns-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="field"><label htmlFor="ns-phone">{en ? 'Phone' : 'ফোন'}</label><input id="ns-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="row" style={{ justifyContent: 'flex-end' }}><button type="submit" className="btn btn-primary" disabled={busy || !form.name.trim()}>{busy && <span className="spinner" aria-hidden="true" />}{en ? 'Add' : 'যোগ করুন'}</button></div>
        </form>
      </Dialog>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name || ''} closeLabel={en ? 'Close' : 'বন্ধ করুন'}>
        {!record ? <div className="skeleton" style={{ height: 120 }} /> : record.error ? <p className="field-error">{en ? 'Couldn’t load.' : 'লোড করা যায়নি।'}</p> : (
          <div className="stack" style={{ '--gap': '18px' }}>
            <dl className="kv">
              <div><dt>{en ? 'Email' : 'ইমেইল'}</dt><dd style={{ wordBreak: 'break-all' }}>{record.email || '—'}</dd></div>
              <div><dt>{en ? 'Phone' : 'ফোন'}</dt><dd>{record.phone || '—'}</dd></div>
              <div><dt>{en ? 'Joined' : 'যোগদান'}</dt><dd>{dateLabel(lang, record.joinedAt)}</dd></div>
            </dl>
            <section>
              <h3 className="h4" style={{ marginBottom: 8 }}>{en ? 'Courses' : 'কোর্স'}</h3>
              {!record.enrollments.length ? <p className="small muted">{en ? 'No enrollments.' : 'কোনো ভর্তি নেই।'}</p> : (
                <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, '--gap': '10px' }}>
                  {record.enrollments.map((e) => (
                    <li key={e.id} className="surface" style={{ padding: 12 }}>
                      <div className="row between"><span className="strong">{e.title || `#${e.courseId}`}</span><span className={`badge ${e.status === 'active' ? 'badge-success' : ''}`}>{e.status === 'active' ? (en ? 'Active' : 'চলমান') : (en ? 'Cancelled' : 'বাতিল')}</span></div>
                      <div className="progress progress-sm" style={{ margin: '8px 0 4px' }}><span style={{ width: `${e.lessons ? Math.round((e.done / e.lessons) * 100) : 0}%` }} /></div>
                      <div className="xsmall muted">{num(lang, e.done)}/{num(lang, e.lessons)} · {e.source === 'order' ? (en ? 'Purchase' : 'ক্রয়') : e.source === 'batch' ? (en ? 'Batch' : 'ব্যাচ') : (en ? 'Manual' : 'ম্যানুয়াল')} · {dateLabel(lang, e.enrolledAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="h4" style={{ marginBottom: 8 }}>{en ? 'Orders' : 'অর্ডার'}</h3>
              {!record.orders.length ? <p className="small muted">{en ? 'No orders.' : 'কোনো অর্ডার নেই।'}</p> : (
                <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, '--gap': '8px' }}>
                  {record.orders.map((o) => <li key={o.id} className="row between small"><span>#{o.id} · {o.items || '—'}</span><span className="strong tabular">{taka(lang, o.amount)} · {o.status}</span></li>)}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </>
  );
}
