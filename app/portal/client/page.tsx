import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  FolderLock, 
  AlertCircle, 
  ArrowLeft,
  FileText 
} from 'lucide-react';

export const revalidate = 0;

export default async function ClientDashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

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
      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ borderInlineStart: '4px solid #3B82F6' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>الطلبات النشطة</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#60A5FA' }}>{activeRequests}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>الطلبات المكتملة</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#34D399' }}>{completedRequests}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid var(--color-gold)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>إجمالي الطلبات</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-gold-light)' }}>{totalRequests}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid #06B6D4' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>التقارير السرية المتاحة</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#22D3EE' }}>2</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        {/* Recent Requests Table Card */}
        <div className="card" style={{ flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              أحدث طلبات الخدمات الأمنية
            </h2>
            <Link href="/portal/client/requests" style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)', fontWeight: 700 }}>
              عرض كافة الطلبات
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>لا توجد طلبات مسجلة حتى الآن.</p>
              <Link href="/request-service" className="btn btn-gold btn-sm" style={{ marginTop: '1rem' }}>
                تقديم أول طلب خدمة
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم المتابعة</th>
                    <th>الخدمة</th>
                    <th>الأولوية</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>
                        {req.requestNumber}
                      </td>
                      <td>{req.service.titleAr}</td>
                      <td>
                        <span className={`badge ${req.priority === 'URGENT' ? 'badge-red' : req.priority === 'HIGH' ? 'badge-yellow' : 'badge-gold'}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-green">
                          {req.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(req.createdAt).toLocaleDateString('ar-YE')}
                      </td>
                      <td>
                        <Link href={`/portal/client/requests/${req.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                          متابعة
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
            التنبيهات والإشعارات التشغيلية
          </h3>

          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>لا توجد إشعارات جديدة.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: '0.85rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', borderInlineStart: '3px solid var(--color-gold)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF', marginBottom: '0.25rem' }}>
                    {n.titleAr}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    {n.messageAr}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginTop: '0.4rem' }}>
                    {new Date(n.createdAt).toLocaleDateString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
