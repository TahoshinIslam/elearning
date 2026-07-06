import { Hind_Siliguri, Archivo } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import PrototypeBar from '@/components/PrototypeBar';
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
  title: 'Leo Learning — কোচিং সেন্টারের সম্পূর্ণ প্ল্যাটফর্ম',
  description:
    'Multi-tenant SaaS platform for Bangladeshi coaching centers — batches, live classes, bKash payments, parent monitoring, and course selling in one place.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${hind.variable} ${archivo.variable}`}>
      <body>
        <AppProvider>
          <PrototypeBar />
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
