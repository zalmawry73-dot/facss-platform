'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowUpDown,
  MapPin,
  X,
  Sparkles
} from 'lucide-react';
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

export default function RiskRegisterManager({ currentUser }: RiskRegisterManagerProps) {
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

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState('');
  const [matrixCellFilter, setMatrixCellFilter] = useState<{ l: number; i: number } | null>(null);

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
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (levelFilter) params.set('riskLevel', levelFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (governorateFilter) params.set('governorate', governorateFilter);
      if (matrixCellFilter) {
        params.set('likelihood', String(matrixCellFilter.l));
        params.set('impact', String(matrixCellFilter.i));
      }

      const res = await fetch(`/api/admin/risks?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل في تحميل سجل المخاطر');
      }

      setRisks(data.risks || []);
      if (data.stats) setStats(data.stats);
      if (data.matrixCounts) setMatrixCounts(data.matrixCounts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [search, categoryFilter, levelFilter, statusFilter, governorateFilter, matrixCellFilter]);

  // Fetch verified incidents when opening modal
  const openFromIncidentModal = async () => {
    setIsFromIncidentModalOpen(true);
    setLoadingIncidents(true);
    setSelectedIncidentId('');
    setIncidentPreviewData(null);
    setFormError(null);
    try {
      const res = await fetch('/api/admin/risks/verified-incidents');
      const data = await res.json();
      if (res.ok && data.incidents) {
        setVerifiedIncidents(data.incidents);
      }
    } catch (err) {
      console.error('Error fetching verified incidents:', err);
    } finally {
      setLoadingIncidents(false);
    }
  };

  // Handle incident selection for preview
  const handleSelectIncident = async (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    if (!incidentId) {
      setIncidentPreviewData(null);
      return;
    }
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/risk-preview`);
      const data = await res.json();
      if (res.ok && data.data) {
        setIncidentPreviewData(data.data);
        setFormData({
          title: data.data.title,
          description: data.data.description,
          category: data.data.category,
          governorate: data.data.governorate,
          district: data.data.district || '',
          generalLocation: data.data.generalLocation || '',
          likelihood: data.data.suggestedLikelihood || 3,
          impact: data.data.suggestedImpact || 3,
          targetResolutionDate: '',
        });
      }
    } catch (err) {
      console.error('Error loading incident preview:', err);
    }
  };

  // Calculated score for the form
  const calculatedScore = useMemo(() => {
    return calculateRiskScore(Number(formData.likelihood), Number(formData.impact));
  }, [formData.likelihood, formData.impact]);

  // Submit Standalone or From Incident Risk
  const handleCreateRisk = async (e: React.FormEvent) => {
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
        throw new Error(data.error || 'فشل في حفظ قيد الخطر');
      }

      setIsStandaloneModalOpen(false);
      setIsFromIncidentModalOpen(false);
      // Reset form
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
      fetchRisks();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Matrix cell click
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
    search || categoryFilter || levelFilter || statusFilter || governorateFilter || matrixCellFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          background: 'var(--facss-card-bg)',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--facss-border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(234, 88, 12, 0.12)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--facss-text-primary)' }}>
              سجل المخاطر التشغيلية الميدانية (Operational Risk Register)
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--facss-text-secondary)', fontSize: '0.9rem' }}>
              منظومة الرصد والتقييم المنهجي للمخاطر الميدانية، متابعة إجراءات التخفيف، والمصفوفة التفاعلية 5×5
            </p>
          </div>
        </div>

        {currentUser.canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
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
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              <Plus size={18} />
              تسجيل خطر مستقل
            </button>

            <button
              onClick={openFromIncidentModal}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                borderColor: 'var(--facss-gold-500)',
                color: 'var(--facss-gold-600)',
              }}
            >
              <Link2 size={18} />
              اشتقاق من بلاغ محقق
            </button>
          </div>
        )}
      </div>

      {/* Metrics Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            borderRight: '4px solid #3b82f6',
            background: 'var(--facss-card-bg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--facss-text-secondary)', fontWeight: 600 }}>
              إجمالي المخاطر المسجلة
            </span>
            <Layers size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--facss-text-primary)' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.25rem' }}>
            {stats.active} قيد المتابعة النشطة
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            borderRight: '4px solid #dc2626',
            background: 'var(--facss-card-bg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--facss-text-secondary)', fontWeight: 600 }}>
              المخاطر الحرجة (Critical)
            </span>
            <AlertTriangle size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.5rem', color: '#dc2626' }}>
            {stats.critical}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#ea580c', marginTop: '0.25rem' }}>
            + {stats.high} مخاطر عالية الخطورة
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            borderRight: '4px solid #f59e0b',
            background: 'var(--facss-card-bg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--facss-text-secondary)', fontWeight: 600 }}>
              قيد المعالجة والتخفيف
            </span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.5rem', color: '#d97706' }}>
            {stats.inTreatment}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--facss-text-secondary)', marginTop: '0.25rem' }}>
            {stats.monitored} تحت المراقبة
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            borderRight: '4px solid #10b981',
            background: 'var(--facss-card-bg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--facss-text-secondary)', fontWeight: 600 }}>
              المعالجة والمغلقة
            </span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.5rem', color: '#10b981' }}>
            {stats.resolved + stats.closed}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--facss-text-secondary)', marginTop: '0.25rem' }}>
            {stats.resolved} تمت معالجتها • {stats.closed} مغلقة
          </div>
        </div>
      </div>

      {/* Visual 5x5 Interactive Risk Matrix */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          background: 'var(--facss-card-bg)',
          border: '1px solid var(--facss-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--facss-gold-500)" />
              مصفوفة المخاطر الميدانية 5×5 (Interactive 5×5 Risk Matrix)
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--facss-text-secondary)' }}>
              انقر على أي خلية لتصفية قائمة المخاطر الميدانية النشطة حسب إحداثيات الاحتمالية والأثر
            </p>
          </div>

          {matrixCellFilter && (
            <button
              onClick={() => setMatrixCellFilter(null)}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626' }}
            >
              <X size={14} />
              إلغاء تصفية الخلية [احتمالية: {matrixCellFilter.l} × أثر: {matrixCellFilter.i}]
            </button>
          )}
        </div>

        <div className="matrix-hint">
          <span>← مرر أفقياً لمعاينة كامل خلايا مصفوفة المخاطر 5×5 →</span>
        </div>

        <div className="matrix-scroll-container">
          <div style={{ minWidth: '580px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Rows from Likelihood 5 down to 1 */}
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={`row-${l}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '130px',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--facss-text-secondary)',
                    paddingLeft: '0.5rem',
                  }}
                >
                  {l === 5 && '5 - شبه مؤكد'}
                  {l === 4 && '4 - محتمل'}
                  {l === 3 && '3 - متوسط'}
                  {l === 2 && '2 - غير محتمل'}
                  {l === 1 && '1 - نادر'}
                </div>

                {/* 5 columns of Impact */}
                {[1, 2, 3, 4, 5].map((i) => {
                  const score = l * i;
                  const count = matrixCounts[`${l},${i}`] || 0;
                  const isSelected = matrixCellFilter?.l === l && matrixCellFilter?.i === i;

                  // Color scheme
                  let bgColor = 'rgba(22, 163, 74, 0.18)';
                  let textColor = '#16a34a';
                  let borderColor = 'rgba(22, 163, 74, 0.35)';

                  if (score >= 17) {
                    bgColor = 'rgba(220, 38, 38, 0.22)';
                    textColor = '#dc2626';
                    borderColor = 'rgba(220, 38, 38, 0.5)';
                  } else if (score >= 10) {
                    bgColor = 'rgba(234, 88, 12, 0.22)';
                    textColor = '#ea580c';
                    borderColor = 'rgba(234, 88, 12, 0.5)';
                  } else if (score >= 5) {
                    bgColor = 'rgba(217, 119, 6, 0.20)';
                    textColor = '#d97706';
                    borderColor = 'rgba(217, 119, 6, 0.45)';
                  }

                  return (
                    <button
                      key={`cell-${l}-${i}`}
                      onClick={() => handleMatrixCellClick(l, i)}
                      style={{
                        flex: 1,
                        height: '52px',
                        background: bgColor,
                        border: isSelected ? '2px solid #FFFFFF' : `1px solid ${borderColor}`,
                        boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`احتمالية ${l} × أثر ${i} = درجة ${score}`}
                    >
                      <span style={{ fontSize: '0.72rem', color: textColor, fontWeight: 700 }}>
                        درجة {score}
                      </span>
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 900,
                          color: count > 0 ? textColor : 'rgba(150,150,150,0.5)',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Matrix X-Axis (Impact) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ width: '130px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--facss-gold-500)' }}>
                الاحتمالية ↓ / الأثر ←
              </div>
              {['1 - طفيف', '2 - محدود', '3 - متوسط', '4 - كبير', '5 - كارثي'].map((label, idx) => (
                <div
                  key={`col-label-${idx}`}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--facss-text-secondary)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--facss-border)',
            flexWrap: 'wrap',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '14px', height: '14px', background: '#16a34a', borderRadius: '3px' }} />
            <span>منخفض (1-4)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '14px', height: '14px', background: '#d97706', borderRadius: '3px' }} />
            <span>متوسط (5-9)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '14px', height: '14px', background: '#ea580c', borderRadius: '3px' }} />
            <span>مرتفع (10-16)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '14px', height: '14px', background: '#dc2626', borderRadius: '3px' }} />
            <span>حرج / شديد الخطورة (17-25)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'var(--facss-card-bg)',
          border: '1px solid var(--facss-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search
              size={18}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--facss-text-muted)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="بحث بالرمز (RSK)، العنوان، الوصف، أو الموقع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">كافة التصنيفات</option>
              <option value="ARMED_CONFLICT_SECURITY">نزاع مسلح وتهديدات أمنية</option>
              <option value="ACCESS_ROADBLOCK_DENIAL">إعاقة وصول ونقاط تفتيش</option>
              <option value="EXPLOSIVE_HAZARD_UXO">ألغام ومخلفات حرب (UXO)</option>
              <option value="CRIMINALITY_THEFT">سطو مسلح وجريمة وسرقة</option>
              <option value="STAFF_DETENTION_THREAT">احتجاز واعتداء على الطواقم</option>
              <option value="FACILITY_DAMAGE">أضرار المقرات والمرافق</option>
              <option value="ENVIRONMENTAL_NATURAL">كوارث طبيعية وبيئية</option>
              <option value="HEALTH_SAFETY">صحة وسلامة مهنية</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <select
              className="form-control"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">كافة المستويات</option>
              <option value="CRITICAL">حرج (Critical)</option>
              <option value="HIGH">مرتفع (High)</option>
              <option value="MEDIUM">متوسط (Medium)</option>
              <option value="LOW">منخفض (Low)</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">كافة الحالات</option>
              <option value="IDENTIFIED">تم الرصد</option>
              <option value="ASSESSED">تم التقييم</option>
              <option value="TREATMENT_IN_PROGRESS">قيد المعالجة</option>
              <option value="MONITORED">تحت المراقبة</option>
              <option value="RESOLVED">تمت المعالجة</option>
              <option value="CLOSED">مغلق</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="تصفية بالمحافظة..."
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626' }}
            >
              <RefreshCw size={16} />
              إعادة ضبط
            </button>
          )}
        </div>
      </div>

      {/* Risks Table / List View */}
      <div
        className="card"
        style={{
          padding: 0,
          background: 'var(--facss-card-bg)',
          border: '1px solid var(--facss-border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--facss-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
            قائمة قيود المخاطر التشغيلية ({risks.length})
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--facss-text-secondary)' }}>
            مرتبة حسب درجة الخطر تنازلياً
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--facss-text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            جاري تحميل سجل المخاطر...
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
            {error}
          </div>
        ) : risks.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--facss-text-secondary)' }}>
            <AlertTriangle size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h5 style={{ fontWeight: 700, margin: 0 }}>لا توجد مخاطر مطابقة لشروط البحث</h5>
            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
              جرّب تغيير فلاتر البحث أو إضافة قيد خطر ميداني جديد.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--facss-border)', textAlign: 'right' }}>
                  <th style={{ padding: '1rem' }}>رقم الخطر</th>
                  <th style={{ padding: '1rem' }}>العنوان والتصنيف</th>
                  <th style={{ padding: '1rem' }}>الموقع الميداني</th>
                  <th style={{ padding: '1rem' }}>التقييم (احتمالية × أثر)</th>
                  <th style={{ padding: '1rem' }}>مستوى الخطر</th>
                  <th style={{ padding: '1rem' }}>الحالة</th>
                  <th style={{ padding: '1rem' }}>إجراءات التخفيف</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((risk) => {
                  const levelMeta = getRiskLevelMeta(risk.riskLevel);
                  const statusMeta = getRiskStatusMeta(risk.status);
                  const categoryMeta = getRiskCategoryMeta(risk.category);

                  return (
                    <tr
                      key={risk.id}
                      style={{
                        borderBottom: '1px solid var(--facss-border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--facss-gold-500)' }}>{risk.riskNumber}</span>
                        {risk.incident && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-muted)', marginTop: '0.2rem' }}>
                            بلاغ: {risk.incident.incidentNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem', maxWidth: '300px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--facss-text-primary)', marginBottom: '0.25rem' }}>
                          {risk.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--facss-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(0,0,0,0.05)',
                              fontSize: '0.75rem',
                            }}
                          >
                            {categoryMeta.labelAr}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                          <MapPin size={14} color="var(--facss-gold-500)" />
                          {risk.governorate}
                          {risk.district && ` - ${risk.district}`}
                        </div>
                        {risk.generalLocation && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-muted)', marginTop: '0.2rem' }}>
                            {risk.generalLocation}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          {risk.likelihood} × {risk.impact} = <span style={{ color: levelMeta.color }}>{risk.riskScore}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-muted)' }}>
                          من 25
                        </div>
                      </td>

                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '6px',
                            background: levelMeta.bg,
                            color: levelMeta.color,
                            border: `1px solid ${levelMeta.border}`,
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            display: 'inline-block',
                          }}
                        >
                          {levelMeta.labelAr}
                        </span>
                      </td>

                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            background: statusMeta.bg,
                            color: statusMeta.color,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'inline-block',
                          }}
                        >
                          {statusMeta.labelAr}
                        </span>
                      </td>

                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                          <Shield size={16} color="var(--facss-gold-500)" />
                          {risk._count?.mitigations || 0} إجراءات
                        </div>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <Link
                          href={`/admin/risks/${risk.id}`}
                          className="btn btn-sm btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem' }}
                        >
                          <Eye size={14} />
                          التفاصيل والمعالجة
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE STANDALONE RISK */}
      {isStandaloneModalOpen && (
        <div className="facss-modal-overlay">
          <div className="facss-modal-content" style={{ maxWidth: '680px' }}>
            <div className="facss-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>تسجيل قيد خطر تشغيلي جديد (مستقل)</h3>
              <button
                onClick={() => setIsStandaloneModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--facss-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="facss-modal-body">
              {formError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              <div>
                <label className="form-label">عنوان الخطر التشغيلي *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: قطع طريق القوافل الإغاثية في نقيل هيجة العبد..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="facss-form-grid-2">
                <div>
                  <label className="form-label">تصنيف الخطر *</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="ARMED_CONFLICT_SECURITY">نزاع مسلح وتهديدات أمنية</option>
                    <option value="ACCESS_ROADBLOCK_DENIAL">إعاقة وصول وقطع طرق ونقاط تفتيش</option>
                    <option value="EXPLOSIVE_HAZARD_UXO">ألغام ومخلفات حرب (UXO)</option>
                    <option value="CRIMINALITY_THEFT">سطو مسلح وجريمة وسرقة قوافل</option>
                    <option value="STAFF_DETENTION_THREAT">احتجاز واعتداء على الطواقم الإنسانية</option>
                    <option value="FACILITY_DAMAGE">أضرار المقرات والمرافق والمخازن</option>
                    <option value="ENVIRONMENTAL_NATURAL">كوارث طبيعية وسيول وانهيارات</option>
                    <option value="HEALTH_SAFETY">صحة وسلامة مهنية وحوادث سير</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">المحافظة *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: لحج، عدن، تعز..."
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="facss-form-grid-2">
                <div>
                  <label className="form-label">المديرية (اختياري)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: المقاطرة، طور الباحة..."
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">الموقع العام غير الحساس</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: ممر العبور الإنساني الرئيسي..."
                    value={formData.generalLocation}
                    onChange={(e) => setFormData({ ...formData, generalLocation: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">الوصف التشغيلي المنقح *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="وصف الخطر وطبيعته والتهديد المترتب على الفرق الإنسانية بدون تفاصيل سرية أو إحداثيات حساسة..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {/* Assessment Sliders & Score Preview */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.03)',
                  padding: '1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--facss-border)',
                }}
              >
                <h5 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800 }}>
                  تقييم الخطر الأولي (Likelihood × Impact)
                </h5>

                <div className="facss-form-grid-2">
                  <div>
                    <label className="form-label">
                      الاحتمالية: <strong>{formData.likelihood}</strong>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={formData.likelihood}
                      onChange={(e) => setFormData({ ...formData, likelihood: parseInt(e.target.value, 10) })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-secondary)', marginTop: '0.25rem' }}>
                      {formData.likelihood === 1 && '1 - نادر الحدوث'}
                      {formData.likelihood === 2 && '2 - غير محتمل'}
                      {formData.likelihood === 3 && '3 - متوسط الاحتمال'}
                      {formData.likelihood === 4 && '4 - محتمل الحدوث'}
                      {formData.likelihood === 5 && '5 - شبه مؤكد الحدوث'}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">
                      شدة الأثر: <strong>{formData.impact}</strong>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={formData.impact}
                      onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value, 10) })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-secondary)', marginTop: '0.25rem' }}>
                      {formData.impact === 1 && '1 - طفيف / مهمل'}
                      {formData.impact === 2 && '2 - محدود'}
                      {formData.impact === 3 && '3 - متوسط'}
                      {formData.impact === 4 && '4 - كبير / جسيم'}
                      {formData.impact === 5 && '5 - كارثي'}
                    </div>
                  </div>
                </div>

                {/* Score Preview */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: getRiskLevelMeta(calculatedScore.level).bg,
                    border: `1px solid ${getRiskLevelMeta(calculatedScore.level).border}`,
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    الدرجة الناتجة: <strong>{calculatedScore.score} / 25</strong>
                  </span>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      background: getRiskLevelMeta(calculatedScore.level).color,
                      color: '#FFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                    }}
                  >
                    {getRiskLevelMeta(calculatedScore.level).labelAr}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">تاريخ الاستهداف لمعالجة الخطر (اختياري)</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.targetResolutionDate}
                  onChange={(e) => setFormData({ ...formData, targetResolutionDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsStandaloneModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ fontWeight: 700 }}
                >
                  {submitting ? 'جاري الحفظ...' : 'اعتماد وتسجيل الخطر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE RISK FROM VERIFIED INCIDENT */}
      {isFromIncidentModalOpen && (
        <div className="facss-modal-overlay">
          <div className="facss-modal-content" style={{ maxWidth: '750px' }}>
            <div className="facss-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link2 size={22} color="var(--facss-gold-500)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  اشتقاق قيد خطر من بلاغ ميداني تم التحقق منه
                </h3>
              </div>
              <button
                onClick={() => setIsFromIncidentModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--facss-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="facss-modal-body">
              {/* Step 1: Select verified incident */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 800 }}>
                  اختر البلاغ المحقق للربط والاشتقاق:
                </label>
                {loadingIncidents ? (
                  <div style={{ padding: '1rem', color: 'var(--facss-text-muted)' }}>جاري استرجاع البلاغات المحققة...</div>
                ) : verifiedIncidents.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', borderRadius: '8px', fontSize: '0.85rem' }}>
                    لا توجد بلاغات ميدانية محققة متاحة للربط حالياً.
                  </div>
                ) : (
                  <select
                    className="form-control"
                    value={selectedIncidentId}
                    onChange={(e) => handleSelectIncident(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">-- اضغط لاختيار بلاغ محقق --</option>
                    {verifiedIncidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.incidentNumber} - {inc.title} ({inc.governorate})
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--facss-text-muted)', marginTop: '0.35rem' }}>
                  * الضابط الأمني: يتم استيراد المعلومات المنقحة والمصرح بها فقط. أصول البلاغات وهويات المصادر المشفرة محجوبة تماماً.
                </div>
              </div>

              {/* Step 2: Form with preview data */}
              {selectedIncidentId && (
                <form onSubmit={handleCreateRisk} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {formError && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem' }}>
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="form-label">عنوان الخطر التشغيلي *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="facss-form-grid-2">
                    <div>
                      <label className="form-label">التصنيف المشتق *</label>
                      <select
                        className="form-control"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      >
                        <option value="ARMED_CONFLICT_SECURITY">نزاع مسلح وتهديدات أمنية</option>
                        <option value="ACCESS_ROADBLOCK_DENIAL">إعاقة وصول وقطع طرق ونقاط تفتيش</option>
                        <option value="EXPLOSIVE_HAZARD_UXO">ألغام ومخلفات حرب (UXO)</option>
                        <option value="CRIMINALITY_THEFT">سطو مسلح وجريمة وسرقة قوافل</option>
                        <option value="STAFF_DETENTION_THREAT">احتجاز واعتداء على الطواقم الإنسانية</option>
                        <option value="FACILITY_DAMAGE">أضرار المقرات والمرافق والمخازن</option>
                        <option value="ENVIRONMENTAL_NATURAL">كوارث طبيعية وسيول وانهيارات</option>
                        <option value="HEALTH_SAFETY">صحة وسلامة مهنية وحوادث سير</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">المحافظة *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.governorate}
                        onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">الوصف التشغيلي المنقح *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  {/* Assessment */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.03)',
                      padding: '1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--facss-border)',
                    }}
                  >
                    <h5 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800 }}>
                      التقييم المقترح للخطر (Likelihood × Impact)
                    </h5>

                    <div className="facss-form-grid-2">
                      <div>
                        <label className="form-label">
                          الاحتمالية: <strong>{formData.likelihood}</strong>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={formData.likelihood}
                          onChange={(e) => setFormData({ ...formData, likelihood: parseInt(e.target.value, 10) })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label className="form-label">
                          شدة الأثر: <strong>{formData.impact}</strong>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={formData.impact}
                          onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value, 10) })}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: getRiskLevelMeta(calculatedScore.level).bg,
                        border: `1px solid ${getRiskLevelMeta(calculatedScore.level).border}`,
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        الدرجة الناتجة: <strong>{calculatedScore.score} / 25</strong>
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          background: getRiskLevelMeta(calculatedScore.level).color,
                          color: '#FFF',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                        }}
                      >
                        {getRiskLevelMeta(calculatedScore.level).labelAr}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsFromIncidentModalOpen(false)}
                      className="btn btn-secondary"
                      disabled={submitting}
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                      style={{ fontWeight: 700 }}
                    >
                      {submitting ? 'جاري الحفظ...' : 'اعتماد وتسجيل الخطر المشتق'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
