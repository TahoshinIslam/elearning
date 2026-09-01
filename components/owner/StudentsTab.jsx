'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function StudentsTab() {
  const { t, lang, students, addStudent, importStudentsCsv, showToast,
    enrollments, courses, batches, attendance, certificates, payments, submissions } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [detail, setDetail] = useState(null); // student being viewed

  const handleImport = async () => {
    const added = await importStudentsCsv();
    showToast(
      lang === 'bn' ? `CSV থেকে ${added.length} জন শিক্ষার্থী ইমপোর্ট হয়েছে` : `${added.length} students imported from CSV`
    );
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      showToast(lang === 'bn' ? 'নাম লিখুন' : 'Enter a name');
      return;
    }
    await addStudent({ name: newName, phone: newPhone });
    setNewName('');
    setNewPhone('');
    setShowAdd(false);
    showToast(lang === 'bn' ? 'শিক্ষার্থী যোগ হয়েছে ✓' : 'Student added ✓');
  };

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.students}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={handleImport}>⇪ {t.importCsv}</button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ {t.addStudent}</button>
        </div>
      </div>

      {showAdd && (
        <div
          style={{
            background: '#fff9f3',
            border: '1.5px solid #f2b28a',
            borderRadius: 14,
            padding: '18px 20px',
            marginBottom: 18,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}
        >
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.thName}</label>
            <input className="input" style={{ padding: '10px 12px', fontSize: 14.5, background: '#fff' }} value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="label" style={{ fontSize: 12.5, marginBottom: 5 }}>{t.thPhone}</label>
            <input className="input" style={{ padding: '10px 12px', fontSize: 14.5, background: '#fff' }} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="01XXX-XXXXXX" />
          </div>
          <button className="btn-dark" onClick={handleAdd}>{t.save}</button>
          <button
            onClick={() => setShowAdd(false)}
            style={{ border: 'none', background: 'none', color: 'var(--muted)', fontSize: 13, fontWeight: 600, padding: '11px 6px' }}
          >
            {t.cancel}
          </button>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-head-dark" style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.6fr 1fr', gap: 10, padding: '12px 20px' }}>
          <div>{t.thName}</div><div>{t.thPhone}</div><div>{t.thBatch}</div><div>{t.thStatus}</div>
        </div>
        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => setDetail(s)}
            className="row-line"
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', fontFamily: 'inherit', cursor: 'pointer', display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.6fr 1fr', gap: 10, padding: '13px 20px', alignItems: 'center', fontSize: 14 }}
          >
            <div style={{ fontWeight: 600 }}>{s.name}</div>
            <div className="mono" style={{ color: 'var(--muted)', fontSize: 12.5 }}>{s.phone}</div>
            <div style={{ color: 'var(--muted)' }}>{s.batch}</div>
            <div>
              <span className={`chip ${s.paid ? 'chip-green' : 'chip-orange'}`}>{s.paid ? t.paid : t.notPurchased}</span>
            </div>
          </button>
        ))}
      </div>

      {detail && (
        <StudentDetail
          student={detail} onClose={() => setDetail(null)} t={t}
          data={{ enrollments, courses, batches, attendance, certificates, payments, submissions }}
        />
      )}
    </div>
  );
}

function StudentDetail({ student, onClose, t, data }) {
  const { enrollments, courses, batches, attendance, certificates, payments, submissions } = data;
  const sid = student.id;
  const myEnr = enrollments.filter((e) => e.studentId === sid);
  const myCourses = myEnr.map((e) => courses.find((c) => c.id === (e.courseId ?? batches.find((b) => b.id === e.batchId)?.courseId))).filter(Boolean);
  const att = attendance.filter((a) => a.studentId === sid);
  const attRate = att.length ? Math.round(att.filter((a) => a.present).length / att.length * 100) : null;
  const myCerts = certificates.filter((c) => c.studentId === sid);
  const myPays = payments.filter((p) => p.studentId === sid);
  const graded = submissions.filter((x) => x.studentId === sid && x.status === 'graded').length;
  const money = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

  const Stat = ({ label, value }) => (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div className="display" style={{ fontSize: 22, marginTop: 2 }}>{value}</div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 90, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="panel anim-in" style={{ width: 'min(600px,100%)', maxHeight: '88vh', overflow: 'auto', padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div className="avatar" style={{ width: 46, height: 46, background: 'var(--brand)', color: '#fff', fontSize: 18 }}>{student.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{student.name}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{student.phone} · {student.batch}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(120px,100%),1fr))', gap: 10, marginBottom: 18 }}>
          <Stat label={t.myCourses} value={myCourses.length} />
          <Stat label={t.mentorAttendance} value={attRate == null ? '—' : `${attRate}%`} />
          <Stat label={t.sCertificates} value={myCerts.length} />
          <Stat label={t.mentorGraded} value={graded} />
        </div>

        {myCourses.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{t.myCourses}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {myCourses.map((c) => <span key={c.id} className="chip" style={{ border: '1.5px solid var(--line)' }}>{c.title}</span>)}
            </div>
          </div>
        )}

        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{t.payHistory}</div>
        {myPays.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--faint)' }}>{t.payNone}</div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {myPays.map((p) => (
              <div key={p.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13 }}>
                <span className="mono" style={{ fontSize: 11, flex: 1 }}>{p.invoiceNo}</span>
                <span className="display">{money(p.amount)}</span>
                <span className={`chip ${p.status === 'refunded' ? '' : 'chip-green'}`} style={{ border: p.status === 'refunded' ? '1.5px solid var(--line)' : 'none' }}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
