'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import DataTable from '@/components/ui/DataTable';
import { useAdminData } from '@/components/owner/useAdminData';
import { dateLabel } from '@/lib/copy';

// Every enrollment with its source (purchase / batch / manual) and status;
// manual batch enrollment stays available to staff.
export default function EnrollmentsTab() {
  const { lang, t, students, batches, api, showToast } = useApp();
  const en = lang === 'en';
  const list = useAdminData('/api/enrollments/directory');
  const [studentId, setStudentId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [busy, setBusy] = useState(false);

  const doEnroll = async (e) => {
    e.preventDefault();
    if (!studentId || !batchId) return;
    setBusy(true);
    try { await api.enroll(Number(studentId), Number(batchId)); showToast(t.enrollDone, 'success'); setStudentId(''); setBatchId(''); list.reload(); }
    catch (err) { showToast(err?.status === 409 ? (en ? 'Already enrolled' : 'আগে থেকেই ভর্তি আছে') : t.errGeneric, 'error'); } finally { setBusy(false); }
  };
  const cancel = async (row) => {
    if (row.source === 'order') { showToast(en ? 'Purchased access is revoked by refunding the order.' : 'কেনা কোর্সের অ্যাক্সেস অর্ডার রিফান্ড করে বন্ধ করতে হয়।', 'info'); return; }
    if (!window.confirm(en ? 'Remove this enrollment?' : 'এই ভর্তিটি বাতিল করবেন?')) return;
    try { await api.unenroll(row.id); showToast(t.enrollCancelled, 'success'); list.reload(); } catch { showToast(t.errGeneric, 'error'); }
  };
  const src = { order: en ? 'Purchase' : 'ক্রয়', batch: en ? 'Batch' : 'ব্যাচ', manual: en ? 'Manual' : 'ম্যানুয়াল' };

  return (
    <div className="ws-split">
      <DataTable lang={lang} caption={en ? 'Enrollments' : 'ভর্তি'} rows={list.data || []} loading={list.loading} error={list.error} onRetry={list.reload}
        searchText={(r) => `${r.studentName || ''} ${r.courseTitle || ''} ${r.batchName || ''}`}
        filters={[
          { key: 'status', label: en ? 'Status' : 'অবস্থা', options: [{ value: 'active', label: en ? 'Active' : 'চলমান' }, { value: 'cancelled', label: en ? 'Cancelled' : 'বাতিল' }], test: (r, v) => r.status === v },
          { key: 'source', label: en ? 'Source' : 'উৎস', options: Object.entries(src).map(([value, label]) => ({ value, label })), test: (r, v) => r.source === v }
        ]}
        initialSort={{ key: 'enrolledAt', dir: 'desc' }}
        columns={[
          { key: 'studentName', label: en ? 'Student' : 'শিক্ষার্থী' },
          { key: 'courseTitle', label: en ? 'Course' : 'কোর্স', render: (r) => r.courseTitle || '—' },
          { key: 'source', label: en ? 'Source' : 'উৎস', render: (r) => <span className="badge">{src[r.source]}{r.batchName ? ` · ${r.batchName}` : ''}</span> },
          { key: 'status', label: en ? 'Status' : 'অবস্থা', render: (r) => <span className={`badge ${r.status === 'active' ? 'badge-success' : ''}`}>{r.status === 'active' ? (en ? 'Active' : 'চলমান') : (en ? 'Cancelled' : 'বাতিল')}</span> },
          { key: 'enrolledAt', label: en ? 'Enrolled' : 'ভর্তির তারিখ', render: (r) => <span className="small muted">{dateLabel(lang, r.enrolledAt)}</span> },
          { key: 'lastAccessedAt', label: en ? 'Last opened' : 'সর্বশেষ খোলা', sort: (r) => r.lastAccessedAt || '', render: (r) => <span className="small muted">{r.lastAccessedAt ? dateLabel(lang, r.lastAccessedAt) : '—'}</span> }
        ]}
        rowActions={(r) => r.status === 'active' && r.source !== 'order' ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => cancel(r)}>{en ? 'Remove' : 'বাতিল'}</button> : null}
      />
      <form className="surface surface-pad stack" onSubmit={doEnroll} aria-labelledby="enr-h">
        <h2 id="enr-h" className="h4">{en ? 'Enroll in a batch' : 'ব্যাচে ভর্তি করুন'}</h2>
        <p className="small muted">{en ? 'For live cohorts. Course purchases enroll automatically after bKash confirms payment.' : 'লাইভ ব্যাচের জন্য। কোর্স কেনার পর bKash পেমেন্ট নিশ্চিত হলে ভর্তি নিজে থেকেই হয়।'}</p>
        <div className="field"><label htmlFor="enr-s">{en ? 'Student' : 'শিক্ষার্থী'}</label>
          <select id="enr-s" className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">—</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label htmlFor="enr-b">{en ? 'Batch' : 'ব্যাচ'}</label>
          <select id="enr-b" className="select" value={batchId} onChange={(e) => setBatchId(e.target.value)}><option value="">—</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        <button type="submit" className="btn btn-primary" disabled={busy || !studentId || !batchId}>{busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="plus" size={16} />}{en ? 'Enroll' : 'ভর্তি করুন'}</button>
      </form>
    </div>
  );
}
