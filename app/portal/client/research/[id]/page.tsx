import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import { type Locale, formatDate } from '@/lib/i18n';
import {
  FolderLock,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
} from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ClientRestrictedStudyDetailPage({ params }: PageProps) {
  const session = await requireRole([ROLES.CLIENT], `/portal/client/research/${params.id}`);

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  const publication = await prisma.researchPublication.findUnique({
    where: { id: params.id },
    include: {
      category: true,
    },
  });

  if (!publication) {
    notFound();
  }

  // Strict server-side verification of active access grant
  const activeGrant = await prisma.researchAccessGrant.findFirst({
    where: {
      publicationId: publication.id,
      grantedToUserId: session.userId,
      isActive: true,
    },
  });

  if (!activeGrant && publication.visibility === 'CLIENT_ONLY') {
    return (
      <div className="portal-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '520px', marginInline: 'auto', border: '1.5px solid #DC2626' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginInline: 'auto', marginBottom: '1rem' }}>
          <ShieldAlert size={26} />
        </div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {isAr ? 'عذراً، تصريح الوصول غير مفعل' : 'Access Authorization Required'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
          {isAr
            ? 'هذه الدراسة الأمنية مصنفة كـ [خاص بالعملاء المصرح لهم]، ولا يتوفر لحسابكم حالياً تصريح وصول سارٍ للاطلاع عليها.'
            : 'This study is classified as restricted client-only content and your account does not hold an active authorization grant.'}
        </p>
        <Link href="/portal/client/research" className="btn btn-gold btn-sm">
          <span>{isAr ? 'العودة لقائمة دراساتي المصرح بها' : 'Return to My Authorized Studies'}</span>
        </Link>
      </div>
    );
  }

  // Increment views count safely
  await prisma.researchPublication.update({
    where: { id: publication.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => null);

  const title = isAr ? publication.titleAr : publication.titleEn || publication.titleAr;
  const summary = isAr ? publication.summaryAr : publication.summaryEn || publication.summaryAr;
  const content = isAr ? publication.contentAr : publication.contentEn || publication.contentAr;
  const categoryTitle = isAr ? publication.category.titleAr : publication.category.titleEn;

  return (
    <div>
      {/* Header & Back Link */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link href="/portal/client/research" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ChevronIcon size={15} />
          <span>{isAr ? 'العودة لقائمة الدراسات' : 'Back to Studies'}</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              background: 'rgba(181, 146, 84, 0.12)',
              color: 'var(--color-gold-700)',
              border: '1px solid rgba(181, 146, 84, 0.35)',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <FolderLock size={14} />
            <span>{isAr ? 'مادة أمنية مقيدة ومصرح بها' : 'Restricted Security Assessment'}</span>
          </span>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="portal-card" style={{ padding: 'clamp(1.25rem, 3vw, 2.25rem)', marginBottom: '2rem' }}>
        <header style={{ borderBottom: '1px solid var(--admin-card-border)', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            <span 
              style={{ 
                background: 'rgba(11, 61, 46, 0.08)', 
                color: 'var(--color-primary-900)',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '4px',
                border: '1px solid var(--admin-card-border)'
              }}
            >
              {categoryTitle}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isAr ? `تاريخ الإصدار: ${formatDate(publication.publicationDate, locale)}` : `Published: ${formatDate(publication.publicationDate, locale)}`}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              • {publication.viewsCount + 1} {isAr ? 'قراءة' : 'views'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 1rem 0', lineHeight: 1.35 }}>
            {title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <User size={16} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? `إعداد الباحث: ${publication.author}` : `Author: ${publication.author}`}</span>
            </div>

            {publication.pdfPath && (
              <a
                href={publication.pdfPath}
                target="_blank"
                rel="noreferrer"
                className="btn btn-gold btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Download size={15} />
                <span>{isAr ? 'تحميل وثيقة الدراسة (PDF)' : 'Download PDF Study'}</span>
              </a>
            )}
          </div>
        </header>

        {/* Executive Summary */}
        {summary && (
          <div
            style={{
              padding: '1.25rem 1.4rem',
              background: 'var(--surface-bg)',
              borderInlineStart: '4px solid var(--color-gold-500)',
              border: '1px solid var(--admin-card-border)',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-primary-950)', margin: '0 0 0.5rem 0' }}>
              {isAr ? 'الملخص التنفيذي للدراسة' : 'Executive Summary'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Main Body */}
        <div
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.85,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line',
          }}
        >
          {content}
        </div>
      </article>
    </div>
  );
}
