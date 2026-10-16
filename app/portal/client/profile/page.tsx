import React from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import { User, Building, Mail, Phone, ShieldCheck, Lock, Building2 } from 'lucide-react';

export const revalidate = 0;

export default async function ClientProfilePage() {
  const session = await requireRole([ROLES.CLIENT], '/portal/client/profile');

  const cookieStore = cookies();
  const isAr = cookieStore.get('facss_locale')?.value !== 'en';

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { clientProfile: true },
  });

  if (!user) return null;

  return (
    <div style={{ maxWidth: '850px', marginInline: 'auto' }}>
      <div className="portal-card" style={{ marginBottom: '1.75rem' }}>
        <div className="portal-card-header">
          <h2 className="portal-card-title">
            <Building2 size={20} style={{ color: 'var(--color-gold-600)' }} />
            <span>{isAr ? 'الملف التعريفي للجهة والمنشأة الشريكة' : 'Enterprise & Client Profile'}</span>
          </h2>
          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '4px', background: 'rgba(21, 128, 61, 0.1)', color: '#15803D', fontWeight: 700, border: '1px solid rgba(21, 128, 61, 0.25)' }}>
            {isAr ? 'حساب معتمد ومفعل' : 'Active Account'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '1rem 1.15rem', background: 'var(--surface-bg)', borderRadius: '10px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              {isAr ? 'اسم المفوض الأمني / جهة الاتصال' : 'Authorized Representative'}
            </span>
            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{user.fullName}</strong>
          </div>

          <div style={{ padding: '1rem 1.15rem', background: 'var(--surface-bg)', borderRadius: '10px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              {isAr ? 'البريد الإلكتروني الرسمي' : 'Official Email'}
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }} dir="ltr">
              {user.email}
            </strong>
          </div>

          <div style={{ padding: '1rem 1.15rem', background: 'var(--surface-bg)', borderRadius: '10px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              {isAr ? 'الجهة / المنظمة المسجلة' : 'Organization / Enterprise'}
            </span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-primary-950)' }}>
              {user.organization || user.clientProfile?.companyName || (isAr ? 'غير محدد' : 'Not specified')}
            </strong>
          </div>

          <div style={{ padding: '1rem 1.15rem', background: 'var(--surface-bg)', borderRadius: '10px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              {isAr ? 'رقم الهاتف والتواصل الميداني' : 'Contact Phone'}
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }} dir="ltr">
              {user.phone || (isAr ? 'غير مسجل' : 'Not registered')}
            </strong>
          </div>

          <div style={{ padding: '1rem 1.15rem', background: 'var(--surface-bg)', borderRadius: '10px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              {isAr ? 'قطاع النشاط التشغيلي' : 'Operational Sector'}
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {user.clientProfile?.sector || (isAr ? 'منشأة إنسانية / تجارية' : 'Humanitarian / Commercial')}
            </strong>
          </div>

          <div style={{ padding: '1rem 1.15rem', background: 'var(--surface-bg)', borderRadius: '10px', border: '1px solid var(--admin-card-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              {isAr ? 'مستوى الصلاحية الممنوحة' : 'Access Level'}
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-gold-700)' }}>
              {isAr ? 'بوابة العميل المؤسسية (CLIENT)' : 'Client Portal Access (CLIENT)'}
            </strong>
          </div>
        </div>
      </div>

      {/* Security & Password Notice */}
      <div className="portal-card" style={{ borderInlineStart: '5px solid var(--color-gold-500)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-gold-600)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {isAr ? 'إجراءات أمان الحساب والتوثيق المؤسسي' : 'Account Security & Institutional Verification'}
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
          {isAr
            ? 'لتغيير كلمة المرور أو تحديث بيانات المفوضين بالتواصل الرسمي، يرجى التواصل مع إدارة العمليات بمركز الحلول المتكاملة للأمن والسلامة لضمان استيفاء معايير التحقق الأمني.'
            : 'To update your password or primary points of contact, please reach out to operations support to fulfill security verification standards.'}
        </p>
      </div>
    </div>
  );
}
