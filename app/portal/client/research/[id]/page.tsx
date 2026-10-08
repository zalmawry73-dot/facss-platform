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
      <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', border: '1px solid #ef4444' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#FFF', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          {isAr ? 'عذراً، تصريح الوصول غير مفعل' : 'Access Authorization Required'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
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
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link href="/portal/client/research" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ChevronIcon size={15} />
          <span>{isAr ? 'العودة لقائمة الدراسات' : 'Back to Studies'}</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="badge"
            style={{
              background: 'rgba(197, 155, 39, 0.15)',
              color: 'var(--color-gold-light)',
              border: '1px solid rgba(197, 155, 39, 0.3)',
              fontSize: '0.8rem',
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
      <article className="card" style={{ padding: 'clamp(1.25rem, 4vw, 2.5rem)', marginBottom: '2rem', border: '1px solid rgba(197, 155, 39, 0.25)' }}>
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-gold)' }}>
              {categoryTitle}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isAr ? `تاريخ الإصدار: ${formatDate(publication.publicationDate, locale)}` : `Published: ${formatDate(publication.publicationDate, locale)}`}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              • {publication.viewsCount + 1} {isAr ? 'قراءة' : 'views'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFF', margin: '0 0 1rem 0', lineHeight: 1.3 }}>
            {title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <User size={16} color="var(--color-gold)" />
              <span>{isAr ? `إعداد الباحث: ${publication.author}` : `Author: ${publication.author}`}</span>
            </div>

            {publication.pdfPath && (
              <a
                href={publication.pdfPath}
                target="_blank"
                rel="noreferrer"
                className="btn btn-gold btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={15} />
                <span>{isAr ? 'تحميل نسخة PDF الرسمية' : 'Download Official PDF'}</span>
              </a>
            )}
          </div>
        </header>

        {/* Confidentiality Watermark Alert */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(197, 155, 39, 0.08)',
            border: '1px solid rgba(197, 155, 39, 0.25)',
            borderRadius: '8px',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--color-gold-light)',
          }}
        >
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <span>
            {isAr
              ? 'تنبيه سرية وأمان: هذه الدراسة والمعلومات الواردة فيها مخصصة حصرياً للمؤسسة المصرح لها بموجب الترخيص الرقمي للمنصة. يُحظر إعادة التوزيع دون إذن خطي مسبق.'
              : 'Confidentiality Notice: This report is exclusively authorized for your organization. Unauthorized redistribution is strictly prohibited.'}
          </span>
        </div>

        {/* Executive Summary Section */}
        {summary && (
          <section style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'var(--surface-sunken)', borderRadius: '10px', borderRight: isAr ? '4px solid var(--color-gold)' : undefined, borderLeft: !isAr ? '4px solid var(--color-gold)' : undefined }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-light)', margin: '0 0 0.75rem 0' }}>
              {isAr ? 'الملخص التنفيذي للدراسة' : 'Executive Summary'}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
              {summary}
            </p>
          </section>
        )}

        {/* Full Content Body */}
        <section style={{ fontSize: '1rem', color: '#E2E8F0', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
          {content}
        </section>
      </article>
    </div>
  );
}
