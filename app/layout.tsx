import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import PublicSiteLayout from '@/components/PublicSiteLayout';

const cairo = localFont({
  src: [
    { path: './fonts/cairo/cairo-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/cairo/cairo-arabic-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/cairo/cairo-arabic-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/cairo/cairo-arabic-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/cairo/cairo-arabic-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-cairo',
  display: 'swap',
});

const outfit = localFont({
  src: [
    { path: './fonts/outfit/outfit-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/outfit/outfit-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/outfit/outfit-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/outfit/outfit-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/outfit/outfit-latin-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: 'مركز الحلول المتكاملة للأمن والسلامة | Integrated Solutions Center for Safety and Security',
  description: 'مركز الحلول المتكاملة للأمن والسلامة — صرح مهني واستشاري وتنفيذي يقدم حلول الأمن والسلامة، الرصد الميداني والتنبيه المبكر، الدراسات والتحليلات، التدريب والتأهيل. السلامة أولاً.',
  keywords: 'مركز الحلول المتكاملة للأمن والسلامة, أمن وسلامة, حراسات أمنية عدن, دراسات ميدانية, رصد وتنبيه مبكر, أنظمة سلامة, تدريب أمني, Integrated Solutions Center for Safety and Security',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'مركز الحلول المتكاملة للأمن والسلامة | Integrated Solutions Center for Safety and Security',
    description: '«السلامة أولاً» — منظومة متكاملة لحلول وخدمات الأمن والسلامة والرصد والدراسات الميدانية وأنظمة التدريب',
    url: process.env.APP_URL || 'http://localhost:3000',
    siteName: 'مركز الحلول المتكاملة للأمن والسلامة',
    images: [
      {
        url: '/images/brand/logo-horizontal-light.png',
        width: 951,
        height: 210,
        alt: 'شعار مركز الحلول المتكاملة للأمن والسلامة',
      },
    ],
    locale: 'ar_YE',
    type: 'website',
  },
};

import { cookies } from 'next/headers';
import type { Locale } from '@/lib/i18n';
import prisma from '@/lib/prisma';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const initialLocale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const dir = initialLocale === 'ar' ? 'rtl' : 'ltr';

  let contactSettings: { contactAddressAr?: string; contactAddressEn?: string; contactEmail?: string } = {};
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['contact_address_ar', 'contact_address_en', 'contact_email'] }
      }
    });
    contactSettings = {
      contactAddressAr: settings.find(s => s.key === 'contact_address_ar')?.value,
      contactAddressEn: settings.find(s => s.key === 'contact_address_en')?.value,
      contactEmail: settings.find(s => s.key === 'contact_email')?.value,
    };
  } catch (err) {
    // Graceful fallback
  }

  return (
    <html lang={initialLocale} dir={dir} className={`${cairo.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  if (event.filename && (event.filename.indexOf('chrome-extension://') !== -1 || event.filename.indexOf('moz-extension://') !== -1)) {
                    event.stopImmediatePropagation();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider initialLocale={initialLocale}>
          <AuthProvider>
            <PublicSiteLayout contactSettings={contactSettings}>
              {children}
            </PublicSiteLayout>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
