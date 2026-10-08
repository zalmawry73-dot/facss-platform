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
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <FolderLock size={22} color="var(--color-gold)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                {isAr ? 'الدراسات والتقارير الأمنية المقيدة والمصرح بها' : 'Restricted & Authorized Security Studies'}
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {isAr
                ? 'الدراسات الميدانية والتقارير الاستراتيجية الخاصة التي تم منح مؤسستكم تصريح وصول رسمي للاطلاع عليها'
                : 'Field studies and confidential strategic assessments officially authorized for your organization'}
            </p>
          </div>
          <Link href="/portal/client" className="btn btn-outline btn-sm">
            <span>{isAr ? 'العودة للوحة العميل' : 'Back to Dashboard'}</span>
            <ChevronIcon size={14} />
          </Link>
        </div>
      </div>

      {authorizedStudies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>
            {isAr
              ? 'لا توجد دراسات أمنية مقيدة مصرح بها لحسابكم حالياً.'
              : 'No restricted security studies are currently authorized for your account.'}
          </p>
          <span style={{ fontSize: '0.82rem', marginTop: '0.5rem', display: 'block' }}>
            {isAr
              ? 'يمكنكم طلب دراسات مخصصة أو تقييمات ميدانية عبر قسم طلبات الخدمات'
              : 'You can request tailored security studies through the services section'}
          </span>
          <Link href="/portal/client/requests" className="btn btn-gold btn-sm" style={{ marginTop: '1.25rem' }}>
            <span>{isAr ? 'تقديم طلب دراسة ميدانية' : 'Request Field Study'}</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
          {authorizedStudies.map((grant) => {
            const pub = grant.publication;
            const title = isAr ? pub.titleAr : pub.titleEn || pub.titleAr;
            const summary = isAr ? pub.summaryAr : pub.summaryEn || pub.summaryAr;
            const categoryName = isAr ? pub.category.titleAr : pub.category.titleEn;

            return (
              <div
                key={grant.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(197, 155, 39, 0.3)',
                  background: 'linear-gradient(180deg, var(--surface-card) 0%, rgba(20, 30, 20, 0.6) 100%)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: 'rgba(197, 155, 39, 0.15)', color: 'var(--color-gold-light)', fontSize: '0.78rem' }}>
                      {categoryName}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <ShieldCheck size={13} />
                      <span>{isAr ? 'تصريح نشط' : 'Active Grant'}</span>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                    {title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.85rem',
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

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={13} />
                      <span>{pub.author}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} />
                      <span>{formatDate(pub.publicationDate, locale)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/portal/client/research/${pub.id}`}
                    className="btn btn-gold btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <BookOpen size={15} />
                    <span>{isAr ? 'قراءة الدراسة الكاملة' : 'Read Full Study'}</span>
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
