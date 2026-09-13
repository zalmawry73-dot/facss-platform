import React from 'react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { User, Building, Mail, Phone, ShieldCheck, Lock } from 'lucide-react';

export const revalidate = 0;

export default async function ClientProfilePage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { clientProfile: true },
  });

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', marginInline: 'auto' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFF', marginBottom: '1.5rem' }}>
          الملف التعريفي للجهة / العميل
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>اسم المفوض</span>
            <strong style={{ fontSize: '1rem', color: '#FFF' }}>{user.fullName}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>البريد الإلكتروني الرسمي</span>
            <strong style={{ fontSize: '1rem', color: '#FFF' }}>{user.email}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>الجهة / المنشأة</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-gold-light)' }}>
              {user.organization || user.clientProfile?.companyName || 'غير محدد'}
            </strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>رقم الهاتف</span>
            <strong style={{ fontSize: '1rem', color: '#FFF' }}>{user.phone || 'غير مسجل'}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>قطاع النشاط</span>
            <strong style={{ fontSize: '1rem', color: '#FFF' }}>{user.clientProfile?.sector || 'منشأة تجارية / مصرفية'}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>حالة الحساب</span>
            <span className="badge badge-green">نشط ومعتمد</span>
          </div>
        </div>
      </div>

      {/* Security & Password Notice */}
      <div className="card" style={{ borderInlineStart: '4px solid var(--color-gold)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-gold-light)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
            إعدادات أمان الحساب
          </h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
          لتغيير كلمة المرور أو تحديث المفوضين بالتواصل، يرجى تقديم طلب إلكتروني أو التواصل مع إدارة العمليات لضمان مطابقة التحقق الأمني.
        </p>
      </div>
    </div>
  );
}
