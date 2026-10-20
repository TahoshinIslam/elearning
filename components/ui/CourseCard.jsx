import Link from 'next/link';
import Icon from '@/components/Icon';
import CourseCover, { toneFor } from '@/components/ui/CourseCover';
import CourseBadges from '@/components/ui/CourseBadges';
import { copy, duration, num, taka, dateLabel } from '@/lib/copy';

// Server-renderable catalog card, coloured by subject. The whole card is
// clickable through the title link's stretched ::after (one link, one tab
// stop). Every number on it — purchases, rating, reviews, price — comes from
// real records. The image slot is 4:3 (IMAGE_SPECS.courseCard).
export default function CourseCard({ course, lang = 'bn', owned = false, categoryLabel, priority = false }) {
  const c = copy(lang);
  const tone = toneFor(course.category || course.title);
  const kicker = categoryLabel || course.categoryName || course.category || '';
  const social = course.free ? course.enrollmentCount : course.purchaseCount;
  const offerText = course.offer ? (course.offer.type === 'percent' ? `${num(lang, course.offer.value)}%` : taka(lang, course.offer.value)) : null;
  return (
    <article className="course-card" style={{ '--tone': tone.bg, '--tone-2': tone.bg2, '--tone-tint': tone.tint }}>
      <div className="course-card-media">
        <CourseCover id={course.id} title={course.title} category={course.category} kicker={kicker} thumbnailUrl={course.thumbnailUrl} priority={priority} />
        <div className="course-card-flags">
          <CourseBadges badges={course.badges} lang={lang} />
          {offerText && !owned && !course.upcoming && <span className="badge offer-flag">{c.offerSave(offerText)}</span>}
        </div>
        {owned && <span className="badge badge-success owned-ribbon"><Icon name="check" size={13} />{c.owned}</span>}
      </div>
      <div className="course-card-body">
        <p className="course-card-kicker">
          {kicker && <span className="subject-chip">{kicker}</span>}
          {course.className && <span className="class-chip">{course.className}</span>}
        </p>
        <h3 className="course-card-title clamp-2">
          <Link href={`/course/${course.slug}`}>{course.title}</Link>
        </h3>
        {course.instructor && <p className="course-card-inst clamp-1">{course.instructor}</p>}
        {course.upcoming ? (
          <p className="course-card-release"><Icon name="clock" size={14} />{course.releaseDate ? c.releaseOn(dateLabel(lang, course.releaseDate)) : c.tba}</p>
        ) : (
          <div className="course-card-stats">
            {course.rating != null && course.reviewCount > 0 ? (
              <span className="card-rating" aria-label={lang === 'en' ? `Rated ${course.rating} from ${course.reviewCount} reviews` : `${num(lang, course.rating)} রেটিং, ${num(lang, course.reviewCount)}টি রিভিউ`}>
                <Icon name="star" size={13} /><strong aria-hidden="true">{num(lang, course.rating.toFixed(1))}</strong><span aria-hidden="true">({num(lang, course.reviewCount)})</span>
              </span>
            ) : <span className="muted">{c.noReviewsYet}</span>}
            {social > 0 && <span><Icon name="users" size={13} />{num(lang, social)}<span className="sr-only"> {course.free ? c.studentsN(social) : c.purchasersN(social)}</span></span>}
            {course.lessonCount > 0 && <span className="hide-xs"><Icon name="list" size={13} />{num(lang, course.lessonCount)}</span>}
            {course.durationSeconds > 0 && <span className="hide-xs"><Icon name="clock" size={13} />{duration(lang, course.durationSeconds)}</span>}
          </div>
        )}
        <div className="course-card-foot">
          {owned ? <span className="small strong" style={{ color: 'var(--success)' }}>{c.continueLearning}</span>
            : course.upcoming ? <span className="badge badge-info">{c.badge_upcoming}</span>
            : (
              <span className="card-price">
                <strong>{course.price ? taka(lang, course.price) : c.free}</strong>
                {course.listPrice > course.price && <s><span className="sr-only">{c.listPriceSr}</span>{taka(lang, course.listPrice)}</s>}
              </span>
            )}
          <span className="card-go" aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
        </div>
      </div>
    </article>
  );
}
