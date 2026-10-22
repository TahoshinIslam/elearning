import Link from 'next/link';
import BrandMark from '@/components/ui/BrandMark';
import { getSettings } from '@/lib/settingsRepo';
import { getCopy } from '@/lib/lang';

// Server component: support contact comes from the admin-managed site settings.
export default async function SiteFooter() {
  const { c } = getCopy();
  const settings = await getSettings().catch(() => ({}));
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container-wide footer-cta">
        <div>
          <h2 className="footer-cta-title">{c.footCtaT}</h2>
          <p>{c.footCtaD}</p>
        </div>
        <div className="cluster" style={{ '--gap': '10px' }}>
          <Link href="/courses" className="btn btn-primary btn-lg">{c.heroBrowse}</Link>
          <Link href="/paths" className="btn btn-lg footer-cta-ghost">{c.navPaths}</Link>
        </div>
      </div>
      <div className="container-wide footer-grid">
        <div className="stack" style={{ '--gap': '14px' }}>
          <Link href="/" className="brand" style={{ color: '#fff' }}><BrandMark /><span>Leo Learning</span></Link>
          <p style={{ maxWidth: 340, fontSize: 14.5, lineHeight: 1.6 }}>{c.footerTagline}</p>
          <p className="footer-pay"><span className="badge" style={{ background: 'var(--bkash, #E2136E)', color: '#fff', borderColor: 'transparent' }}>bKash</span>{c.paymentsBy}</p>
        </div>
        <div>
          <h2 className="footer-title">{c.footLearn}</h2>
          <ul className="footer-links">
            <li><Link href="/courses">{c.navCourses}</Link></li>
            <li><Link href="/paths">{c.navPaths}</Link></li>
            <li><Link href="/blog">{c.navBlog}</Link></li>
            <li><Link href="/verify">{c.certVerify}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="footer-title">{c.footCompany}</h2>
          <ul className="footer-links">
            <li><Link href="/about">{c.navAbout}</Link></li>
            <li><Link href="/contact">{c.navContact}</Link></li>
            {settings.supportEmail && <li><a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a></li>}
            {settings.supportPhone && <li><a href={`tel:${String(settings.supportPhone).replace(/[^\d+]/g, '')}`}>{settings.supportPhone}</a></li>}
          </ul>
        </div>
        <div>
          <h2 className="footer-title">{c.footPolicies}</h2>
          <ul className="footer-links">
            <li><Link href="/terms">{c.terms}</Link></li>
            <li><Link href="/terms#refund">{c.refundPolicy}</Link></li>
            <li><Link href="/privacy">{c.privacy}</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-wide footer-bottom">
        <span>© {year} {settings.siteTitle || 'Leo Learning'}. {c.rights}</span>
      </div>
    </footer>
  );
}
