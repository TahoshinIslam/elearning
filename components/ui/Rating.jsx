import Icon from '@/components/Icon';
import { num } from '@/lib/copy';

// Shows a real average only — callers pass null when there are no verified reviews.
export default function Rating({ value, count, lang = 'bn', size = 14, showCount = true, countLabel }) {
  if (value == null || !count) return null;
  const full = Math.round(value);
  const label = lang === 'en' ? `Rated ${value} out of 5 from ${count} reviews` : `৫-এর মধ্যে ${num(lang, value)} রেটিং, ${num(lang, count)}টি রিভিউ`;
  return (
    <span className="rating" role="img" aria-label={label}>
      <span aria-hidden="true">{num(lang, value.toFixed(1))}</span>
      <span className="stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={size} style={{ opacity: i <= full ? 1 : 0.25 }} />)}
      </span>
      {showCount && <span className="muted small" aria-hidden="true" style={{ fontWeight: 500 }}>({countLabel || num(lang, count)})</span>}
    </span>
  );
}
