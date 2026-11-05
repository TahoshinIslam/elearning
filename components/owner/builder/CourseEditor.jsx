'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import CourseCover from '@/components/ui/CourseCover';
import TabIndicator from '@/components/ui/TabIndicator';
import ImageDropzone, { ImageSizeGuide } from '@/components/ui/ImageDropzone';
import { IMAGE_SPECS } from '@/lib/imageSpecs';
import CurriculumEditor from '@/components/owner/builder/CurriculumEditor';
import CourseSectionsPicker from '@/components/owner/builder/CourseSectionsPicker';
import { S, errText } from '@/components/owner/builder/strings';
import { api as http, putFile } from '@/components/owner/builder/upload';
import { num, taka, dateLabel } from '@/lib/copy';
import { discounted, offerMatches } from '@/lib/offerMath';
import { useFlash } from '@/components/ui/motion';

const MODES = ['recorded', 'live', 'hybrid', 'workshop', 'webinar', 'free'];
import { MODE_LABEL } from '@/lib/modes';

function toForm(c) {
  return {
    title: c.title || '', slug: c.slug || '', tagline: c.tagline || '', description: c.description || '',
    category: c.category || '', level: c.level || '', language: c.language || '', mode: c.mode || 'recorded',
    instructorId: c.instructorId ? String(c.instructorId) : '', duration: c.duration || '',
    whatYouLearn: (c.whatYouLearn || []).join('\n'), requirements: (c.requirements || []).join('\n'), audience: (c.audience || []).join('\n'),
    faqs: (c.faqs || []).map((f) => ({ q: f.q, a: f.a })),
    classId: c.classId ? String(c.classId) : '',
    price: String(c.price ?? 0), completionThreshold: String(c.completionThreshold ?? 80)
  };
}

// Client mirror of lib/repo.js assertCourseComplete (the server re-checks).
export function checklist(course, form) {
  const lessons = course.modules.flatMap((m) => m.lessons);
  return [
    ['title', !!form.title.trim()], ['description', !!form.description.trim()],
    ['price', form.price !== '' && Number.isInteger(Number(form.price)) && Number(form.price) >= 0],
    ['level', !!form.level.trim()], ['language', !!form.language.trim()],
    ['lessons', lessons.length > 0], ['empty_sections', course.modules.every((m) => m.lessons.length > 0)],
    ['videos_not_ready', lessons.filter((l) => l.type === 'video').every((l) => l.videoStatus === 'ready')]
  ];
}

function Field({ id, label, children, help, error }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {help && <p className="help">{help}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export default function CourseEditor({ course, onBack }) {
  const { lang, api, showToast, teachers } = useApp();
  const s = S(lang);
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState(() => toForm(course));
  const [base, setBase] = useState(() => JSON.stringify(toForm(course)));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [cats, setCats] = useState([]);
  const [classes, setClasses] = useState([]);
  const [offers, setOffers] = useState(null);
  const [upc, setUpc] = useState(() => ({ isUpcoming: !!course.isUpcoming, releaseDate: course.releaseDate ? String(course.releaseDate).slice(0, 10) : '' }));
  const [thumbBusy, setThumbBusy] = useState(null);
  const dirty = JSON.stringify(form) !== base;
  const [savedFlash, flashSaved] = useFlash();

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCats(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/classes').then((r) => r.json()).then((d) => setClasses(Array.isArray(d) ? d : [])).catch(() => {});
    // owner/superadmin only; other staff simply don't see the offers panel
    fetch('/api/offers').then((r) => (r.ok ? r.json() : null)).then((d) => setOffers(Array.isArray(d) ? d : null)).catch(() => {});
  }, []);
  useEffect(() => { setUpc({ isUpcoming: !!course.isUpcoming, releaseDate: course.releaseDate ? String(course.releaseDate).slice(0, 10) : '' }); }, [course.isUpcoming, course.releaseDate]);
  // Re-sync when the course is saved/updated elsewhere and there are no local edits.
  useEffect(() => { if (!dirty) { const f = toForm(course); setForm(f); setBase(JSON.stringify(f)); } /* eslint-disable-next-line */ }, [course.updatedAt, course.modules]);
  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const run = async (body, okMsg) => {
    setBusy(true);
    try { await api.courseOp({ courseId: course.id, ...body }); if (okMsg) showToast(okMsg, 'success'); return true; }
    catch (err) { showToast(errText(s, err), 'error'); return false; }
    finally { setBusy(false); }
  };

  const save = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = s.ck_title;
    if (!Number.isInteger(Number(form.price)) || Number(form.price) < 0) errs.price = s.e_invalid_price;
    setErrors(errs);
    if (Object.keys(errs).length) { if (errs.price) setTab('pricing'); else setTab('details'); return; }
    const ok = await run({
      op: 'updateCourse', title: form.title, tagline: form.tagline, description: form.description, category: form.category,
      classId: form.classId === '' ? null : Number(form.classId),
      level: form.level, language: form.language, mode: form.mode, duration: form.duration,
      instructorId: form.instructorId === '' ? null : Number(form.instructorId),
      whatYouLearn: form.whatYouLearn, requirements: form.requirements, audience: form.audience,
      faqs: form.faqs.filter((f) => f.q.trim() && f.a.trim()),
      price: Number(form.price), completionThreshold: Number(form.completionThreshold),
      ...(course.published || form.slug === course.slug ? {} : { slug: form.slug })
    }, s.saved);
    if (ok) { setBase(JSON.stringify(form)); flashSaved(); }
  };

  const togglePublish = async () => {
    if (dirty) { showToast(s.unsaved, 'info'); return; }
    await run({ op: 'publish' }, course.published ? s.unpublish : s.published);
  };

  const uploadThumb = async (file) => {
    if (!file) return;
    setThumbBusy(0);
    try {
      const up = await http(`/api/courses/${course.id}/thumbnail/upload-url`, { method: 'POST', body: { fileName: file.name, contentType: file.type, size: file.size } });
      await putFile(up.uploadUrl, file, file.type, setThumbBusy);
      await http(`/api/courses/${course.id}/thumbnail`, { method: 'POST', body: { key: up.key } });
      api.refetchCourses();
      showToast(s.saved, 'success');
    } catch (err) { showToast(errText(s, err), 'error'); } finally { setThumbBusy(null); }
  };

  const remove = async () => {
    if (!window.confirm(s.deleteConfirm)) return;
    if (await run({ op: 'deleteCourse' }, s.saved)) onBack();
  };

  const saveUpcoming = async () => {
    if (dirty) { showToast(s.unsaved, 'info'); return; }
    await run({ op: 'setUpcoming', isUpcoming: upc.isUpcoming, releaseDate: upc.releaseDate || null }, s.saved);
  };

  const list = useMemo(() => checklist(course, form), [course, form]);
  const ready = list.every(([, ok]) => ok);
  const lessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const tabs = [['details', s.tabDetails], ['curriculum', `${s.tabCurriculum} (${num(lang, lessons)})`], ['media', s.tabMedia], ['pricing', s.tabPricing], ['publish', s.tabPublish], ['students', s.tabStudents]];
  const classSlug = classes.find((c) => String(c.id) === String(form.classId))?.slug || null;
  const matching = (offers || []).filter((o) => o.state === 'live' && offerMatches(o, { id: course.id, category: form.category, classSlug }));
  const listPrice = Number(form.price) || 0;
  const best = listPrice ? matching.reduce((b, o) => { const p = discounted(listPrice, o); return !b || p < b.price ? { price: p, offer: o } : b; }, null) : null;
  const status = course.published ? ['badge-success', s.published] : course.isUpcoming ? ['badge-info', s.upcomingBadge] : course.reviewStatus === 'pending_review' ? ['badge-warning', s.pending] : ['', s.draft];

  const saveBar = (
    <div className="editor-savebar">
      <button type="submit" className={`btn btn-primary ${savedFlash && !dirty ? 'is-success' : ''}`} disabled={busy || (!dirty && !savedFlash)} aria-busy={busy}>
        {busy ? <span className="spinner" aria-hidden="true" /> : savedFlash && !dirty ? <Icon name="check" size={16} /> : null}{savedFlash && !dirty ? s.saved : s.save}
      </button>
      {dirty && <span className="small muted" role="status">{s.unsaved}</span>}
    </div>
  );

  return (
    <div className="stack" style={{ '--gap': '18px' }}>
      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { if (!dirty || window.confirm(s.unsaved)) onBack(); }}><Icon name="arrowLeft" size={16} />{s.back}</button>
      </div>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div className="row" style={{ '--gap': '16px', minWidth: 0 }}>
          <div style={{ width: 120, flex: 'none' }} className="hide-sm"><CourseCover id={course.id} title={course.title} category={course.category} thumbnailUrl={course.thumbnailUrl} size="sm" /></div>
          <div style={{ minWidth: 0 }}>
            <div className="cluster" style={{ '--gap': '8px', marginBottom: 6 }}>
              <span className={`badge ${status[0]}`}>{status[1]}</span>
              {course.featured && <span className="badge badge-brand"><Icon name="star" size={11} />{s.featuredBadge}</span>}
              {dirty && <span className="badge badge-warning">{s.unsaved}</span>}
            </div>
            <h1 className="ws-title" style={{ overflowWrap: 'anywhere' }}>{course.title}</h1>
            <div className="xsmall muted">{num(lang, course.purchaseCount || 0)} {s.purchasers} · {course.rating != null ? `★ ${num(lang, course.rating.toFixed(1))} (${num(lang, course.reviewCount)})` : `${num(lang, 0)} ${s.reviews}`}</div>
          </div>
        </div>
        <div className="cluster" style={{ '--gap': '8px' }}>
          {(course.published || course.isUpcoming) && <Link href={`/course/${course.slug}`} target="_blank" className="btn btn-secondary"><Icon name="external" size={16} />{s.view}</Link>}
          <button type="button" className={`btn ${course.published ? 'btn-secondary' : 'btn-primary'}`} onClick={togglePublish} disabled={busy || (!course.published && !ready)} title={!course.published && !ready ? s.checklist : undefined}>
            {course.published ? s.unpublish : s.publish}
          </button>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label={course.title}>
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" id={`ctab-${k}`} aria-selected={tab === k} aria-controls={`cpanel-${k}`} className="tab" onClick={() => setTab(k)}>{label}</button>
        ))}
        <TabIndicator activeKey={tab} />
      </div>

      <div role="tabpanel" id={`cpanel-${tab}`} aria-labelledby={`ctab-${tab}`}>
        {tab === 'details' && (
          <form onSubmit={save} noValidate>
            <div className="editor-grid">
              <div className="stack" style={{ '--gap': '18px' }}>
                <section className="surface surface-pad stack" aria-labelledby="ed-content">
                  <h2 id="ed-content" className="h4">{s.content}</h2>
                  <Field id="c-title" label={s.title} error={errors.title}><input id="c-title" className="input" value={form.title} onChange={set('title')} maxLength={191} required aria-invalid={!!errors.title} /></Field>
                  <Field id="c-slug" label={s.slug} help={course.published ? s.slugLocked : `/course/${form.slug}`}>
                    <input id="c-slug" className="input" value={form.slug} onChange={set('slug')} disabled={course.published} maxLength={80} />
                  </Field>
                  <Field id="c-tagline" label={s.tagline}><input id="c-tagline" className="input" value={form.tagline} onChange={set('tagline')} maxLength={255} /></Field>
                  <Field id="c-desc" label={s.description}><textarea id="c-desc" className="textarea" rows={8} value={form.description} onChange={set('description')} maxLength={20000} /></Field>
                </section>

                <section className="surface surface-pad stack">
                  <Field id="c-out" label={s.outcomes}><textarea id="c-out" className="textarea" rows={5} value={form.whatYouLearn} onChange={set('whatYouLearn')} /></Field>
                  <div className="form-grid">
                    <Field id="c-req" label={s.requirements}><textarea id="c-req" className="textarea" rows={4} value={form.requirements} onChange={set('requirements')} /></Field>
                    <Field id="c-aud" label={s.audience}><textarea id="c-aud" className="textarea" rows={4} value={form.audience} onChange={set('audience')} /></Field>
                  </div>
                </section>

                <fieldset className="surface surface-pad stack" style={{ margin: 0 }}>
                  <legend className="h4" style={{ padding: '0 4px' }}>{s.faqs}</legend>
                  {form.faqs.map((f, i) => (
                    <div key={i} className="stack" style={{ '--gap': '8px', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <label className="sr-only" htmlFor={`faq-q-${i}`}>{s.faqQ}</label>
                      <input id={`faq-q-${i}`} className="input" placeholder={s.faqQ} value={f.q} onChange={(e) => setForm((x) => ({ ...x, faqs: x.faqs.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)) }))} />
                      <label className="sr-only" htmlFor={`faq-a-${i}`}>{s.faqA}</label>
                      <textarea id={`faq-a-${i}`} className="textarea" rows={2} placeholder={s.faqA} value={f.a} onChange={(e) => setForm((x) => ({ ...x, faqs: x.faqs.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) }))} />
                      <div><button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((x) => ({ ...x, faqs: x.faqs.filter((_, j) => j !== i) }))}><Icon name="trash" size={14} />{s.remove}</button></div>
                    </div>
                  ))}
                  <div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm((x) => ({ ...x, faqs: [...x.faqs, { q: '', a: '' }] }))}><Icon name="plus" size={14} />{s.addFaq}</button></div>
                </fieldset>
              </div>

              <aside className="stack editor-side" style={{ '--gap': '18px' }}>
                <section className="surface surface-pad stack" aria-labelledby="ed-class">
                  <h2 id="ed-class" className="h4">{s.classify}</h2>
                  <Field id="c-cat" label={s.category}>
                    <select id="c-cat" className="select" value={form.category} onChange={set('category')}>
                      <option value="">{s.none}</option>
                      {cats.map((ct) => <option key={ct.slug} value={ct.slug}>{ct.name}</option>)}
                      {form.category && !cats.some((ct) => ct.slug === form.category) && <option value={form.category}>{form.category}</option>}
                    </select>
                  </Field>
                  <Field id="c-class" label={s.classLevel}>
                    <select id="c-class" className="select" value={form.classId} onChange={set('classId')}>
                      <option value="">{s.none}</option>
                      {classes.map((cl) => <option key={cl.id} value={String(cl.id)}>{cl.name}</option>)}
                    </select>
                  </Field>
                  <Field id="c-level" label={s.level}><input id="c-level" className="input" value={form.level} onChange={set('level')} maxLength={128} list="level-options" /></Field>
                  <Field id="c-lang" label={s.language}><input id="c-lang" className="input" value={form.language} onChange={set('language')} maxLength={64} list="lang-options" /></Field>
                  <Field id="c-mode" label={s.mode}>
                    <select id="c-mode" className="select" value={form.mode} onChange={set('mode')}>{MODES.map((m) => <option key={m} value={m}>{(lang === 'en' ? MODE_LABEL.en : MODE_LABEL.bn)[m] || m}</option>)}</select>
                  </Field>
                  <Field id="c-inst" label={s.instructor}>
                    <select id="c-inst" className="select" value={form.instructorId} onChange={set('instructorId')}>
                      <option value="">{s.none}</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </Field>
                  <Field id="c-dur" label={s.durationLabel}><input id="c-dur" className="input" value={form.duration} onChange={set('duration')} maxLength={128} /></Field>
                  <datalist id="level-options"><option value="Beginner" /><option value="Intermediate" /><option value="Advanced" /><option value="সকল শ্রেণি" /></datalist>
                  <datalist id="lang-options"><option value="বাংলা" /><option value="English" /></datalist>
                </section>
                <CourseSectionsPicker courseId={course.id} />
              </aside>
            </div>
            {saveBar}
          </form>
        )}

        {tab === 'curriculum' && <CurriculumEditor course={course} />}

        {tab === 'media' && (
          <div className="editor-grid">
            <section className="surface surface-pad stack" aria-labelledby="ed-thumb">
              <h2 id="ed-thumb" className="h4">{s.thumbnail}</h2>
              <div style={{ maxWidth: 640 }}>
                <ImageDropzone spec={IMAGE_SPECS.courseCard} imageUrl={course.thumbnailUrl} lang={lang} progress={thumbBusy} onFile={uploadThumb}
                  label={lang === 'en' ? IMAGE_SPECS.courseCard.en : IMAGE_SPECS.courseCard.bn} />
              </div>
            </section>
            <aside className="surface surface-pad stack editor-side">
              <p className="small muted">{s.mediaHelp}</p>
              <ImageSizeGuide lang={lang} />
              <p className="small muted">{s.tabCurriculum}: {num(lang, lessons)} · {s.video}: {num(lang, course.modules.flatMap((m) => m.lessons).filter((l) => l.type === 'video' && l.videoStatus === 'ready').length)} {s.v_ready}</p>
              <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setTab('curriculum')}>{s.tabCurriculum} →</button>
            </aside>
          </div>
        )}

        {tab === 'pricing' && (
          <form onSubmit={save} noValidate>
            <div className="editor-grid">
              <section className="surface surface-pad stack" aria-labelledby="ed-price">
                <h2 id="ed-price" className="h4">{s.tabPricing}</h2>
                <div className="form-grid">
                  <Field id="c-price" label={s.price} error={errors.price}><input id="c-price" className="input" inputMode="numeric" value={form.price} onChange={set('price')} aria-invalid={!!errors.price} /></Field>
                  <Field id="c-thr" label={s.threshold}><input id="c-thr" className="input" type="number" min={1} max={100} value={form.completionThreshold} onChange={set('completionThreshold')} /></Field>
                </div>
                {saveBar}
              </section>
              {offers && (
                <aside className="surface surface-pad stack editor-side" aria-labelledby="ed-offers">
                  <h2 id="ed-offers" className="h4">{s.activeOffers}</h2>
                  {!matching.length || !listPrice ? <p className="small muted">{s.noOffers}</p> : (<>
                    <ul className="stack" style={{ '--gap': '6px', listStyle: 'none', margin: 0, padding: 0 }}>
                      {matching.map((o) => <li key={o.id} className="small"><strong>{o.type === 'percent' ? `${num(lang, o.value)}%` : taka(lang, o.value)}</strong> · {o.name}{o.endsAt ? ` · ${dateLabel(lang, o.endsAt)}` : ''}</li>)}
                    </ul>
                    {best && <p className="small">{s.customersPay}: <strong className="tabular">{taka(lang, best.price)}</strong> <s className="muted tabular">{taka(lang, listPrice)}</s></p>}
                  </>)}
                </aside>
              )}
            </div>
          </form>
        )}

        {tab === 'publish' && (
          <div className="editor-grid">
            <div className="stack" style={{ '--gap': '18px' }}>
              <section className="surface surface-pad stack" style={{ '--gap': '12px' }} aria-labelledby="ed-ck">
                <h2 id="ed-ck" className="h4">{s.checklist}</h2>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                  {list.map(([k, ok]) => (
                    <li key={k} className="row" style={{ '--gap': '10px', color: ok ? 'var(--success)' : 'var(--danger)' }}>
                      <Icon name={ok ? 'checkCircle' : 'alert'} size={17} /><span style={{ color: 'var(--ink-2)' }}>{s[`ck_${k}`]}</span>
                    </li>
                  ))}
                </ul>
                <div className="row" style={{ '--gap': '10px', flexWrap: 'wrap' }}>
                  <button type="button" className={`btn ${course.published ? 'btn-secondary' : 'btn-primary'}`} onClick={togglePublish} disabled={busy || (!course.published && !ready)}>{course.published ? s.unpublish : s.publish}</button>
                  {course.published && <span className="small muted">{s.unpublishNote}</span>}
                </div>
              </section>

              {!course.published && (
                <section className="surface surface-pad stack" style={{ '--gap': '12px' }} aria-labelledby="ed-upc">
                  <h2 id="ed-upc" className="h4">{s.upcoming}</h2>
                  <p className="small muted">{s.upcomingHelp}</p>
                  <label className="check"><input type="checkbox" checked={upc.isUpcoming} onChange={(e) => setUpc((u) => ({ ...u, isUpcoming: e.target.checked }))} />{s.upcoming}</label>
                  {upc.isUpcoming && (
                    <Field id="c-rel" label={s.releaseDate} help={!upc.releaseDate ? s.tba : undefined}>
                      <input id="c-rel" type="date" className="input" style={{ maxWidth: 240 }} value={upc.releaseDate} onChange={(e) => setUpc((u) => ({ ...u, releaseDate: e.target.value }))} />
                    </Field>
                  )}
                  <div className="row" style={{ '--gap': '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" onClick={saveUpcoming} disabled={busy || (upc.isUpcoming === !!course.isUpcoming && (upc.releaseDate || '') === (course.releaseDate ? String(course.releaseDate).slice(0, 10) : ''))}>{s.saveAnnouncement}</button>
                    {course.isUpcoming && <span className="small muted">{num(lang, course.waitlistCount || 0)} {s.waitlist}</span>}
                  </div>
                </section>
              )}
            </div>

            <aside className="stack editor-side" style={{ '--gap': '18px' }}>
              <section className="surface surface-pad stack" style={{ '--gap': '10px' }} aria-labelledby="ed-vis">
                <h2 id="ed-vis" className="h4">{s.visibility}</h2>
                <label className="check"><input type="checkbox" checked={!!course.featured} onChange={() => run({ op: 'toggleFeatured' }, s.saved)} disabled={busy} />{s.featured}</label>
                <p className="xsmall muted">{s.featuredHelp}</p>
              </section>
              <section className="surface surface-pad stack" style={{ '--gap': '10px' }} aria-labelledby="ed-stats">
                <h2 id="ed-stats" className="h4">{s.stats}</h2>
                <dl className="kv kv-grid">
                  <dt>{s.purchasers}</dt><dd className="tabular">{num(lang, course.purchaseCount || 0)}</dd>
                  <dt>{s.enrolled}</dt><dd className="tabular">{num(lang, course.enrollmentCount || 0)}</dd>
                  <dt>{s.reviews}</dt><dd className="tabular">{num(lang, course.reviewCount || 0)}{course.rating != null ? ` · ★ ${num(lang, course.rating.toFixed(1))}` : ''}</dd>
                  <dt>{s.pendingReviews}</dt><dd className="tabular">{num(lang, course.pendingReviewCount || 0)}</dd>
                </dl>
              </section>
              <section className="surface surface-pad stack" style={{ borderColor: 'color-mix(in srgb, var(--danger) 35%, var(--border))', '--gap': '10px' }} aria-labelledby="ed-danger">
                <h2 id="ed-danger" className="h4">{s.danger}</h2>
                <button type="button" className="btn btn-danger" onClick={remove} disabled={busy || course.published || course.enrollmentCount > 0 || course.paidOrderCount > 0} style={{ alignSelf: 'flex-start' }}>
                  <Icon name="trash" size={16} />{s.deleteCourse}
                </button>
                {(course.published || course.enrollmentCount > 0 || course.paidOrderCount > 0) && <p className="help">{course.enrollmentCount > 0 || course.paidOrderCount > 0 ? s.e_course_has_students : s.e_unpublish_first}</p>}
              </section>
            </aside>
          </div>
        )}

        {tab === 'students' && <StudentsPanel course={course} s={s} lang={lang} />}
      </div>
    </div>
  );
}

function StudentsPanel({ course, s, lang }) {
  const { enrollments, students } = useApp();
  const rows = enrollments.filter((e) => e.courseId === course.id && e.status === 'active');
  const nameOf = (id) => students.find((st) => st.id === id)?.name || `#${id}`;
  return (
    <div className="stack" style={{ '--gap': '16px' }}>
      <div className="cluster" style={{ '--gap': '12px' }}>
        <div className="surface surface-pad" style={{ minWidth: 180 }}><div className="stat-num">{num(lang, course.enrollmentCount || 0)}</div><div className="stat-label">{s.enrolled}</div></div>
        <div className="surface surface-pad" style={{ minWidth: 180 }}><div className="stat-num">{num(lang, course.paidOrderCount || 0)}</div><div className="stat-label">{s.paidOrders}</div></div>
      </div>
      <p className="small muted">{s.openPayments}</p>
      <h2 className="h4">{s.studentList}</h2>
      {rows.length ? (
        <div className="table-wrap"><table className="table">
          <tbody>{rows.map((e) => <tr key={e.id}><td>{nameOf(e.studentId)}</td><td className="small muted">{e.enrolledAt}</td><td>{e.batchId ? <span className="badge">batch</span> : <span className="badge badge-brand">order</span>}</td></tr>)}</tbody>
        </table></div>
      ) : <p className="muted">{s.noStudents}</p>}
    </div>
  );
}
