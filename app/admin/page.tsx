import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  FileText, 
  Mail, 
  Activity, 
  Clock,
  ArrowLeft 
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  // Live counts from PostgreSQL database
  const [
    newRequestsCount,
    activeRequestsCount,
    completedRequestsCount,
    totalClientsCount,
    totalTraineesCount,
    coursesCount,
    applicationsCount,
    publicationsCount,
    unreadMessagesCount,
    recentRequests,
    recentMessages,
    recentLogs
  ] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: 'NEW' } }),
    prisma.serviceRequest.count({ where: { status: { in: ['NEW', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'REPORT_READY'] } } }),
    prisma.serviceRequest.count({ where: { status: 'COMPLETED' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'TRAINEE' } }),
    prisma.course.count(),
    prisma.trainingRegistration.count(),
    prisma.researchPublication.count(),
    prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
    prisma.serviceRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { service: true }
    }),
    prisma.contactMessage.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    })
  ]);

  const metrics = [
    { label: 'طلبات جديدة بحاجة لمراجعة', value: newRequestsCount, color: '#EF4444', icon: ShieldAlert, href: '/admin/requests' },
    { label: 'طلبات نشطة قيد المتابعة', value: activeRequestsCount, color: '#3B82F6', icon: Activity, href: '/admin/requests' },
    { label: 'طلبات مكتملة بنجاح', value: completedRequestsCount, color: '#10B981', icon: CheckCircle2, href: '/admin/requests' },
    { label: 'رسائل استفسار غير مقروءة', value: unreadMessagesCount, color: '#F59E0B', icon: Mail, href: '/admin/messages' },
    { label: 'إجمالي العملاء والمؤسسات', value: totalClientsCount, color: 'var(--color-gold-light)', icon: Users, href: '/admin/users' },
    { label: 'إجمالي المتدربين المسجلين', value: totalTraineesCount, color: '#A855F7', icon: GraduationCap, href: '/admin/training' },
    { label: 'البرامج التدريبية المتاحة', value: coursesCount, color: '#06B6D4', icon: GraduationCap, href: '/admin/training' },
    { label: 'الدراسات والتقارير المنشورة', value: publicationsCount, color: '#6366F1', icon: FileText, href: '/admin/research' },
  ];

  return (
    <div>
      {/* 8 Live Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Link key={idx} href={m.href} className="card" style={{ padding: '1.4rem', borderInlineStart: `4px solid ${m.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.label}</span>
                <Icon size={18} style={{ color: m.color }} />
              </div>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: m.color }}>
                {m.value}
              </span>
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Latest Requests */}
        <div className="card" style={{ flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              أحدث طلبات الخدمات المقدمة
            </h3>
            <Link href="/admin/requests" style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 700 }}>
              إدارة كافة الطلبات
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الرقم المرجعي</th>
                  <th>الجهة</th>
                  <th>الخدمة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>
                      <Link href={`/admin/requests?id=${r.id}`}>{r.requestNumber}</Link>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.organization}</td>
                    <td style={{ fontSize: '0.85rem' }}>{r.service.titleAr}</td>
                    <td>
                      <span className={`badge ${r.status === 'NEW' ? 'badge-blue' : r.status === 'COMPLETED' ? 'badge-green' : 'badge-gold'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('ar-YE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Audit Logs */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              سجل النشاط الإداري المباشر
            </h3>
            <Link href="/admin/logs" style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 700 }}>
              السجل الكامل
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentLogs.map((log) => (
              <div key={log.id} style={{ padding: '0.75rem 0.9rem', background: 'rgba(5,14,9,0.5)', borderRadius: '6px', borderInlineStart: '3px solid var(--color-gold)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold-light)' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                    {new Date(log.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
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
