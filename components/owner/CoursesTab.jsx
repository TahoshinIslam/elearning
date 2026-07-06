'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const LESSON_TYPES = [
  { key: 'video', icon: '▶', chip: 'chip-orange' },
  { key: 'pdf', icon: '📄', chip: 'chip-stone' },
  { key: 'quiz', icon: '❓', chip: 'chip-violet' },
  { key: 'assignment', icon: '✍', chip: 'chip-green' }
];

const inputStyle = {
  flex: 1,
  minWidth: 0,
  border: '1px solid var(--field-line)',
  background: 'var(--field)',
  borderRadius: 8,
  padding: '8px 11px',
  fontSize: 13.5,
  fontFamily: 'inherit'
};

export default function CoursesTab() {
  const { t, lang, courses, api, showToast } = useApp();
  const bn = lang === 'bn';

  const [newCourse, setNewCourse] = useState('');
  const [moduleDraft, setModuleDraft] = useState({}); // { [courseId]: title }
  const [lessonDraft, setLessonDraft] = useState({}); // { [moduleId]: { title, type } }
  const [collapsed, setCollapsed] = useState({}); // { [courseId]: true }

  const lessonMeta = (type) => LESSON_TYPES.find((x) => x.key === type) || LESSON_TYPES[0];
  const typeLabel = (type) =>
    ({ video: t.lessonVideo, pdf: t.lessonPdf, quiz: t.lessonQuiz, assignment: t.lessonAssignment }[type] || type);

  const createCourse = async () => {
    const title = newCourse.trim();
    if (!title) return;
    setNewCourse('');
    await api.addCourse(title);
    showToast(bn ? 'কোর্স তৈরি হয়েছে' : 'Course created');
  };

  const togglePublish = async (c) => {
    await api.toggleCoursePublish(c.id);
    showToast(
      c.published
        ? bn ? 'কোর্স আনপাবলিশ হয়েছে' : 'Course unpublished'
        : bn ? 'কোর্স পাবলিশ হয়েছে' : 'Course published'
    );
  };

  const addModule = async (courseId) => {
    const title = (moduleDraft[courseId] || '').trim();
    if (!title) return;
    setModuleDraft((d) => ({ ...d, [courseId]: '' }));
    await api.addModule(courseId, title);
    showToast(bn ? 'মডিউল যোগ হয়েছে' : 'Module added');
  };

  const addLesson = async (courseId, moduleId) => {
    const draft = lessonDraft[moduleId] || { title: '', type: 'video' };
    const title = draft.title.trim();
    if (!title) return;
    setLessonDraft((d) => ({ ...d, [moduleId]: { title: '', type: draft.type } }));
    await api.addLesson(courseId, moduleId, title, draft.type);
    showToast(bn ? 'লেসন যোগ হয়েছে' : 'Lesson added');
  };

  return (
    <div className="anim-in">
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.courses}</h2>
        <div style={{ fontSize: 13, color: 'var(--faint)', marginTop: 2 }}>{t.courseBuilder}</div>
      </div>

      {/* new course */}
      <div className="card" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center', margin: '18px 0 22px', flexWrap: 'wrap' }}>
        <input
          value={newCourse}
          onChange={(e) => setNewCourse(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createCourse()}
          placeholder={t.courseTitlePh}
          style={{ ...inputStyle, minWidth: 220 }}
        />
        <button className="btn-primary" onClick={createCourse}>+ {t.newCourse}</button>
      </div>

      {courses.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--faint)' }}>{t.cbEmpty}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {courses.map((c) => {
          const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
          const isCollapsed = collapsed[c.id];
          return (
            <div key={c.id} className="card" style={{ padding: 20 }}>
              {/* course header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn-ghost-sm"
                  onClick={() => setCollapsed((s) => ({ ...s, [c.id]: !s[c.id] }))}
                  style={{ marginTop: 2 }}
                  aria-label="toggle"
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{c.title}</span>
                    <span className={`chip ${c.published ? 'chip-green' : 'chip-stone'}`}>
                      {c.published ? t.cbPublished : t.cbDraft}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 3 }}>
                    {c.slug} · {c.modules.length} {t.cbModules} · {lessonCount} {t.cbLessons}
                  </div>
                </div>
                <button className="btn-ghost-sm" onClick={() => togglePublish(c)}>
                  {c.published ? t.cbUnpublish : t.cbPublish}
                </button>
              </div>

              {!isCollapsed && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {c.modules.length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--faint)', padding: '4px 2px' }}>{t.cbNoModules}</div>
                  )}

                  {c.modules.map((m) => {
                    const draft = lessonDraft[m.id] || { title: '', type: 'video' };
                    return (
                      <div key={m.id} className="panel" style={{ padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <span style={{ fontWeight: 700, fontSize: 14.5, flex: 1 }}>{m.title}</span>
                          <button
                            className="btn-ghost-sm"
                            onClick={() => api.deleteModule(c.id, m.id).then(() => showToast(bn ? 'মডিউল মুছে ফেলা হয়েছে' : 'Module deleted'))}
                          >
                            ✕
                          </button>
                        </div>

                        {/* lessons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {m.lessons.length === 0 && (
                            <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>{t.cbNoLessons}</div>
                          )}
                          {m.lessons.map((l) => {
                            const meta = lessonMeta(l.type);
                            return (
                              <div key={l.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px' }}>
                                <span style={{ width: 20, textAlign: 'center', fontSize: 13 }}>{meta.icon}</span>
                                <span style={{ flex: 1, fontSize: 13.5, minWidth: 0 }}>{l.title}</span>
                                {l.duration && <span style={{ fontSize: 12, color: 'var(--faint)' }}>{l.duration}</span>}
                                <span className={`chip ${meta.chip}`} style={{ flex: 'none' }}>{typeLabel(l.type)}</span>
                                <button
                                  className="btn-ghost-sm"
                                  onClick={() => api.deleteLesson(c.id, m.id, l.id)}
                                  aria-label="delete lesson"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* add lesson */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          <input
                            value={draft.title}
                            onChange={(e) => setLessonDraft((d) => ({ ...d, [m.id]: { ...draft, title: e.target.value } }))}
                            onKeyDown={(e) => e.key === 'Enter' && addLesson(c.id, m.id)}
                            placeholder={t.cbLessonPh}
                            style={{ ...inputStyle, minWidth: 140 }}
                          />
                          <select
                            value={draft.type}
                            onChange={(e) => setLessonDraft((d) => ({ ...d, [m.id]: { ...draft, type: e.target.value } }))}
                            style={{ ...inputStyle, flex: 'none', width: 130 }}
                          >
                            {LESSON_TYPES.map((lt) => (
                              <option key={lt.key} value={lt.key}>{typeLabel(lt.key)}</option>
                            ))}
                          </select>
                          <button className="btn-ghost-sm" onClick={() => addLesson(c.id, m.id)}>+ {t.cbAddLesson}</button>
                        </div>
                      </div>
                    );
                  })}

                  {/* add module */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <input
                      value={moduleDraft[c.id] || ''}
                      onChange={(e) => setModuleDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addModule(c.id)}
                      placeholder={t.cbModulePh}
                      style={{ ...inputStyle, minWidth: 160 }}
                    />
                    <button className="btn-ghost-sm" onClick={() => addModule(c.id)}>+ {t.cbAddModule}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
