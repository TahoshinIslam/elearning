import { redirect } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import { getCopy } from '@/lib/lang';

export const metadata = { title: 'Verify a certificate' };

// Certificate lookup form → /verify/[certNo].
export default function VerifyIndex({ searchParams }) {
  const no = typeof searchParams?.no === 'string' ? searchParams.no.trim() : '';
  if (no) redirect(`/verify/${encodeURIComponent(no.slice(0, 64))}`);
  const { c } = getCopy();
  return (
    <>
      <SiteNav />
      <main id="main" className="container section" style={{ maxWidth: 560 }}>
        <form className="surface surface-pad stack" action="/verify" method="get">
          <h1 className="h2">{c.certVerify}</h1>
          <div className="field">
            <label htmlFor="cert-no">{c.certificate} #</label>
            <input id="cert-no" name="no" className="input mono" placeholder="LEO-2026-0001" required maxLength={64} />
          </div>
          <div><button type="submit" className="btn btn-primary">{c.search}</button></div>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
