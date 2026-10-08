'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState } from 'react';
import { History, Shield, User, Clock, Terminal, Filter } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminDataTable,
  AdminStatusBadge,
  AdminFilterBar,
  AdminSearchInput,
  AdminSelect,
  type ColumnDef,
} from '@/components/admin/ui';

export interface ActivityLogItem {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
}

interface LogsManagerProps {
  initialLogs: ActivityLogItem[];
}

const ACTION_LABELS_AR: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  USER_LOGIN: { get label() { return tx("تسجيل دخول"); }, variant: 'success' },
  USER_LOGOUT: { get label() { return tx("تسجيل خروج"); }, variant: 'neutral' },
  SUBMIT_CONTACT_MESSAGE: { get label() { return tx("إرسال رسالة تواصل"); }, variant: 'info' },
  UPDATE_MESSAGE_STATUS: { get label() { return tx("تعديل حالة رسالة"); }, variant: 'warning' },
  CREATE_SERVICE_REQUEST: { get label() { return tx("إنشاء طلب خدمة"); }, variant: 'info' },
  UPDATE_SERVICE_REQUEST: { get label() { return tx("تحديث طلب خدمة"); }, variant: 'warning' },
  UPDATE_REQUEST_STATUS: { get label() { return tx("تعديل حالة طلب"); }, variant: 'warning' },
  ASSIGN_REQUEST_EMPLOYEE: { get label() { return tx("إسناد موظف للطلب"); }, variant: 'info' },
  UPLOAD_REQUEST_DOCUMENT: { get label() { return tx("رفع مستند عملية"); }, variant: 'info' },
  ARCHIVE_REQUEST_DOCUMENT: { get label() { return tx("أرشفة مستند عملية"); }, variant: 'danger' },
  UPDATE_REGISTRATION_STATUS: { get label() { return tx("تعديل تسجيل متدرب"); }, variant: 'warning' },
  CREATE_INCIDENT: { get label() { return tx("تسجيل بلاغ ميداني"); }, variant: 'danger' },
  VERIFY_INCIDENT: { get label() { return tx("التحقق من بلاغ"); }, variant: 'success' },
  CREATE_ALERT: { get label() { return tx("إصدار تنبيه أمني"); }, variant: 'danger' },
  UPDATE_ALERT: { get label() { return tx("تعديل تنبيه أمني"); }, variant: 'warning' },
  UPDATE_RISK_STATUS: { get label() { return tx("تحديث حالة خطر"); }, variant: 'warning' },
  UPDATE_SYSTEM_SETTING: { get label() { return tx("تعديل إعدادات النظام"); }, variant: 'warning' },
  CREATE_USER: { get label() { return tx("إضافة مستخدم جديد"); }, variant: 'info' },
  UPDATE_USER: { get label() { return tx("تعديل بيانات مستخدم"); }, variant: 'warning' },
  DELETE_USER: { get label() { return tx("حذف مستخدم"); }, variant: 'danger' },
};

export default function LogsManager({ initialLogs }: LogsManagerProps) {
  const { tx, txLocale } = useAdminT();
  const [logs] = useState<ActivityLogItem[]>(initialLogs || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Extract distinct actions for filter dropdown
  const distinctActions = Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (log.userName || '').toLowerCase().includes(query) ||
      (log.details || '').toLowerCase().includes(query) ||
      (log.action || '').toLowerCase().includes(query) ||
      (log.entityType || '').toLowerCase().includes(query);

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const columns: ColumnDef<ActivityLogItem>[] = [
    {
      key: 'action',
      header: tx("الإجراء الموثق"),
      render: (log) => {
        const mapped = ACTION_LABELS_AR[log.action];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <AdminStatusBadge
              status={log.action}
              variant={mapped?.variant || 'neutral'}
              label={mapped?.label || log.action}
            />
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-en)',
                direction: 'ltr',
                display: 'inline-block',
              }}
            >
              {log.action}
            </span>
          </div>
        );
      },
    },
    {
      key: 'entityType',
      header: tx("نوع الكيان"),
      render: (log) => (
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            background: 'var(--surface-bg)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-en)',
            direction: 'ltr',
            display: 'inline-block',
          }}
        >
          {log.entityType || 'SYSTEM'}
        </span>
      ),
    },
    {
      key: 'userName',
      header: tx("المستخدم المسؤول"),
      render: (log) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--surface-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <User size={13} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
            {log.userName || tx("النظام الآلي")}
          </span>
        </div>
      ),
    },
    {
      key: 'details',
      header: tx("تفاصيل العملية"),
      render: (log) => (
        <span
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            display: 'block',
            maxWidth: '420px',
            lineHeight: 1.45,
          }}
        >
          {log.details || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: tx("التاريخ والوقت"),
      render: (log) => (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-en)',
            direction: 'ltr',
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}
        >
          {new Date(log.createdAt).toLocaleString(txLocale("ar-YE"), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={tx("سجل الرقابة والنشاط الإداري (Audit Activity Logs)")}
        description={tx("سجل تتبعي زمني غير قابل للتعديل لتوثيق كافة العمليات الإدارية والتشغيلية الميدانية في المنظومة")}
        meta={
          <span style={{ fontSize: '0.78rem', color: 'var(--brand-gold-600)', fontWeight: 700 }}>
            {tx("إجمالي السجلات المسجلة:")} {logs.length} {tx("عملية")}
          </span>
        }
      />

      <AdminFilterBar
        hasActiveFilters={Boolean(searchQuery || actionFilter !== 'ALL')}
        onReset={() => {
          setSearchQuery('');
          setActionFilter('ALL');
        }}
      >
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={tx("البحث باسم المستخدم، تفاصيل العملية، أو نوع الكيان...")}
        />

        <div style={{ minWidth: '200px' }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="admin-select"
            style={{ height: 'var(--admin-control-height-md)', margin: 0 }}
          >
            <option value="ALL">{tx("كافة الإجراءات والعمليات")}</option>
            {distinctActions.map((act) => {
              const label = ACTION_LABELS_AR[act]?.label || act;
              return (
                <option key={act} value={act}>
                  {label} ({act})
                </option>
              );
            })}
          </select>
        </div>
      </AdminFilterBar>

      <AdminDataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        emptyTitle={tx("لا توجد سجلات مطابقة")}
        emptyDescription={tx("لم يتم العثور على أي نشاط مطابق لمعايير البحث الحالية.")}
        mobileCardRender={(log) => {
          const mapped = ACTION_LABELS_AR[log.action];
          return (
            <div className="admin-card-inner">
              <div className="admin-card-top">
                <AdminStatusBadge
                  status={log.action}
                  variant={mapped?.variant || 'neutral'}
                  label={mapped?.label || log.action}
                />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'var(--surface-bg)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-en)',
                    direction: 'ltr',
                  }}
                >
                  {log.entityType || 'SYSTEM'}
                </span>
              </div>

              <div className="admin-card-body">
                <div className="admin-card-row">
                  <User size={13} style={{ color: 'var(--text-muted)' }} />
                  <span className="admin-card-value">{log.userName || tx("مستخدم غير معروف")}</span>
                </div>
                {log.details && (
                  <p className="admin-card-snippet" style={{ color: 'var(--text-secondary)' }}>
                    {log.details}
                  </p>
                )}
              </div>

              <div className="admin-card-footer">
                <span className="admin-card-date" dir="ltr">
                  <Clock size={12} />
                  <span>{new Date(log.createdAt).toLocaleString(txLocale("ar-YE"))}</span>
                </span>
                {log.entityId && (
                  <span
                    dir="ltr"
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ID: {log.entityId.slice(0, 14)}...
                  </span>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
