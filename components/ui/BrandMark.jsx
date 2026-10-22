// Leo Learning mark: a rising sun read as a lion's mane over a horizon.
export default function BrandMark({ size = 32, className = 'brand-mark', mono = false }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill={mono ? 'currentColor' : 'var(--brand)'} />
      <path d="M5.5 23a10.5 10.5 0 0 1 21 0" stroke="#FFD6BC" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M9.5 23a6.5 6.5 0 0 1 13 0" stroke="#FFF1E8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="23" r="2.4" fill="#fff" />
      <path d="M4 26.5h24" stroke="#FFD6BC" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}
