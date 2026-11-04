import { Hind_Siliguri, Space_Grotesk, Anek_Bangla } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import Toast from '@/components/Toast';
import { currentSession } from '@/lib/auth';
import { getCopy } from '@/lib/lang';
import { siteUrl } from '@/lib/seo';

// Type system: Space Grotesk carries Latin text and the loud uppercase
// display style; Bangla glyphs fall through to Anek Bangla (headings) and
// Hind Siliguri (body), so mixed Bangla/English lines render in one rhythm.
const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap'
});
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap'
});
const anek = Anek_Bangla({
  subsets: ['bengali', 'latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-anek',
  display: 'swap'
});

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

export default function RootLayout({ children }) {
  const session = currentSession();
  const { lang, c } = getCopy();
  // Only the fields the UI needs reach the client.
  const initialAuth = session
    ? { id: session.id, role: session.role, name: session.name, email: session.email, studentId: session.studentId, teacherId: session.teacherId, tenantId: session.tenantId, sections: session.sections, permissions: session.permissions }
    : null;
  return (
    <html lang={lang} className={`${hind.variable} ${grotesk.variable} ${anek.variable}`}>
      <body>
        <a href="#main" className="skip-link">{c.skip}</a>
        <AppProvider initialAuth={initialAuth} initialLang={lang}>
          <MaintenanceBanner />
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
