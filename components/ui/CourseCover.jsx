// Course imagery. Uses the uploaded thumbnail (made to IMAGE_SPECS.courseCard,
// 4:3) when there is one; otherwise a generated cover in one of six vivid
// tones (stable per subject) with the brand's "mane" arcs — so the catalog
// never shows broken or stock art.
const TONES = [
  { bg: '#C2410C', bg2: '#F59E0B', fg: '#FFFFFF', ac: '#FFE7C2', tint: '#FFF4EA' }, // sunrise
  { bg: '#0F766E', bg2: '#2DD4BF', fg: '#FFFFFF', ac: '#CCFBF1', tint: '#EBFAF7' }, // lagoon
  { bg: '#4338CA', bg2: '#A78BFA', fg: '#FFFFFF', ac: '#E0E7FF', tint: '#F1F0FF' }, // violet
  { bg: '#15803D', bg2: '#A3E635', fg: '#FFFFFF', ac: '#ECFCCB', tint: '#F0FAEA' }, // meadow
  { bg: '#BE185D', bg2: '#FB7185', fg: '#FFFFFF', ac: '#FFE4E6', tint: '#FFF0F3' }, // berry
  { bg: '#1D4ED8', bg2: '#38BDF8', fg: '#FFFFFF', ac: '#DBEAFE', tint: '#EEF5FF' }  // sky
];

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s || '')) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export function toneFor(key) { return TONES[hash(key) % TONES.length]; }

function Pattern({ variant, tone }) {
  if (variant === 0) {
    return (
      <svg className="cover-pattern" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
        {[150, 118, 86, 54].map((r, i) => (
          <circle key={r} cx="300" cy="190" r={r} fill="none" stroke={tone.ac} strokeOpacity={0.18 + i * 0.12} strokeWidth="14" />
        ))}
        <circle cx="300" cy="190" r="22" fill={tone.ac} fillOpacity=".85" />
      </svg>
    );
  }
  if (variant === 1) {
    return (
      <svg className="cover-pattern" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={170 + i * 22} y="-40" width="10" height="280" transform={`rotate(24 ${170 + i * 22} 90)`} fill={tone.ac} fillOpacity={0.1 + i * 0.07} />
        ))}
      </svg>
    );
  }
  return (
    <svg className="cover-pattern" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
      {Array.from({ length: 6 }).map((_, r) => Array.from({ length: 8 }).map((__, c) => (
        <circle key={`${r}-${c}`} cx={168 + c * 20} cy={24 + r * 28} r={3 + ((r + c) % 3)} fill={tone.ac} fillOpacity={0.15 + ((r * c) % 5) * 0.12} />
      )))}
    </svg>
  );
}

export default function CourseCover({ title, category, kicker, thumbnailUrl, id = 0, size = 'md', priority = false }) {
  const tone = toneFor(category || title);
  const cls = `cover ${size === 'lg' ? 'cover-lg' : size === 'sm' ? 'cover-sm' : ''}`;
  if (thumbnailUrl) {
    return (
      <div className={cls}>
        <img src={thumbnailUrl} alt="" width="1024" height="768" loading={priority ? 'eager' : 'lazy'} decoding="async" />
      </div>
    );
  }
  return (
    <div className={cls} style={{ '--cover-bg': tone.bg, '--cover-bg2': tone.bg2, '--cover-fg': tone.fg }} aria-hidden="true">
      <div className="cover-art">
        <Pattern variant={Number(id) % 3} tone={tone} />
        <span className="cover-kicker">{kicker || ''}</span>
        <span className="cover-title">{title}</span>
      </div>
    </div>
  );
}
