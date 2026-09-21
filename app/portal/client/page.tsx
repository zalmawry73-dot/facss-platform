import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import StatusBadge from '@/components/StatusBadge';
import { getTranslation, formatDate, type Locale } from '@/lib/i18n';
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  AlertCircle, 
  ArrowLeft,
  ArrowRight,
  FileText,
  Download,
  Plus
} from 'lucide-react';

export const revalidate = 0;

export default async function ClientDashboardPage() {
  const session = await requireRole([ROLES.CLIENT], '/portal/client');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const totalRequests = await prisma.serviceRequest.count({
    where: { userId: session.userId }
  });

  const activeRequests = await prisma.serviceRequest.count({
    where: {
      userId: session.userId,
      status: { notIn: ['COMPLETED', 'CANCELLED'] }
    }
  });

  const completedRequests = await prisma.serviceRequest.count({
    where: {
      userId: session.userId,
      status: 'COMPLETED'
    }
  });

  // Count available, unarchived final reports
  const finalReportsCount = await prisma.serviceRequestDocument.count({
    where: {
      request: { userId: session.userId },
      documentType: 'FINAL_REPORT',
      visibility: 'CLIENT_VISIBLE',
      isArchived: false,
    }
  });

  // Recent available final reports
  const readyReports = await prisma.serviceRequestDocument.findMany({
    where: {
      request: { userId: session.userId },
      documentType: 'FINAL_REPORT',
      visibility: 'CLIENT_VISIBLE',
      isArchived: false,
    },
    include: {
      request: {
        select: {
          id: true,
          requestNumber: true,
          service: { select: { titleAr: true, titleEn: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const recentRequests = await prisma.serviceRequest.findMany({
    where: { userId: session.userId },
    include: { service: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return (
    <div>
      {/* Ready Final Reports Alert Banner */}
      {readyReports.length > 0 && (
        <div 
          className="card" 
          style={{ 
            marginBottom: '2rem', 
            background: 'linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(18,59,44,0.06) 100%)',
            border: '1px solid var(--facss-gold-500)',
            borderInlineStart: '5px solid var(--facss-gold-500)',
            padding: '1.5rem 2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--facss-gold-500)', color: 'var(--facss-green-950)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'التقرير الأمني النهائي متاح للتنزيل' : 'Final Security Report Available for Download'}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--facss-green-900)', fontWeight: 600 }}>
                  {isAr 
                    ? `أصدر المركز التقرير الأمني لطلبكم رقم ${readyReports[0].request.requestNumber} (${readyReports[0].request.service.titleAr})`
                    : `Report issued for request ${readyReports[0].request.requestNumber} (${readyReports[0].request.service.titleEn || readyReports[0].request.service.titleAr})`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link 
                href={`/portal/client/requests/${readyReports[0].request.id}`}
                className="btn btn-gold btn-sm"
              >
                <span>{isAr ? 'عرض تفاصيل التقرير' : 'View Report Details'}</span>
                <ArrowIcon size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ borderInlineStart: '4px solid var(--facss-green-800)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            {isAr ? 'الطلبات النشطة' : 'Active Requests'}
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--facss-green-800)' }}>{activeRequests}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid #059669' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            {isAr ? 'الطلبات المكتملة' : 'Completed Requests'}
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669' }}>{completedRequests}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid var(--facss-gold-600)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            {isAr ? 'التقارير الأمنية الجاهزة' : 'Ready Security Reports'}
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--facss-gold-700)' }}>{finalReportsCount}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid var(--border-color-dark)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            {isAr ? 'إجمالي طلبات الخدمة' : 'Total Requests'}
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{totalRequests}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
        {/* Recent Requests Table Card */}
        <div className="card" style={{ flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'أحدث طلبات الخدمات الأمنية' : 'Recent Security Service Requests'}
            </h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link href="/request-service" className="btn btn-gold btn-sm" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                <Plus size={14} />
                <span>{isAr ? 'تقديم طلب جديد' : 'New Request'}</span>
              </Link>
              <Link href="/portal/client/requests" style={{ fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <span>{isAr ? 'عرض الكل' : 'View All'}</span>
                <ArrowIcon size={14} />
              </Link>
            </div>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>{isAr ? 'لا توجد طلبات مسجلة حتى الآن.' : 'No requests recorded yet.'}</p>
              <Link href="/request-service" className="btn btn-gold btn-sm" style={{ marginTop: '1rem' }}>
                {isAr ? 'تقديم أول طلب خدمة' : 'Submit First Service Request'}
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'رقم المتابعة' : 'Tracking #'}</th>
                    <th>{isAr ? 'الخدمة' : 'Service'}</th>
                    <th>{isAr ? 'الأولوية' : 'Priority'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                    <th>{isAr ? 'التاريخ' : 'Date'}</th>
                    <th>{isAr ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => {
                    const serviceTitle = isAr ? req.service.titleAr : (req.service.titleEn || req.service.titleAr);
                    return (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 800 }}>
                          <Link href={`/portal/client/requests/${req.id}`} style={{ color: 'var(--facss-gold-700)', textDecoration: 'none' }}>
                            {req.requestNumber}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{serviceTitle}</td>
                        <td>
                          <span className={`badge ${req.priority === 'URGENT' ? 'badge-red' : req.priority === 'HIGH' ? 'badge-yellow' : 'badge-gold'}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td>
                          <StatusBadge type="serviceRequest" status={req.status} locale={locale} />
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDate(req.createdAt, locale)}
                        </td>
                        <td>
                          <Link href={`/portal/client/requests/${req.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                            {isAr ? 'متابعة الطلب' : 'View Request'}
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

        {/* Notifications Card */}
        <div className="card">
          <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'التنبيهات والإشعارات التشغيلية' : 'Operational Notifications'}
            </h3>
          </div>

          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {isAr ? 'لا توجد إشعارات جديدة.' : 'No new notifications.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {notifications.map((n) => {
                const title = isAr ? (n.titleAr || n.titleEn) : (n.titleEn || n.titleAr);
                const message = isAr ? (n.messageAr || n.messageEn) : (n.messageEn || n.messageAr);
                return (
                  <div key={n.id} style={{ padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: '8px', borderInlineStart: '3px solid var(--facss-gold-500)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--facss-green-900)', marginBottom: '0.25rem' }}>
                      {title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {message}
                    </p>
                    {n.link && (
                      <Link href={n.link} style={{ fontSize: '0.75rem', color: 'var(--facss-gold-700)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem', fontWeight: 700 }}>
                        <span>{isAr ? 'الانتقال للطلب' : 'Go to request'}</span>
                        <ArrowIcon size={12} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
