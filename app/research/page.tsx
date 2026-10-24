import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getTranslation, formatDate, type Locale } from '@/lib/i18n';
import {
  FileText,
  Calendar,
  User,
  Eye,
  Lock,
  BookOpen
} from 'lucide-react';

import { getContentBlock } from '@/lib/content';

export const revalidate = 0;

const AUTHOR_TRANSLATIONS: Record<string, string> = {
  'وحدة الدراسات والبحوث بمركز الحلول المتكاملة للأمن والسلامة (FACSS)': 'Studies & Research Unit (FACSS)',
  'وحدة التحليل والتقييم الميداني — مركز الحلول المتكاملة للأمن والسلامة': 'Field Analysis & Assessment Unit (FACSS)',
  'وحدة الدراسات الميدانية والتحليل بالمركز المتكامل': 'Field Studies & Analysis Unit (Integrated Center)',
  'وحدة الأبحاث والمسوحات الميدانية بالمركز المتكامل': 'Field Research & Surveys Unit (Integrated Center)',
  'فريق السلامة والتقييم الميداني بالمركز المتكامل': 'Safety & Field Assessment Team (Integrated Center)',
  'هيئة الرصد والتحليل الميداني بالمركز المتكامل': 'Field Monitoring & Analysis Board (Integrated Center)',
  'وحدة الدراسات الاستراتيجية بمركز عدن الأول (FACSS)': 'Strategic Studies Unit',
  'وحدة الدراسات الاستراتيجية بمركز عدن الدولي (FACSS)': 'Strategic Studies Unit',
  'فريق الاستشارات الأمنية وتقييم المخاطر (FACSS)': 'Security Advisory & Risk Assessment Team',
  'هيئة التحرير والتحليل الاستراتيجي (FACSS)': 'Editorial & Strategic Analysis Board',
};

export default async function ResearchPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const session = await getSession();

  // FAIL-SECURE RESEARCH AUTHORIZATION GATE:
  // Public anonymous visitors and general clients see strictly PUBLIC + PUBLISHED research.
  // Because ResearchPublication lacks a clientId/ownership column, granting access based
  // solely on the CLIENT role would expose client-specific research across different clients.
  // Therefore, until an architectural decision/migration establishes explicit client ownership,
  // CLIENT_ONLY is restricted exclusively to authorized Center Operations Staff & Admins.
  const allowedVisibilities: ('PUBLIC' | 'CLIENT_ONLY')[] = ['PUBLIC'];
  const isAuthorizedStaff = session && (
    session.role === 'SUPER_ADMIN' ||
    session.role === 'ADMIN' ||
    session.role === 'STAFF' ||
    session.role === 'RESEARCH_MANAGER' ||
    session.role.includes('MANAGER')
  );
  if (isAuthorizedStaff) {
    allowedVisibilities.push('CLIENT_ONLY');
  }

  const [publications, bannerBlock] = await Promise.all([
    prisma.researchPublication.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: { in: allowedVisibilities },
      },
      include: { category: true },
      orderBy: { publicationDate: 'desc' },
    }),
    getContentBlock('page_banners', 'banner_research'),
  ]);

  let bannerMeta: any = {};
  try { bannerMeta = bannerBlock?.metadata ? JSON.parse(bannerBlock.metadata) : {}; } catch {}

  const bannerTag = (locale === 'ar' ? bannerMeta.tagAr : bannerMeta.tagEn) || t.researchSectionTitle;
  const bannerTitle = (locale === 'ar' ? (bannerBlock?.titleAr || bannerBlock?.titleEn) : (bannerBlock?.titleEn || bannerBlock?.titleAr)) || (locale === 'ar' ? 'المنتجات المعرفية والدراسات والتقارير الميدانية' : 'Knowledge Products, Field Studies & Reports');
  const bannerDesc = (locale === 'ar' ? (bannerBlock?.descriptionAr || bannerBlock?.descriptionEn) : (bannerBlock?.descriptionEn || bannerBlock?.descriptionAr)) || t.researchSectionSubtitle;

  return (
    <div>
      {/* Banner */}
      <section className="page-header-institutional">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge-pill" style={{ marginBottom: '1.25rem' }}>
            <BookOpen size={15} style={{ color: 'var(--color-gold-400)' }} />
            <span>{bannerTag}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.75rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            {bannerTitle}
          </h1>
          <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '1.05rem', maxWidth: '820px', marginInline: 'auto', lineHeight: 1.75 }}>
            {bannerDesc}
          </p>
        </div>
      </section>

      {/* Publications Repository */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          {publications.length === 0 ? (
            <div className="card-institutional" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', marginInline: 'auto' }}>
              <FileText size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {locale === 'ar' ? 'لا توجد دراسات أو تقارير منشورة حالياً' : 'No publications currently available'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                {locale === 'ar' 
                  ? 'يتم نشر التقارير الدورية وموجزات سياق الوصول الإنساني ومصفوفات المخاطر فور اعتمادها وتدقيقها الداخلي.' 
                  : 'Periodic context briefs, access risk analyses, and danger matrices are published upon internal validation.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.75rem' }}>
              {publications.map((pub) => {
                const categoryTitle = locale === 'en' ? (pub.category.titleEn || pub.category.titleAr) : pub.category.titleAr;
                const title = locale === 'en' ? (pub.titleEn || pub.titleAr) : pub.titleAr;
                const summary = locale === 'en' ? (pub.summaryEn || pub.summaryAr) : pub.summaryAr;

                return (
                  <div key={pub.id} className="card-institutional" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--color-primary-900)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                        <span className="badge badge-gold">{categoryTitle}</span>
                        {pub.visibility === 'PUBLIC' ? (
                          <span className="badge badge-success">{t.publicAccess}</span>
                        ) : (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Lock size={12} />
                            <span>{t.clientOnlyAccess}</span>
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                        {title}
                      </h3>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.35rem' }}>
                        {summary}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <User size={15} style={{ color: 'var(--color-primary-800)' }} />
                          <span style={{ fontWeight: 600 }}>{locale === 'en' ? (AUTHOR_TRANSLATIONS[pub.author] || pub.author) : pub.author}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Eye size={15} style={{ color: 'var(--color-gold-700)' }} />
                          <span>{pub.viewsCount} {locale === 'ar' ? 'قراءة' : 'views'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Link
                        href={`/research/${pub.slug}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.85rem' }}
                      >
                        <BookOpen size={15} />
                        <span>{t.viewResearch}</span>
                      </Link>

                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-en)' }}>
                        {formatDate(pub.publicationDate, locale)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
