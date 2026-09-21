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

export const revalidate = 0;

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

  const publications = await prisma.researchPublication.findMany({
    where: {
      status: 'PUBLISHED',
      visibility: { in: allowedVisibilities },
    },
    include: { category: true },
    orderBy: { publicationDate: 'desc' },
  });

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.researchSectionTitle}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {locale === 'ar' ? 'المنتجات المعرفية والدراسات والتقارير الميدانية' : 'Knowledge Products, Field Studies & Reports'}
          </h1>
          <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '1.1rem', maxWidth: '820px', marginInline: 'auto', lineHeight: 1.75 }}>
            {t.researchSectionSubtitle}
          </p>
        </div>
      </section>

      {/* Publications Repository */}
      <section className="section">
        <div className="container">
          {publications.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', marginInline: 'auto' }}>
              <FileText size={44} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {locale === 'ar' ? 'لا توجد دراسات أو تقارير منشورة حالياً' : 'No publications currently available'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {locale === 'ar' 
                  ? 'يتم نشر التقارير الدورية وموجزات سياق الوصول الإنساني ومصفوفات المخاطر فور اعتمادها وتدقيقها الداخلي.' 
                  : 'Periodic context briefs, access risk analyses, and danger matrices are published upon internal validation.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
              {publications.map((pub) => {
                const categoryTitle = locale === 'en' ? (pub.category.titleEn || pub.category.titleAr) : pub.category.titleAr;
                const title = locale === 'en' ? (pub.titleEn || pub.titleAr) : pub.titleAr;
                const summary = locale === 'en' ? (pub.summaryEn || pub.summaryAr) : pub.summaryAr;

                return (
                  <div key={pub.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span className="badge badge-gold">{categoryTitle}</span>
                        {pub.visibility === 'PUBLIC' ? (
                          <span className="badge badge-success">{t.publicAccess}</span>
                        ) : (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Lock size={12} />
                            <span>{t.clientOnlyAccess}</span>
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                        {title}
                      </h3>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                        {summary}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} style={{ color: 'var(--facss-green-800)' }} />
                          <span>{pub.author}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Eye size={14} style={{ color: 'var(--facss-gold-600)' }} />
                          <span>{pub.viewsCount} {locale === 'ar' ? 'قراءة' : 'views'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: '1.2rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Link
                        href={`/research/${pub.slug}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <BookOpen size={15} />
                        <span>{t.viewResearch}</span>
                      </Link>

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
