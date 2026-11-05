import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import PathCard from '@/components/ui/PathCard';
import Icon from '@/components/Icon';
import { getPublicPaths } from '@/lib/catalogRepo';
import { getCopy } from '@/lib/lang';
import { num } from '@/lib/copy';
import { abs } from '@/lib/seo';

export async function generateMetadata() {
  const { c } = await getCopy();
  return { title: c.pathsTitle, description: c.pathsWhat, alternates: { canonical: abs('/paths') } };
}

export default async function PathsPage() {
  const { lang, c } = await getCopy();
  const paths = await getPublicPaths();
  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="paths-hero">
          <div className="container-wide">
            <span className="eyebrow">{c.navPaths}</span>
            <h1 className="h1">{c.pathsTitle}</h1>
            <p className="lead" style={{ maxWidth: 720 }}>{c.pathsWhat}</p>
            <ol className="paths-how">
              {[c.pathsHow1, c.pathsHow2, c.pathsHow3].map((t, i) => (
                <li key={t}><span className="paths-how-n">{num(lang, i + 1)}</span>{t}</li>
              ))}
            </ol>
          </div>
        </section>
        <section className="home-section">
          <div className="container-wide">
            {paths.length ? (
              <ul className="path-grid">{paths.map((p) => <li key={p.id}><PathCard path={p} lang={lang} /></li>)}</ul>
            ) : (
              <div className="surface state"><div className="state-icon"><Icon name="compass" size={24} /></div><p>{c.pathsEmpty}</p><Link href="/courses" className="btn btn-primary">{c.heroBrowse}</Link></div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
