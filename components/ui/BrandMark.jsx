// Leo Learning mark: a rising sun (the lion's mane) over a horizon, drawn as
// a black stamp with a yellow sun so it reads at favicon size.
export default function BrandMark({ size = 36, className = 'brand-mark', mono = false }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" fill={mono ? 'currentColor' : '#0A0A0A'} />
      <path d="M5.5 23a10.5 10.5 0 0 1 21 0" stroke="#FFD84D" strokeWidth="2.6" fill="none" />
      <path d="M9.5 23a6.5 6.5 0 0 1 13 0" stroke="#FF7AA2" strokeWidth="2.6" fill="none" />
      <rect x="13.6" y="20.6" width="4.8" height="4.8" fill="#FFFFFF" />
      <path d="M4 26.5h24" stroke="#FFD84D" strokeWidth="1.8" />
    </svg>
  );
}
