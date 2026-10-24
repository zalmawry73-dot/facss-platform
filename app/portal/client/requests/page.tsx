import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requireRole, ROLES, STAFF_ROLES } from '@/lib/rbac';
import { getTranslation, formatDate, type Locale } from '@/lib/i18n';
import { Shield, Plus, Clock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Filter } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export const revalidate = 0;

const PRIORITY_LABEL: Record<string, { ar: string; en: string }> = {
  NORMAL:  { ar: 'عادية',  en: 'Normal'  },
  HIGH:    { ar: 'مرتفعة', en: 'High'    },
  URGENT:  { ar: 'عاجلة',  en: 'Urgent'  },
};

interface SearchParams {
  filter?: string;
}

export default async function ClientRequestsPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await getCurrentUser(true);
  if (user && STAFF_ROLES.includes(user.role as any)) {
    redirect('/admin/requests');
  }

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const session = await requireRole([ROLES.CLIENT], '/portal/client/requests');

  const activeFilter = searchParams?.filter || 'ALL';

  let statusFilterCondition: any = undefined;
  if (activeFilter === 'NEW') {
    statusFilterCondition = { in: ['NEW', 'UNDER_REVIEW', 'CONTACTED', 'WAITING_FOR_CLIENT'] };
  } else if (activeFilter === 'IN_PROGRESS') {
    statusFilterCondition = { in: ['APPROVED', 'IN_PROGRESS', 'REPORT_READY'] };
  } else if (activeFilter === 'COMPLETED') {
    statusFilterCondition = { in: ['COMPLETED', 'CANCELLED'] };
  }

  const clientOwnerCondition = {
    OR: [
      { userId: session.userId },
      { contactEmail: session.email.toLowerCase() }
    ]
  };

  const allRequests = await prisma.serviceRequest.findMany({
    where: { 
      AND: [
        clientOwnerCondition,
        ...(statusFilterCondition ? [{ status: statusFilterCondition }] : [])
      ]
    },
    include: {
      service: true,
      assignedEmployee: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Counts for tabs
  const countAll = await prisma.serviceRequest.count({ 
    where: clientOwnerCondition 
  });
  const countNew = await prisma.serviceRequest.count({ 
    where: { 
      AND: [
        clientOwnerCondition,
        { status: { in: ['NEW', 'UNDER_REVIEW', 'CONTACTED', 'WAITING_FOR_CLIENT'] } }
      ]
    } 
  });
  const countInProgress = await prisma.serviceRequest.count({ 
    where: { 
      AND: [
        clientOwnerCondition,
        { status: { in: ['APPROVED', 'IN_PROGRESS', 'REPORT_READY'] } }
      ]
    } 
  });
  const countCompleted = await prisma.serviceRequest.count({ 
    where: { 
      AND: [
        clientOwnerCondition,
        { status: { in: ['COMPLETED', 'CANCELLED'] } }
      ]
    } 
  });

  const heading   = isAr ? 'سجل طلبات الخدمات والتقييمات الميدانية' : 'Field Assessment & Service Requests';
  const subtext   = isAr
    ? 'متابعة حالة طلبات تقييم المخاطر، الاستشارات الأمنية، والتقارير الميدانية المعتمدة'
    : 'Track the status of risk assessment, security advisory, and verified field reports';

  return (
    <div className="portal-card">
      {/* Header */}
      <div className="portal-card-header">
        <div>
          <h2 className="portal-card-title">
            <Shield size={22} style={{ color: 'var(--color-gold-600)' }} />
            <span>{heading}</span>
          </h2>
          <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.35rem', lineHeight: 1.5 }}>
            {subtext}
          </span>
        </div>

        <Link 
          href="/request-service" 
          className="btn btn-gold btn-sm"
          style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Plus size={16} />
          <span>{isAr ? 'تقديم طلب خدمة جديد' : 'Submit New Request'}</span>
        </Link>
      </div>

      {/* Visual Separation Filter Tabs (Requirement 2) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem', borderBottom: '1px solid var(--admin-card-border)' }}>
        {[
          { key: 'ALL', label: isAr ? 'كافة الطلبات' : 'All Requests', count: countAll },
          { key: 'NEW', label: isAr ? 'طلبات جديدة ومراجعة' : 'New & In Review', count: countNew, color: '#0284C7' },
          { key: 'IN_PROGRESS', label: isAr ? 'قيد التنفيذ الميداني' : 'In Field Execution', count: countInProgress, color: '#B45309' },
          { key: 'COMPLETED', label: isAr ? 'طلبات مكتملة' : 'Completed', count: countCompleted, color: '#15803D' },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === 'ALL' ? '/portal/client/requests' : `/portal/client/requests?filter=${tab.key}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                background: isActive ? 'var(--color-primary-950)' : 'var(--surface-bg)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--color-gold-500)' : '1px solid var(--admin-card-border)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.label}</span>
              <span 
                style={{
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(181, 146, 84, 0.3)' : 'rgba(0,0,0,0.06)',
                  color: isActive ? 'var(--color-gold-300)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-en)'
                }}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Requests Content */}
      {allRequests.length === 0 ? (
        <div className="portal-empty-state">
          <Shield size={46} style={{ color: 'var(--color-gold-500)', marginInline: 'auto', marginBottom: '0.85rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {isAr ? 'لم يتم العثور على طلبات ضمن هذا التصنيف' : 'No requests found for this filter'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', marginInline: 'auto', marginBottom: '1.25rem' }}>
            {isAr 
              ? 'يمكنكم استعراض الفئات الأخرى أو تقديم طلب تقييم واستشارة أمنية جديد.' 
              : 'Switch filters or submit a new field assessment request.'}
          </p>
          <Link href="/request-service" className="btn btn-gold btn-sm">
            <Plus size={16} />
            <span>{isAr ? 'تقديم طلب خدمة جديد' : 'Submit New Request'}</span>
          </Link>
        </div>
      ) : (
        <div className="portal-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isAr ? 'رقم المرجع' : 'Ref No.'}</th>
                <th>{isAr ? 'الخدمة المطلوبة' : 'Requested Service'}</th>
                <th>{isAr ? 'الأولوية' : 'Priority'}</th>
                <th>{isAr ? 'المسؤول الميداني' : 'Assigned Officer'}</th>
                <th>{isAr ? 'حالة الطلب' : 'Status'}</th>
                <th>{isAr ? 'تاريخ التقديم' : 'Submitted'}</th>
                <th>{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {allRequests.map((r) => {
                const serviceTitle = isAr
                  ? r.service.titleAr
                  : ((r.service as any).titleEn || r.service.titleAr);
                const priorityLabel = PRIORITY_LABEL[r.priority]?.[locale] ?? r.priority;

                return (
                  <tr key={r.id}>
                    {/* Reference number */}
                    <td style={{ fontWeight: 800 }}>
                      <Link 
                        href={`/portal/client/requests/${r.id}`} 
                        style={{ color: 'var(--color-primary-900)', textDecoration: 'none', fontFamily: 'var(--font-en)' }}
                      >
                        {r.requestNumber}
                      </Link>
                    </td>

                    {/* Service title */}
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {serviceTitle}
                    </td>

                    {/* Priority */}
                    <td>
                      <span 
                        style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.45rem', 
                          borderRadius: '4px',
                          background: r.priority === 'URGENT' ? 'rgba(220, 38, 38, 0.1)' : r.priority === 'HIGH' ? 'rgba(217, 119, 6, 0.1)' : 'var(--surface-bg)',
                          color: r.priority === 'URGENT' ? '#DC2626' : r.priority === 'HIGH' ? '#B45309' : 'var(--text-secondary)',
                          border: '1px solid var(--admin-card-border)'
                        }}
                      >
                        {priorityLabel}
                      </span>
                    </td>

                    {/* Assigned employee */}
                    <td>
                      {r.assignedEmployee ? (
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 600 }}>
                          {r.assignedEmployee.fullName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          {isAr ? 'قيد التعيين' : 'Pending'}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge
                        type="serviceRequest"
                        status={r.status}
                        locale={locale}
                      />
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-en)' }}>
                      {formatDate(r.createdAt, locale)}
                    </td>

                    {/* Action */}
                    <td>
                      <Link
                        href={`/portal/client/requests/${r.id}`}
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <span>{isAr ? 'عرض وتتبع' : 'Track'}</span>
                        <ArrowIcon size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
