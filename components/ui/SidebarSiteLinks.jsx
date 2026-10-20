'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { useApp } from '@/context/AppContext';
import { copy } from '@/lib/copy';

// Site-wide links inside a dashboard sidebar, shown only when the sidebar
// is the mobile drawer (it replaces the header's own mobile menu there).
export default function SidebarSiteLinks({ onNavigate }) {
  const { lang, toggleLang } = useApp();
  const c = copy(lang);
  return (
    <div className="side-group side-site">
      <div className="side-label">Leo Learning</div>
      <Link href="/" className="side-tab" onClick={onNavigate}><Icon name="home" size={18} /><span className="side-text">{c.home}</span></Link>
      <Link href="/courses" className="side-tab" onClick={onNavigate}><Icon name="layers" size={18} /><span className="side-text">{c.navCourses}</span></Link>
      <Link href="/paths" className="side-tab" onClick={onNavigate}><Icon name="compass" size={18} /><span className="side-text">{c.navPaths}</span></Link>
      <Link href="/blog" className="side-tab" onClick={onNavigate}><Icon name="file" size={18} /><span className="side-text">{c.navBlog}</span></Link>
      <button type="button" className="side-tab" onClick={() => { toggleLang(); onNavigate?.(); }} lang={lang === 'bn' ? 'en' : 'bn'}><Icon name="globe" size={18} /><span className="side-text">{c.langSwitch}</span></button>
    </div>
  );
}
