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
  Plus,
  Bell,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const PRIORITY_LABEL: Record<string, { ar: string; en: string }> = {
  NORMAL: { ar: 'عادية', en: 'Normal' },
  HIGH: { ar: 'عالية', en: 'High' },
  URGENT: { ar: 'عاجلة', en: 'Urgent' },
};

export const revalidate = 0;

export default async function ClientDashboardPage() {
  const session = await requireRole([ROLES.CLIENT], '/portal/client');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
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
          className="portal-card" 
          style={{ 
            marginBottom: '2rem', 
            background: 'linear-gradient(135deg, rgba(181, 146, 84, 0.12) 0%, rgba(11, 61, 46, 0.05) 100%)',
            border: '1.5px solid var(--color-gold-500)',
            borderInlineStart: '6px solid var(--color-gold-600)',
            padding: '1.4rem 1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-gold-500)', color: 'var(--color-primary-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(181, 146, 84, 0.3)' }}>
                <FileCheck2 size={26} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? 'التقرير الأمني النهائي معتمد ومتاح للتحميل' : 'Final Security Report Approved & Ready'}
                  </h3>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(21, 128, 61, 0.12)', color: '#15803D', fontWeight: 700, border: '1px solid rgba(21, 128, 61, 0.25)' }}>
                    {isAr ? 'معتمد رسمياً' : 'Official Deliverable'}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                  {isAr 
                    ? `أصدر المركز التقرير الأمني لطلبكم رقم ${readyReports[0].request.requestNumber} (${readyReports[0].request.service.titleAr})`
                    : `Report issued for request ${readyReports[0].request.requestNumber} (${readyReports[0].request.service.titleEn || readyReports[0].request.service.titleAr})`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link 
                href={`/portal/client/requests/${readyReports[0].request.id}`}
                className="btn btn-gold btn-sm"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.15rem' }}
              >
                <span>{isAr ? 'عرض وتنزيل التقرير' : 'View & Download Report'}</span>
                <ArrowIcon size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4 Metrics Cards */}
      <div className="portal-stat-grid">
        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid var(--color-primary-800)' }}>
          <span className="portal-stat-label">
            {isAr ? 'الطلبات النشطة وقيد التنفيذ' : 'Active & In-Progress Requests'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: 'var(--color-primary-900)' }}>{activeRequests}</span>
            <Clock size={20} style={{ color: 'var(--color-primary-800)', opacity: 0.6 }} />
          </div>
        </div>

        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid #15803D' }}>
          <span className="portal-stat-label">
            {isAr ? 'الطلبات المنجزة والمكتملة' : 'Completed Requests'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: '#15803D' }}>{completedRequests}</span>
            <CheckCircle2 size={20} style={{ color: '#15803D', opacity: 0.6 }} />
          </div>
        </div>

        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid var(--color-gold-600)' }}>
          <span className="portal-stat-label">
            {isAr ? 'التقارير الأمنية المعتمدة' : 'Ready Security Reports'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: 'var(--color-gold-600)' }}>{finalReportsCount}</span>
            <FileCheck2 size={20} style={{ color: 'var(--color-gold-600)', opacity: 0.6 }} />
          </div>
        </div>

        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid var(--admin-card-border)' }}>
          <span className="portal-stat-label">
            {isAr ? 'إجمالي الطلبات المسجلة' : 'Total Service Requests'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: 'var(--text-primary)' }}>{totalRequests}</span>
            <Shield size={20} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Requests & Operational Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Recent Requests Table Card */}
        <div className="portal-card" style={{ flex: 2 }}>
          <div className="portal-card-header">
            <h2 className="portal-card-title">
              <Shield size={20} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'أحدث طلبات الخدمات الأمنية' : 'Recent Security Service Requests'}</span>
            </h2>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <Link href="/request-service" className="btn btn-gold btn-sm" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                <Plus size={14} />
                <span>{isAr ? 'طلب جديد' : 'New Request'}</span>
              </Link>
              <Link 
                href="/portal/client/requests" 
                style={{ fontSize: '0.82rem', color: 'var(--color-primary-900)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
              >
                <span>{isAr ? 'عرض الكل' : 'View All'}</span>
                <ArrowIcon size={14} />
              </Link>
            </div>
          </div>

          {recentRequests.length === 0 ? (
            <div className="portal-empty-state">
              <Shield size={44} style={{ color: 'var(--color-gold-500)', marginInline: 'auto', marginBottom: '0.85rem', opacity: 0.6 }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {isAr ? 'لا توجد طلبات خدمات مسجلة حتى الآن' : 'No service requests recorded yet'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', marginInline: 'auto', marginBottom: '1.25rem' }}>
                {isAr 
                  ? 'يمكنكم البدء بتقديم طلب تقييم مخاطر، رصد ميداني، أو استشارة أمنية عبر نموذج الطلبات المعتمد.' 
                  : 'Submit a new risk assessment, field monitoring, or safety advisory request through the secure form.'}
              </p>
              <Link href="/request-service" className="btn btn-gold btn-sm">
                <Plus size={16} />
                <span>{isAr ? 'تقديم أول طلب خدمة' : 'Submit First Request'}</span>
              </Link>
            </div>
          ) : (
            <div className="portal-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'رقم المتابعة' : 'Ref #'}</th>
                    <th>{isAr ? 'نوع الخدمة' : 'Service'}</th>
                    <th>{isAr ? 'الأولوية' : 'Priority'}</th>
                    <th>{isAr ? 'الحالة التشغيلية' : 'Status'}</th>
                    <th>{isAr ? 'تاريخ التقديم' : 'Submitted'}</th>
                    <th>{isAr ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => {
                    const serviceTitle = isAr ? req.service.titleAr : (req.service.titleEn || req.service.titleAr);
                    return (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 800 }}>
                          <Link href={`/portal/client/requests/${req.id}`} style={{ color: 'var(--color-primary-900)', textDecoration: 'none', fontFamily: 'var(--font-en)' }}>
                            {req.requestNumber}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{serviceTitle}</td>
                        <td>
                          <span 
                            style={{ 
                              fontSize: '0.72rem', 
                              fontWeight: 700, 
                              padding: '0.15rem 0.45rem', 
                              borderRadius: '4px',
                              background: req.priority === 'URGENT' ? 'rgba(220, 38, 38, 0.1)' : req.priority === 'HIGH' ? 'rgba(217, 119, 6, 0.1)' : 'var(--surface-bg)',
                              color: req.priority === 'URGENT' ? '#DC2626' : req.priority === 'HIGH' ? '#B45309' : 'var(--text-secondary)',
                              border: '1px solid var(--admin-card-border)'
                            }}
                          >
                            {PRIORITY_LABEL[req.priority]?.[locale] ?? req.priority}
                          </span>
                        </td>
                        <td>
                          <StatusBadge type="serviceRequest" status={req.status} locale={locale} />
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-en)' }}>
                          {formatDate(req.createdAt, locale)}
                        </td>
                        <td>
                          <Link href={`/portal/client/requests/${req.id}`} className="admin-btn admin-btn-outline admin-btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
                            {isAr ? 'متابعة الطلب' : 'Track'}
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

        {/* Operational Notifications Card */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h3 className="portal-card-title">
              <Bell size={18} style={{ color: 'var(--color-gold-600)' }} />
              <span>{isAr ? 'الإشعارات والتحديثات الأمنية' : 'Security Notifications'}</span>
            </h3>
          </div>

          {notifications.length === 0 ? (
            <div className="portal-empty-state" style={{ padding: '2rem 1rem' }}>
              <Bell size={32} style={{ color: 'var(--text-muted)', marginInline: 'auto', marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                {isAr ? 'لا توجد إشعارات جديدة حالياً.' : 'No new notifications.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {notifications.map((n) => {
                const title = isAr ? (n.titleAr || n.titleEn) : (n.titleEn || n.titleAr);
                const message = isAr ? (n.messageAr || n.messageEn) : (n.messageEn || n.messageAr);
                return (
                  <div 
                    key={n.id} 
                    style={{ 
                      padding: '0.85rem 1rem', 
                      background: 'var(--surface-bg)', 
                      borderRadius: '8px', 
                      borderInlineStart: '4px solid var(--color-gold-500)', 
                      border: '1px solid var(--admin-card-border)' 
                    }}
                  >
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary-900)', margin: '0 0 0.25rem 0' }}>
                      {title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {message}
                    </p>
                    {n.link && (
                      <Link 
                        href={n.link} 
                        style={{ fontSize: '0.75rem', color: 'var(--color-gold-700)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.45rem', fontWeight: 700, textDecoration: 'none' }}
                      >
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
