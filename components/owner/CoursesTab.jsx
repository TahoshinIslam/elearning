'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import VideoUploadControl from '@/components/owner/VideoUploadControl';
import ThumbnailUploadControl from '@/components/owner/ThumbnailUploadControl';

const LESSON_TYPES = [
  { key: 'video', icon: 'play', chip: 'chip-orange' },
  { key: 'pdf', icon: 'file', chip: 'chip-stone' },
  { key: 'quiz', icon: 'help', chip: 'chip-violet' },
  { key: 'assignment', icon: 'edit', chip: 'chip-green' }
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
  const [editCourse, setEditCourse] = useState(null); // { id, title, price, oldPrice, category }
  const [editModule, setEditModule] = useState(null); // { id, title }
  const [editLesson, setEditLesson] = useState(null); // { id, title }
  const [drag, setDrag] = useState(null); // { moduleId, lessonId }
  const [cats, setCats] = useState([]);   // managed categories (so new ones are selectable)

  useEffect(() => { api.getCategories().then(setCats).catch(() => {}); }, []);

  // drag-drop: drop lesson `drag` before `targetLessonId`, persist the new order
  const onLessonDrop = async (courseId, module, targetLessonId) => {
    if (!drag || drag.moduleId !== module.id || drag.lessonId === targetLessonId) { setDrag(null); return; }
    const ids = module.lessons.map((l) => l.id).filter((id) => id !== drag.lessonId);
    const at = ids.indexOf(targetLessonId);
    ids.splice(at < 0 ? ids.length : at, 0, drag.lessonId);
    setDrag(null);
    await api.reorderLessons(courseId, module.id, ids);
  };

  const startEdit = (c) => setEditCourse({
    id: c.id, title: c.title, price: c.price ?? 0, oldPrice: c.oldPrice ?? '', category: c.category || '',
    level: c.level || '', language: c.language || '', duration: c.duration || '', thumb: c.thumb || '',
    instructor: c.instructor || '', mode: c.mode || 'live', tagline: c.tagline || '', description: c.description || '',
    completionThreshold: c.completionThreshold ?? 80
  });
  const saveEdit = async () => {
    const { id, ...patch } = editCourse;
    setEditCourse(null);
    await api.updateCourse(id, patch);
    showToast(t.cbCourseUpdated);
  };
  const removeCourse = async (c) => {
    if (!window.confirm(t.cbDeleteConfirm)) return;
    await api.deleteCourse(c.id);
    showToast(t.cbCourseDeleted);
  };
  const saveModuleName = async (courseId) => {
    const { id, title } = editModule;
    setEditModule(null);
    if (title.trim()) { await api.renameModule(courseId, id, title.trim()); showToast(bn ? 'মডিউল আপডেট হয়েছে' : 'Module updated'); }
  };
  const saveLessonName = async (courseId, moduleId) => {
    const { id, title } = editLesson;
    setEditLesson(null);
    if (title.trim()) { await api.renameLesson(courseId, moduleId, id, title.trim()); showToast(bn ? 'লেসন আপডেট হয়েছে' : 'Lesson updated'); }
  };

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

  const MISSING_LABEL = { lessons: bn ? 'অন্তত ১টি লেসন' : 'at least one lesson', description: bn ? 'বিবরণ' : 'a description', price: bn ? 'মূল্য' : 'a price' };
  const togglePublish = async (c) => {
    try {
      await api.toggleCoursePublish(c.id);
      showToast(
        c.published
          ? bn ? 'কোর্স আনপাবলিশ হয়েছে' : 'Course unpublished'
          : bn ? 'কোর্স পাবলিশ হয়েছে' : 'Course published'
      );
    } catch (e) {
      const missing = e?.data?.missing;
      if (e?.data?.error === 'incomplete_course' && missing?.length) {
        showToast(`${bn ? 'পাবলিশ করার আগে যোগ করুন: ' : 'Add before publishing: '}${missing.map((k) => MISSING_LABEL[k] || k).join(', ')}`);
      } else {
        showToast(t.errGeneric);
      }
    }
  };

  const submitForReview = async (c) => {
    try {
      await api.courseReviewAction(c.id, 'submit');
      showToast(bn ? 'রিভিউর জন্য জমা দেওয়া হয়েছে' : 'Submitted for review');
    } catch (e) {
      const missing = e?.data?.missing;
      if (e?.data?.error === 'incomplete_course' && missing?.length) {
        showToast(`${bn ? 'জমা দেওয়ার আগে যোগ করুন: ' : 'Add before submitting: '}${missing.map((k) => MISSING_LABEL[k] || k).join(', ')}`);
      } else {
        showToast(t.errGeneric);
      }
    }
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
                    {c.reviewStatus === 'pending_review' && (
                      <span className="chip chip-violet">{bn ? 'রিভিউ অপেক্ষমাণ' : 'Pending review'}</span>
                    )}
                    {c.featured && <span className="chip chip-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="star" size={12} /> {t.courseFeatured}</span>}
                    {c.price > 0 && <span className="chip chip-orange">৳{c.price}</span>}
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 3 }}>
                    {c.slug} · {c.modules.length} {t.cbModules} · {lessonCount} {t.cbLessons}
                  </div>
                  {c.reviewNote && (
                    <div style={{ fontSize: 12, color: 'var(--danger,#c92a2a)', marginTop: 6, background: '#fef2f2', borderRadius: 8, padding: '6px 10px' }}>
                      {bn ? 'রিভিউয়ারের মন্তব্য: ' : 'Reviewer feedback: '}{c.reviewNote}
                    </div>
                  )}
                </div>
                <button className="btn-ghost-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} onClick={() => startEdit(c)}><Icon name="edit" size={13} /> {t.cbEdit}</button>
                <button className="btn-ghost-sm" style={{ color: c.featured ? 'var(--brand)' : 'var(--muted)' }} onClick={() => api.toggleCourseFeatured(c.id).then(() => showToast(c.featured ? t.courseUnfeatured || 'Unfeatured' : t.courseFeatured, 'info'))} title={t.courseFeatured}>
                  <Icon name="star" size={15} />
                </button>
                {!c.published && c.reviewStatus !== 'pending_review' && (
                  <button className="btn-ghost-sm" onClick={() => submitForReview(c)}>
                    {bn ? 'রিভিউর জন্য জমা দিন' : 'Submit for review'}
                  </button>
                )}
                <button className="btn-ghost-sm" onClick={() => togglePublish(c)}>
                  {c.published ? t.cbUnpublish : t.cbPublish}
                </button>
                <button className="btn-ghost-sm" style={{ color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: 5 }} onClick={() => removeCourse(c)}><Icon name="trash" size={13} /> {t.cbDelete}</button>
              </div>

              {/* inline course edit form */}
              {editCourse?.id === c.id && (
                <div className="panel" style={{ padding: 14, marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(150px,100%),1fr))', gap: 10, alignItems: 'end' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cbTitleLabel}
                    <input value={editCourse.title} onChange={(e) => setEditCourse((s) => ({ ...s, title: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cbPrice}
                    <input type="number" value={editCourse.price} onChange={(e) => setEditCourse((s) => ({ ...s, price: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cbOldPrice}
                    <input type="number" value={editCourse.oldPrice} onChange={(e) => setEditCourse((s) => ({ ...s, oldPrice: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cbCategory}
                    <select value={editCourse.category} onChange={(e) => setEditCourse((s) => ({ ...s, category: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }}>
                      <option value="">—</option>
                      {cats.map((c) => <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>)}
                      {/* keep the current value selectable even if it predates the managed list */}
                      {editCourse.category && !cats.some((c) => c.slug === editCourse.category) && (
                        <option value={editCourse.category}>{editCourse.category}</option>
                      )}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cdInstructor}
                    <input value={editCourse.instructor} onChange={(e) => setEditCourse((s) => ({ ...s, instructor: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cdLevel}
                    <input value={editCourse.level} onChange={(e) => setEditCourse((s) => ({ ...s, level: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cdLanguage}
                    <input value={editCourse.language} onChange={(e) => setEditCourse((s) => ({ ...s, language: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cdDuration}
                    <input value={editCourse.duration} onChange={(e) => setEditCourse((s) => ({ ...s, duration: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cbCompletionReq}
                    <input type="number" min="1" max="100" value={editCourse.completionThreshold} onChange={(e) => setEditCourse((s) => ({ ...s, completionThreshold: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{t.cbTaglineLabel || 'Tagline'}
                    <input value={editCourse.tagline} onChange={(e) => setEditCourse((s) => ({ ...s, tagline: e.target.value }))} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', gridColumn: '1 / -1' }}>{t.cdDescription}
                    <textarea value={editCourse.description} onChange={(e) => setEditCourse((s) => ({ ...s, description: e.target.value }))} rows={3} style={{ ...inputStyle, width: '100%', marginTop: 4, resize: 'vertical' }} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', gridColumn: '1 / -1' }}>{bn ? 'থাম্বনেইল' : 'Thumbnail'}
                    <div style={{ marginTop: 4 }}><ThumbnailUploadControl courseId={c.id} currentUrl={c.thumbnailUrl} /></div>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" onClick={saveEdit}>{t.cbSave}</button>
                    <button className="btn-ghost-sm" onClick={() => setEditCourse(null)}>{t.cbCancel}</button>
                  </div>
                </div>
              )}

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
                          {editModule?.id === m.id ? (
                            <>
                              <input
                                value={editModule.title}
                                autoFocus
                                onChange={(e) => setEditModule((s) => ({ ...s, title: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveModuleName(c.id); if (e.key === 'Escape') setEditModule(null); }}
                                style={{ ...inputStyle, flex: 1 }}
                              />
                              <button className="btn-ghost-sm" onClick={() => saveModuleName(c.id)}>{t.cbSave}</button>
                              <button className="btn-ghost-sm" onClick={() => setEditModule(null)}>{t.cbCancel}</button>
                            </>
                          ) : (
                            <>
                              <span style={{ fontWeight: 700, fontSize: 14.5, flex: 1, minWidth: 0 }}>{m.title}</span>
                              <button className="btn-ghost-sm" onClick={() => setEditModule({ id: m.id, title: m.title })} aria-label="rename module"><Icon name="edit" size={14} /></button>
                              <button
                                className="btn-ghost-sm"
                                onClick={() => api.deleteModule(c.id, m.id).then(() => showToast(bn ? 'মডিউল মুছে ফেলা হয়েছে' : 'Module deleted'))}
                                aria-label="delete module"
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* lessons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {m.lessons.length === 0 && (
                            <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>{t.cbNoLessons}</div>
                          )}
                          {m.lessons.map((l) => {
                            const meta = lessonMeta(l.type);
                            const dragging = drag?.lessonId === l.id;
                            return (
                              <div
                                key={l.id}
                                className="row-line"
                                draggable
                                onDragStart={() => setDrag({ moduleId: m.id, lessonId: l.id })}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => onLessonDrop(c.id, m, l.id)}
                                onDragEnd={() => setDrag(null)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', opacity: dragging ? 0.4 : 1, cursor: 'grab', flexWrap: 'wrap' }}
                              >
                                <span title="drag to reorder" style={{ color: 'var(--faint)', cursor: 'grab', display: 'inline-flex' }}><Icon name="drag" size={15} /></span>
                                <span style={{ color: 'var(--muted)', display: 'inline-flex' }}><Icon name={meta.icon} size={15} /></span>
                                {editLesson?.id === l.id ? (
                                  <>
                                    <input
                                      value={editLesson.title}
                                      autoFocus
                                      onChange={(e) => setEditLesson((s) => ({ ...s, title: e.target.value }))}
                                      onKeyDown={(e) => { if (e.key === 'Enter') saveLessonName(c.id, m.id); if (e.key === 'Escape') setEditLesson(null); }}
                                      style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <button className="btn-ghost-sm" onClick={() => saveLessonName(c.id, m.id)}>{t.cbSave}</button>
                                    <button className="btn-ghost-sm" onClick={() => setEditLesson(null)}>{t.cbCancel}</button>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ flex: 1, fontSize: 13.5, minWidth: 0 }}>{l.title}</span>
                                    {l.duration && <span style={{ fontSize: 12, color: 'var(--faint)' }}>{l.duration}</span>}
                                    <span className={`chip ${meta.chip}`} style={{ flex: 'none' }}>{typeLabel(l.type)}</span>
                                    {/* demo (free preview) vs locked */}
                                    <button
                                      className={`chip ${l.free ? 'chip-green' : ''}`}
                                      style={{ flex: 'none', cursor: 'pointer', border: l.free ? 'none' : '1.5px solid var(--line)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                      onClick={() => api.toggleLessonFree(c.id, m.id, l.id)}
                                      title={l.free ? t.cbDemo : t.cbLocked}
                                    >
                                      <Icon name={l.free ? 'eye' : 'lock'} size={12} /> {l.free ? t.cbDemo : t.cbLocked}
                                    </button>
                                    {l.type === 'video' && <VideoUploadControl lessonId={l.id} />}
                                    {/* reorder */}
                                    <button className="btn-ghost-sm" onClick={() => api.moveLesson(c.id, m.id, l.id, 'up')} aria-label="move up"><Icon name="arrowUp" size={14} /></button>
                                    <button className="btn-ghost-sm" onClick={() => api.moveLesson(c.id, m.id, l.id, 'down')} aria-label="move down"><Icon name="arrowDown" size={14} /></button>
                                    <button className="btn-ghost-sm" onClick={() => setEditLesson({ id: l.id, title: l.title })} aria-label="rename lesson"><Icon name="edit" size={14} /></button>
                                    <button
                                      className="btn-ghost-sm"
                                      onClick={() => api.deleteLesson(c.id, m.id, l.id)}
                                      aria-label="delete lesson"
                                    >
                                      <Icon name="trash" size={14} />
                                    </button>
                                  </>
                                )}
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
