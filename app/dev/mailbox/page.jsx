import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import Icon from '@/components/Icon';
import { listDemoMail, demoMailEnabled } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Demo inbox', robots: { index: false } };

const dt = (v) => new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' });

// DEMO ONLY. Mail is not delivered yet (lib/mailer.js); every message the app
// "sends" — sign-in and password-reset codes — shows up here instead.
export default async function MailboxPage({ searchParams }) {
  if (!demoMailEnabled()) notFound();
  const to = typeof searchParams?.to === 'string' ? searchParams.to : undefined;
  const mails = await listDemoMail({ to, limit: 30 });
  return (
    <>
      <SiteNav />
      <main id="main" className="container section-tight" style={{ maxWidth: 860 }}>
        <div className="ws-head">
          <span className="eyebrow"><span className="sticker sticker-cyan" style={{ fontSize: 13 }}>Demo mode</span></span>
          <h1 className="ws-title" style={{ marginTop: 12 }}>Demo inbox</h1>
          <p className="ws-desc">Emails are not sent in demo mode. Copy a code from here and paste it into the code screen.</p>
        </div>
        <div className="cluster" style={{ marginBottom: 18 }}>
          <Link href="/dev/mailbox" className="btn btn-secondary btn-sm"><Icon name="refresh" size={14} />Refresh</Link>
          {to && <Link href="/dev/mailbox" className="btn btn-ghost btn-sm">Show all · filtered by {to}</Link>}
        </div>
        {!mails.length ? (
          <div className="surface state"><div className="state-icon"><Icon name="mail" size={24} /></div><p>No mail yet. Request a sign-in code on the login page.</p></div>
        ) : (
          <ul className="stack mailbox" style={{ listStyle: 'none', margin: 0, padding: 0, '--gap': '14px' }}>
            {mails.map((m) => {
              const code = (m.subject.match(/\b\d{6}\b/) || [])[0];
              return (
                <li key={m.id} className="surface surface-pad stack" style={{ '--gap': '8px' }}>
                  <div className="row between" style={{ flexWrap: 'wrap', '--gap': '8px' }}>
                    <span className="strong">To: <Link className="link" href={`/dev/mailbox?to=${encodeURIComponent(m.toEmail)}`}>{m.toEmail}</Link></span>
                    <span className="xsmall muted">{dt(m.createdAt)}</span>
                  </div>
                  <div className="row" style={{ flexWrap: 'wrap', '--gap': '10px' }}>
                    <span className="h4">{m.subject}</span>
                    {code && <span className="sticker" style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '.12em' }}>{code}</span>}
                  </div>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, font: 'inherit', color: 'var(--ink-2)' }}>{m.body}</pre>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
