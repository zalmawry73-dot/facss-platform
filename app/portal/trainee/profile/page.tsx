import React from 'react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { User, Award, ShieldCheck, Mail, Phone } from 'lucide-react';

export const revalidate = 0;

export default async function TraineeProfilePage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', marginInline: 'auto' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFF', marginBottom: '1.5rem' }}>
          الملف التعريفي للمتدرب
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>الاسم الرباعي</span>
            <strong style={{ fontSize: '1rem', color: '#FFF' }}>{user.fullName}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>البريد الإلكتروني</span>
            <strong style={{ fontSize: '1rem', color: '#FFF' }}>{user.email}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>رقم الهاتف</span>
            <strong style={{ fontSize: '1rem', color: '#FFF' }}>{user.phone || 'غير مسجل'}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.2rem' }}>الصفة</span>
            <span className="badge badge-gold">متدرب أمني معتمد</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderInlineStart: '4px solid var(--color-gold)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>
          تحديث السجل والبيانات المهنية
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
          يتم ربط كافة الدورات والشهادات المعتمدة التي تجتازها تلقائياً بملفك الشخصي لدى أكاديمية مركز عدن الأول للتدريب الأمني.
        </p>
      </div>
    </div>
  );
}
