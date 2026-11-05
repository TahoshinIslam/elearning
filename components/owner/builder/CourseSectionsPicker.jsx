'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '@/context/AppContext';

// "Show in sections" — pick which home/catalog sections (School, College,
// Admission, Upcoming…) list this course. Saves on every change.
export default function CourseSectionsPicker({ courseId }) {
  const { lang, showToast } = useApp();
  const en = lang === 'en';
  const [sections, setSections] = useState(null);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/course-sections?all=1').then((r) => (r.ok ? r.json() : fetch('/api/course-sections').then((x) => x.json()))),
      fetch(`/api/courses/${courseId}/sections`).then((r) => r.json())
    ]).then(([all, mine]) => { setSections(Array.isArray(all) ? all : []); setPicked(mine.sectionIds || []); }).catch(() => setSections([]));
  }, [courseId]);

  const toggle = async (id) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    setPicked(next); setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/sections`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionIds: next }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPicked(d.sectionIds);
      showToast(en ? 'Sections updated' : 'সেকশন আপডেট হয়েছে', 'success');
    } catch {
      setPicked(picked);
      showToast(en ? 'Couldn’t update sections' : 'সেকশন আপডেট করা যায়নি', 'error');
    } finally { setBusy(false); }
  };

  return (
    <section className="surface surface-pad stack" aria-labelledby="ed-sections" style={{ '--gap': '10px' }}>
      <h2 id="ed-sections" className="h4"><Icon name="layers" size={18} /> {en ? 'Show in sections' : 'কোন সেকশনে দেখাবে'}</h2>
      <p className="help" style={{ margin: 0 }}>{en ? 'The course appears in each ticked section on the home page and in the course filters.' : 'টিক দেওয়া প্রতিটি সেকশনে কোর্সটি হোমপেজ ও কোর্স ফিল্টারে দেখাবে।'}</p>
      {sections === null ? <div className="skeleton" style={{ height: 120 }} /> : (
        <ul className="sec-checks" aria-busy={busy}>
          {sections.map((s) => (
            <li key={s.id}>
              <label className={`sec-check ${picked.includes(s.id) ? 'on' : ''}`} style={{ '--tone': `var(--c-${s.tone})` }}>
                <input type="checkbox" checked={picked.includes(s.id)} disabled={busy} onChange={() => toggle(s.id)} />
                <span className="sec-check-icon" aria-hidden="true"><Icon name={s.icon} size={15} /></span>
                <span className="grow">{en ? s.nameEn : s.nameBn}</span>
                {s.enabled === false && <span className="badge badge-danger">{en ? 'Off' : 'বন্ধ'}</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
