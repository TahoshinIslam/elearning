// Course imagery. Uses the uploaded thumbnail (made to IMAGE_SPECS.courseCard,
// 4:3) when there is one; otherwise a generated cover in one of six vivid
// flat bright tones (stable per subject) with black line patterns — so the catalog
// never shows broken or stock art.
const TONES = [
  { bg: '#FFD84D', bg2: '#FFD84D', fg: '#0A0A0A', ac: '#0A0A0A', tint: '#FFF3B8' }, // yellow
  { bg: '#4DE3F4', bg2: '#4DE3F4', fg: '#0A0A0A', ac: '#0A0A0A', tint: '#CFF7FC' }, // cyan
  { bg: '#B69CFF', bg2: '#B69CFF', fg: '#0A0A0A', ac: '#0A0A0A', tint: '#E9E1FF' }, // violet
  { bg: '#6EEB83', bg2: '#6EEB83', fg: '#0A0A0A', ac: '#0A0A0A', tint: '#D5FADC' }, // lime
  { bg: '#FF7AA2', bg2: '#FF7AA2', fg: '#0A0A0A', ac: '#0A0A0A', tint: '#FFDCE6' }, // pink
  { bg: '#FF9F43', bg2: '#FF9F43', fg: '#0A0A0A', ac: '#0A0A0A', tint: '#FFE3C7' }  // orange
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
          <circle key={r} cx="300" cy="190" r={r} fill="none" stroke={tone.ac} strokeOpacity={0.10 + i * 0.07} strokeWidth="10" />
        ))}
        <circle cx="300" cy="190" r="22" fill={tone.ac} fillOpacity=".9" />
      </svg>
    );
  }
  if (variant === 1) {
    return (
      <svg className="cover-pattern" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={170 + i * 22} y="-40" width="10" height="280" transform={`rotate(24 ${170 + i * 22} 90)`} fill={tone.ac} fillOpacity={0.06 + i * 0.04} />
        ))}
      </svg>
    );
  }
  return (
    <svg className="cover-pattern" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
      {Array.from({ length: 6 }).map((_, r) => Array.from({ length: 8 }).map((__, c) => (
        <circle key={`${r}-${c}`} cx={168 + c * 20} cy={24 + r * 28} r={3 + ((r + c) % 3)} fill={tone.ac} fillOpacity={0.12 + ((r * c) % 5) * 0.08} />
      )))}
    </svg>
  );
}

export default function CourseCover({ title, category, kicker, thumbnailUrl, id = 0, size = 'md', priority = false, showTitle = true }) {
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
        {showTitle ? <span className="cover-title">{title}</span> : <span className="cover-glyph" aria-hidden="true">{String(kicker || title || '').trim().charAt(0)}</span>}
      </div>
    </div>
  );
}
