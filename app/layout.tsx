import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: 'مركز عدن الدولي للسلامة والدراسات الميدانية | Aden International Center for Safety and Field Assessment',
  description: 'مركز عدن الدولي للسلامة والدراسات الميدانية — مؤسسة مهنية متخصصة في دعم سلامة العاملين في المجال الإنساني، وتحليل مخاطر الوصول، وبناء القدرات، والدراسات الميدانية.',
  keywords: 'سلامة العاملين في المجال الإنساني, تقييم مخاطر الوصول, دراسات ميدانية عدن, بناء القدرات الميدانية, التدريب وإدارة المخاطر, Humanitarian Safety Aden, Access Assessment, Field Assessment Yemen',
  icons: {
    icon: '/favicon.ico',
    apple: '/images/logo-128.png',
  },
  openGraph: {
    title: 'مركز عدن الدولي للسلامة والدراسات الميدانية | Aden International Center for Safety and Field Assessment',
    description: '«معلوماتٌ ميدانيةٌ دقيقة... لوصولٍ إنسانيٍّ آمن» — Actionable Field Insights for Safer Humanitarian Access',
    url: process.env.APP_URL || 'http://localhost:3000',
    siteName: 'مركز عدن الدولي للسلامة والدراسات الميدانية',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 800,
        alt: 'شعار مركز عدن الدولي للسلامة والدراسات الميدانية',
      },
    ],
    locale: 'ar_YE',
    type: 'website',
  },
};

import { cookies } from 'next/headers';
import type { Locale } from '@/lib/i18n';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const initialLocale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const dir = initialLocale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={initialLocale} dir={dir}>
      <body>
        <AuthProvider>
          <LanguageProvider initialLocale={initialLocale}>
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
