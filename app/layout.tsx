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
  title: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية | Integrated Center for Security, Safety & Field Studies (FACSS)',
  description: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية (FACSS) — صرح مهني واستشاري وتنفيذي يقدم خدمات الأمن والسلامة، الرصد الميداني والتنبيه المبكر، الدراسات والتحليلات، التدريب والتأهيل. السلامة أولاً — Safety First.',
  keywords: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية, FACSS, أمن وسلامة, حراسات أمنية عدن, دراسات ميدانية, رصد وتنبيه مبكر, أنظمة سلامة, تدريب أمني, Integrated Center for Security Safety & Field Studies',
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
    title: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية | Integrated Center for Security, Safety & Field Studies (FACSS)',
    description: '«السلامة أولاً» — منظومة متكاملة لخدمات الأمن والسلامة والرصد والدراسات الميدانية وبناء القدرات',
    url: process.env.APP_URL || 'http://localhost:3000',
    siteName: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية (FACSS)',
    images: [
      {
        url: '/images/brand/logo-horizontal-light.png',
        width: 951,
        height: 210,
        alt: 'شعار المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية',
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
  let brandData: { primaryAr?: string; primaryEn?: string; secondaryAr?: string; secondaryEn?: string } = {};
  let footerData: {
    aboutAr?: string;
    aboutEn?: string;
    rightsAr?: string;
    rightsEn?: string;
    noticeAr?: string;
    noticeEn?: string;
    sloganAr?: string;
    sloganEn?: string;
  } = {};
  let activityFields: Array<{ id: string; key: string; titleAr: string | null; titleEn: string | null; link: string | null }> = [];

  try {
    const [settings, brandBlock, footerBlock, sloganBlock, dbActivityBlocks] = await Promise.all([
      prisma.systemSetting.findMany({
        where: {
          key: { in: ['contact_address_ar', 'contact_address_en', 'contact_email', 'slogan_ar', 'slogan_en'] }
        }
      }),
      (prisma as any).contentBlock ? (prisma as any).contentBlock.findUnique({
        where: { section_key: { section: 'navigation_brand', key: 'brand_names' } }
      }) : null,
      (prisma as any).contentBlock ? (prisma as any).contentBlock.findUnique({
        where: { section_key: { section: 'navigation_brand', key: 'footer_content' } }
      }) : null,
      (prisma as any).contentBlock ? (prisma as any).contentBlock.findUnique({
        where: { section_key: { section: 'identity', key: 'slogan' } }
      }) : null,
      (prisma as any).contentBlock ? (prisma as any).contentBlock.findMany({
        where: { section: 'activity_fields', isVisible: true },
        orderBy: { order: 'asc' },
        select: { id: true, key: true, titleAr: true, titleEn: true, link: true },
      }) : [],
    ]);

    if (dbActivityBlocks && Array.isArray(dbActivityBlocks)) {
      activityFields = dbActivityBlocks;
    }

    contactSettings = {
      contactAddressAr: settings.find(s => s.key === 'contact_address_ar')?.value,
      contactAddressEn: settings.find(s => s.key === 'contact_address_en')?.value,
      contactEmail: settings.find(s => s.key === 'contact_email')?.value,
    };

    if (brandBlock) {
      brandData = {
        primaryAr: brandBlock.titleAr || undefined,
        primaryEn: brandBlock.titleEn || undefined,
        secondaryAr: brandBlock.descriptionAr || undefined,
        secondaryEn: brandBlock.descriptionEn || undefined,
      };
    }

    let footerMeta: any = {};
    try { footerMeta = footerBlock?.metadata ? JSON.parse(footerBlock.metadata) : {}; } catch {}

    const sloganSettingAr = settings.find(s => s.key === 'slogan_ar')?.value;
    const sloganSettingEn = settings.find(s => s.key === 'slogan_en')?.value;

    footerData = {
      aboutAr: footerBlock?.descriptionAr || undefined,
      aboutEn: footerBlock?.descriptionEn || undefined,
      rightsAr: footerBlock?.titleAr || undefined,
      rightsEn: footerBlock?.titleEn || undefined,
      noticeAr: footerMeta.noticeAr || undefined,
      noticeEn: footerMeta.noticeEn || undefined,
      sloganAr: sloganBlock?.descriptionAr || sloganBlock?.titleAr || sloganSettingAr,
      sloganEn: sloganBlock?.descriptionEn || sloganBlock?.titleEn || sloganSettingEn,
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
            <PublicSiteLayout contactSettings={contactSettings} brandData={brandData} footerData={footerData} activityFields={activityFields}>
              {children}
            </PublicSiteLayout>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
