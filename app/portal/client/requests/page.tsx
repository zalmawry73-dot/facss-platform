import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requireRole, ROLES, STAFF_ROLES } from '@/lib/rbac';
import { getTranslation, formatDate, type Locale } from '@/lib/i18n';
import { Shield, Plus } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export const revalidate = 0;

// ── Presentation mappings for Priority (U05) ──
const PRIORITY_LABEL: Record<string, { ar: string; en: string }> = {
  NORMAL:  { ar: 'عادية',  en: 'Normal'  },
  HIGH:    { ar: 'مرتفعة', en: 'High'    },
  URGENT:  { ar: 'عاجلة',  en: 'Urgent'  },
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'badge-danger',
  HIGH:   'badge-warning',
  NORMAL: 'badge-neutral',
};

export default async function ClientRequestsPage() {
  // Gracefully redirect staff users to their comprehensive admin dashboard
  const user = await getCurrentUser(true);
  if (user && STAFF_ROLES.includes(user.role as any)) {
    redirect('/admin/requests');
  }

  // ── i18n ──
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const t = getTranslation(locale);

  const session = await requireRole([ROLES.CLIENT], '/portal/client/requests');

  const requests = await prisma.serviceRequest.findMany({
    where: { userId: session.userId },
    include: {
      service: true,
      assignedEmployee: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ── Localised UI labels ──
  const heading   = isAr ? 'سجل طلبات الخدمات الميدانية والاستشارية' : 'Field & Advisory Service Requests';
  const subtext   = isAr
    ? 'متابعة حالة طلبات تقييم مخاطر الوصول الإنساني والرصد والتدريب الميداني'
    : 'Track the status of humanitarian access risk assessment, monitoring, and field training requests';
  const newBtn    = isAr ? 'تقديم طلب خدمة جديد' : 'Submit New Service Request';
  const emptyMsg  = isAr ? 'لا توجد طلبات مسجلة بحسابكم حالياً.' : 'No service requests found for your account.';
  const emptyBtn  = isAr ? 'تقديم طلب خدمة الآن' : 'Submit a Service Request';

  const colRef      = isAr ? 'رقم المرجع' : 'Reference No.';
  const colService  = isAr ? 'الخدمة المطلوبة' : 'Requested Service';
  const colPriority = isAr ? 'الأولوية' : 'Priority';
  const colAssigned = isAr ? 'المسؤول المكلف' : 'Assigned Officer';
  const colStatus   = isAr ? 'حالة الطلب' : 'Status';
  const colDate     = isAr ? 'تاريخ التقديم' : 'Submitted';
  const colAction   = isAr ? 'الإجراء' : 'Action';
  const pending     = isAr ? 'قيد التعيين' : 'Pending Assignment';
  const viewBtn     = isAr ? 'عرض وتتبع' : 'View & Track';

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {heading}
          </h2>
          {/* U04: secondary text — use --text-secondary (contrast ≥ 9:1) instead of --text-muted */}
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem', lineHeight: 1.6 }}>
            {subtext}
          </span>
        </div>

        <Link href="/request-service" className="btn btn-gold btn-sm">
          <Plus size={16} />
          <span>{newBtn}</span>
        </Link>
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Shield size={48} style={{ color: 'var(--color-gold)', marginInline: 'auto', marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.05rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{emptyMsg}</p>
          <Link href="/request-service" className="btn btn-gold">
            {emptyBtn}
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{colRef}</th>
                <th>{colService}</th>
                <th>{colPriority}</th>
                <th>{colAssigned}</th>
                <th>{colStatus}</th>
                <th>{colDate}</th>
                <th>{colAction}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const serviceTitle = isAr
                  ? r.service.titleAr
                  : ((r.service as any).titleEn || r.service.titleAr);
                const priorityLabel = PRIORITY_LABEL[r.priority]?.[locale] ?? r.priority;
                const priorityBadge = PRIORITY_BADGE[r.priority] ?? 'badge-neutral';

                return (
                  <tr key={r.id}>
                    {/* Reference number */}
                    <td style={{ fontWeight: 800, color: 'var(--color-gold-light)', fontVariantNumeric: 'tabular-nums' }}>
                      {r.requestNumber}
                    </td>

                    {/* Service title */}
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {serviceTitle}
                    </td>

                    {/* Priority — U05: human label, not raw ENUM */}
                    <td>
                      <span className={`badge ${priorityBadge}`}>
                        {priorityLabel}
                      </span>
                    </td>

                    {/* Assigned employee */}
                    <td>
                      {r.assignedEmployee ? (
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {r.assignedEmployee.fullName}
                        </span>
                      ) : (
                        /* U04: pending text — readable secondary color */
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                          {pending}
                        </span>
                      )}
                    </td>

                    {/* Status — U05: use StatusBadge (mapped, translated) */}
                    <td>
                      <StatusBadge
                        type="serviceRequest"
                        status={r.status}
                        locale={locale}
                      />
                    </td>

                    {/* Date — U03: locale-aware date */}
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {formatDate(r.createdAt, locale)}
                    </td>

                    {/* Action */}
                    <td>
                      <Link
                        href={`/portal/client/requests/${r.id}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <span>{viewBtn}</span>
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
