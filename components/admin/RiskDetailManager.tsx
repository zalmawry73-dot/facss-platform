'use client';

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
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';
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
        throw new Error(data.error || 'فشل في تسجيل إعادة التقييم');
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
        throw new Error(data.error || 'فشل في إضافة إجراء التخفيف');
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
        throw new Error(data.error || 'فشل في تغيير حالة الخطر');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
          <Link href="/admin/risks" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--facss-gold-500)', fontWeight: 700 }}>
            <ArrowRight size={16} />
            العودة إلى سجل المخاطر
          </Link>
          <span style={{ color: 'var(--facss-text-muted)' }}>/</span>
          <span style={{ fontWeight: 800, color: 'var(--facss-text-primary)' }}>{risk.riskNumber}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {currentUser.canAssess && risk.status !== 'CLOSED' && (
            <button
              onClick={() => {
                setReassessLikelihood(risk.likelihood);
                setReassessImpact(risk.impact);
                setReassessRationale('');
                setReassessError(null);
                setIsReassessOpen(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <RefreshCw size={16} />
              إعادة التقييم
            </button>
          )}

          {currentUser.canManage && (
            <>
              {risk.status !== 'CLOSED' ? (
                <button
                  onClick={() => {
                    setTargetStatus('CLOSED');
                    setStatusReason('');
                    setStatusError(null);
                    setIsStatusModalOpen(true);
                  }}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', borderColor: '#dc2626' }}
                >
                  <Lock size={16} />
                  إغلاق الخطر
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTargetStatus('MONITORED');
                    setStatusReason('');
                    setStatusError(null);
                    setIsStatusModalOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', borderColor: '#10b981' }}
                >
                  <Unlock size={16} />
                  إعادة فتح الخطر
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Risk Header Card */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'var(--facss-card-bg)',
          border: '1px solid var(--facss-border)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--facss-gold-500)', letterSpacing: '0.5px' }}>
                {risk.riskNumber}
              </span>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: levelMeta.bg,
                  color: levelMeta.color,
                  border: `1px solid ${levelMeta.border}`,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                {levelMeta.labelAr} (درجة {risk.riskScore}/25)
              </span>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: statusMeta.bg,
                  color: statusMeta.color,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {statusMeta.labelAr}
              </span>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.05)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {categoryMeta.labelAr}
              </span>
            </div>

            <h1 style={{ fontSize: '1.55rem', fontWeight: 900, margin: '0 0 1rem', color: 'var(--facss-text-primary)' }}>
              {risk.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--facss-text-secondary)', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={16} color="var(--facss-gold-500)" />
                <span>
                  {risk.governorate}
                  {risk.district && ` - ${risk.district}`}
                  {risk.generalLocation && ` (${risk.generalLocation})`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} />
                <span>تاريخ التسجيل: {new Date(risk.createdAt).toLocaleDateString('ar-YE')}</span>
              </div>
              {risk.targetResolutionDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={16} />
                  <span>مستهدف المعالجة: {new Date(risk.targetResolutionDate).toLocaleDateString('ar-YE')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Score Visual */}
          <div
            style={{
              padding: '1.25rem 1.75rem',
              borderRadius: '12px',
              background: levelMeta.bg,
              border: `2px solid ${levelMeta.border}`,
              textAlign: 'center',
              minWidth: '150px',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: levelMeta.color, textTransform: 'uppercase' }}>
              الاحتمالية × الأثر
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: levelMeta.color, lineHeight: 1.1, margin: '0.25rem 0' }}>
              {risk.likelihood} × {risk.impact}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: levelMeta.color }}>
              = درجة {risk.riskScore}
            </div>
          </div>
        </div>

        {/* Operational Description */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--facss-border)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--facss-gold-500)' }}>
            الوصف التشغيلي المنقح:
          </h4>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--facss-text-primary)' }}>
            {risk.description}
          </p>
        </div>

        {/* Linked Incident Card (Confidentiality Protected) */}
        {risk.incident && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              background: 'rgba(201, 162, 39, 0.08)',
              border: '1px solid rgba(201, 162, 39, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link2 size={20} color="var(--facss-gold-500)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  مرتبط بالبلاغ الميداني المحقق: {risk.incident.incidentNumber}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--facss-text-secondary)' }}>
                  المحافظة: {risk.incident.governorate} • تاريخ الواقعة: {new Date(risk.incident.incidentDate).toLocaleDateString('ar-YE')}
                </div>
              </div>
            </div>

            {/* Navigation link ONLY if user has incident capabilities */}
            {currentUser.canViewIncidents ? (
              <Link
                href={`/admin/incidents/${risk.incident.id}`}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.8rem', fontWeight: 700 }}
              >
                عرض البلاغ المصرح به
              </Link>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--facss-text-muted)' }}>
                (الارتباط مرجعي تشغيلي)
              </span>
            )}
          </div>
        )}

        {/* Status reason notes if closed or reopened */}
        {(risk.closeReason || risk.reopenReason) && (
          <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.25rem', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--facss-border)' }}>
            {risk.status === 'CLOSED' && risk.closeReason && (
              <div style={{ fontSize: '0.85rem', color: 'var(--facss-text-secondary)' }}>
                <strong>مبرر إغلاق الخطر ({new Date(risk.closedAt).toLocaleDateString('ar-YE')}):</strong> {risk.closeReason}
              </div>
            )}
            {risk.reopenReason && (
              <div style={{ fontSize: '0.85rem', color: 'var(--facss-text-secondary)' }}>
                <strong>مبرر إعادة فتح الخطر ({new Date(risk.reopenedAt).toLocaleDateString('ar-YE')}):</strong> {risk.reopenReason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs: Mitigations vs History */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--facss-border)' }}>
        <button
          onClick={() => setActiveTab('mitigations')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'mitigations' ? '3px solid var(--facss-gold-500)' : '3px solid transparent',
            color: activeTab === 'mitigations' ? 'var(--facss-gold-500)' : 'var(--facss-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Shield size={18} />
          إجراءات التخفيف والمعالجة ({risk.mitigations?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid var(--facss-gold-500)' : '3px solid transparent',
            color: activeTab === 'history' ? 'var(--facss-gold-500)' : 'var(--facss-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <History size={18} />
          سجل التقييمات التاريخية ({risk.assessments?.length || 0})
        </button>
      </div>

      {/* TAB CONTENT: MITIGATIONS */}
      {activeTab === 'mitigations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              مصفوفة إجراءات التخفيف والمعالجة (Treatment Matrix)
            </h3>
            {currentUser.canManage && risk.status !== 'CLOSED' && (
              <button
                onClick={() => {
                  setMitigationTitle('');
                  setMitigationDesc('');
                  setMitigationAssignee('');
                  setMitigationDueDate('');
                  setMitigationError(null);
                  setIsAddMitigationOpen(true);
                }}
                className="btn btn-sm btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Plus size={16} />
                إضافة إجراء تخفيف جديد
              </button>
            )}
          </div>

          {(!risk.mitigations || risk.mitigations.length === 0) ? (
            <div
              className="card"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'var(--facss-card-bg)',
                border: '1px solid var(--facss-border)',
                color: 'var(--facss-text-secondary)',
              }}
            >
              <Shield size={40} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <h5 style={{ fontWeight: 700, margin: 0 }}>لا توجد إجراءات تخفيف مسجلة لهذا الخطر حتى الآن</h5>
              <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                قم بإضافة تدابير وقائية أو خطط استجابة طوارئ للحد من احتمالية الخطر أو شدة أثره.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {risk.mitigations.map((action: any) => {
                let actionTypeLabel = 'وقائي (Preventive)';
                if (action.actionType === 'CONTINGENCY') actionTypeLabel = 'طوارئ واستجابة (Contingency)';
                if (action.actionType === 'CORRECTIVE') actionTypeLabel = 'تصحيحي (Corrective)';

                return (
                  <div
                    key={action.id}
                    className="card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      background: 'var(--facss-card-bg)',
                      border: '1px solid var(--facss-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: '1 1 450px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.55rem',
                            borderRadius: '4px',
                            background: 'rgba(201, 162, 39, 0.12)',
                            color: 'var(--facss-gold-600)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {actionTypeLabel}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--facss-text-primary)' }}>
                          {action.actionTitle}
                        </h4>
                      </div>

                      {action.description && (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: 'var(--facss-text-secondary)', lineHeight: 1.6 }}>
                          {action.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--facss-text-muted)' }}>
                        {action.assignedTo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <User size={14} />
                            <span>المسؤول: {action.assignedTo}</span>
                          </div>
                        )}
                        {action.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={14} />
                            <span>تاريخ الاستحقاق: {new Date(action.dueDate).toLocaleDateString('ar-YE')}</span>
                          </div>
                        )}
                        {action.completedAt && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981' }}>
                            <CheckCircle2 size={14} />
                            <span>تم الإنجاز: {new Date(action.completedAt).toLocaleDateString('ar-YE')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Toggle Dropdown */}
                    {currentUser.canManage ? (
                      <div style={{ minWidth: '160px' }}>
                        <select
                          className="form-control"
                          value={action.status}
                          onChange={(e) => handleUpdateMitigationStatus(action.id, e.target.value)}
                          style={{ fontSize: '0.85rem', fontWeight: 700 }}
                        >
                          <option value="PLANNED">مخطط (Planned)</option>
                          <option value="IN_PROGRESS">جاري التنفيذ (In Progress)</option>
                          <option value="COMPLETED">مكتمل (Completed)</option>
                          <option value="DELAYED">متأخر (Delayed)</option>
                          <option value="CANCELLED">ملغى (Cancelled)</option>
                        </select>
                      </div>
                    ) : (
                      <span
                        style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.05)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {action.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ASSESSMENT HISTORY */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
            السجل التاريخي للتقييمات وإعادة التقييم (Audit Trail)
          </h3>

          <div
            className="card"
            style={{
              padding: 0,
              background: 'var(--facss-card-bg)',
              border: '1px solid var(--facss-border)',
              overflow: 'hidden',
            }}
          >
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--facss-border)', textAlign: 'right' }}>
                  <th style={{ padding: '1rem' }}>تاريخ التقييم</th>
                  <th style={{ padding: '1rem' }}>المسؤول / المقيم</th>
                  <th style={{ padding: '1rem' }}>الاحتمالية × الأثر</th>
                  <th style={{ padding: '1rem' }}>الدرجة والمستوى</th>
                  <th style={{ padding: '1rem' }}>مبررات التقييم</th>
                </tr>
              </thead>
              <tbody>
                {risk.assessments?.map((item: any) => {
                  const itemLevelMeta = getRiskLevelMeta(item.riskLevel);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--facss-border)' }}>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {new Date(item.assessedAt).toLocaleString('ar-YE')}
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontWeight: 700 }}>
                        {item.assessedByName}
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap', fontWeight: 800 }}>
                        {item.likelihood} × {item.impact}
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            background: itemLevelMeta.bg,
                            color: itemLevelMeta.color,
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          {itemLevelMeta.labelAr} ({item.riskScore})
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--facss-text-secondary)', fontSize: '0.88rem' }}>
                        {item.rationale || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REASSESS RISK */}
      {isReassessOpen && (
        <div className="facss-modal-overlay">
          <div className="facss-modal-content" style={{ maxWidth: '560px' }}>
            <div className="facss-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>إعادة تقييم الخطر الميداني</h3>
              <button
                onClick={() => setIsReassessOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--facss-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReassess} className="facss-modal-body">
              {reassessError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {reassessError}
                </div>
              )}

              <div className="facss-form-grid-2">
                <div>
                  <label className="form-label">الاحتمالية الجديدة: <strong>{reassessLikelihood}</strong></label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={reassessLikelihood}
                    onChange={(e) => setReassessLikelihood(parseInt(e.target.value, 10))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-muted)' }}>
                    {reassessLikelihood === 1 && '1 - نادر'}
                    {reassessLikelihood === 2 && '2 - غير محتمل'}
                    {reassessLikelihood === 3 && '3 - متوسط'}
                    {reassessLikelihood === 4 && '4 - محتمل'}
                    {reassessLikelihood === 5 && '5 - شبه مؤكد'}
                  </div>
                </div>

                <div>
                  <label className="form-label">شدة الأثر الجديدة: <strong>{reassessImpact}</strong></label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={reassessImpact}
                    onChange={(e) => setReassessImpact(parseInt(e.target.value, 10))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-muted)' }}>
                    {reassessImpact === 1 && '1 - طفيف'}
                    {reassessImpact === 2 && '2 - محدود'}
                    {reassessImpact === 3 && '3 - متوسط'}
                    {reassessImpact === 4 && '4 - كبير'}
                    {reassessImpact === 5 && '5 - كارثي'}
                  </div>
                </div>
              </div>

              {/* Score Preview */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: getRiskLevelMeta(calculatedPreviewScore.level).bg,
                  border: `1px solid ${getRiskLevelMeta(calculatedPreviewScore.level).border}`,
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  الدرجة الجديدة: <strong>{calculatedPreviewScore.score} / 25</strong>
                </span>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    background: getRiskLevelMeta(calculatedPreviewScore.level).color,
                    color: '#FFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                  }}
                >
                  {getRiskLevelMeta(calculatedPreviewScore.level).labelAr}
                </span>
              </div>

              <div>
                <label className="form-label">مبررات إعادة التقييم والتغير الميداني *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="بيان أسباب التعديل (مثل: استكمال تدابير التخفيف، ظهور معطيات ميدانية جديدة، تقارير رصد دورية...)"
                  value={reassessRationale}
                  onChange={(e) => setReassessRationale(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsReassessOpen(false)}
                  className="btn btn-secondary"
                  disabled={reassessing}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reassessing}
                  style={{ fontWeight: 700 }}
                >
                  {reassessing ? 'جاري الحفظ...' : 'اعتماد التقييم الجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MITIGATION ACTION */}
      {isAddMitigationOpen && (
        <div className="facss-modal-overlay">
          <div className="facss-modal-content" style={{ maxWidth: '580px' }}>
            <div className="facss-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>إضافة إجراء تخفيف ومعالجة</h3>
              <button
                onClick={() => setIsAddMitigationOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--facss-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMitigation} className="facss-modal-body">
              {mitigationError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {mitigationError}
                </div>
              )}

              <div>
                <label className="form-label">عنوان إجراء التخفيف *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: التنسيق المسبق مع نقاط التفتيش واعتماد مسار عبور بديل..."
                  value={mitigationTitle}
                  onChange={(e) => setMitigationTitle(e.target.value)}
                  required
                />
              </div>

              <div className="facss-form-grid-2">
                <div>
                  <label className="form-label">نوع الإجراء *</label>
                  <select
                    className="form-control"
                    value={mitigationType}
                    onChange={(e) => setMitigationType(e.target.value as any)}
                  >
                    <option value="PREVENTIVE">وقائي (Preventive)</option>
                    <option value="CONTINGENCY">طوارئ واستجابة (Contingency)</option>
                    <option value="CORRECTIVE">تصحيحي (Corrective)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">المسؤول عن التنفيذ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: منسق الوصول الميداني..."
                    value={mitigationAssignee}
                    onChange={(e) => setMitigationAssignee(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">تاريخ الاستحقاق (اختياري)</label>
                <input
                  type="date"
                  className="form-control"
                  value={mitigationDueDate}
                  onChange={(e) => setMitigationDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">تفاصيل إضافية / خطوات التنفيذ</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="شرح الإجراء أو الاشتراطات التشغيلية..."
                  value={mitigationDesc}
                  onChange={(e) => setMitigationDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddMitigationOpen(false)}
                  className="btn btn-secondary"
                  disabled={addingMitigation}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingMitigation}
                  style={{ fontWeight: 700 }}
                >
                  {addingMitigation ? 'جاري الحفظ...' : 'إضافة الإجراء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLOSE / REOPEN STATUS */}
      {isStatusModalOpen && (
        <div className="facss-modal-overlay">
          <div className="facss-modal-content" style={{ maxWidth: '520px' }}>
            <div className="facss-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {targetStatus === 'CLOSED' ? 'إغلاق قيد الخطر الميداني' : 'إعادة فتح الخطر الميداني'}
              </h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--facss-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStatusChange} className="facss-modal-body">
              {statusError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {statusError}
                </div>
              )}

              <div>
                <label className="form-label">
                  {targetStatus === 'CLOSED'
                    ? 'سبب ومبرر إغلاق الخطر التشغيلي *'
                    : 'سبب ومبرر إعادة فتح الخطر وتجدد التهديد *'}
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={
                    targetStatus === 'CLOSED'
                      ? 'مثال: زوال التهديد بالكامل وفتح المسار الإنساني بصورة آمنة...'
                      : 'مثال: رصد توترات جديدة في المنطقة تتطلب إعادة التقييم والمراقبة...'
                  }
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={updatingStatus}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={targetStatus === 'CLOSED' ? 'btn btn-danger' : 'btn btn-primary'}
                  disabled={updatingStatus}
                  style={{ fontWeight: 700 }}
                >
                  {updatingStatus ? 'جاري الحفظ...' : targetStatus === 'CLOSED' ? 'تأكيد إغلاق الخطر' : 'تأكيد إعادة الفتح'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
