import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import { Shield, ArrowLeft, Filter, Plus } from 'lucide-react';

export const revalidate = 0;

export default async function ClientRequestsPage() {
  const session = await requireRole([ROLES.CLIENT], '/portal/client/requests');

  const requests = await prisma.serviceRequest.findMany({
    where: { userId: session.userId },
    include: {
      service: true,
      assignedEmployee: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
            سجل طلبات الخدمات الميدانية والاستشارية
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            متابعة حالة طلبات تقييم مخاطر الوصول الإنساني والرصد والتدريب الميداني
          </span>
        </div>

        <Link href="/request-service" className="btn btn-gold btn-sm">
          <Plus size={16} />
          <span>تقديم طلب خدمة جديد</span>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Shield size={48} style={{ color: 'var(--color-gold)', marginInline: 'auto', marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>لا توجد طلبات مسجلة بحسابكم حالياً.</p>
          <Link href="/request-service" className="btn btn-gold">
            تقديم طلب خدمة الآن
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم التتبع المرجعي</th>
                <th>الخدمة المطلوبة</th>
                <th>الأولوية</th>
                <th>المسؤول المكلف</th>
                <th>حالة الطلب</th>
                <th>تاريخ التقديم</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>
                    {r.requestNumber}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.service.titleAr}</td>
                  <td>
                    <span className={`badge ${r.priority === 'URGENT' ? 'badge-red' : r.priority === 'HIGH' ? 'badge-yellow' : 'badge-gold'}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td>
                    {r.assignedEmployee ? (
                      <span style={{ color: '#FFF', fontSize: '0.85rem' }}>{r.assignedEmployee.fullName}</span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>قيد التعيين</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'COMPLETED' ? 'badge-green' : r.status === 'NEW' ? 'badge-blue' : 'badge-gold'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString('ar-YE')}
                  </td>
                  <td>
                    <Link
                      href={`/portal/client/requests/${r.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <span>عرض وتتبع</span>
                      <ArrowLeft size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
