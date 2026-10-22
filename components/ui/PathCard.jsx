import Link from 'next/link';
import Icon from '@/components/Icon';
import CourseCover, { toneFor } from '@/components/ui/CourseCover';
import { copy, num, taka, duration } from '@/lib/copy';

// A learning path: ordered steps shown as a numbered row of course covers.
export default function PathCard({ path, lang = 'bn' }) {
  const c = copy(lang);
  const tone = toneFor(path.slug);
  return (
    <article className="path-card" style={{ '--tone': tone.bg, '--tone-2': tone.bg2, '--tone-tint': tone.tint }}>
      <div className="path-steps" aria-hidden="true">
        {path.courses.slice(0, 3).map((course, i) => (
          <div key={course.id} className="path-step">
            <span className="path-step-n">{num(lang, i + 1)}</span>
            <CourseCover id={course.id} title={course.title} category={course.category} thumbnailUrl={course.thumbnailUrl} size="sm" />
          </div>
        ))}
        {!path.courses.length && <div className="path-step path-step-empty"><Icon name="compass" size={28} /></div>}
      </div>
      <div className="path-card-body">
        <span className="path-chip"><Icon name="compass" size={13} />{c.pathSteps(path.courses.length)}</span>
        <h3 className="path-card-title"><Link href={`/paths/${path.slug}`}>{path.title}</Link></h3>
        {path.description && <p className="path-card-desc">{path.description}</p>}
        <div className="path-card-meta">
          {path.lessonCount > 0 && <span><Icon name="list" size={14} />{c.lessonsN(path.lessonCount)}</span>}
          {path.durationSeconds > 0 && <span><Icon name="clock" size={14} />{duration(lang, path.durationSeconds)}</span>}
          {path.courses.length > 0 && <span><Icon name="receipt" size={14} />{path.price ? taka(lang, path.price) : c.free}</span>}
        </div>
      </div>
    </article>
  );
}
