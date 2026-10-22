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
  const items = modules.map((m) => ({
    id: m.id,
    title: m.title,
    meta: `${owned ? `${m.lessons.filter((l) => done.has(l.id)).length}/${m.lessons.length} · ` : ''}${c.lessonsN(m.lessons.length)}${m.durationSeconds ? ` · ${duration(lang, m.durationSeconds)}` : ''}`,
    flush: true,
    content: (
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
    )
  }));
  return (
    <Accordion
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
