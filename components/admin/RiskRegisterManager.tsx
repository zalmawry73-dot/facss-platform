'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Plus,
  Link2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  MapPin,
  X,
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
  AdminInput,
  AdminTextarea,
  AdminDataTable,
  AdminStatusBadge,
  AdminButton,
  AdminIconButton,
  AdminModal,
  AdminAlert,
  AdminEmptyState,
  AdminLoadingState,
} from '@/components/admin/ui';

import {
  calculateRiskScore,
  getRiskLevelMeta,
  getRiskStatusMeta,
  getRiskCategoryMeta,
  RiskLevelType,
  RiskStatusType,
  RiskCategoryType,
} from '@/lib/risk-engine';

interface RiskRegisterManagerProps {
  currentUser: {
    id: string;
    fullName: string;
    role: string;
    canManage: boolean;
    canAssess: boolean;
  };
}

const CATEGORY_OPTIONS: Array<{ value: RiskCategoryType; label: string }> = [
  { value: 'ARMED_CONFLICT_SECURITY', get label() { return tx("نزاع مسلح وتوترات أمنية"); } },
  { value: 'ACCESS_ROADBLOCK_DENIAL', get label() { return tx("قطع طرق وإعاقة وصول"); } },
  { value: 'EXPLOSIVE_HAZARD_UXO', get label() { return tx("مخاطر ألغام ومخلفات حرب"); } },
  { value: 'CRIMINALITY_THEFT', get label() { return tx("جرائم جنائية وسرقات"); } },
  { value: 'STAFF_DETENTION_THREAT', get label() { return tx("احتجاز وتهديد موظفين"); } },
  { value: 'FACILITY_DAMAGE', get label() { return tx("أضرار منشآت ومرافق"); } },
  { value: 'ENVIRONMENTAL_NATURAL', get label() { return tx("كوارث طبيعية ومخاطر بيئية"); } },
  { value: 'HEALTH_SAFETY', get label() { return tx("صحة وسلامة عامة"); } },
];

const LEVEL_OPTIONS = [
  { value: 'CRITICAL', get label() { return tx("خطر حرج (Critical)"); } },
  { value: 'HIGH', get label() { return tx("خطر عالي (High)"); } },
  { value: 'MEDIUM', get label() { return tx("خطر متوسط (Medium)"); } },
  { value: 'LOW', get label() { return tx("خطر منخفض (Low)"); } },
];

const STATUS_OPTIONS = [
  { value: 'IDENTIFIED', get label() { return tx("تم الرصد (Identified)"); } },
  { value: 'ASSESSED', get label() { return tx("تم التقييم (Assessed)"); } },
  { value: 'TREATMENT_IN_PROGRESS', get label() { return tx("قيد المعالجة (In Treatment)"); } },
  { value: 'MONITORED', get label() { return tx("تحت المراقبة (Monitored)"); } },
  { value: 'RESOLVED', get label() { return tx("تمت المعالجة (Resolved)"); } },
  { value: 'CLOSED', get label() { return tx("مغلق (Closed)"); } },
];

const YEMEN_GOVERNORATES = [
  'عدن', 'لحج', 'أبين', 'الضالع', 'شبوة', 'حضرموت', 'المهرة', 'سقطرى',
  'تعز', 'الحديدة', 'مأرب', 'الجوف', 'صنعاء', 'عمران', 'ذمار', 'إب',
  'البيضاء', 'حجة', 'صعدة', 'المحويت', 'ريمة', 'أمانة العاصمة'
];

export default function RiskRegisterManager({ currentUser }: RiskRegisterManagerProps) {
  const { tx, txLocale } = useAdminT();
  const router = useRouter();
  const [risks, setRisks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    active: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    inTreatment: 0,
    monitored: 0,
    resolved: 0,
    closed: 0,
  });
  const [matrixCounts, setMatrixCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState('');
  const [matrixCellFilter, setMatrixCellFilter] = useState<{ l: number; i: number } | null>(null);

  useEffect(() => {
    const levelParam = searchParams?.get('level')?.toUpperCase();
    if (levelParam && ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(levelParam)) {
      setLevelFilter(levelParam);
    }
    const statusParam = searchParams?.get('status')?.toUpperCase();
    if (statusParam && ['IDENTIFIED', 'ASSESSED', 'TREATMENT_IN_PROGRESS', 'MONITORED', 'RESOLVED', 'CLOSED'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
    const categoryParam = searchParams?.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  // Modals
  const [isStandaloneModalOpen, setIsStandaloneModalOpen] = useState(false);
  const [isFromIncidentModalOpen, setIsFromIncidentModalOpen] = useState(false);

  // Standalone Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ARMED_CONFLICT_SECURITY' as RiskCategoryType,
    governorate: '',
    district: '',
    generalLocation: '',
    likelihood: 3,
    impact: 3,
    targetResolutionDate: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // From Incident State
  const [verifiedIncidents, setVerifiedIncidents] = useState<any[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [incidentPreviewData, setIncidentPreviewData] = useState<any>(null);

  const fetchRisks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/risks');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("تعذر جلب سجل المخاطر"));
      }
      setRisks(data.risks || []);
      setStats(data.stats || {});
      setMatrixCounts(data.matrixCounts || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  // Filtered Risks
  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (search) {
        const query = search.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(query);
        const matchNum = r.riskNumber.toLowerCase().includes(query);
        const matchGov = r.governorate?.toLowerCase().includes(query) || false;
        const matchDist = r.district?.toLowerCase().includes(query) || false;
        if (!matchTitle && !matchNum && !matchGov && !matchDist) return false;
      }
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (levelFilter && r.riskLevel !== levelFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (governorateFilter && r.governorate !== governorateFilter) return false;
      if (matrixCellFilter) {
        if (r.likelihood !== matrixCellFilter.l || r.impact !== matrixCellFilter.i) {
          return false;
        }
      }
      return true;
    });
  }, [risks, search, categoryFilter, levelFilter, statusFilter, governorateFilter, matrixCellFilter]);

  // Open modal to derive from incident
  const openFromIncidentModal = async () => {
    setFormError(null);
    setSelectedIncidentId('');
    setIncidentPreviewData(null);
    setIsFromIncidentModalOpen(true);
    setLoadingIncidents(true);

    try {
      const res = await fetch('/api/admin/risks/verified-incidents');
      const data = await res.json();
      if (res.ok) {
        setVerifiedIncidents(data.incidents || []);
      }
    } catch (err) {
      console.error('Error fetching verified incidents:', err);
    } finally {
      setLoadingIncidents(false);
    }
  };

  // When an incident is selected in derivation modal
  const handleSelectIncident = async (incId: string) => {
    setSelectedIncidentId(incId);
    if (!incId) {
      setIncidentPreviewData(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/incidents/${incId}/risk-preview`);
      const data = await res.json();
      if (res.ok && data.preview) {
        setIncidentPreviewData(data.preview);
        setFormData({
          title: data.preview.suggestedTitle,
          description: data.preview.suggestedDescription,
          category: data.preview.suggestedCategory,
          governorate: data.preview.governorate,
          district: data.preview.district || '',
          generalLocation: data.preview.generalLocation || '',
          likelihood: data.preview.suggestedLikelihood || 3,
          impact: data.preview.suggestedImpact || 3,
          targetResolutionDate: '',
        });
      }
    } catch (err) {
      console.error('Error loading incident risk preview:', err);
    }
  };

  // Submit Risk Form (Standalone or From Incident)
  const handleSubmitRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        governorate: formData.governorate,
        district: formData.district || null,
        generalLocation: formData.generalLocation || null,
        likelihood: Number(formData.likelihood),
        impact: Number(formData.impact),
        targetResolutionDate: formData.targetResolutionDate || null,
      };

      if (isFromIncidentModalOpen && selectedIncidentId) {
        payload.incidentId = selectedIncidentId;
      }

      const res = await fetch('/api/admin/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("فشل في حفظ قيد الخطر"));
      }

      setIsStandaloneModalOpen(false);
      setIsFromIncidentModalOpen(false);
      fetchRisks();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMatrixCellClick = (l: number, i: number) => {
    if (matrixCellFilter?.l === l && matrixCellFilter?.i === i) {
      setMatrixCellFilter(null);
    } else {
      setMatrixCellFilter({ l, i });
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setLevelFilter('');
    setStatusFilter('');
    setGovernorateFilter('');
    setMatrixCellFilter(null);
  };

  const hasActiveFilters =
    Boolean(search || categoryFilter || levelFilter || statusFilter || governorateFilter || matrixCellFilter);

  const previewScore = calculateRiskScore(Number(formData.likelihood), Number(formData.impact));
  const previewLevelMeta = getRiskLevelMeta(previewScore.level);

  const columns = [
    {
      key: 'riskNumber',
      header: tx("رقم الخطر وتاريخ المستهدف"),
      render: (r: any) => (
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
            {r.riskNumber}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            {r.targetResolutionDate
              ? tx("المستهدف: {0}", new Date(r.targetResolutionDate).toLocaleDateString(txLocale("ar-YE")))
              : tx("لم يحدد موعد حل")}
          </span>
        </div>
      ),
    },
    {
      key: 'title',
      header: tx("عنوان الخطر والنطاق"),
      render: (r: any) => (
        <div style={{ maxWidth: '360px' }}>
          <strong style={{ display: 'block', color: 'var(--admin-text-primary)', fontSize: '0.88rem', marginBottom: '2px' }}>
            {r.title}
          </strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
            <MapPin size={12} style={{ color: 'var(--admin-primary)' }} />
            <span>{r.governorate} {r.district ? `(${r.district})` : ''}</span>
            {r.generalLocation && <span>— {r.generalLocation}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: tx("التصنيف التشغيلي"),
      render: (r: any) => {
        const catMeta = getRiskCategoryMeta(r.category);
        return (
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
            {catMeta.labelAr}
          </span>
        );
      },
    },
    {
      key: 'score',
      header: tx("الاحتمالية × الأثر"),
      render: (r: any) => (
        <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-primary)' }}>
          <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
            {r.likelihood} × {r.impact} = {r.riskScore}
          </span>
        </div>
      ),
    },
    {
      key: 'level',
      header: tx("مستوى الخطورة"),
      render: (r: any) => {
        const levelMeta = getRiskLevelMeta(r.riskLevel);
        const variantMap: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
          CRITICAL: 'danger',
          HIGH: 'warning',
          MEDIUM: 'info',
          LOW: 'success',
        };
        return <AdminStatusBadge status={levelMeta.labelAr} variant={variantMap[r.riskLevel] || 'neutral'} dot />;
      },
    },
    {
      key: 'status',
      header: tx("الحالة"),
      render: (r: any) => {
        const statusMeta = getRiskStatusMeta(r.status);
        const variantMap: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
          IDENTIFIED: 'info',
          ASSESSED: 'warning',
          TREATMENT_IN_PROGRESS: 'warning',
          MONITORED: 'info',
          RESOLVED: 'success',
          CLOSED: 'neutral',
        };
        return <AdminStatusBadge status={statusMeta.labelAr} variant={variantMap[r.status] || 'neutral'} dot />;
      },
    },
    {
      key: 'incident',
      header: tx("البلاغ الميداني المصدر"),
      render: (r: any) => {
        if (!r.incident) {
          return <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem' }}>{tx("مستقل")}</span>;
        }
        return (
          <Link
            href={`/admin/incidents/${r.incident.id}`}
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: 'var(--admin-primary)',
              background: 'var(--admin-primary-subtle)',
              padding: '2px 7px',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            <span dir="ltr">{r.incident.incidentNumber}</span>
            <ExternalLink size={11} />
          </Link>
        );
      },
    },
    {
      key: 'actions',
      header: tx("الإجراء"),
      render: (r: any) => (
        <Link href={`/admin/risks/${r.id}`} style={{ textDecoration: 'none' }}>
          <AdminButton variant="secondary" size="sm" icon={<Eye size={13} />}>
            {tx("تفاصيل")}
          </AdminButton>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <AdminPageHeader
        title={tx("سجل المخاطر التشغيلية الميدانية")}
        description={tx("منظومة الرصد والتقييم المنهجي للمخاطر الميدانية، متابعة إجراءات التخفيف، والمصفوفة التفاعلية 5×5")}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <AdminButton
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'spin' : ''} />}
              disabled={loading}
              onClick={fetchRisks}
            >
              {tx("تحديث")}
            </AdminButton>

            {currentUser.canManage && (
              <>
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => {
                    setFormError(null);
                    setFormData({
                      title: '',
                      description: '',
                      category: 'ARMED_CONFLICT_SECURITY',
                      governorate: '',
                      district: '',
                      generalLocation: '',
                      likelihood: 3,
                      impact: 3,
                      targetResolutionDate: '',
                    });
                    setIsStandaloneModalOpen(true);
                  }}
                >
                  {tx("تسجيل خطر مستقل")}
                </AdminButton>

                <AdminButton
                  variant="secondary"
                  size="sm"
                  icon={<Link2 size={14} />}
                  onClick={openFromIncidentModal}
                >
                  {tx("اشتقاق من بلاغ محقق")}
                </AdminButton>
              </>
            )}
          </div>
        }
      />

      {error && (
        <AdminAlert
          variant="danger"
          title={tx("خطأ في استرجاع سجل المخاطر")}
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Key Risk Indicators - Above The Fold */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <AdminStatCard
          title={tx("إجمالي المخاطر المسجلة")}
          value={stats.total || 0}
          icon={Layers}
          description={tx("{0} قيد المتابعة النشطة", stats.active || 0)}
        />
        <AdminStatCard
          title={tx("مخاطر حرجة (Critical)")}
          value={stats.critical || 0}
          icon={AlertTriangle}
          variant="danger"
          description={tx("+ {0} مخاطر عالية", stats.high || 0)}
        />
        <AdminStatCard
          title={tx("قيد المعالجة والتخفيف")}
          value={stats.inTreatment || 0}
          icon={Clock}
          variant="warning"
          description={tx("{0} تحت المراقبة", stats.monitored || 0)}
        />
        <AdminStatCard
          title={tx("المعالجة والمغلقة")}
          value={(stats.resolved || 0) + (stats.closed || 0)}
          icon={CheckCircle2}
          variant="success"
          description={tx("{0} معالجة • {1} مغلقة", stats.resolved || 0, stats.closed || 0)}
        />
      </div>

      {/* Compact Interactive 5x5 Matrix */}
      <AdminSection
        title={tx("مصفوفة المخاطر الميدانية 5×5 (Interactive 5×5 Risk Matrix)")}
        description={tx("انقر على أي خلية لتصفية قائمة المخاطر الميدانية النشطة حسب إحداثيات الاحتمالية والأثر")}
        actions={
          matrixCellFilter ? (
            <AdminButton
              variant="ghost"
              size="sm"
              icon={<X size={13} />}
              onClick={() => setMatrixCellFilter(null)}
            >
              {tx("إلغاء تصفية الخلية [")}{matrixCellFilter.l} × {matrixCellFilter.i}]
            </AdminButton>
          ) : undefined
        }
      >
        <div style={{ overflowX: 'auto', maxWidth: '100%', minWidth: 0 }}>
          <div style={{ minWidth: '540px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={`row-${l}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div
                  style={{
                    width: '120px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--admin-text-secondary)',
                    textAlign: 'left',
                    paddingLeft: '0.5rem',
                  }}
                >
                  {l === 5 && tx("5 - شبه مؤكد")}
                  {l === 4 && tx("4 - محتمل")}
                  {l === 3 && tx("3 - متوسط")}
                  {l === 2 && tx("2 - غير محتمل")}
                  {l === 1 && tx("1 - نادر")}
                </div>

                {[1, 2, 3, 4, 5].map((i) => {
                  const score = l * i;
                  const count = matrixCounts[`${l},${i}`] || 0;
                  const isSelected = matrixCellFilter?.l === l && matrixCellFilter?.i === i;

                  let bgColor = '#dcfce7';
                  let textColor = '#15803d';
                  let borderColor = '#86efac';

                  if (score >= 17) {
                    bgColor = '#fee2e2';
                    textColor = '#b91c1c';
                    borderColor = '#fca5a5';
                  } else if (score >= 10) {
                    bgColor = '#ffedd5';
                    textColor = '#c2410c';
                    borderColor = '#fdba74';
                  } else if (score >= 5) {
                    bgColor = '#fef3c7';
                    textColor = '#b45309';
                    borderColor = '#fde68a';
                  }

                  return (
                    <button
                      key={`cell-${l}-${i}`}
                      type="button"
                      onClick={() => handleMatrixCellClick(l, i)}
                      style={{
                        flex: 1,
                        height: '44px',
                        background: bgColor,
                        border: isSelected ? '2px solid var(--admin-primary)' : `1px solid ${borderColor}`,
                        boxShadow: isSelected ? '0 0 0 3px rgba(15, 43, 72, 0.25)' : 'none',
                        borderRadius: 'var(--admin-radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={tx("احتمالية {0} × أثر {1} = درجة {2}", l, i, score)}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textColor }}>{score}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: textColor, opacity: 0.85 }}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Impact Horizontal Axis Labels */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <div style={{ width: '120px' }} />
              {[tx("1 - طفيف"), tx("2 - محدود"), tx("3 - متوسط"), tx("4 - جسيم"), tx("5 - كارثي")].map((lbl, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--admin-text-secondary)',
                  }}
                >
                  {lbl}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminSection>

      {/* Filter Bar */}
      <AdminFilterBar
        search={
          <AdminSearchInput
            placeholder={tx("بحث برقم الخطر، العنوان، المحافظة...")}
            value={search}
            onChange={(val) => setSearch(val)}
          />
        }
        filters={
          <>
            <AdminSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: tx("جميع التصنيفات") },
                ...CATEGORY_OPTIONS,
              ]}
            />

            <AdminSelect
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              options={[
                { value: '', label: tx("جميع المستويات") },
                ...LEVEL_OPTIONS,
              ]}
            />

            <AdminSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: tx("جميع الحالات") },
                ...STATUS_OPTIONS,
              ]}
            />

            <AdminSelect
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              options={[
                { value: '', label: tx("جميع المحافظات") },
                ...YEMEN_GOVERNORATES.map((g) => ({ value: g, label: g })),
              ]}
            />
          </>
        }
        actions={
          hasActiveFilters ? (
            <AdminButton variant="ghost" size="sm" onClick={clearAllFilters}>
              {tx("إعادة تعيين الفلاتر")}
            </AdminButton>
          ) : undefined
        }
      />

      {/* Table / Empty / Loading */}
      {loading ? (
        <AdminSection>
          <AdminLoadingState message={tx("جاري استرجاع سجل المخاطر التشغيلية...")} />
        </AdminSection>
      ) : filteredRisks.length === 0 ? (
        <AdminSection>
          <AdminEmptyState
            title={tx("لا توجد مخاطر مطابقة")}
            description={
              hasActiveFilters
                ? tx("لم يتم العثور على أي مخاطر مسجلة تطابق خيارات التصفية والبحث.")
                : tx("لم يتم تسجيل أي مخاطر تشغيلية ميدانية حتى الآن.")
            }
            action={
              hasActiveFilters ? (
                <AdminButton variant="secondary" size="sm" onClick={clearAllFilters}>
                  {tx("إلغاء خيارات التصفية")}
                </AdminButton>
              ) : currentUser.canManage ? (
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setIsStandaloneModalOpen(true)}
                >
                  {tx("تسجيل خطر مستقل")}
                </AdminButton>
              ) : undefined
            }
          />
        </AdminSection>
      ) : (
        <AdminDataTable
          columns={columns}
          data={filteredRisks}
          keyExtractor={(r) => r.id}
          mobileCardRender={(r: any) => {
            const levelMeta = getRiskLevelMeta(r.riskLevel);
            const statusMeta = getRiskStatusMeta(r.status);
            const variantMap: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
              CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'success',
            };
            const statusVariantMap: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
              IDENTIFIED: 'info', ASSESSED: 'warning', TREATMENT_IN_PROGRESS: 'warning', MONITORED: 'info', RESOLVED: 'success', CLOSED: 'neutral',
            };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-primary)' }}>
                    {r.riskNumber}
                  </span>
                  <AdminStatusBadge status={levelMeta.labelAr} variant={variantMap[r.riskLevel] || 'neutral'} dot />
                </div>
                <strong style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)', lineHeight: 1.4 }}>
                  {r.title}
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                    {r.likelihood} × {r.impact} = {r.riskScore}
                  </span>
                  <AdminStatusBadge status={statusMeta.labelAr} variant={statusVariantMap[r.status] || 'neutral'} dot />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  <MapPin size={13} style={{ color: 'var(--admin-primary)' }} />
                  <span>{r.governorate} {r.district ? `(${r.district})` : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <Link href={`/admin/risks/${r.id}`} style={{ textDecoration: 'none' }}>
                    <AdminButton variant="secondary" size="sm" icon={<Eye size={13} />}>
                      {tx("تفاصيل")}
                    </AdminButton>
                  </Link>
                </div>
              </div>
            );
          }}
        />
      )}

      {/* Standalone Risk Modal */}
      <AdminModal
        isOpen={isStandaloneModalOpen}
        onClose={() => setIsStandaloneModalOpen(false)}
        title={tx("تسجيل خطر تشغيلي ميداني مستقل")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsStandaloneModalOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={submitting}
              onClick={handleSubmitRisk}
            >
              {submitting ? tx("جاري الحفظ...") : tx("حفظ وتسجيل الخطر")}
            </AdminButton>
          </div>
        }
      >
        <form onSubmit={handleSubmitRisk} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {formError && <AdminAlert variant="danger" message={formError} />}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("عنوان الخطر التشغيلي *")}
            </label>
            <AdminInput
              required
              placeholder={tx("مثال: قطع طريق الإمداد الإنساني في نقيل طور الباحة...")}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("التصنيف التشغيلي *")}
            </label>
            <AdminSelect
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as RiskCategoryType })}
              options={CATEGORY_OPTIONS}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("المحافظة *")}
              </label>
              <AdminSelect
                required
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                options={[
                  { value: '', label: tx("-- اختر المحافظة --") },
                  ...YEMEN_GOVERNORATES.map((g) => ({ value: g, label: g })),
                ]}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("المديرية")}
              </label>
              <AdminInput
                placeholder={tx("المديرية...")}
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("وصف الخطر والتهديد المحتمل *")}
            </label>
            <AdminTextarea
              required
              rows={3}
              placeholder={tx("اكتب التوصيف الدقيق للخطر وتداعياته على العمليات الإنسانية أو الميدانية...")}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Likelihood and Impact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("الاحتمالية (1 إلى 5)")}
              </label>
              <AdminSelect
                value={String(formData.likelihood)}
                onChange={(e) => setFormData({ ...formData, likelihood: Number(e.target.value) })}
                options={[
                  { value: '1', label: tx("1 - نادر (Rare)") },
                  { value: '2', label: tx("2 - غير محتمل (Unlikely)") },
                  { value: '3', label: tx("3 - متوسط (Possible)") },
                  { value: '4', label: tx("4 - محتمل (Likely)") },
                  { value: '5', label: tx("5 - شبه مؤكد (Almost Certain)") },
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("شدة الأثر (1 إلى 5)")}
              </label>
              <AdminSelect
                value={String(formData.impact)}
                onChange={(e) => setFormData({ ...formData, impact: Number(e.target.value) })}
                options={[
                  { value: '1', label: tx("1 - طفيف (Insignificant)") },
                  { value: '2', label: tx("2 - محدود (Minor)") },
                  { value: '3', label: tx("3 - متوسط (Moderate)") },
                  { value: '4', label: tx("4 - جسيم (Major)") },
                  { value: '5', label: tx("5 - كارثي (Catastrophic)") },
                ]}
              />
            </div>
          </div>

          {/* Calculated Preview Badge */}
          <div
            style={{
              padding: '0.65rem 0.9rem',
              background: 'var(--admin-bg-surface-subtle)',
              border: '1px solid var(--admin-border-subtle)',
              borderRadius: 'var(--admin-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{tx("درجة الخطر التقديرية:")}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                {previewScore.score}
              </span>
              <AdminStatusBadge status={previewLevelMeta.labelAr} variant={previewLevelMeta.color as any} dot />
            </div>
          </div>
        </form>
      </AdminModal>

      {/* From Incident Modal */}
      <AdminModal
        isOpen={isFromIncidentModalOpen}
        onClose={() => setIsFromIncidentModalOpen(false)}
        title={tx("اشتقاق خطر تشغيلي من بلاغ ميداني محقق")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsFromIncidentModalOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={submitting || !selectedIncidentId}
              onClick={handleSubmitRisk}
            >
              {submitting ? tx("جاري الاشتقاق...") : tx("اشتقاق وتسجيل الخطر")}
            </AdminButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {formError && <AdminAlert variant="danger" message={formError} />}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("اختر البلاغ الميداني المحقق *")}
            </label>
            {loadingIncidents ? (
              <AdminLoadingState message={tx("جاري جلب البلاغات المحققة...")} />
            ) : verifiedIncidents.length === 0 ? (
              <div style={{ padding: '1rem', background: 'var(--admin-warning-subtle)', color: 'var(--admin-warning)', borderRadius: '6px', fontSize: '0.8rem' }}>
                {tx("لا توجد بلاغات ميدانية محققة مؤهلة للاشتقاق حالياً.")}
              </div>
            ) : (
              <AdminSelect
                value={selectedIncidentId}
                onChange={(e) => handleSelectIncident(e.target.value)}
                options={[
                  { value: '', label: tx("-- اختر بلاغاً محققاً --") },
                  ...verifiedIncidents.map((inc) => ({
                    value: inc.id,
                    label: `${inc.incidentNumber} — ${inc.governorate} [${inc.currentRedacted?.redactedTitleAr || inc.category}]`,
                  })),
                ]}
              />
            )}
          </div>

          {incidentPreviewData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("عنوان الخطر المشتق")}
                </label>
                <AdminInput
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("وصف الخطر")}
                </label>
                <AdminTextarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("الاحتمالية (1 إلى 5)")}
                  </label>
                  <AdminSelect
                    value={String(formData.likelihood)}
                    onChange={(e) => setFormData({ ...formData, likelihood: Number(e.target.value) })}
                    options={[
                      { value: '1', label: tx("1 - نادر") },
                      { value: '2', label: tx("2 - غير محتمل") },
                      { value: '3', label: tx("3 - متوسط") },
                      { value: '4', label: tx("4 - محتمل") },
                      { value: '5', label: tx("5 - شبه مؤكد") },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("شدة الأثر (1 إلى 5)")}
                  </label>
                  <AdminSelect
                    value={String(formData.impact)}
                    onChange={(e) => setFormData({ ...formData, impact: Number(e.target.value) })}
                    options={[
                      { value: '1', label: tx("1 - طفيف") },
                      { value: '2', label: tx("2 - محدود") },
                      { value: '3', label: tx("3 - متوسط") },
                      { value: '4', label: tx("4 - جسيم") },
                      { value: '5', label: tx("5 - كارثي") },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
