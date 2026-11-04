'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import BrandMark from '@/components/ui/BrandMark';
import Drawer from '@/components/ui/Drawer';
import VideoPlayer from '@/components/VideoPlayer';
import TabIndicator from '@/components/ui/TabIndicator';
import { ResourcesPanel, QAPanel, QuizPanel, AssignmentPanel, ReadingPanel } from '@/components/learn/LessonPanels';
import { copy, clock, num } from '@/lib/copy';

const TYPE_ICON = { video: 'play', pdf: 'file', quiz: 'help', assignment: 'edit' };

function Curriculum({ c, lang, modules, currentId, completed, justDone, slug, onNavigate, idPrefix }) {
  const [query, setQuery] = useState('');
  const navRef = useRef(null);
  const currentModule = modules.find((m) => m.lessons.some((l) => l.id === currentId))?.id;
  const [open, setOpen] = useState(() => new Set(currentModule ? [currentModule] : modules.slice(0, 1).map((m) => m.id)));
  useEffect(() => { if (currentModule) setOpen((s) => new Set([...s, currentModule])); }, [currentModule]);
  const qnorm = query.trim().toLowerCase();
  const filtered = modules.map((m) => ({ ...m, lessons: qnorm ? m.lessons.filter((l) => `${l.title} ${l.summary || ''}`.toLowerCase().includes(qnorm)) : m.lessons }))
    .filter((m) => !qnorm || m.lessons.length);
  // Keep the active lesson visible inside the list (never scrolls the page).
  useEffect(() => {
    const nav = navRef.current;
    const row = nav?.querySelector('[aria-current="true"]');
    if (!nav || !row) return;
    const t = setTimeout(() => {
      const top = row.offsetTop - nav.offsetTop;
      if (top < nav.scrollTop || top + row.offsetHeight > nav.scrollTop + nav.clientHeight) nav.scrollTop = Math.max(0, top - nav.clientHeight / 3);
    }, 60);
    return () => clearTimeout(t);
  }, [currentId]);
  return (
    <>
      <div className="curriculum-top">
        <label htmlFor={`${idPrefix}-search`} className="sr-only">{c.searchLessons}</label>
        <div className="input-group">
          <Icon name="search" size={16} />
          <input id={`${idPrefix}-search`} type="search" className="input" placeholder={c.searchLessons} value={query} onChange={(e) => setQuery(e.target.value)} style={{ minHeight: 38, fontSize: 14.5, background: 'var(--stage)', borderColor: 'var(--stage-border)', color: 'var(--stage-ink)' }} />
        </div>
      </div>
      <nav ref={navRef} className="curriculum-scroll" aria-label={c.courseContent}>
        {filtered.map((m, mi) => {
          const isOpen = qnorm ? true : open.has(m.id);
          const done = m.lessons.filter((l) => completed.has(l.id)).length;
          const secs = m.lessons.reduce((n, l) => n + (l.durationSeconds || 0), 0);
          const pid = `${idPrefix}-sec-${m.id}`;
          return (
            <div className="cur-section" key={m.id}>
              <button type="button" className="cur-section-btn" aria-expanded={isOpen} aria-controls={pid}
                onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })}>
                <Icon name="chevronDown" size={17} className="chev" style={{ marginTop: 2 }} />
                <span className="grow">
                  <span className="t" style={{ display: 'block' }}>{num(lang, mi + 1)}. {m.title}</span>
                  <span className="s">{num(lang, done)}/{num(lang, m.lessons.length)}{secs ? ` · ${c.sectionTime(Math.max(1, Math.round(secs / 60)))}` : ''}</span>
                  <span className="cur-sec-progress" aria-hidden="true"><span style={{ width: `${m.lessons.length ? Math.round((done / m.lessons.length) * 100) : 0}%` }} /></span>
                </span>
              </button>
              <div id={pid} className="collapse" data-open={isOpen}><div className="collapse-inner">
              <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 8px' }}>
                {m.lessons.map((l) => {
                  const isDone = completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link href={`/learn/${slug}/${l.id}`} className="cur-lesson" aria-current={l.id === currentId ? 'true' : undefined} onClick={onNavigate} scroll={false}>
                        <span className={`cur-check ${isDone ? 'done' : ''} ${isDone && justDone === l.id ? 'pop' : ''}`} aria-hidden="true">{isDone && <Icon name="check" size={12} stroke={3} />}</span>
                        <span className="lt">
                          <span className="lt-title">{l.title}</span>
                          {l.summary && <span className="lt-sum">{l.summary}</span>}
                          <span className="lm">
                            <Icon name={TYPE_ICON[l.type] || 'play'} size={13} />{c[`type_${l.type}`]}
                            {l.durationSeconds ? <span className="tabular">· {clock(l.durationSeconds)}</span> : null}
                            {l.resources ? <span>· <Icon name="download" size={12} /> {num(lang, l.resources)}</span> : null}
                          </span>
                        </span>
                        <span className="sr-only">{isDone ? c.completed : ''}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              </div></div>
            </div>
          );
        })}
        {!filtered.length && <p className="small muted" style={{ padding: 16 }}>{c.noResultsT}</p>}
      </nav>
    </>
  );
}

export default function CoursePlayer({ outline: initial, lang, children }) {
  const c = copy(lang);
  const params = useParams();
  const router = useRouter();
  const currentId = params?.lessonId ? Number(params.lessonId) : null;
  const [outline, setOutline] = useState(initial);
  const [completed, setCompleted] = useState(() => new Set(initial.modules.flatMap((m) => m.lessons.filter((l) => l.completed).map((l) => l.id))));
  const [collapsed, setCollapsed] = useState(false);
  const [wide, setWide] = useState(null); // ≥1100px: curriculum is a side panel
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState('overview');
  const [saveState, setSaveState] = useState(null);
  const [justDone, setJustDone] = useState(null); // animates only the check that just changed
  const learner = outline.viewer === 'learner';
  const titleRef = useRef(null);

  const flat = useMemo(() => outline.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))), [outline]);
  const idx = flat.findIndex((l) => l.id === currentId);
  const lesson = idx >= 0 ? flat[idx] : null;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  const total = flat.length;
  const doneCount = flat.filter((l) => completed.has(l.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  useEffect(() => {
    try { setCollapsed(localStorage.getItem('leo_player_curriculum_collapsed') === '1'); } catch { /* ignore */ }
    const mq = window.matchMedia('(min-width: 1100px)');
    const on = () => setWide(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const toggleCollapsed = () => setCollapsed((v) => { try { localStorage.setItem('leo_player_curriculum_collapsed', v ? '0' : '1'); } catch { /* ignore */ } return !v; });
  useEffect(() => { if (wide && tab === 'lessons') setTab('overview'); }, [wide, tab]);

  // keep focus management sensible on lesson change
  useEffect(() => { setTab('overview'); setSaveState(null); titleRef.current?.focus({ preventScroll: true }); }, [currentId]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/learn/${outline.course.slug}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOutline(data);
        setCompleted(new Set(data.modules.flatMap((m) => m.lessons.filter((l) => l.completed).map((l) => l.id))));
      }
    } catch { /* keep local state */ }
  }, [outline.course.slug]);

  const markDone = useCallback((id, done = true) => {
    setCompleted((s) => { const n = new Set(s); if (done) n.add(id); else n.delete(id); return n; });
    if (done) setJustDone(id);
    refresh();
  }, [refresh]);

  const tabKeys = [
    ['overview', c.overview],
    ...(wide === false ? [['lessons', c.courseContent]] : []),
    ['resources', `${c.resources}${lesson?.resources ? ` (${num(lang, lesson.resources)})` : ''}`],
    ['qa', c.qa]
  ];
  const goNext = () => { if (next) router.push(`/learn/${outline.course.slug}/${next.id}`, { scroll: false }); };

  const progressBar = (
    <div className="row" style={{ '--gap': '10px', minWidth: 0 }}>
      <div className="progress progress-sm" style={{ width: 90 }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={c.progressOf(doneCount, total)}><span style={{ width: `${pct}%` }} /></div>
      <span className="small muted nowrap">{c.progressOf(doneCount, total)}</span>
    </div>
  );

  const curriculum = (prefix, onNavigate) => (
    <Curriculum c={c} lang={lang} modules={outline.modules} currentId={currentId} completed={completed} justDone={justDone} slug={outline.course.slug} onNavigate={onNavigate} idPrefix={prefix} />
  );

  return (
    <div className="stage">
      <header className="player-top">
        <Link href={`/course/${outline.course.slug}`} className="btn btn-ghost btn-sm" aria-label={c.backToCourse}>
          <Icon name="chevronLeft" size={18} /><span className="desktop-only" style={{ display: 'inline' }}>{c.backToCourse}</span>
        </Link>
        <span aria-hidden="true" style={{ color: 'var(--stage-border)' }}>|</span>
        <Link href="/" aria-label="Leo Learning" className="desktop-only"><BrandMark size={26} /></Link>
        <span className="course-name grow">{outline.course.title}</span>
        <span className="desktop-only">{progressBar}</span>
        <button type="button" className="btn btn-ghost btn-sm wide-only" onClick={toggleCollapsed} aria-pressed={collapsed} aria-label={collapsed ? c.showCurriculum : c.hideCurriculum} data-tooltip={collapsed ? c.showCurriculum : c.hideCurriculum} data-tooltip-pos="bottom">
          <Icon name="sidebar" size={18} />
        </button>
        <button type="button" className="btn btn-secondary btn-sm narrow-only" onClick={() => setDrawer(true)} aria-haspopup="dialog">
          <Icon name="list" size={17} />{c.lessonsBtn} <span className="tabular">{num(lang, doneCount)}/{num(lang, total)}</span>
        </button>
      </header>

      <div className={`player-layout ${collapsed ? 'collapsed' : ''}`}>
        <main id="main" className="player-main">
          {children}
          {!lesson ? (
            <div className="video-frame"><div className="video-state">
              <Icon name="book" size={30} />
              <strong style={{ fontSize: 16 }}>{total ? c.loadingVideo : c.noLessonsYet}</strong>
            </div></div>
          ) : (
            <>
              {lesson.type === 'video' ? (
                <VideoPlayer key={lesson.id} lessonId={lesson.id} lang={lang} mode={learner ? 'learn' : 'preview'}
                  onCompletedChange={(id) => markDone(id, true)} onSaveState={setSaveState} />
              ) : (
                <div className="video-frame" style={{ aspectRatio: 'auto', minHeight: 220, maxHeight: 'none' }}>
                  <div className="video-state" style={{ position: 'relative', minHeight: 220 }}>
                    <Icon name={TYPE_ICON[lesson.type]} size={34} />
                    <strong style={{ fontSize: 18 }}>{c[`type_${lesson.type}`]}</strong>
                    <p>{lesson.type === 'pdf' ? c.readingHint : lesson.type === 'quiz' ? c.quizHint : c.assignmentHint}</p>
                  </div>
                </div>
              )}

              <div className="lesson-bar">
                <div className="grow" style={{ minWidth: 0 }}>
                  <p className="xsmall muted">{lesson.moduleTitle}</p>
                  <h1 ref={titleRef} tabIndex={-1} className="h3" style={{ color: 'var(--stage-ink)', outline: 'none' }}>{lesson.title}</h1>
                </div>
                <div className="row" style={{ '--gap': '8px', flexWrap: 'wrap' }}>
                  {completed.has(lesson.id) && <span className="badge badge-success"><Icon name="check" size={13} />{c.completed}</span>}
                  {learner && lesson.type === 'video' && saveState && (
                    <span className="save-status" role="status" aria-live="polite">
                      {saveState === 'saving' ? <><span className="spinner" style={{ width: 12, height: 12 }} aria-hidden="true" />{c.saving}</> : saveState === 'saved' ? <><Icon name="check" size={13} />{c.saved}</> : <><Icon name="alert" size={13} />{c.saveFailed}</>}
                    </span>
                  )}
                  <Link href={prev ? `/learn/${outline.course.slug}/${prev.id}` : '#'} scroll={false} className="btn btn-secondary btn-sm" aria-disabled={!prev} tabIndex={prev ? undefined : -1}><Icon name="chevronLeft" size={16} /><span className="desktop-only" style={{ display: 'inline' }}>{c.prevLesson}</span></Link>
                  {next
                    ? <Link href={`/learn/${outline.course.slug}/${next.id}`} scroll={false} className="btn btn-primary btn-sm">{c.nextLesson}<Icon name="chevronRight" size={16} /></Link>
                    : <Link href="/student" className="btn btn-primary btn-sm">{c.goMyLearning}</Link>}
                </div>
              </div>

              <div className="lesson-pane">
                {!learner && <div className="notice" style={{ marginBottom: 18 }}><Icon name="eye" size={18} />{c.managerNote}</div>}
                {allDone && learner && (
                  <div className="notice notice-success" style={{ marginBottom: 18, background: 'rgba(21,128,61,.15)', borderColor: 'rgba(34,197,94,.35)', color: '#BBF7D0' }} role="status">
                    <Icon name="award" size={20} /><div><strong style={{ color: '#fff' }}>{c.courseDoneT}</strong><br />{c.courseDoneD} <Link className="link" href="/student">{c.goMyLearning}</Link></div>
                  </div>
                )}
                {!next && !allDone && learner && (
                  <div className="notice" style={{ marginBottom: 18 }}><Icon name="info" size={18} /><div><strong>{c.endOfCourseT}</strong><br />{c.endOfCourseD}</div></div>
                )}
                <div className="lesson-layout">
                  <div style={{ minWidth: 0 }}>
                    <div className="tabs" role="tablist" aria-label={lesson.title}>
                      {tabKeys.map(([k, label]) => (
                        <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className="tab" onClick={() => setTab(k)}
                          onKeyDown={(e) => {
                            const keys = tabKeys.map(([x]) => x); const i = keys.indexOf(k);
                            const to = e.key === 'ArrowRight' ? keys[(i + 1) % keys.length] : e.key === 'ArrowLeft' ? keys[(i + keys.length - 1) % keys.length] : null;
                            if (to) { e.preventDefault(); setTab(to); document.getElementById(`tab-${to}`)?.focus(); }
                          }} tabIndex={tab === k ? 0 : -1}>{label}</button>
                      ))}
                      <TabIndicator activeKey={`${lesson.id}-${tab}-${tabKeys.length}`} />
                    </div>
                    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} style={{ paddingTop: 22 }}>
                      {tab === 'overview' && (
                        <div className="stack" style={{ '--gap': '18px' }}>
                          {lesson.summary && <p className="prose" style={{ color: 'var(--stage-ink)' }}>{lesson.summary}</p>}
                          {lesson.type === 'video' && learner && <p className="small muted row" style={{ '--gap': '8px' }}><Icon name="info" size={15} />{c.watchHint}</p>}
                          {lesson.type === 'pdf' && <ReadingPanel lesson={lesson} lang={lang} learner={learner} completed={completed.has(lesson.id)} onChange={(v) => markDone(lesson.id, v)} />}
                          {lesson.type === 'quiz' && <QuizPanel key={lesson.id} lesson={lesson} lang={lang} learner={learner} onSubmitted={() => markDone(lesson.id, true)} />}
                          {lesson.type === 'assignment' && <AssignmentPanel key={lesson.id} lesson={lesson} lang={lang} learner={learner} onSubmitted={() => markDone(lesson.id, true)} />}
                          {completed.has(lesson.id) && next && <div><button type="button" className="btn btn-secondary" onClick={goNext}>{c.nextLesson}: {next.title}<Icon name="arrowRight" size={16} /></button></div>}
                        </div>
                      )}
                      {tab === 'lessons' && <div className="inline-curriculum">{curriculum('inline')}</div>}
                      {tab === 'resources' && <ResourcesPanel key={lesson.id} lessonId={lesson.id} lang={lang} />}
                      {tab === 'qa' && <QAPanel key={lesson.id} lessonId={lesson.id} lang={lang} />}
                    </div>
                  </div>
                  <aside className="lesson-facts" aria-labelledby="facts-h">
                    <h2 id="facts-h" className="h5" style={{ color: 'var(--stage-ink)' }}>{c.lessonDetails}</h2>
                    <div className="fact"><span>{c.factLesson}</span><span className="tabular">{num(lang, idx + 1)} / {num(lang, total)}</span></div>
                    <div className="fact"><span>{c.factSection}</span><span style={{ textAlign: 'right' }}>{lesson.moduleTitle}</span></div>
                    <div className="fact"><span>{c.factType}</span><span className="row" style={{ '--gap': '6px' }}><Icon name={TYPE_ICON[lesson.type] || 'play'} size={14} />{c[`type_${lesson.type}`]}</span></div>
                    {(lesson.durationSeconds || lesson.durationLabel) && <div className="fact"><span>{c.factDuration}</span><span className="tabular">{lesson.durationSeconds ? clock(lesson.durationSeconds) : lesson.durationLabel}</span></div>}
                    {learner && <div className="fact"><span>{c.factStatus}</span><span style={{ color: completed.has(lesson.id) ? '#86EFAC' : undefined }}>{completed.has(lesson.id) ? c.completed : c.notCompleted}</span></div>}
                    {lesson.resources > 0 && <div className="fact"><span>{c.factResources}</span><button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, color: '#FFD84D', font: 'inherit' }} onClick={() => { setTab('resources'); document.getElementById('tab-resources')?.focus(); }}>{num(lang, lesson.resources)}</button></div>}
                  </aside>
                </div>
              </div>
            </>
          )}
        </main>
        {!collapsed && (
          <aside className="curriculum wide-only-flex" aria-label={c.courseContent}>
            <div style={{ padding: '14px 16px 0' }}><h2 className="h4" style={{ color: 'var(--stage-ink)' }}>{c.courseContent}</h2><div style={{ marginTop: 8 }}>{progressBar}</div></div>
            {curriculum('side')}
          </aside>
        )}
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={c.courseContent} closeLabel={c.close}>
        <div className="stage" style={{ minHeight: 0, margin: '-12px -16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px 0' }}>{progressBar}</div>
          {curriculum('drawer', () => setDrawer(false))}
        </div>
      </Drawer>
    </div>
  );
}
