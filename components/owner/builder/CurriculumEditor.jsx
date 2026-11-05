'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import LessonDialog from '@/components/owner/builder/LessonDialog';
import { S, errText } from '@/components/owner/builder/strings';
import { clock } from '@/lib/copy';

const TYPES = ['video', 'pdf', 'quiz', 'assignment'];
const TYPE_ICON = { video: 'play', pdf: 'file', quiz: 'help', assignment: 'edit' };
const VIDEO_BADGE = { ready: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', missing: 'badge-danger' };

export default function CurriculumEditor({ course }) {
  const { lang, api, showToast } = useApp();
  const s = S(lang);
  const [busy, setBusy] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [draft, setDraft] = useState({}); // moduleId → { title, type }
  const [renaming, setRenaming] = useState(null); // { id, title }
  const [editing, setEditing] = useState(null); // lesson id
  const [drag, setDrag] = useState(null); // { moduleId, lessonId }
  const [over, setOver] = useState(null); // lesson id the dragged row would land before
  const [settled, setSettled] = useState(null); // row that just moved (settle animation)
  const [announce, setAnnounce] = useState('');

  const run = async (body, msg) => {
    setBusy(true);
    try {
      await api.courseOp({ courseId: course.id, ...body });
      if (msg) { showToast(msg, 'success'); setAnnounce(msg); }
      const moved = body.op === 'moveLesson' ? body.lessonId : body.op === 'reorderLessons' ? body.moved : body.op === 'moveModule' ? `m${body.moduleId}` : null;
      if (moved) { setSettled(null); requestAnimationFrame(() => setSettled(moved)); }
      return true;
    }
    catch (err) { showToast(errText(s, err), 'error'); return false; }
    finally { setBusy(false); }
  };

  const addSection = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    if (await run({ op: 'addModule', title: sectionTitle.trim() }, s.saved)) setSectionTitle('');
  };
  const addLesson = async (e, m) => {
    e.preventDefault();
    const d = draft[m.id] || {};
    if (!d.title?.trim()) return;
    if (await run({ op: 'addLesson', moduleId: m.id, title: d.title.trim(), type: d.type || 'video' }, s.saved)) setDraft((x) => ({ ...x, [m.id]: { title: '', type: d.type || 'video' } }));
  };
  const drop = async (m, targetId) => {
    if (!drag || drag.moduleId !== m.id || drag.lessonId === targetId) { setDrag(null); setOver(null); return; }
    const ids = m.lessons.map((l) => l.id).filter((id) => id !== drag.lessonId);
    const at = targetId == null ? ids.length : ids.indexOf(targetId);
    ids.splice(at < 0 ? ids.length : at, 0, drag.lessonId);
    const moved = drag.lessonId;
    setDrag(null); setOver(null);
    await run({ op: 'reorderLessons', moduleId: m.id, order: ids, moved }, s.saved);
  };
  const lesson = editing ? course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id }))).find((l) => l.id === editing) : null;

  return (
    <div className="stack" style={{ '--gap': '16px' }}>
      <p className="small muted row" style={{ '--gap': '8px' }}><Icon name="info" size={15} />{s.dragHint}</p>
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      {course.modules.map((m, mi) => (
        <section key={m.id} className={`surface ${settled === `m${m.id}` ? 'dnd-item settled' : ''}`} aria-labelledby={`sec-${m.id}`}>
          <div className="row" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {renaming?.id === m.id ? (
              <form className="stack grow" style={{ '--gap': '10px' }} onSubmit={async (e) => { e.preventDefault(); if (await run({ op: 'renameModule', moduleId: m.id, title: renaming.title, summary: renaming.summary, outcomes: renaming.outcomes, scheduleLabel: renaming.scheduleLabel }, s.saved)) setRenaming(null); }}>
                <div className="form-grid">
                  <div className="field"><label htmlFor={`ren-${m.id}`}>{lang === 'en' ? 'Chapter title' : 'অধ্যায়ের নাম'}</label>
                    <input id={`ren-${m.id}`} className="input" value={renaming.title} onChange={(e) => setRenaming({ ...renaming, title: e.target.value })} autoFocus maxLength={191} /></div>
                  <div className="field"><label htmlFor={`when-${m.id}`}>{lang === 'en' ? 'When (timeline)' : 'কখন (টাইমলাইন)'}</label>
                    <input id={`when-${m.id}`} className="input" value={renaming.scheduleLabel} onChange={(e) => setRenaming({ ...renaming, scheduleLabel: e.target.value })} maxLength={80} placeholder={lang === 'en' ? 'Week 1–2 · Sat & Tue 8 pm' : 'সপ্তাহ ১–২ · শনি ও মঙ্গল রাত ৮টা'} /></div>
                </div>
                <div className="field"><label htmlFor={`sum-${m.id}`}>{lang === 'en' ? 'Summary' : 'সংক্ষেপে'}</label>
                  <input id={`sum-${m.id}`} className="input" value={renaming.summary} onChange={(e) => setRenaming({ ...renaming, summary: e.target.value })} maxLength={500} /></div>
                <div className="field"><label htmlFor={`out-${m.id}`}>{lang === 'en' ? 'What learners will be able to do (one per line)' : 'এই অধ্যায় শেষে শিক্ষার্থী যা পারবে (প্রতি লাইনে একটি)'}</label>
                  <textarea id={`out-${m.id}`} className="textarea" rows={3} value={renaming.outcomes} onChange={(e) => setRenaming({ ...renaming, outcomes: e.target.value })} maxLength={4000} /></div>
                <div className="cluster" style={{ '--gap': '8px' }}>
                  <button type="submit" className="btn btn-primary btn-sm">{s.save}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(null)}>{s.close}</button>
                </div>
              </form>
            ) : (
              <h3 id={`sec-${m.id}`} className="h4 grow" style={{ minWidth: 160 }}>
                <button type="button" onClick={() => setRenaming({ id: m.id, title: m.title, summary: m.summary || '', outcomes: m.outcomes || '', scheduleLabel: m.scheduleLabel || '' })} style={{ border: 0, background: 'none', padding: 0, font: 'inherit', textAlign: 'left' }} aria-label={`${s.edit}: ${m.title}`}>
                  {mi + 1}. {m.title} <Icon name="edit" size={14} style={{ color: 'var(--subtle)' }} />
                </button>
                {(m.scheduleLabel || m.summary) && <span className="xsmall muted" style={{ display: 'block', fontFamily: 'var(--font-body, inherit)', fontWeight: 500 }}>{[m.scheduleLabel, m.summary].filter(Boolean).join(' · ')}</span>}
              </h3>
            )}
            <div className="row" style={{ '--gap': '4px' }}>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy || mi === 0} onClick={() => run({ op: 'moveModule', moduleId: m.id, dir: 'up' }, s.saved)} aria-label={`${s.moveUp}: ${m.title}`} data-tooltip={s.moveUp}><Icon name="arrowUp" size={16} /></button>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy || mi === course.modules.length - 1} onClick={() => run({ op: 'moveModule', moduleId: m.id, dir: 'down' }, s.saved)} aria-label={`${s.moveDown}: ${m.title}`} data-tooltip={s.moveDown}><Icon name="arrowDown" size={16} /></button>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy} onClick={() => { if (window.confirm(s.confirmDeleteSection)) run({ op: 'deleteModule', moduleId: m.id }, s.saved); }} aria-label={`${s.deleteSection}: ${m.title}`} data-tooltip={s.deleteSection}><Icon name="trash" size={16} /></button>
            </div>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(m, null)}>
            {m.lessons.map((l, li) => (
              <li key={l.id} draggable={!busy} onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDrag({ moduleId: m.id, lessonId: l.id }); }}
                onDragOver={(e) => { e.preventDefault(); if (drag?.moduleId === m.id && over !== l.id) setOver(l.id); }}
                onDrop={(e) => { e.stopPropagation(); drop(m, l.id); }} onDragEnd={() => { setDrag(null); setOver(null); }}
                className={`row dnd-item ${settled === l.id ? 'settled' : ''}`}
                data-dragging={drag?.lessonId === l.id || undefined}
                data-drop-target={(drag && drag.moduleId === m.id && drag.lessonId !== l.id && over === l.id) || undefined}
                onAnimationEnd={() => setSettled(null)}
                style={{ padding: '10px 14px', borderTop: li ? '1px solid var(--surface-2)' : 0, flexWrap: 'wrap', cursor: busy ? 'progress' : undefined }}>
                <span aria-hidden="true" style={{ cursor: 'grab', color: 'var(--subtle)' }}><Icon name="drag" size={16} /></span>
                <Icon name={TYPE_ICON[l.type]} size={16} label={s[`type_${l.type}`]} />
                <button type="button" className="grow" onClick={() => setEditing(l.id)} style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', fontSize: 15, minWidth: 160 }}>{l.title}</button>
                <div className="cluster" style={{ '--gap': '6px' }}>
                  {l.type === 'video' && <span className={`badge ${VIDEO_BADGE[l.videoStatus] || ''}`}>{s[`v_${l.videoStatus}`] || l.videoStatus}{l.durationSeconds ? ` · ${clock(l.durationSeconds)}` : ''}</span>}
                  {l.free && <span className="badge badge-brand">{s.preview}</span>}
                  {l.resourceCount > 0 && <span className="badge"><Icon name="download" size={12} />{l.resourceCount}</span>}
                </div>
                <div className="row" style={{ '--gap': '2px' }}>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy || li === 0} onClick={() => run({ op: 'moveLesson', moduleId: m.id, lessonId: l.id, dir: 'up' }, s.saved)} aria-label={`${s.moveUp}: ${l.title}`} data-tooltip={s.moveUp}><Icon name="arrowUp" size={15} /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={busy || li === m.lessons.length - 1} onClick={() => run({ op: 'moveLesson', moduleId: m.id, lessonId: l.id, dir: 'down' }, s.saved)} aria-label={`${s.moveDown}: ${l.title}`} data-tooltip={s.moveDown}><Icon name="arrowDown" size={15} /></button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(l.id)}><Icon name="edit" size={14} />{s.edit}</button>
                </div>
              </li>
            ))}
          </ul>

          <form className="row" style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--surface-2)', '--gap': '8px', flexWrap: 'wrap' }} onSubmit={(e) => addLesson(e, m)}>
            <label htmlFor={`nl-${m.id}`} className="sr-only">{s.lessonPh}</label>
            <input id={`nl-${m.id}`} className="input grow" placeholder={s.lessonPh} value={draft[m.id]?.title || ''} onChange={(e) => setDraft((x) => ({ ...x, [m.id]: { ...x[m.id], title: e.target.value } }))} style={{ minHeight: 38, minWidth: 180 }} maxLength={191} />
            <label htmlFor={`nt-${m.id}`} className="sr-only">{s.lessonType}</label>
            <select id={`nt-${m.id}`} className="select" style={{ width: 'auto', minHeight: 38 }} value={draft[m.id]?.type || 'video'} onChange={(e) => setDraft((x) => ({ ...x, [m.id]: { ...x[m.id], type: e.target.value } }))}>
              {TYPES.map((t) => <option key={t} value={t}>{s[`type_${t}`]}</option>)}
            </select>
            <button type="submit" className="btn btn-secondary btn-sm" disabled={busy || !draft[m.id]?.title?.trim()}><Icon name="plus" size={14} />{s.addLesson}</button>
          </form>
        </section>
      ))}

      <form className="surface surface-pad row" style={{ '--gap': '8px', flexWrap: 'wrap' }} onSubmit={addSection}>
        <label htmlFor="new-section" className="sr-only">{s.sectionPh}</label>
        <input id="new-section" className="input grow" placeholder={s.sectionPh} value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} style={{ minWidth: 200 }} maxLength={191} />
        <button type="submit" className="btn btn-primary" disabled={busy || !sectionTitle.trim()}><Icon name="plus" size={16} />{s.addSection}</button>
      </form>

      {lesson && <LessonDialog course={course} lesson={lesson} onClose={() => setEditing(null)} />}
    </div>
  );
}
