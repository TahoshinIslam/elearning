'use client';

import Link from 'next/link';
import Accordion from '@/components/ui/Accordion';
import Icon from '@/components/Icon';
import { PreviewLink } from '@/components/course/PreviewProvider';
import { copy, clock, duration } from '@/lib/copy';

const TYPE_ICON = { video: 'play', pdf: 'file', quiz: 'help', assignment: 'edit' };

// Course page curriculum. Enrolled students get each row as a link straight
// into that lesson (/learn/<slug>/<lessonId>) with their completion ticks;
// everyone else sees previews and locks.
export default function Curriculum({ modules, lang, owned, slug, completedIds = [], totalSeconds, lessonCount }) {
  const c = copy(lang);
  const done = new Set(completedIds);
  const en = lang === 'en';
  const bnNum = (n) => (en ? String(n) : String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]));
  const items = modules.map((m, mi) => ({
    id: m.id,
    style: { '--step': `"${bnNum(mi + 1)}"` },
    title: (
      <span className="tl-head">
        <span className="tl-kicker">{en ? `Chapter ${mi + 1}` : `অধ্যায় ${bnNum(mi + 1)}`}{m.when && <span className="tl-when"><Icon name="calendar" size={13} />{m.when}</span>}</span>
        <span className="tl-title">{m.title}</span>
      </span>
    ),
    meta: `${owned ? `${m.lessons.filter((l) => done.has(l.id)).length}/${m.lessons.length} · ` : ''}${c.lessonsN(m.lessons.length)}${m.durationSeconds ? ` · ${duration(lang, m.durationSeconds)}` : ''}`,
    flush: true,
    content: (
      <>
      {(m.summary || m.outcomes?.length > 0) && (
        <div className="tl-about">
          {m.summary && <p className="tl-summary">{m.summary}</p>}
          {m.outcomes?.length > 0 && (
            <div className="tl-outcomes">
              <strong>{en ? 'After this chapter you can' : 'এই অধ্যায় শেষে আপনি পারবেন'}</strong>
              <ul>{m.outcomes.map((o) => <li key={o}><Icon name="check" size={14} />{o}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 6px' }}>
        {m.lessons.map((l) => {
          const meta = (l.durationSeconds || l.durationLabel) && <span className="dur">{l.durationSeconds ? clock(l.durationSeconds) : l.durationLabel}</span>;
          if (owned) {
            const isDone = done.has(l.id);
            return (
              <li key={l.id}>
                <Link href={`/learn/${slug}/${l.id}`} className="lesson-row lesson-row-link">
                  <span className={`cur-check light ${isDone ? 'done' : ''}`} aria-hidden="true">{isDone && <Icon name="check" size={12} stroke={3} />}</span>
                  <span className="lesson-title grow">
                    <span style={{ display: 'block' }}>{l.title}</span>
                    {l.summary && <span className="xsmall muted clamp-1" style={{ display: 'block' }}>{l.summary}</span>}
                  </span>
                  <span className="xsmall muted row nowrap" style={{ '--gap': '4px' }}><Icon name={TYPE_ICON[l.type] || 'play'} size={13} />{c[`type_${l.type}`]}</span>
                  {meta}
                  <span className="sr-only">{isDone ? c.completed : ''}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={l.id} className="lesson-row">
              <Icon name={l.previewable ? TYPE_ICON[l.type] || 'play' : 'lock'} size={16} style={{ color: l.previewable ? 'var(--brand)' : 'var(--subtle)' }} label={l.previewable ? c[`type_${l.type}`] : c.locked} />
              {l.previewable ? <PreviewLink lessonId={l.id}>{l.title}</PreviewLink> : <span className="lesson-title">{l.title}</span>}
              {l.previewable && <span className="badge badge-brand">{c.preview}</span>}
              {meta}
            </li>
          );
        })}
        {!m.lessons.length && <li className="lesson-row muted small">{c.noLessonsYet}</li>}
      </ul>
      </>
    )
  }));
  return (
    <Accordion
      className="timeline"
      items={items}
      defaultOpen={modules.slice(0, 1).map((m) => m.id)}
      renderControls={({ setAll, allOpen }) => (
        <div className="curriculum-head">
          <span>{c.sectionsN(modules.length)} · {c.lessonsN(lessonCount)}{totalSeconds ? ` · ${c.totalLength} ${duration(lang, totalSeconds)}` : ''}</span>
          {modules.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(!allOpen)}>{allOpen ? c.collapseAll : c.expandAll}</button>}
        </div>
      )}
    />
  );
}
