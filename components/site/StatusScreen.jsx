import Link from 'next/link';
import Icon from '@/components/Icon';
import BrandMark from '@/components/ui/BrandMark';

const TONES = { 404: ['var(--c-pink)', 'var(--c-yellow)', 'var(--c-cyan)'], 500: ['var(--c-orange)', 'var(--c-pink)', 'var(--c-yellow)'], 403: ['var(--c-violet)', 'var(--c-lime)', 'var(--c-pink)'], 503: ['var(--c-cyan)', 'var(--c-yellow)', 'var(--c-lime)'] };

// Full-viewport status page (404 / 403 / 500 / 503) in the notebook style:
// giant tilted digit blocks, a plain-language message and clear next steps.
// Server-safe (no hooks), so it works in not-found, error boundaries and
// global-error alike. `actions` is any extra JSX (e.g. a Retry button).
export default function StatusScreen({ code = 404, title, message, actions, reference, lang = 'bn', homeHref = '/', children }) {
  const en = lang === 'en';
  const digits = String(code).split('');
  const tones = TONES[code] || TONES[404];
  return (
    <main id="main" className={`status-screen is-${code}`}>
      <div className="status-top">
        <Link href="/" className="brand"><BrandMark /><span className="brand-word">Leo <span className="sticker">Learning</span></span></Link>
      </div>
      <div className="status-body">
        <div className="status-code" aria-hidden="true">
          {digits.map((d, i) => <span key={i} style={{ '--t': tones[i % tones.length], '--i': i }}>{d}</span>)}
        </div>
        <p className="sr-only">{code}</p>
        <h1 className="status-title">{title}</h1>
        {message && <p className="status-msg">{message}</p>}
        {children}
        <div className="status-actions">
          {actions}
          <Link href={homeHref} className="btn btn-primary btn-lg"><Icon name="home" size={18} />{en ? 'Go home' : 'হোমে যান'}</Link>
          <Link href="/courses" className="btn btn-secondary btn-lg"><Icon name="search" size={18} />{en ? 'Browse courses' : 'কোর্স দেখুন'}</Link>
        </div>
        {reference && <p className="status-ref">{en ? 'Reference' : 'রেফারেন্স'}: <code>{reference}</code></p>}
      </div>
      <div className="status-shapes" aria-hidden="true"><i /><i /><i /><i /></div>
    </main>
  );
}
