'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BellRing,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Lock,
  Eye,
  MapPin,
  Users,
  ShieldCheck,
  Send,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminFilterBar,
  AdminSearchInput,
  AdminSelect,
  AdminDataTable,
  AdminStatusBadge,
  AdminButton,
  AdminIconButton,
  AdminEmptyState,
  AdminLoadingState,
  AdminAlert,
} from '@/components/admin/ui';

interface AlertItem {
  id: string;
  alertNumber: string;
  severity: string;
  titleAr: string;
  executiveTitleAr?: string | null;
  targetGovernorate: string;
  targetDistricts: string;
  approvalStatus: string;
  currentVersion: number;
  isPrecautionary: boolean;
  dispatchedAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  incident?: {
    id: string;
    incidentNumber: string;
    status: string;
    category: string;
    governorate: string;
    district?: string | null;
  };
  snapshots?: Array<{ id: string; approvalVersion: number; snapshotHash: string }>;
  recipients?: Array<{ id: string; alertTier: string; recipientUser: { fullName: string; role: string } }>;
}

interface AlertsManagerProps {
  currentUserRole: string;
  currentUserId: string;
}

const SEVERITY_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'neutral' }> = {
  CRITICAL_FLASH: {
    get label() { return tx("خاطف عاجل جداً (Critical Flash)"); },
    variant: 'danger',
  },
  WARNING_HIGH: {
    get label() { return tx("تحذير أمني عالي (Warning High)"); },
    variant: 'warning',
  },
  ADVISORY_WATCH: {
    get label() { return tx("إشعار مراقبة (Advisory Watch)"); },
    variant: 'info',
  },
  INFORMATIONAL: {
    get label() { return tx("إحاطة إعلامية (Informational)"); },
    variant: 'neutral',
  },
};

export default function AlertsManager({ currentUserRole, currentUserId }: AlertsManagerProps) {
  const { tx, txLocale } = useAdminT();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const stats = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter((a) => a.severity === 'CRITICAL_FLASH').length;
    const approved = alerts.filter((a) => a.approvalStatus === 'APPROVED' && !a.dispatchedAt).length;
    const dispatched = alerts.filter((a) => Boolean(a.dispatchedAt)).length;
    return { total, critical, approved, dispatched };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'DISPATCHED' && !alert.dispatchedAt) return false;
        if (statusFilter === 'APPROVED' && (alert.approvalStatus !== 'APPROVED' || alert.dispatchedAt)) return false;
        if (statusFilter === 'DRAFT' && alert.approvalStatus !== 'DRAFT') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = alert.alertNumber.toLowerCase().includes(q);
        const matchTitle = alert.titleAr.toLowerCase().includes(q);
        const matchExec = (alert.executiveTitleAr || '').toLowerCase().includes(q);
        const matchGov = alert.targetGovernorate.toLowerCase().includes(q);
        if (!matchNumber && !matchTitle && !matchExec && !matchGov) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, statusFilter, searchQuery]);

  // Data table columns definition
  const columns = [
    {
      key: 'alertNumber',
      header: tx("رقم التنبيه والنسخة"),
      render: (row: AlertItem) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              dir="ltr"
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--admin-primary)',
              }}
            >
              {row.alertNumber}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                background: 'var(--admin-bg-surface-subtle)',
                color: 'var(--admin-text-secondary)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              v{row.currentVersion}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
            {new Date(row.createdAt).toLocaleDateString(txLocale("ar-YE"), {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: tx("مستوى الخطورة"),
      render: (row: AlertItem) => {
        const config = SEVERITY_CONFIG[row.severity] || { label: row.severity, variant: 'neutral' as const };
        return <AdminStatusBadge status={config.label} variant={config.variant} dot />;
      },
    },
    {
      key: 'title',
      header: tx("الإحاطة التشغيلية والملخص الموجز"),
      render: (row: AlertItem) => (
        <div style={{ maxWidth: '380px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-text-primary)', marginBottom: '3px' }}>
            {row.titleAr}
          </div>
          {row.executiveTitleAr && (
            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--admin-info)', fontWeight: 600 }}>{tx("الموجز:")}</span>
              <span>{row.executiveTitleAr}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      header: tx("النطاق والمستلمون"),
      render: (row: AlertItem) => {
        const recipientCount = row.recipients ? row.recipients.length : 0;
        return (
          <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
              <MapPin size={13} style={{ color: 'var(--admin-primary)' }} />
              <span>{row.targetGovernorate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
              <Users size={12} />
              <span>{recipientCount} {tx("حساب مصرح")}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: tx("حالة الاعتماد والتوزيع"),
      render: (row: AlertItem) => {
        const isDispatched = Boolean(row.dispatchedAt);
        const isApproved = row.approvalStatus === 'APPROVED' && !isDispatched;

        if (isDispatched) {
          return <AdminStatusBadge status={tx("تم التوزيع داخلياً")} variant="info" dot />;
        }
        if (isApproved) {
          return <AdminStatusBadge status={tx("معتمد (لقطة مجمدة)")} variant="success" dot />;
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <AdminStatusBadge status={tx("مسودة قيد المراجعة")} variant="warning" dot />
            {row.isPrecautionary && (
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'var(--admin-warning-subtle)',
                  color: 'var(--admin-warning)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {tx("احترازي غير مؤكد")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'incident',
      header: tx("البلاغ الميداني المصدر"),
      render: (row: AlertItem) => {
        if (!row.incident) {
          return <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{tx("مستقل")}</span>;
        }
        return (
          <Link
            href={`/admin/incidents/${row.incident.id}`}
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: 'var(--admin-primary)',
              background: 'var(--admin-primary-subtle)',
              padding: '3px 7px',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            <span dir="ltr">{row.incident.incidentNumber}</span>
            <ExternalLink size={11} />
          </Link>
        );
      },
    },
    {
      key: 'actions',
      header: tx("الإجراءات"),
      render: (row: AlertItem) => (
        <Link href={`/admin/alerts/${row.id}`} style={{ textDecoration: 'none' }}>
          <AdminButton variant="secondary" size="sm" icon={<Eye size={13} />}>
            {tx("مراجعة")}
          </AdminButton>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <AdminPageHeader
        title={tx("منظومة التنبيهات الميدانية المستهدفة")}
        description={tx("إعداد، مراجعة، واعتماد التنبيهات الميدانية الأمنية وتوزيعها الداخلي المشفر عبر المنصة")}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AdminButton
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} className={isLoading ? 'spin' : ''} />}
              disabled={isLoading}
              onClick={fetchAlerts}
            >
              {tx("تحديث")}
            </AdminButton>
            <Link href="/admin/incidents" style={{ textDecoration: 'none' }}>
              <AdminButton variant="primary" size="sm" icon={<FileCheck2 size={14} />}>
                {tx("البلاغات الميدانية المنقحة")}
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Security Boundary Notice */}
      <AdminAlert
        variant="warning"
        title={tx("ضابط الأمان والتوزيع الداخلي المشفر")}
        message={tx("التوزيع محصور داخل المنصة (In-App Portal) للحسابات المصرحة وفق اللقطات المجمدة المشفرة (Snapshots). لا يحتوي أي تنبيه على مصادر المعلومات أو وسائل اتصالهم أو إحداثياتهم الدقيقة. الاعتماد النهائي محصور بالإدارة العليا (SUPER_ADMIN).")}
      />

      {/* Summary Stat Indicators */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <AdminStatCard
          title={tx("إجمالي التنبيهات")}
          value={stats.total}
          icon={BellRing}
          description={tx("كافة السجلات والمسودات")}
        />
        <AdminStatCard
          title={tx("تنبيهات خاطفة عاجلة")}
          value={stats.critical}
          icon={AlertTriangle}
          variant="danger"
          description={tx("مستوى خطورة قصوى (Flash)")}
        />
        <AdminStatCard
          title={tx("تنبيهات معتمدة مجمدة")}
          value={stats.approved}
          icon={ShieldCheck}
          variant="success"
          description={tx("بانتظار التوزيع الداخلي")}
        />
        <AdminStatCard
          title={tx("تم التوزيع الداخلي")}
          value={stats.dispatched}
          icon={Send}
          variant="info"
          description={tx("تم الإرسال للمستفيدين")}
        />
      </div>

      {/* Filter Bar */}
      <AdminFilterBar
        search={
          <AdminSearchInput
            placeholder={tx("بحث برقم التنبيه، العنوان، أو المحافظة...")}
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        }
        filters={
          <>
            <AdminSelect
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: tx("جميع مستويات الخطورة") },
                { value: 'CRITICAL_FLASH', label: tx("خاطف عاجل جداً (Critical Flash)") },
                { value: 'WARNING_HIGH', label: tx("تحذير أمني عالي (Warning High)") },
                { value: 'ADVISORY_WATCH', label: tx("إشعار مراقبة (Advisory Watch)") },
                { value: 'INFORMATIONAL', label: tx("إحاطة إعلامية (Informational)") },
              ]}
            />
            <AdminSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: tx("جميع حالات التنبيه") },
                { value: 'DRAFT', label: tx("مسودات قيد المراجعة") },
                { value: 'APPROVED', label: tx("معتمد (لقطة مجمدة)") },
                { value: 'DISPATCHED', label: tx("تم التوزيع الداخلي") },
              ]}
            />
          </>
        }
        actions={
          (searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL') ? (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
              }}
            >
              {tx("إعادة تعيين الفلاتر")}
            </AdminButton>
          ) : undefined
        }
      />

      {/* Content Table or Empty/Loading State */}
      {isLoading ? (
        <AdminSection>
          <AdminLoadingState message={tx("جاري جلب سجلات التنبيهات الميدانية من الخادم...")} />
        </AdminSection>
      ) : filteredAlerts.length === 0 ? (
        <AdminSection>
          <AdminEmptyState
            title={tx("لا توجد تنبيهات مطابقة")}
            description={
              searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL'
                ? tx("لم يتم العثور على نتائج تطابق معايير البحث والتصفية المحددة أعلاه.")
                : tx("لم يتم إعداد أو صياغة أي تنبيهات ميدانية حتى الآن. يمكنك استعراض البلاغات الميدانية المنقحة لإعداد تنبيه جديد.")
            }
            action={
              searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL' ? (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                >
                  {tx("إلغاء معايير التصفية")}
                </AdminButton>
              ) : (
                <Link href="/admin/incidents" style={{ textDecoration: 'none' }}>
                  <AdminButton variant="primary" size="sm" icon={<FileCheck2 size={14} />}>
                    {tx("استعراض البلاغات المنقحة")}
                  </AdminButton>
                </Link>
              )
            }
          />
        </AdminSection>
      ) : (
        <AdminDataTable
          columns={columns}
          data={filteredAlerts}
          keyExtractor={(item) => item.id}
          mobileCardRender={(alert) => {
            const severityConfig = SEVERITY_CONFIG[alert.severity] || { label: alert.severity, variant: 'neutral' as const };
            const isDispatched = Boolean(alert.dispatchedAt);
            const isApproved = alert.approvalStatus === 'APPROVED' && !isDispatched;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-primary)' }}>
                      {alert.alertNumber}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'var(--admin-bg-surface-subtle)', color: 'var(--admin-text-secondary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      v{alert.currentVersion}
                    </span>
                  </div>
                  <AdminStatusBadge status={severityConfig.label} variant={severityConfig.variant} dot />
                </div>
                <strong style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)', lineHeight: 1.4 }}>
                  {alert.titleAr}
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  <MapPin size={13} style={{ color: 'var(--admin-primary)' }} />
                  <span>{alert.targetGovernorate}</span>
                  <span style={{ marginInlineStart: '0.5rem' }}>
                    <Users size={12} style={{ verticalAlign: 'middle' }} /> {alert.recipients?.length || 0} {tx("مصرح")}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  {isDispatched ? (
                    <AdminStatusBadge status={tx("تم التوزيع داخلياً")} variant="info" dot />
                  ) : isApproved ? (
                    <AdminStatusBadge status={tx("معتمد (لقطة مجمدة)")} variant="success" dot />
                  ) : (
                    <AdminStatusBadge status={tx("مسودة قيد المراجعة")} variant="warning" dot />
                  )}
                  <Link href={`/admin/alerts/${alert.id}`} style={{ textDecoration: 'none' }}>
                    <AdminButton variant="secondary" size="sm" icon={<Eye size={13} />}>
                      {tx("مراجعة")}
                    </AdminButton>
                  </Link>
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
