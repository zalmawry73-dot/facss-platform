import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getTranslation, formatDate, type Locale } from '@/lib/i18n';
import { 
  FileText, 
  User, 
  Calendar, 
  Eye, 
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

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

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ResearchDetailPage({ params }: PageProps) {
  // ── i18n ──
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const t = getTranslation(locale);

  // ── Auth ──
  const session = await getSession();
  const isAuthorizedStaff = session && (
    session.role === 'SUPER_ADMIN' ||
    session.role === 'ADMIN' ||
    session.role === 'STAFF' ||
    session.role === 'RESEARCH_MANAGER' ||
    session.role.includes('MANAGER')
  );

  const pub = await prisma.researchPublication.findUnique({
    where: { slug: params.slug },
    include: { category: true }
  });

  if (!pub) {
    notFound();
  }

  // Status Gate
  if (pub.status !== 'PUBLISHED' && !isAuthorizedStaff) {
    notFound();
  }

  // Visibility Gate
  let hasClientGrant = false;
  if (session?.userId && pub.visibility === 'CLIENT_ONLY') {
    const grant = await prisma.researchAccessGrant.findFirst({
      where: {
        publicationId: pub.id,
        grantedToUserId: session.userId,
        isActive: true,
      },
    });
    if (grant) {
      hasClientGrant = true;
    }
  }

  if (pub.visibility !== 'PUBLIC' && !isAuthorizedStaff && !hasClientGrant) {
    notFound();
  }

  // Increment views non-blocking
  await prisma.researchPublication.update({
    where: { id: pub.id },
    data: { viewsCount: { increment: 1 } }
  }).catch(() => {});

  // ── Localised content ──
  const categoryTitle = isAr
    ? pub.category.titleAr
    : (pub.category.titleEn || pub.category.titleAr);

  const title = isAr
    ? pub.titleAr
    : (pub.titleEn || pub.titleAr);

  const secondaryTitle = isAr
    ? (pub.titleEn || null)
    : null;

  const summaryText = isAr
    ? pub.summaryAr
    : (pub.summaryEn || pub.summaryAr);

  const contentText = isAr
    ? pub.contentAr
    : ((pub as any).contentEn || pub.contentAr);

  const summaryLabel = isAr
    ? 'الملخص التنفيذي للدراسة'
    : 'Executive Summary';

  const contentLabel = isAr
    ? 'محتوى الدراسة'
    : 'Study Content';

  const backLabel = isAr
    ? 'العودة لكافة الدراسات والتقارير'
    : 'Back to All Studies & Reports';

  const homeLabel = isAr ? 'الرئيسية' : 'Home';
  const researchLabel = isAr ? 'البحوث والدراسات' : 'Research & Studies';
  const readLabel = isAr ? 'قراءة' : 'views';

  return (
    <div dir={dir}>
      {/* Banner */}
      <section className="page-header-institutional">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-on-dark-muted)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'var(--text-on-dark-muted)', textDecoration: 'none' }}>{homeLabel}</Link>
            <span>/</span>
            <Link href="/research" style={{ color: 'var(--text-on-dark-muted)', textDecoration: 'none' }}>{researchLabel}</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-gold-400)', fontWeight: 700 }}>{categoryTitle}</span>
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            {categoryTitle}
          </span>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.8vw, 2.4rem)',
            fontWeight: 900,
            color: '#FFF',
            marginBottom: '0.75rem',
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
            maxWidth: '900px',
            marginInline: 'auto',
          }}>
            {title}
          </h1>

          {/* Secondary title (English subtitle when in Arabic mode) */}
          {secondaryTitle && (
            <p style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
              color: 'var(--color-gold-400)',
              fontWeight: 600,
              maxWidth: '850px',
              marginInline: 'auto',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}>
              {secondaryTitle}
            </p>
          )}

          {/* Metadata row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-on-dark-muted)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <User size={16} style={{ color: 'var(--color-gold-400)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{locale === 'en' ? (AUTHOR_TRANSLATIONS[pub.author] || pub.author) : pub.author}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Calendar size={16} style={{ color: 'var(--color-gold-400)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-en)' }}>{formatDate(pub.publicationDate, locale)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Eye size={16} style={{ color: 'var(--color-gold-400)', flexShrink: 0 }} />
              <span>{pub.viewsCount + 1} {readLabel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reader Content */}
      <section className="section" style={{ backgroundColor: 'var(--surface-bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '880px', marginInline: 'auto' }}>

            {/* Executive Summary Card */}
            <div className="card-institutional" style={{ marginBottom: '2rem', borderInlineStart: '4px solid var(--color-gold-500)', background: '#FFFFFF' }}>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--color-gold-700)',
                marginBottom: '0.75rem',
              }}>
                {summaryLabel}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.85, margin: 0 }}>
                {summaryText}
              </p>
            </div>

            {/* Main Content Body */}
            <div className="card-institutional" style={{
              padding: 'clamp(1.5rem, 4vw, 2.75rem)',
              marginBottom: '2.5rem',
              lineHeight: 2,
              fontSize: 'clamp(0.98rem, 2vw, 1.05rem)',
              color: 'var(--text-secondary)',
              background: '#FFFFFF',
            }}>
              <h2 style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.55rem)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
                paddingBottom: '0.85rem',
                borderBottom: '2px solid var(--border-subtle)',
              }}>
                {contentLabel}
              </h2>
              <p style={{ marginBottom: '1.5rem', lineHeight: 1.95 }}>{contentText}</p>

              {/* Show English abstract separately only in Arabic mode when summaryEn exists */}
              {isAr && pub.summaryEn && (
                <div style={{
                  padding: '1.25rem 1.5rem',
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '2rem',
                }}>
                  <h3 style={{ color: 'var(--color-gold-700)', fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                    English Abstract & Key Findings:
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.75, margin: 0, direction: 'ltr', textAlign: 'left' }}>
                    {pub.summaryEn}
                  </p>
                </div>
              )}
            </div>

            {/* Back button */}
            <div style={{ textAlign: 'center' }}>
              <Link href="/research" className="btn btn-secondary">
                {isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                <span>{backLabel}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
