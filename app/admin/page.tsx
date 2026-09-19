import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import StatusBadge from '@/components/StatusBadge';
import { getTranslation, formatDate, type Locale } from '@/lib/i18n';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  FileText, 
  Mail, 
  Activity, 
  Clock,
  ArrowLeft,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  // Server-side authorization gate
  await requireStaff('/admin');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Live counts from PostgreSQL database
  const [
    newRequestsCount,
    activeRequestsCount,
    pendingRegistrationsCount,
    unreadMessagesCount,
    totalClientsCount,
    totalTraineesCount,
    coursesCount,
    publicationsCount,
    recentRequests,
    recentLogs
  ] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: 'NEW' } }),
    prisma.serviceRequest.count({ where: { status: { in: ['NEW', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'] } } }),
    prisma.trainingRegistration.count({ where: { status: 'PENDING' } }),
    prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'TRAINEE' } }),
    prisma.course.count(),
    prisma.researchPublication.count(),
    prisma.serviceRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { service: true }
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    })
  ]);

  const actionableMetrics = [
    { 
      label: isAr ? 'طلبات جديدة بحاجة لمراجعة' : 'New Requests Requiring Review', 
      value: newRequestsCount, 
      color: '#DC2626', 
      bg: 'rgba(220, 38, 38, 0.05)',
      icon: ShieldAlert, 
      href: '/admin/requests',
      badge: isAr ? 'إجراء عاجل' : 'Urgent Action'
    },
    { 
      label: isAr ? 'طلبات نشطة قيد المتابعة' : 'Active Requests Underway', 
      value: activeRequestsCount, 
      color: 'var(--facss-green-800)', 
      bg: 'rgba(18, 59, 44, 0.05)',
      icon: Activity, 
      href: '/admin/requests',
      badge: isAr ? 'عمليات جارية' : 'In Progress'
    },
    { 
      label: isAr ? 'تسجيلات متدربين معلقة' : 'Pending Trainee Applications', 
      value: pendingRegistrationsCount, 
      color: 'var(--facss-gold-700)', 
      bg: 'rgba(201, 162, 39, 0.08)',
      icon: UserCheck, 
      href: '/admin/training',
      badge: isAr ? 'اعتماد المتدربين' : 'Trainee Approvals'
    },
    { 
      label: isAr ? 'رسائل واستفسارات غير مقروءة' : 'Unread Inquiries', 
      value: unreadMessagesCount, 
      color: '#D97706', 
      bg: 'rgba(217, 119, 6, 0.06)',
      icon: Mail, 
      href: '/admin/messages',
      badge: isAr ? 'صندوق الوارد' : 'Inbox'
    },
  ];

  return (
    <div>
      {/* 4 Focused Actionable KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {actionableMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Link key={idx} href={m.href} className="card" style={{ padding: '1.4rem', borderInlineStart: `4px solid ${m.color}`, background: 'var(--surface-card)', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{m.label}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: m.color }}>
                  {m.value}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {m.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Compact Platform Totals Strip */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', background: 'var(--surface-sunken)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} style={{ color: 'var(--facss-gold-600)' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'إجمالي العملاء والمؤسسات' : 'Total Clients & Enterprises'}
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{totalClientsCount}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={20} style={{ color: 'var(--facss-green-800)' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'المتدربون المسجلون' : 'Registered Trainees'}
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{totalTraineesCount}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--facss-gold-700)' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'البرامج التدريبية النشطة' : 'Active Training Programs'}
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{coursesCount}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} style={{ color: 'var(--facss-green-800)' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'الأبحاث والتقارير المنشورة' : 'Published Research & Studies'}
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{publicationsCount}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
        {/* Latest Requests */}
        <div className="card" style={{ flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'أحدث طلبات الخدمات المقدمة' : 'Recent Service Requests'}
            </h3>
            <Link href="/admin/requests" style={{ fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>{isAr ? 'إدارة كافة الطلبات' : 'Manage All Requests'}</span>
              <ArrowIcon size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAr ? 'الرقم المرجعي' : 'Ref Number'}</th>
                  <th>{isAr ? 'الجهة' : 'Organization'}</th>
                  <th>{isAr ? 'الخدمة' : 'Service'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => {
                  const serviceTitle = isAr ? r.service.titleAr : (r.service.titleEn || r.service.titleAr);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 800 }}>
                        <Link href={`/admin/requests?id=${r.id}`} style={{ color: 'var(--facss-gold-700)', textDecoration: 'none' }}>
                          {r.requestNumber}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.organization}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{serviceTitle}</td>
                      <td>
                        <StatusBadge type="serviceRequest" status={r.status} locale={locale} />
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {formatDate(r.createdAt, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Audit Logs */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'سجل النشاط الإداري المباشر' : 'Live Activity Audit Log'}
            </h3>
            <Link href="/admin/logs" style={{ fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>{isAr ? 'السجل الكامل' : 'Full Audit Trail'}</span>
              <ArrowIcon size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentLogs.map((log) => (
              <div key={log.id} style={{ padding: '0.75rem 0.9rem', background: 'var(--surface-sunken)', borderRadius: '6px', borderInlineStart: '3px solid var(--facss-gold-500)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--facss-green-900)' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleTimeString(isAr ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
