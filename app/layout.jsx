import { Archivo, Archivo_Black, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import Toast from '@/components/Toast';
import Tracker from '@/components/Tracker';
import { Suspense } from 'react';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { siteUrl } from '@/lib/seo';

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
  const { lang, c } = getCopy();
  // Only the fields the UI needs reach the client.
  const initialAuth = session
    ? { id: session.id, role: session.role, name: session.name, email: session.email, studentId: session.studentId, teacherId: session.teacherId, tenantId: session.tenantId, sections: session.sections, permissions: session.permissions }
    : null;
  return (
    <html lang={lang} className={`${archivoBlack.variable} ${archivo.variable} ${notoBengali.variable}`}>
      <body>
        <a href="#main" className="skip-link">{c.skip}</a>
        <AppProvider initialAuth={initialAuth} initialLang={lang}>
          <MaintenanceBanner />
          {children}
          <Toast />
          <Suspense fallback={null}><Tracker /></Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
