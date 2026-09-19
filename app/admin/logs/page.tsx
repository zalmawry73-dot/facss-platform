import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import { History, Shield, User, Clock } from 'lucide-react';

export const revalidate = 0;

export default async function AdminLogsPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.VIEW_AUDIT_LOGS, '/admin');

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
          سجل الرقابة والنشاط الإداري (Audit Activity Logs)
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          سجل تتبعي زمني غير قابل للتعديل لتوثيق كافة العمليات الإدارية والميدانية
        </span>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>الإجراء (Action)</th>
                <th>نوع الكيان</th>
                <th>المستخدم المسؤول</th>
                <th>تفاصيل العملية</th>
                <th>التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>
                    {log.action}
                  </td>
                  <td>
                    <span className="badge badge-gold">{log.entityType}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#FFF' }}>
                    {log.userName || 'النظام الآلي'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '350px' }}>
                    {log.details}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString('ar-YE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
