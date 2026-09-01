import { Hind_Siliguri, Archivo } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import Toast from '@/components/Toast';

const hind = Hind_Siliguri({
  subsets: ['latin', 'bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap'
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap'
});

export const metadata = {
  title: 'Leo Learning — অনলাইন কোর্স প্ল্যাটফর্ম',
  description:
    'Buy recorded & live courses with lifetime access — live classes on Zoom, recordings, quizzes and certificates in one place.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${hind.variable} ${archivo.variable}`}>
      <body>
        <AppProvider>
          <MaintenanceBanner />
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
