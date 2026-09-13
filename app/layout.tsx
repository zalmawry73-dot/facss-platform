import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية | FACSS',
  description: 'Aden First Center for Security Services and Strategic Studies (FACSS) — Comprehensive Security Ecosystem, Guarding, Risk Assessment, Electronic Solutions, and Strategic Research.',
  keywords: 'FACSS, Security Aden, حراسات أمنية عدن, تقييم أمن مادي, دراسات استراتيجية, تدريب أمني, كاميرات مراقبة, مكافحة حرائق',
  icons: {
    icon: '/favicon.ico',
    apple: '/images/logo-128.png',
  },
  openGraph: {
    title: 'FACSS — Aden First Center for Security Services & Strategic Studies',
    description: '«أمانٌ يبدأ من عدن» — First in Security, First in Trust',
    url: 'https://www.facss-aden.com',
    siteName: 'FACSS Aden',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 800,
        alt: 'FACSS Center Emblem',
      },
    ],
    locale: 'ar_YE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <main style={{ flex: 1 }}>{children}</main>
              <Footer />
            </div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
