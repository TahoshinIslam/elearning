import { Archivo, Archivo_Black, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { headers, cookies } from 'next/headers';
import MaintenanceScreen from '@/components/site/MaintenanceScreen';
import StaffMaintenanceStrip from '@/components/site/StaffMaintenanceStrip';
import { Splash } from '@/components/site/Preloader';
import RouteProgress from '@/components/site/RouteProgress';
import { getSettings, maintenanceState } from '@/lib/settingsRepo';
import { socialLinks } from '@/lib/social';
import Toast from '@/components/Toast';
import Tracker from '@/components/Tracker';
import { Suspense } from 'react';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { siteUrl } from '@/lib/seo';
import { T } from '@/lib/i18n';

// Type system: Archivo Black sets the loud uppercase display lines, Archivo
// carries Latin text, and Bangla glyphs fall through to Noto Sans Bengali
// (a real 400–800 family, so headings and labels never use synthetic bold).
const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-archivo-black', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-archivo', display: 'swap' });
const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali'], weight: ['400', '500', '600', '700', '800'], variable: '--font-bengali', display: 'swap' });

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Leo Learning — বাংলায় অনলাইন ভিডিও কোর্স', template: '%s · Leo Learning' },
  description: 'বাংলায় ভিডিও কোর্স: প্রিভিউ দেখে কিনুন, bKash-এ পেমেন্ট করুন, যেকোনো ডিভাইসে যেখানে থেমেছিলেন সেখান থেকে শিখুন।',
  applicationName: 'Leo Learning',
  openGraph: { type: 'website', siteName: 'Leo Learning', locale: 'bn_BD' },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.svg' }
};

export const viewport = {
  themeColor: '#FFD84D',
  width: 'device-width',
  initialScale: 1
};

export default async function RootLayout({ children }) {
  const session = await currentSession();
  const { lang, c } = await getCopy();
  // Only the fields the UI needs reach the client.
  const initialAuth = session
    ? { id: session.id, role: session.role, name: session.name, email: session.email, studentId: session.studentId, teacherId: session.teacherId, tenantId: session.tenantId, sections: session.sections, permissions: session.permissions }
    : null;
  const settings = await getSettings().catch(() => ({}));
  const maint = maintenanceState(settings);
  const isStaff = ['teacher', 'staff', 'owner', 'superadmin'].includes(session?.role);
  const path = (await headers()).get('x-pathname') || '/';
  // Visitors see the countdown page; staff (and the login / dev pages they
  // need to get in) keep working.
  const blocked = maint.active && !isStaff && !/^\/(login|forgot|reset|dev)(\/|$)/.test(path);
  const showSplash = settings.preloader !== 'off' && !blocked && !(await cookies()).get('leo_splash') && !/^\/(owner|superadmin|learn)(\/|$)/.test(path);
  return (
    <html lang={lang} className={`${archivoBlack.variable} ${archivo.variable} ${notoBengali.variable}`}>
      <body>
        <a href="#main" className="skip-link">{c.skip}</a>
        <AppProvider initialAuth={initialAuth} initialLang={lang} dict={T[lang]}>
          {showSplash && <Splash />}
          <Suspense fallback={null}><RouteProgress /></Suspense>
          {maint.active && isStaff && <StaffMaintenanceStrip until={maint.until} lang={lang} />}
          {blocked
            ? <MaintenanceScreen until={maint.until} title={maint.title} message={maint.message} lang={lang} social={socialLinks(settings)} />
            : children}
          <Toast />
          {!blocked && <Suspense fallback={null}><Tracker /></Suspense>}
        </AppProvider>
      </body>
    </html>
  );
}
