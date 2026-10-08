'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  RefreshCw,
  History,
  Lock,
  Unlock,
  MapPin,
  FileText,
  Link2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminTabs,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminButton,
  AdminIconButton,
  AdminDataTable,
  AdminStatusBadge,
  AdminModal,
  AdminAlert,
  AdminEmptyState,
} from '@/components/admin/ui';

import {
  calculateRiskScore,
  getRiskLevelMeta,
  getRiskStatusMeta,
  getRiskCategoryMeta,
  MitigationStatusType,
  MitigationTypeType,
} from '@/lib/risk-engine';

interface RiskDetailManagerProps {
  risk: any;
  currentUser: {
    id: string;
    fullName: string;
    role: string;
    canManage: boolean;
    canAssess: boolean;
    canViewIncidents: boolean;
  };
}

export default function RiskDetailManager({ risk: initialRisk, currentUser }: RiskDetailManagerProps) {
  const { tx, txLocale } = useAdminT();
  const router = useRouter();
  const [risk, setRisk] = useState<any>(initialRisk);
  const [activeTab, setActiveTab] = useState<'mitigations' | 'history'>('mitigations');

  // Reassessment State
  const [isReassessOpen, setIsReassessOpen] = useState(false);
  const [reassessLikelihood, setReassessLikelihood] = useState(initialRisk.likelihood || 3);
  const [reassessImpact, setReassessImpact] = useState(initialRisk.impact || 3);
  const [reassessRationale, setReassessRationale] = useState('');
  const [reassessing, setReassessing] = useState(false);
  const [reassessError, setReassessError] = useState<string | null>(null);

  // Add Mitigation State
  const [isAddMitigationOpen, setIsAddMitigationOpen] = useState(false);
  const [mitigationTitle, setMitigationTitle] = useState('');
  const [mitigationType, setMitigationType] = useState<MitigationTypeType>('PREVENTIVE');
  const [mitigationDesc, setMitigationDesc] = useState('');
  const [mitigationAssignee, setMitigationAssignee] = useState('');
  const [mitigationDueDate, setMitigationDueDate] = useState('');
  const [addingMitigation, setAddingMitigation] = useState(false);
  const [mitigationError, setMitigationError] = useState<string | null>(null);

  // Status Change State (Close / Reopen)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'CLOSED' | 'MONITORED' | 'RESOLVED'>('CLOSED');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const levelMeta = getRiskLevelMeta(risk.riskLevel);
  const statusMeta = getRiskStatusMeta(risk.status);
  const categoryMeta = getRiskCategoryMeta(risk.category);

  const calculatedPreviewScore = calculateRiskScore(reassessLikelihood, reassessImpact);

  // Refresh risk data
  const refreshRisk = async () => {
    try {
      const res = await fetch(`/api/admin/risks/${risk.id}`);
      const data = await res.json();
      if (res.ok && data.risk) {
        setRisk(data.risk);
      }
    } catch (err) {
      console.error('Error refreshing risk:', err);
    }
  };

  // Submit Reassessment
  const handleReassess = async (e: React.FormEvent) => {
    e.preventDefault();
    setReassessError(null);
    setReassessing(true);

    try {
      const res = await fetch(`/api/admin/risks/${risk.id}/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likelihood: Number(reassessLikelihood),
          impact: Number(reassessImpact),
          rationale: reassessRationale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("فشل في تسجيل إعادة التقييم"));
      }

      setIsReassessOpen(false);
      setReassessRationale('');
      refreshRisk();
    } catch (err: any) {
      setReassessError(err.message);
    } finally {
      setReassessing(false);
    }
  };

  // Submit Mitigation Action
  const handleAddMitigation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMitigationError(null);
    setAddingMitigation(true);

    try {
      const res = await fetch(`/api/admin/risks/${risk.id}/mitigations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionTitle: mitigationTitle,
          actionType: mitigationType,
          description: mitigationDesc || null,
          assignedTo: mitigationAssignee || null,
          dueDate: mitigationDueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("فشل في إضافة إجراء التخفيف"));
      }

      setIsAddMitigationOpen(false);
      setMitigationTitle('');
      setMitigationDesc('');
      setMitigationAssignee('');
      setMitigationDueDate('');
      refreshRisk();
    } catch (err: any) {
      setMitigationError(err.message);
    } finally {
      setAddingMitigation(false);
    }
  };

  // Update Mitigation Status
  const handleUpdateMitigationStatus = async (actionId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/risks/${risk.id}/mitigations/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        refreshRisk();
      }
    } catch (err) {
      console.error('Error updating mitigation status:', err);
    }
  };

  // Submit Status Change (Close / Reopen)
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/admin/risks/${risk.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("فشل في تغيير حالة الخطر"));
      }

      setIsStatusModalOpen(false);
      setStatusReason('');
      refreshRisk();
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const levelVariantMap: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'success',
  };

  const statusVariantMap: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
    IDENTIFIED: 'info',
    ASSESSED: 'warning',
    TREATMENT_IN_PROGRESS: 'warning',
    MONITORED: 'info',
    RESOLVED: 'success',
    CLOSED: 'neutral',
  };

  const tabs = [
    { id: 'mitigations', label: tx("إجراءات التخفيف والمعالجة ({0})", risk.mitigations?.length || 0), icon: Shield },
    { id: 'history', label: tx("سجل التقييمات التاريخية ({0})", risk.assessments?.length || 0), icon: History },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <AdminPageHeader
        title={risk.title}
        description={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <span
              dir="ltr"
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: 'var(--admin-primary)',
                background: 'var(--admin-primary-subtle)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {risk.riskNumber}
            </span>
            <AdminStatusBadge status={levelMeta.labelAr} variant={levelVariantMap[risk.riskLevel] || 'neutral'} dot />
            <AdminStatusBadge status={statusMeta.labelAr} variant={statusVariantMap[risk.status] || 'neutral'} dot />
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
              {categoryMeta.labelAr}
            </span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/admin/risks" style={{ textDecoration: 'none' }}>
              <AdminButton variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                {tx("سجل المخاطر")}
              </AdminButton>
            </Link>

            {currentUser.canAssess && risk.status !== 'CLOSED' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<RefreshCw size={13} />}
                onClick={() => {
                  setReassessLikelihood(risk.likelihood);
                  setReassessImpact(risk.impact);
                  setReassessRationale('');
                  setReassessError(null);
                  setIsReassessOpen(true);
                }}
              >
                {tx("إعادة التقييم")}
              </AdminButton>
            )}

            {currentUser.canManage && (
              <>
                {risk.status !== 'CLOSED' ? (
                  <AdminButton
                    variant="danger"
                    size="sm"
                    icon={<Lock size={13} />}
                    onClick={() => {
                      setTargetStatus('CLOSED');
                      setStatusReason('');
                      setStatusError(null);
                      setIsStatusModalOpen(true);
                    }}
                  >
                    {tx("إغلاق الخطر")}
                  </AdminButton>
                ) : (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon={<Unlock size={13} />}
                    onClick={() => {
                      setTargetStatus('MONITORED');
                      setStatusReason('');
                      setStatusError(null);
                      setIsStatusModalOpen(true);
                    }}
                  >
                    {tx("إعادة فتح الخطر")}
                  </AdminButton>
                )}
              </>
            )}
          </div>
        }
      />

      {/* Quick Metrics Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <AdminStatCard
          title={tx("درجة الخطر المحسوبة")}
          value={`${risk.riskScore} / 25`}
          icon={AlertTriangle}
          variant={levelVariantMap[risk.riskLevel]}
          description={tx("احتمالية {0} × أثر {1}", risk.likelihood, risk.impact)}
        />
        <AdminStatCard
          title={tx("النطاق الجغرافي")}
          value={risk.governorate}
          icon={MapPin}
          description={risk.district ? `${risk.district} ${risk.generalLocation ? `(${risk.generalLocation})` : ''}` : tx("المحافظة بالكامل")}
        />
        <AdminStatCard
          title={tx("تاريخ التسجيل والمستهدف")}
          value={new Date(risk.createdAt).toLocaleDateString(txLocale("ar-YE"))}
          icon={Calendar}
          description={risk.targetResolutionDate ? tx("المستهدف: {0}", new Date(risk.targetResolutionDate).toLocaleDateString(txLocale("ar-YE"))) : tx("لم يحدد موعد حل")}
        />
        <AdminStatCard
          title={tx("إجراءات التخفيف")}
          value={`${risk.mitigations?.length || 0} تدبير`}
          icon={Shield}
          variant="info"
          description={tx("{0} تقييم مسجل", risk.assessments?.length || 0)}
        />
      </div>

      {/* Operational Description & Linked Incident */}
      <AdminSection title={tx("التوصيف التشغيلي والارتباطات الميدانية")} description={tx("سياق التهديد وتفاصيل البلاغ المرتبط")}>
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--admin-text-primary)' }}>
          {risk.description}
        </p>

        {risk.incident && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--admin-radius-md)',
              background: 'var(--admin-primary-subtle)',
              border: '1px solid var(--admin-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link2 size={16} style={{ color: 'var(--admin-primary)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-text-primary)' }}>
                  {tx("مرتبط بالبلاغ الميداني المحقق:")} <span dir="ltr" style={{ fontFamily: 'monospace' }}>{risk.incident.incidentNumber}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
                  {tx("المحافظة:")} {risk.incident.governorate} {tx("• تاريخ الواقعة:")} {new Date(risk.incident.incidentDate).toLocaleDateString(txLocale("ar-YE"))}
                </div>
              </div>
            </div>

            {currentUser.canViewIncidents ? (
              <Link href={`/admin/incidents/${risk.incident.id}`} style={{ textDecoration: 'none' }}>
                <AdminButton variant="outline" size="sm" icon={<ExternalLink size={12} />}>
                  {tx("فتح البلاغ الميداني")}
                </AdminButton>
              </Link>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                {tx("(الارتباط مرجعي تشغيلي)")}
              </span>
            )}
          </div>
        )}

        {/* Close/Reopen Notes */}
        {(risk.closeReason || risk.reopenReason) && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--admin-bg-surface-subtle)', borderRadius: 'var(--admin-radius-md)', border: '1px solid var(--admin-border-subtle)', fontSize: '0.82rem' }}>
            {risk.status === 'CLOSED' && risk.closeReason && (
              <div style={{ color: 'var(--admin-text-secondary)' }}>
                <strong>{tx("سبب إغلاق الخطر (")}{new Date(risk.closedAt).toLocaleDateString(txLocale("ar-YE"))}):</strong> {risk.closeReason}
              </div>
            )}
            {risk.reopenReason && (
              <div style={{ color: 'var(--admin-text-secondary)' }}>
                <strong>{tx("سبب إعادة فتح الخطر (")}{new Date(risk.reopenedAt).toLocaleDateString(txLocale("ar-YE"))}):</strong> {risk.reopenReason}
              </div>
            )}
          </div>
        )}
      </AdminSection>

      {/* Tabs */}
      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* TAB 1: MITIGATIONS */}
      {activeTab === 'mitigations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AdminSection
            title={tx("مصفوفة إجراءات التخفيف والمعالجة (Treatment Matrix)")}
            description={tx("التدابير الوقائية وخطط الاستجابة الميدانية للحد من احتمالية الخطر وشدة تداعياته")}
            actions={
              currentUser.canManage && risk.status !== 'CLOSED' ? (
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => {
                    setMitigationTitle('');
                    setMitigationDesc('');
                    setMitigationAssignee('');
                    setMitigationDueDate('');
                    setMitigationError(null);
                    setIsAddMitigationOpen(true);
                  }}
                >
                  {tx("إضافة تدبير تخفيف")}
                </AdminButton>
              ) : undefined
            }
          >
            {(!risk.mitigations || risk.mitigations.length === 0) ? (
              <AdminEmptyState
                title={tx("لا توجد إجراءات تخفيف مسجلة")}
                description={tx("قم بإضافة تدابير وقائية أو خطط استجابة للحد من احتمالية الخطر أو شدة أثره.")}
                action={
                  currentUser.canManage && risk.status !== 'CLOSED' ? (
                    <AdminButton
                      variant="primary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => setIsAddMitigationOpen(true)}
                    >
                      {tx("إضافة إجراء تخفيف")}
                    </AdminButton>
                  ) : undefined
                }
              />
            ) : (
              <AdminDataTable
                columns={[
                  {
                    key: 'actionTitle',
                    header: tx("إجراء التخفيف والنوع"),
                    render: (m: any) => {
                      let typeLabel = tx("وقائي");
                      if (m.actionType === 'CONTINGENCY') typeLabel = tx("طوارئ واستجابة");
                      if (m.actionType === 'CORRECTIVE') typeLabel = tx("تصحيحي");
                      return (
                        <div style={{ maxWidth: '320px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.72rem', background: 'var(--admin-primary-subtle)', color: 'var(--admin-primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {typeLabel}
                            </span>
                            <strong style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)' }}>
                              {m.actionTitle}
                            </strong>
                          </div>
                          {m.description && (
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                              {m.description}
                            </p>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    key: 'assignedTo',
                    header: tx("المسؤول"),
                    render: (m: any) => (
                      <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-primary)' }}>
                        {m.assignedTo || tx("غير محدد")}
                      </span>
                    ),
                  },
                  {
                    key: 'dueDate',
                    header: tx("تاريخ الاستحقاق"),
                    render: (m: any) => (
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString(txLocale("ar-YE")) : '—'}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: tx("الحالة"),
                    render: (m: any) => {
                      const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
                        PLANNED: { label: tx("مخطط"), variant: 'info' },
                        IN_PROGRESS: { label: tx("جاري التنفيذ"), variant: 'warning' },
                        COMPLETED: { label: tx("مكتمل"), variant: 'success' },
                        DELAYED: { label: tx("متأخر"), variant: 'danger' },
                        CANCELLED: { label: tx("ملغى"), variant: 'neutral' },
                      };
                      const sm = statusMap[m.status] || { label: m.status, variant: 'neutral' as const };

                      if (currentUser.canManage && risk.status !== 'CLOSED') {
                        return (
                          <AdminSelect
                            value={m.status}
                            onChange={(e) => handleUpdateMitigationStatus(m.id, e.target.value)}
                            options={[
                              { value: 'PLANNED', label: tx("مخطط") },
                              { value: 'IN_PROGRESS', label: tx("جاري التنفيذ") },
                              { value: 'COMPLETED', label: tx("مكتمل") },
                              { value: 'DELAYED', label: tx("متأخر") },
                              { value: 'CANCELLED', label: tx("ملغى") },
                            ]}
                          />
                        );
                      }
                      return <AdminStatusBadge status={sm.label} variant={sm.variant} dot />;
                    },
                  },
                ]}
                data={risk.mitigations}
                keyExtractor={(m) => m.id}
                mobileCardRender={(m: any) => {
                  let typeLabel = tx("وقائي");
                  if (m.actionType === 'CONTINGENCY') typeLabel = tx("طوارئ واستجابة");
                  if (m.actionType === 'CORRECTIVE') typeLabel = tx("تصحيحي");
                  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
                    PLANNED: { label: tx("مخطط"), variant: 'info' },
                    IN_PROGRESS: { label: tx("جاري التنفيذ"), variant: 'warning' },
                    COMPLETED: { label: tx("مكتمل"), variant: 'success' },
                    DELAYED: { label: tx("متأخر"), variant: 'danger' },
                    CANCELLED: { label: tx("ملغى"), variant: 'neutral' },
                  };
                  const sm = statusMap[m.status] || { label: m.status, variant: 'neutral' as const };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', background: 'var(--admin-primary-subtle)', color: 'var(--admin-primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {typeLabel}
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)' }}>
                            {m.actionTitle}
                          </strong>
                        </div>
                        {currentUser.canManage && risk.status !== 'CLOSED' ? (
                          <AdminSelect
                            value={m.status}
                            onChange={(e: any) => handleUpdateMitigationStatus(m.id, e.target.value)}
                            options={[
                              { value: 'PLANNED', label: tx("مخطط") },
                              { value: 'IN_PROGRESS', label: tx("جاري التنفيذ") },
                              { value: 'COMPLETED', label: tx("مكتمل") },
                              { value: 'DELAYED', label: tx("متأخر") },
                              { value: 'CANCELLED', label: tx("ملغى") },
                            ]}
                          />
                        ) : (
                          <AdminStatusBadge status={sm.label} variant={sm.variant} dot />
                        )}
                      </div>
                      {m.description && (
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                          {m.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--admin-text-primary)' }}>
                          {m.assignedTo || tx("غير محدد")}
                        </span>
                        <span style={{ color: 'var(--admin-text-muted)' }}>
                          {m.dueDate ? new Date(m.dueDate).toLocaleDateString(txLocale("ar-YE")) : '—'}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </AdminSection>
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AdminSection
            title={tx("السجل التاريخي للتقييمات وإعادة التقييم (Audit Trail)")}
            description={tx("توثيق التغييرات على درجات الاحتمالية والأثر ومبررات التعديل المعتمدة")}
          >
            {(!risk.assessments || risk.assessments.length === 0) ? (
              <AdminEmptyState
                title={tx("لا يوجد سجل تقييمات سابق")}
                description={tx("لم يتم تسجيل عمليات إعادة تقييم لهذا الخطر بعد.")}
              />
            ) : (
              <AdminDataTable
                columns={[
                  {
                    key: 'date',
                    header: tx("تاريخ التقييم"),
                    render: (item: any) => (
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {new Date(item.assessedAt).toLocaleString(txLocale("ar-YE"))}
                      </span>
                    ),
                  },
                  {
                    key: 'assessor',
                    header: tx("المقيم / المسؤول"),
                    render: (item: any) => (
                      <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        {item.assessedByName}
                      </span>
                    ),
                  },
                  {
                    key: 'formula',
                    header: tx("الاحتمالية × الأثر"),
                    render: (item: any) => (
                      <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {item.likelihood} × {item.impact}
                      </span>
                    ),
                  },
                  {
                    key: 'level',
                    header: tx("الدرجة والمستوى"),
                    render: (item: any) => {
                      const itemLevelMeta = getRiskLevelMeta(item.riskLevel);
                      return (
                        <AdminStatusBadge
                          status={`${itemLevelMeta.labelAr} (${item.riskScore})`}
                          variant={levelVariantMap[item.riskLevel] || 'neutral'}
                          dot
                        />
                      );
                    },
                  },
                  {
                    key: 'rationale',
                    header: tx("مبررات التقييم"),
                    render: (item: any) => (
                      <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
                        {item.rationale || '—'}
                      </span>
                    ),
                  },
                ]}
                data={risk.assessments}
                keyExtractor={(item) => item.id}
                mobileCardRender={(item: any) => {
                  const itemLevelMeta = getRiskLevelMeta(item.riskLevel);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <strong style={{ color: 'var(--admin-text-primary)', fontSize: '0.88rem' }}>
                          {item.assessedByName}
                        </strong>
                        <AdminStatusBadge
                          status={`${itemLevelMeta.labelAr} (${item.riskScore})`}
                          variant={levelVariantMap[item.riskLevel] || 'neutral'}
                          dot
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                          {item.likelihood} × {item.impact}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                          {new Date(item.assessedAt).toLocaleString(txLocale("ar-YE"))}
                        </span>
                      </div>
                      {item.rationale && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
                          {item.rationale}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            )}
          </AdminSection>
        </div>
      )}

      {/* MODAL: REASSESS RISK */}
      <AdminModal
        isOpen={isReassessOpen}
        onClose={() => setIsReassessOpen(false)}
        title={tx("إعادة تقييم الخطر التشغيلي الميداني")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsReassessOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={reassessing}
              onClick={handleReassess}
            >
              {reassessing ? tx("جاري الحفظ...") : tx("اعتماد التقييم الجديد")}
            </AdminButton>
          </div>
        }
      >
        <form onSubmit={handleReassess} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reassessError && <AdminAlert variant="danger" message={reassessError} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("الاحتمالية الجديدة (1 إلى 5)")}
              </label>
              <AdminSelect
                value={String(reassessLikelihood)}
                onChange={(e) => setReassessLikelihood(parseInt(e.target.value, 10))}
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
                {tx("شدة الأثر الجديدة (1 إلى 5)")}
              </label>
              <AdminSelect
                value={String(reassessImpact)}
                onChange={(e) => setReassessImpact(parseInt(e.target.value, 10))}
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

          {/* Calculated Score Preview */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--admin-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--admin-bg-surface-subtle)',
              border: '1px solid var(--admin-border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
              {tx("الدرجة المحسوبة الجديدة:")} <strong dir="ltr">{calculatedPreviewScore.score} / 25</strong>
            </span>
            <AdminStatusBadge
              status={getRiskLevelMeta(calculatedPreviewScore.level).labelAr}
              variant={levelVariantMap[calculatedPreviewScore.level] || 'neutral'}
              dot
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("مبررات إعادة التقييم والتغير الميداني *")}
            </label>
            <AdminTextarea
              rows={3}
              required
              placeholder={tx("بيان أسباب التعديل (مثل: استكمال تدابير التخفيف، ظهور معطيات ميدانية جديدة...)")}
              value={reassessRationale}
              onChange={(e) => setReassessRationale(e.target.value)}
            />
          </div>
        </form>
      </AdminModal>

      {/* MODAL: ADD MITIGATION */}
      <AdminModal
        isOpen={isAddMitigationOpen}
        onClose={() => setIsAddMitigationOpen(false)}
        title={tx("إضافة إجراء تخفيف ومعالجة")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsAddMitigationOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={addingMitigation}
              onClick={handleAddMitigation}
            >
              {addingMitigation ? tx("جاري الإضافة...") : tx("حفظ تدبير التخفيف")}
            </AdminButton>
          </div>
        }
      >
        <form onSubmit={handleAddMitigation} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {mitigationError && <AdminAlert variant="danger" message={mitigationError} />}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("عنوان إجراء التخفيف *")}
            </label>
            <AdminInput
              required
              placeholder={tx("مثال: التنسيق المسبق مع نقاط التفتيش واعتماد مسار عبور بديل...")}
              value={mitigationTitle}
              onChange={(e) => setMitigationTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("نوع الإجراء *")}
              </label>
              <AdminSelect
                value={mitigationType}
                onChange={(e) => setMitigationType(e.target.value as any)}
                options={[
                  { value: 'PREVENTIVE', label: tx("وقائي (Preventive)") },
                  { value: 'CONTINGENCY', label: tx("طوارئ واستجابة (Contingency)") },
                  { value: 'CORRECTIVE', label: tx("تصحيحي (Corrective)") },
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("المسؤول عن التنفيذ")}
              </label>
              <AdminInput
                placeholder={tx("مثال: منسق الوصول الميداني...")}
                value={mitigationAssignee}
                onChange={(e) => setMitigationAssignee(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("تاريخ الاستحقاق (اختياري)")}
            </label>
            <AdminInput
              type="date"
              value={mitigationDueDate}
              onChange={(e) => setMitigationDueDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("التفاصيل وخطة العمل")}
            </label>
            <AdminTextarea
              rows={3}
              placeholder={tx("وصف الإجراء والخطوات المتفق عليها...")}
              value={mitigationDesc}
              onChange={(e) => setMitigationDesc(e.target.value)}
            />
          </div>
        </form>
      </AdminModal>

      {/* MODAL: CLOSE / REOPEN RISK */}
      <AdminModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={targetStatus === 'CLOSED' ? tx("إغلاق الخطر التشغيلي") : tx("إعادة فتح الخطر التشغيلي")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton
              variant={targetStatus === 'CLOSED' ? 'danger' : 'primary'}
              size="sm"
              disabled={updatingStatus}
              onClick={handleStatusChange}
            >
              {updatingStatus ? tx("جاري التحديث...") : targetStatus === 'CLOSED' ? tx("تأكيد إغلاق الخطر") : tx("تأكيد إعادة الفتح")}
            </AdminButton>
          </div>
        }
      >
        <form onSubmit={handleStatusChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {statusError && <AdminAlert variant="danger" message={statusError} />}

          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
            {targetStatus === 'CLOSED'
              ? tx("هل تؤكد إغلاق قيد الخطر؟ يرجى بيان مبررات الإغلاق (مثل زوال التهديد أو استكمال المعالجة بنجاح).")
              : tx("هل تؤكد إعادة فتح الخطر وتغيير حالته إلى قيد المراقبة النشطة؟")}
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {targetStatus === 'CLOSED' ? tx("مبررات إغلاق الخطر *") : tx("أسباب إعادة فتح الخطر *")}
            </label>
            <AdminTextarea
              rows={3}
              required
              placeholder={tx("اكتب التوضيح والأسباب الموجبة لهذا الإجراء...")}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
