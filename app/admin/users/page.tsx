import React from 'react';
import prisma from '@/lib/prisma';
import { Users, Shield, UserCheck, Lock } from 'lucide-react';

export const revalidate = 0;

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organization: true,
      phone: true,
      isActive: true,
      createdAt: true,
    }
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
          إدارة المستخدمين والصلاحيات (RBAC)
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          التحكم برتب الموظفين، مدراء الخدمات، مسؤولي التدريب، والعملاء
        </span>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم الكامل</th>
                <th>البريد الإلكتروني</th>
                <th>الجهة / المؤسسة</th>
                <th>الرتبة والدور (Role)</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: '#FFF' }}>{u.fullName}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.organization || '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'badge-red' : u.role.includes('MANAGER') ? 'badge-gold' : u.role === 'CLIENT' ? 'badge-blue' : 'badge-green'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-green">
                      {u.isActive ? 'مفعل' : 'معطل'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('ar-YE')}
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
