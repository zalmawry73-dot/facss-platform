'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import {
  AdminSection,
  AdminDataTable,
  AdminStatusBadge,
} from '@/components/admin/ui';

export interface SerializedTrainingRegistration {
  id: string;
  fullName: string;
  courseTitle: string;
  phone: string;
  status: string;
  certificateNumber?: string | null;
  createdAt: string;
}

interface Props {
  registrations: SerializedTrainingRegistration[];
}

export default function TrainingRegistrationsSummary({ registrations }: Props) {
  const { tx, txLocale } = useAdminT();
  const columns = [
    {
      key: 'fullName',
      title: tx("اسم المتدرب"),
      render: (reg: SerializedTrainingRegistration) => (
        <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>{reg.fullName}</span>
      ),
    },
    {
      key: 'course',
      title: tx("الدورة التدريبية"),
      render: (reg: SerializedTrainingRegistration) => (
        <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem' }}>{reg.courseTitle}</span>
      ),
    },
    {
      key: 'phone',
      title: tx("رقم الهاتف"),
      render: (reg: SerializedTrainingRegistration) => (
        <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>{reg.phone}</span>
      ),
    },
    {
      key: 'status',
      title: tx("الحالة"),
      render: (reg: SerializedTrainingRegistration) => (
        <AdminStatusBadge
          variant={reg.status === 'COMPLETED' ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'warning'}
          label={reg.status}
        />
      ),
    },
    {
      key: 'certificate',
      title: tx("الشهادة الصادرة"),
      render: (reg: SerializedTrainingRegistration) => (
        reg.certificateNumber ? (
          <code
            dir="ltr"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              background: 'rgba(201, 162, 39, 0.1)',
              color: 'var(--admin-gold-hover)',
              padding: '0.2rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid rgba(201, 162, 39, 0.25)',
            }}
          >
            {reg.certificateNumber}
          </code>
        ) : (
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{tx("قيد الإجراء")}</span>
        )
      ),
    },
    {
      key: 'createdAt',
      title: tx("تاريخ التقديم"),
      render: (reg: SerializedTrainingRegistration) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
          {new Date(reg.createdAt).toLocaleDateString(txLocale("ar-YE"))}
        </span>
      ),
    },
  ];

  return (
    <AdminSection
      title={tx("أحدث طلبات الالتحاق بالبرامج التدريبية")}
      description={tx("عرض سريع لآخر 20 طلب تسجيل مستلم عبر البوابة التدريبية")}
    >
      <AdminDataTable
        columns={columns}
        data={registrations}
        rowKey="id"
        emptyMessage={tx("لا توجد طلبات تسجيل مسجلة حالياً.")}
        mobileCardRender={(reg) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <strong style={{ color: 'var(--admin-text-primary)', fontSize: '0.9rem' }}>{reg.fullName}</strong>
              <AdminStatusBadge
                variant={reg.status === 'COMPLETED' ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'warning'}
                label={reg.status}
              />
            </div>
            <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>{reg.courseTitle}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>{reg.phone}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                {new Date(reg.createdAt).toLocaleDateString(txLocale("ar-YE"))}
              </span>
            </div>
            {reg.certificateNumber && (
              <code dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: 'rgba(201, 162, 39, 0.1)', color: 'var(--admin-gold-hover)', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(201, 162, 39, 0.25)', alignSelf: 'flex-start' }}>
                {reg.certificateNumber}
              </code>
            )}
          </div>
        )}
      />
    </AdminSection>
  );
}
