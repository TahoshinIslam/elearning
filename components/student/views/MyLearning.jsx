'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import CourseCover from '@/components/ui/CourseCover';
import TabIndicator from '@/components/ui/TabIndicator';
import { copy, num, dateLabel } from '@/lib/copy';

export default function MyLearning({ lang, courses }) {
  const c = copy(lang);
  const [tab, setTab] = useState('all');
  const counts = {
    all: courses.length,
    in_progress: courses.filter((x) => x.status === 'in_progress').length,
    not_started: courses.filter((x) => x.status === 'not_started' || x.status === 'empty').length,
    completed: courses.filter((x) => x.status === 'completed').length
  };
  const list = tab === 'all' ? courses : tab === 'not_started' ? courses.filter((x) => x.status === 'not_started' || x.status === 'empty') : courses.filter((x) => x.status === tab);
  const tabs = [['all', c.tabAll], ['in_progress', c.tabInProgress], ['not_started', c.tabNotStarted], ['completed', c.tabCompleted]];
  const resume = courses.find((x) => x.status === 'in_progress');

  return (
    <div className="stack" style={{ '--gap': '22px' }}>
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>{c.mlTitle}</h1><p>{c.mlSub}</p></div></div>

      {!courses.length ? (
        <div className="surface state">
          <div className="state-icon"><Icon name="book" size={24} /></div>
          <h2>{c.mlEmptyT}</h2>
          <p>{c.mlEmptyD}</p>
          <Link href="/courses" className="btn btn-primary">{c.browseCourses}</Link>
        </div>
      ) : (
        <>
          {resume && (
            <section className="surface surface-pad row" style={{ flexWrap: 'wrap', '--gap': '18px', alignItems: 'center' }} aria-label={c.continueLearning}>
              <div style={{ width: 200, flex: 'none' }}><CourseCover id={resume.courseId} title={resume.title} category={resume.category} thumbnailUrl={resume.thumbnailUrl} /></div>
              <div className="stack grow" style={{ '--gap': '8px', minWidth: 220 }}>
                <span className="eyebrow">{c.continueLearning}</span>
                <h2 className="h3">{resume.title}</h2>
                {resume.resumeLessonTitle && <p className="small muted">{resume.resumeLessonTitle}</p>}
                <div className="progress" role="progressbar" aria-valuenow={resume.completionPct} aria-valuemin={0} aria-valuemax={100} aria-label={c.percentDone(resume.completionPct)}><span style={{ width: `${resume.completionPct}%` }} /></div>
                <span className="small muted">{c.percentDone(resume.completionPct)} · {c.progressOf(resume.completedCount, resume.lessonCount)}</span>
              </div>
              <Link href={`/learn/${resume.slug}/${resume.resumeLessonId}`} className="btn btn-primary btn-lg">{c.resume}<Icon name="arrowRight" size={18} /></Link>
            </section>
          )}

          <div className="tabs" role="tablist" aria-label={c.mlTitle}>
            {tabs.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>{label}<span className="count">{num(lang, counts[k])}</span></button>
            ))}
            <TabIndicator activeKey={tab} />
          </div>

          {!list.length ? <p className="muted" role="status">{c.mlEmptyFilter}</p> : (
            <ul className="grid-cards" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {list.map((x) => (
                <li key={x.courseId} className="course-card">
                  <CourseCover id={x.courseId} title={x.title} category={x.category} thumbnailUrl={x.thumbnailUrl} />
                  <div className="course-card-body">
                    <h3 className="course-card-title clamp-2"><Link href={x.resumeLessonId ? `/learn/${x.slug}/${x.resumeLessonId}` : `/course/${x.slug}`}>{x.title}</Link></h3>
                    {x.instructor && <p className="small muted">{x.instructor}</p>}
                    {x.completionPct != null ? (
                      <div className="stack" style={{ '--gap': '6px', marginTop: 4 }}>
                        <div className={`progress progress-sm ${x.status === 'completed' ? 'progress-success' : ''}`} role="progressbar" aria-valuenow={x.completionPct} aria-valuemin={0} aria-valuemax={100} aria-label={c.percentDone(x.completionPct)}><span style={{ width: `${x.completionPct}%` }} /></div>
                        <span className="small muted">{c.percentDone(x.completionPct)}{x.lastActivityAt ? ` · ${c.lastViewed} ${dateLabel(lang, x.lastActivityAt)}` : ''}</span>
                      </div>
                    ) : <p className="small muted">{c.noLessonsYet}</p>}
                    <div className="course-card-foot" style={{ position: 'relative', zIndex: 1 }}>
                      {x.status === 'completed'
                        ? <span className="badge badge-success"><Icon name="checkCircle" size={13} />{c.completed}</span>
                        : <span className="small strong" style={{ color: 'var(--brand)' }}>{x.status === 'in_progress' ? c.resume : c.start}</span>}
                      {x.certified ? <Link className="small link" href={`/verify/${x.certNo}`}>{c.viewCertificate}</Link>
                        : x.completionPct != null && x.completionPct >= x.certificateThreshold ? <Link className="small link" href="/student?view=certificates">{c.getCertificate}</Link> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
