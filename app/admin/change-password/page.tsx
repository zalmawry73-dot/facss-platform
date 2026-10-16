import React from 'react';
import { requireStaff } from '@/lib/rbac';
import ChangePasswordCard from '@/components/auth/ChangePasswordCard';
import { AdminPageHeader } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminChangePasswordPage() {
  // Layer 2 Authentication & Authorization Guard
  await requireStaff('/admin/change-password');

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0.5rem 0 3.5rem' }}>
      <AdminPageHeader
        title="أمان الحساب وتغيير كلمة المرور"
        description="تحديث كلمة المرور لحسابك مع رفع رقم إصدار الجلسة وإبطال كافة الرموز السابقة على جميع الأجهزة فورياً"
      />
      <div style={{ marginTop: '1.25rem' }}>
        <ChangePasswordCard backUrl="/admin" />
      </div>
    </div>
  );
}
