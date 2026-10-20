import Icon from '@/components/Icon';
import { copy } from '@/lib/copy';

const STYLE = { featured: ['badge-brand', 'star'], top_rated: ['badge-warning', 'award'], new: ['badge-success', null], upcoming: ['badge-info', 'clock'] };

// Badges computed server-side from real data (lib/badges.js).
export default function CourseBadges({ badges, lang = 'bn', className = '' }) {
  if (!badges?.length) return null;
  const c = copy(lang);
  return (
    <ul className={`badge-list ${className}`} aria-label={lang === 'en' ? 'Badges' : 'ব্যাজ'}>
      {badges.map((b) => {
        const [cls, icon] = STYLE[b] || ['', null];
        return <li key={b} className={`badge ${cls}`}>{icon && <Icon name={icon} size={12} />}{c[`badge_${b}`] || b}</li>;
      })}
    </ul>
  );
}
