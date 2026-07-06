'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function StudentsTab() {
  const { t, lang, students, addStudent, importStudentsCsv, showToast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

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
          <div
            key={s.id}
            className="row-line"
            style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.6fr 1fr', gap: 10, padding: '13px 20px', alignItems: 'center', fontSize: 14 }}
          >
            <div style={{ fontWeight: 600 }}>{s.name}</div>
            <div className="mono" style={{ color: 'var(--muted)', fontSize: 12.5 }}>{s.phone}</div>
            <div style={{ color: 'var(--muted)' }}>{s.batch}</div>
            <div>
              <span className={`chip ${s.paid ? 'chip-green' : 'chip-orange'}`}>{s.paid ? t.paid : t.due}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
