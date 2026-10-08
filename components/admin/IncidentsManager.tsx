'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Eye,
  MapPin,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  FileCheck2,
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
} from '@/components/admin/ui';

interface IncidentItem {
  id: string;
  incidentNumber: string;
  category: string;
  priority: string;
  status: string;
  governorate: string;
  district?: string | null;
  incidentDate: string;
  createdAt: string;
  createdBy?: { fullName: string; role: string; organization?: string | null };
  hasOriginal?: boolean;
  firstResponseAt?: string | null;
  dueAt?: string | null;
  closedAt?: string | null;
  slaTargetMinutes?: number | null;
  slaStatus?: string | null;
  isEscalated?: boolean;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  slaDetails?: {
    elapsedMinutes: number;
    remainingMinutes: number;
    isBreached: boolean;
    isApproachingBreach: boolean;
    isClosed: boolean;
  };
  currentRedacted?: {
    id: string;
    redactedTitleAr: string;
    safeAreaScopeAr?: string;
    isApproved: boolean;
  } | null;
  activeAssignments?: Array<{
    id: string;
    roleScope: string;
    assignedTo: { fullName: string };
  }>;
  myAssignment?: {
    id: string;
    roleScope: string;
    instructions?: string | null;
    assignedAt: string;
  };
  counts?: {
    verifications: number;
    attachments: number;
    alerts?: number;
  };
}

interface IncidentsManagerProps {
  initialIncidents?: IncidentItem[];
  currentUserRole: string;
  currentUserId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  // Operational Security & Safety (Package B)
  get THEFT() { return tx("سرقة وتعدي على ممتلكات"); },
  get INTRUSION() { return tx("اقتحام وتسلل غير مصرح به"); },
  get FIRE() { return tx("حريق واشتعال"); },
  get INJURY() { return tx("إصابة عمل وحالة طارئة"); },
  get SAFETY_INCIDENT() { return tx("حادث سلامة مهنية ووقائية"); },
  get VEHICLE_INCIDENT() { return tx("حادث مركبة وتلفيات نقل"); },
  get SECURITY_THREAT() { return tx("تهديد أمني واشتباه مباشر"); },
  // Historical Categories
  get ARMED_CONFLICT_TACTICAL() { return tx("نزاع مسلح وتكتيكي"); },
  get HUMANITARIAN_ACCESS_DENIAL() { return tx("إعاقة وصول إنساني"); },
  get PHYSICAL_ATTACK_THREAT() { return tx("اعتداء وتهديد مباشر"); },
  get UXO_LANDMINE_HAZARD() { return tx("مخاطر ألغام ومخلفات حرب"); },
  get CIVIL_UNREST_ROADBLOCK() { return tx("اضطرابات وقطع طرق"); },
  get DETENTION_HARASSMENT() { return tx("احتجاز ومضايقات"); },
  get NATURAL_DISASTER_ENVIRONMENTAL() { return tx("كوارث ومخاطر بيئية"); },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral' }> = {
  CRITICAL_EMERGENCY: { get label() { return tx("طارئة وقصوى"); }, variant: 'danger' },
  HIGH: { get label() { return tx("عالية"); }, variant: 'warning' },
  MEDIUM: { get label() { return tx("متوسطة"); }, variant: 'info' },
  LOW: { get label() { return tx("منخفضة"); }, variant: 'success' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral' }> = {
  RECEIVED: { get label() { return tx("مستلم جديد"); }, variant: 'info' },
  TRIAGED: { get label() { return tx("تم الفرز الأمني"); }, variant: 'warning' },
  REDACTED: { get label() { return tx("تم التنقيح والاعتماد"); }, variant: 'warning' },
  ASSIGNED: { get label() { return tx("مُسند للمتابعة"); }, variant: 'info' },
  UNDER_VERIFICATION: { get label() { return tx("قيد التحقق الميداني"); }, variant: 'warning' },
  VERIFIED: { get label() { return tx("متحقق منه ومؤكد"); }, variant: 'success' },
  RESOLVED: { get label() { return tx("تمت المعالجة"); }, variant: 'success' },
  UNCONFIRMED: { get label() { return tx("غير مؤكد"); }, variant: 'neutral' },
  CONTRADICTED: { get label() { return tx("متناقض"); }, variant: 'danger' },
  DISPROVED: { get label() { return tx("مفند ومستبعد"); }, variant: 'danger' },
  DUPLICATE: { get label() { return tx("بلاغ مكرر"); }, variant: 'neutral' },
  ALERT_DRAFTED: { get label() { return tx("صيغت مسودة تنبيه"); }, variant: 'warning' },
  ALERT_APPROVED: { get label() { return tx("اعتمد التنبيه"); }, variant: 'success' },
  ALERT_DISPATCHED: { get label() { return tx("تم نشر التنبيه"); }, variant: 'success' },
  CLOSED: { get label() { return tx("مغلق"); }, variant: 'neutral' },
  ARCHIVED: { get label() { return tx("مؤرشف"); }, variant: 'neutral' },
};

const SLA_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral' }> = {
  ON_TIME: { get label() { return tx("ضمن المهلة"); }, variant: 'success' },
  APPROACHING_BREACH: { get label() { return tx("أوشك على التجاوز"); }, variant: 'warning' },
  BREACHED: { get label() { return tx("تجاوز المهلة (SLA)"); }, variant: 'danger' },
  CLOSED_ON_TIME: { get label() { return tx("أُغلق ضمن المهلة"); }, variant: 'success' },
  CLOSED_BREACHED: { get label() { return tx("أُغلق بعد التجاوز"); }, variant: 'danger' },
};

export default function IncidentsManager({
  initialIncidents = [],
  currentUserRole,
  currentUserId,
}: IncidentsManagerProps) {
  const { tx, txLocale } = useAdminT();
  const searchParams = useSearchParams();
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'OPEN' | 'CRITICAL' | 'UNASSIGNED' | 'APPROACHING_BREACH' | 'BREACHED' | 'ESCALATED' | 'CLOSED'>('ALL');
  const [incidents, setIncidents] = useState<IncidentItem[]>(initialIncidents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const filterParam = searchParams?.get('filter')?.toUpperCase();
    if (filterParam && ['ALL', 'OPEN', 'CRITICAL', 'UNASSIGNED', 'APPROACHING_BREACH', 'BREACHED', 'ESCALATED', 'CLOSED'].includes(filterParam)) {
      setQuickFilter(filterParam as any);
    }
  }, [searchParams]);

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/incidents');
      const data = await res.json();
      if (data.success && data.incidents) {
        setIncidents(data.incidents);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialIncidents.length === 0) {
      fetchIncidents();
    }
  }, []);

  const stats = useMemo(() => {
    const total = incidents.length;
    const critical = incidents.filter((i) => i.priority === 'CRITICAL_EMERGENCY').length;
    const underVerification = incidents.filter((i) => i.status === 'UNDER_VERIFICATION' || i.status === 'ASSIGNED').length;
    const verified = incidents.filter((i) => i.status === 'VERIFIED').length;
    const slaBreached = incidents.filter((i) => i.slaStatus === 'BREACHED' || i.slaStatus === 'CLOSED_BREACHED' || i.isEscalated).length;
    return { total, critical, underVerification, verified, slaBreached };
  }, [incidents]);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      const title = inc.currentRedacted?.redactedTitleAr || '';
      const number = inc.incidentNumber || '';
      const gov = inc.governorate || '';
      const query = search.toLowerCase();

      const matchesSearch =
        title.toLowerCase().includes(query) ||
        number.toLowerCase().includes(query) ||
        gov.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || inc.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'ALL' || inc.category === categoryFilter;

      let matchesQuick = true;
      if (quickFilter === 'OPEN') {
        matchesQuick = inc.status !== 'CLOSED' && inc.status !== 'ARCHIVED';
      } else if (quickFilter === 'CRITICAL') {
        matchesQuick = inc.priority === 'CRITICAL_EMERGENCY';
      } else if (quickFilter === 'UNASSIGNED') {
        matchesQuick = !inc.activeAssignments || inc.activeAssignments.length === 0;
      } else if (quickFilter === 'APPROACHING_BREACH') {
        matchesQuick = inc.slaStatus === 'APPROACHING_BREACH';
      } else if (quickFilter === 'BREACHED') {
        matchesQuick = inc.slaStatus === 'BREACHED' || inc.slaStatus === 'CLOSED_BREACHED';
      } else if (quickFilter === 'ESCALATED') {
        matchesQuick = Boolean(inc.isEscalated);
      } else if (quickFilter === 'CLOSED') {
        matchesQuick = inc.status === 'CLOSED' || inc.status === 'ARCHIVED';
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesQuick;
    });
  }, [incidents, search, statusFilter, priorityFilter, categoryFilter, quickFilter]);

  const columns = [
    {
      key: 'incidentNumber',
      header: tx("رقم البلاغ والتاريخ"),
      render: (row: IncidentItem) => (
        <div>
          <span
            dir="ltr"
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--admin-primary)',
              display: 'block',
            }}
          >
            {row.incidentNumber}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            {new Date(row.incidentDate).toLocaleString(txLocale("ar-YE"), {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      header: tx("التصنيف والأولوية"),
      render: (row: IncidentItem) => {
        const priorityMeta = PRIORITY_CONFIG[row.priority] || { label: row.priority, variant: 'neutral' as const };
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--admin-text-primary)', marginBottom: '3px' }}>
              {CATEGORY_LABELS[row.category] || row.category}
            </div>
            <AdminStatusBadge status={priorityMeta.label} variant={priorityMeta.variant} dot />
          </div>
        );
      },
    },
    {
      key: 'location',
      header: tx("الموقع الجغرافي"),
      render: (row: IncidentItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--admin-text-primary)' }}>
          <MapPin size={14} style={{ color: 'var(--admin-primary)' }} />
          <span>{row.governorate}</span>
          {row.district && <span style={{ color: 'var(--admin-text-muted)' }}>- {row.district}</span>}
        </div>
      ),
    },
    {
      key: 'sla',
      header: tx("مؤشر SLA والاستجابة"),
      render: (row: IncidentItem) => {
        const slaKey = row.slaStatus || 'ON_TIME';
        const slaMeta = SLA_CONFIG[slaKey] || { label: slaKey, variant: 'neutral' as const };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AdminStatusBadge status={slaMeta.label} variant={slaMeta.variant} dot />
              {row.isEscalated && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'var(--admin-danger-subtle)',
                    color: 'var(--admin-danger)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  🚨 {tx("مُصعّد")}
                </span>
              )}
            </div>
            {row.dueAt && (
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                {tx("المهلة:")} {new Date(row.dueAt).toLocaleTimeString(txLocale("ar-YE"), { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {row.firstResponseAt && (
              <span style={{ fontSize: '0.7rem', color: 'var(--admin-success)' }}>
                ✓ {tx("استجيب")} ({new Date(row.firstResponseAt).toLocaleTimeString(txLocale("ar-YE"), { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: tx("الحالة والإسناد"),
      render: (row: IncidentItem) => {
        const statusMeta = STATUS_CONFIG[row.status] || { label: row.status, variant: 'neutral' as const };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
            <AdminStatusBadge status={statusMeta.label} variant={statusMeta.variant} dot />

            {isSuperAdmin && row.activeAssignments && row.activeAssignments.length > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-info)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <UserCheck size={11} />
                <span>{tx("مكلف:")} {row.activeAssignments.map((a) => a.assignedTo.fullName).join(', ')}</span>
              </span>
            )}

            {!isSuperAdmin && row.myAssignment && (
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-info)' }}>
                {tx("مهمتك:")} {row.myAssignment.roleScope === 'VERIFIER' ? tx("التحقق الميداني") : tx("التحليل والتقييم")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: tx("الإجراء"),
      render: (row: IncidentItem) => (
        <Link href={`/admin/incidents/${row.id}`} style={{ textDecoration: 'none' }}>
          <AdminButton variant="secondary" size="sm" icon={<Eye size={13} />}>
            {tx("فتح الملف")}
          </AdminButton>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Admin Page Header */}
      <AdminPageHeader
        title={tx("منظومة البلاغات الميدانية والتحقق الأمني")}
        description={
          isSuperAdmin
            ? tx("استعراض وفرز البلاغات الميدانية الحساسة، إدارة التنقيح، إسناد مهام التحقق، واعتماد التحديثات (إدارة عليا)")
            : tx("قائمة البلاغات المسندة إليك رسمياً — استعراض النسخ المنقحة المعتمدة وتوثيق التحقق الميداني بمعيار أدميرالتي")
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AdminButton
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} className={isLoading ? 'spin' : ''} />}
              disabled={isLoading}
              onClick={fetchIncidents}
            >
              {tx("تحديث")}
            </AdminButton>
            <Link href="/portal/field/intake" style={{ textDecoration: 'none' }}>
              <AdminButton variant="primary" size="sm" icon={<Plus size={14} />}>
                {tx("تقديم بلاغ ميداني جديد")}
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Summary Indicators */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <AdminStatCard
          title={tx("إجمالي البلاغات")}
          value={stats.total}
          icon={ShieldAlert}
          description={tx("كافة السجلات المسجلة")}
        />
        <AdminStatCard
          title={tx("بلاغات طارئة وقصوى")}
          value={stats.critical}
          icon={AlertTriangle}
          variant="danger"
          description={tx("أولوية قصوى حرجة")}
        />
        <AdminStatCard
          title={tx("قيد التحقق والإسناد")}
          value={stats.underVerification}
          icon={Clock}
          variant="warning"
          description={tx("فرق المتابعة الميدانية")}
        />
        <AdminStatCard
          title={tx("تجاوز SLA / تصعيد")}
          value={stats.slaBreached}
          icon={AlertTriangle}
          variant={stats.slaBreached > 0 ? "danger" : "neutral"}
          description={tx("تجاوزت المهلة أو مصعدة")}
        />
        <AdminStatCard
          title={tx("بلاغات مؤكدة ومحققة")}
          value={stats.verified}
          icon={CheckCircle2}
          variant="success"
          description={tx("معيار أدميرالتي معتمد")}
        />
      </div>

      {/* Quick Filters Pill Bar */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <AdminButton
          variant={quickFilter === 'ALL' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setQuickFilter('ALL')}
        >
          {tx("الكل")} ({incidents.length})
        </AdminButton>
        <AdminButton
          variant={quickFilter === 'OPEN' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setQuickFilter('OPEN')}
        >
          {tx("مفتوحة وقيد المتابعة")}
        </AdminButton>
        <AdminButton
          variant={quickFilter === 'CRITICAL' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setQuickFilter('CRITICAL')}
        >
          {tx("طارئة وقصوى")} ({stats.critical})
        </AdminButton>
        <AdminButton
          variant={quickFilter === 'UNASSIGNED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setQuickFilter('UNASSIGNED')}
        >
          {tx("غير مسندة")}
        </AdminButton>
        <AdminButton
          variant={quickFilter === 'APPROACHING_BREACH' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setQuickFilter('APPROACHING_BREACH')}
        >
          {tx("أوشكت على التجاوز")}
        </AdminButton>
        <AdminButton
          variant={quickFilter === 'BREACHED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setQuickFilter('BREACHED')}
        >
          {tx("تجاوزت SLA")} ({stats.slaBreached})
        </AdminButton>
        <AdminButton
          variant={quickFilter === 'CLOSED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setQuickFilter('CLOSED')}
        >
          {tx("مغلقة")}
        </AdminButton>
      </div>

      {/* Filters */}
      <AdminFilterBar
        search={
          <AdminSearchInput
            placeholder={tx("بحث برقم البلاغ، العنوان المنقح، أو المحافظة...")}
            value={search}
            onChange={(val) => setSearch(val)}
          />
        }
        filters={
          <>
            <AdminSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: tx("جميع الحالات") },
                ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                })),
              ]}
            />

            <AdminSelect
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: tx("جميع الأولويات") },
                ...Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                })),
              ]}
            />

            <AdminSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: tx("جميع التصنيفات") },
                ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                })),
              ]}
            />
          </>
        }
        actions={
          (search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') ? (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setCategoryFilter('ALL');
              }}
            >
              {tx("إعادة تعيين الفلاتر")}
            </AdminButton>
          ) : undefined
        }
      />

      {/* Incidents Table / Loading / Empty */}
      {isLoading ? (
        <AdminSection>
          <AdminLoadingState message={tx("جاري جلب وتحديث سجلات البلاغات الميدانية...")} />
        </AdminSection>
      ) : filtered.length === 0 ? (
        <AdminSection>
          <AdminEmptyState
            title={isSuperAdmin ? tx("لم يتم العثور على بلاغات ميدانية مطابقة للبحث") : tx("لا توجد بلاغات ميدانية مسندة إليك حالياً")}
            description={
              isSuperAdmin
                ? tx("يمكنك استقبال البلاغات عبر البوابة الميدانية أو تعديل معايير التصفية والبحث أعلاه.")
                : tx("يتم إظهار البلاغات حصراً فور قيام الإدارة العليا بتنقيحها واعتمادها وإسنادها إلى حسابك وفق قاعدة الاستحقاق.")
            }
            action={
              (search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') ? (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                    setCategoryFilter('ALL');
                  }}
                >
                  {tx("إلغاء معايير التصفية")}
                </AdminButton>
              ) : (
                <Link href="/portal/field/intake" style={{ textDecoration: 'none' }}>
                  <AdminButton variant="primary" size="sm" icon={<Plus size={14} />}>
                    {tx("تقديم بلاغ ميداني جديد")}
                  </AdminButton>
                </Link>
              )
            }
          />
        </AdminSection>
      ) : (
        <AdminDataTable
          columns={columns}
          data={filtered}
          keyExtractor={(inc) => inc.id}
          mobileCardRender={(inc) => {
            const priorityMeta = PRIORITY_CONFIG[inc.priority] || { label: inc.priority, variant: 'neutral' as const };
            const statusMeta = STATUS_CONFIG[inc.status] || { label: inc.status, variant: 'neutral' as const };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-primary)' }}>
                    {inc.incidentNumber}
                  </span>
                  <AdminStatusBadge status={statusMeta.label} variant={statusMeta.variant} dot />
                </div>
                {inc.currentRedacted && (
                  <strong style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)' }}>
                    {inc.currentRedacted.redactedTitleAr}
                  </strong>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <AdminStatusBadge status={priorityMeta.label} variant={priorityMeta.variant} dot />
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
                    {CATEGORY_LABELS[inc.category] || inc.category}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  <MapPin size={13} style={{ color: 'var(--admin-primary)' }} />
                  <span>{inc.governorate}</span>
                  {inc.district && <span>- {inc.district}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                    {new Date(inc.incidentDate).toLocaleString(txLocale("ar-YE"), { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <Link href={`/admin/incidents/${inc.id}`} style={{ textDecoration: 'none' }}>
                    <AdminButton variant="secondary" size="sm" icon={<Eye size={13} />}>
                      {tx("فتح الملف")}
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
