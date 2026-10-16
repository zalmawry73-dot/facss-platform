import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requireRole, ROLES, STAFF_ROLES } from '@/lib/rbac';
import { type Locale, formatDate } from '@/lib/i18n';
import {
  FolderLock,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const revalidate = 0;

export default async function ClientResearchPage() {
  const user = await getCurrentUser(true);
  if (user && STAFF_ROLES.includes(user.role as any)) {
    redirect('/admin/research');
  }

  const session = await requireRole([ROLES.CLIENT], '/portal/client/research');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  // Fetch active access grants for this client
  const grants = await prisma.researchAccessGrant.findMany({
    where: {
      grantedToUserId: session.userId,
      isActive: true,
    },
    include: {
      publication: {
        include: {
          category: { select: { id: true, titleAr: true, titleEn: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Only show PUBLISHED studies
  const authorizedStudies = grants.filter((g) => g.publication.status === 'PUBLISHED');

  return (
    <div>
      <div className="portal-card" style={{ marginBottom: '1.75rem' }}>
        <div className="portal-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <FolderLock size={22} style={{ color: 'var(--color-gold-600)' }} />
              <h2 className="portal-card-title">
                {isAr ? 'الدراسات والتقارير الأمنية المقيدة والمصرح بها' : 'Restricted & Authorized Security Studies'}
              </h2>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
              {isAr
                ? 'الدراسات الميدانية والتقارير الاستراتيجية الخاصة التي تم منح مؤسستكم تصريح وصول رسمي للاطلاع عليها'
                : 'Field studies and confidential strategic assessments officially authorized for your organization'}
            </p>
          </div>
          <Link href="/portal/client" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{isAr ? 'العودة للوحة العميل' : 'Back to Dashboard'}</span>
            <ChevronIcon size={14} />
          </Link>
        </div>
      </div>

      {authorizedStudies.length === 0 ? (
        <div className="portal-empty-state">
          <FolderLock size={44} style={{ color: 'var(--color-gold-500)', marginInline: 'auto', marginBottom: '0.85rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {isAr
              ? 'لا توجد دراسات أمنية مقيدة مصرح بها لحسابكم حالياً'
              : 'No restricted security studies are currently authorized for your account'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', marginInline: 'auto', marginBottom: '1.25rem' }}>
            {isAr
              ? 'يمكنكم طلب دراسات مخصصة أو تقارير تقييم ميداني نوعية عبر قسم طلبات الخدمات.'
              : 'You can request tailored security studies through the service requests department.'}
          </p>
          <Link href="/portal/client/requests" className="btn btn-gold btn-sm">
            <span>{isAr ? 'تقديم طلب دراسة ميدانية' : 'Request Field Study'}</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
          {authorizedStudies.map((grant) => {
            const pub = grant.publication;
            const title = isAr ? pub.titleAr : pub.titleEn || pub.titleAr;
            const summary = isAr ? pub.summaryAr : pub.summaryEn || pub.summaryAr;
            const categoryName = isAr ? pub.category.titleAr : pub.category.titleEn;

            return (
              <div
                key={grant.id}
                className="portal-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.35rem',
                  marginBottom: 0
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.74rem', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '4px',
                        background: 'rgba(181, 146, 84, 0.12)', 
                        color: 'var(--color-gold-700)', 
                        fontWeight: 700,
                        border: '1px solid rgba(181, 146, 84, 0.3)'
                      }}
                    >
                      {categoryName}
                    </span>
                    <span
                      style={{
                        background: 'rgba(21, 128, 61, 0.1)',
                        color: '#15803D',
                        border: '1px solid rgba(21, 128, 61, 0.25)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <ShieldCheck size={12} />
                      <span>{isAr ? 'وصول مصرح به' : 'Authorized'}</span>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                    {title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {summary}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--admin-card-border)', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-en)' }}>
                    <Calendar size={13} />
                    <span>{formatDate(pub.createdAt, locale)}</span>
                  </div>

                  <Link
                    href={`/portal/client/research/${pub.id}`}
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={13} />
                    <span>{isAr ? 'الاطلاع على الدراسة' : 'View Study'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
