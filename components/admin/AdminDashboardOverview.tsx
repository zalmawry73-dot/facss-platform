'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  FileText, 
  Mail, 
  Activity, 
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Layers,
  Calendar,
  Clock,
  AlertTriangle,
  FileCheck,
  Star,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminDataTable,
  AdminStatusBadge,
  AdminButton,
  type ColumnDef,
} from '@/components/admin/ui';
import type { ExecutiveDashboardKpis, KpiPeriod } from '@/lib/kpi-engine';

export interface DashboardMetrics {
  newRequestsCount: number;
  activeRequestsCount: number;
  pendingRegistrationsCount: number;
  unreadMessagesCount: number;
  totalClientsCount: number;
  totalTraineesCount: number;
  coursesCount: number;
  publicationsCount: number;
}

export interface SerializedRequest {
  id: string;
  requestNumber: string;
  organization: string;
  status: string;
  createdAt: string;
  serviceTitle: string;
}

export interface SerializedLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface Props {
  metrics: DashboardMetrics;
  recentRequests: SerializedRequest[];
  recentLogs: SerializedLog[];
  initialKpis?: ExecutiveDashboardKpis;
  locale?: string;
}

export default function AdminDashboardOverview({
  metrics,
  recentRequests,
  recentLogs,
  initialKpis,
  locale = 'ar',
}: Props) {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Time Filtering State (C4)
  const [selectedPeriod, setSelectedPeriod] = useState<KpiPeriod>(initialKpis?.period || '30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [kpis, setKpis] = useState<ExecutiveDashboardKpis | undefined>(initialKpis);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [activeTab, setActiveTab] = useState<'operations' | 'risks' | 'complaints' | 'qa' | 'training' | 'satisfaction'>('operations');

  // Fetch updated KPIs on period change
  const handlePeriodChange = async (period: KpiPeriod, cStart?: string, cEnd?: string) => {
    setSelectedPeriod(period);
    setIsLoadingKpis(true);
    try {
      let url = `/api/admin/kpis?range=${period}`;
      if (period === 'custom' && (cStart || customStart) && (cEnd || customEnd)) {
        url += `&startDate=${cStart || customStart}&endDate=${cEnd || customEnd}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setKpis(data.data);
      }
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setIsLoadingKpis(false);
    }
  };

  const actionableMetrics = [
    { 
      label: isAr ? 'طلبات جديدة بحاجة لمراجعة' : 'New Requests Requiring Review', 
      value: metrics.newRequestsCount, 
      color: '#DC2626', 
      bg: 'rgba(220, 38, 38, 0.08)',
      icon: ShieldAlert, 
      href: '/admin/requests?status=NEW',
      badge: isAr ? 'إجراء عاجل' : 'Urgent Action',
      helper: isAr ? 'تتطلب تدقيق الفريق الميداني' : 'Requires field team verification',
    },
    { 
      label: isAr ? 'طلبات نشطة قيد المتابعة' : 'Active Requests Underway', 
      value: metrics.activeRequestsCount, 
      color: '#0369A1', 
      bg: 'rgba(3, 105, 161, 0.08)',
      icon: Activity, 
      href: '/admin/requests',
      badge: isAr ? 'عمليات جارية' : 'In Progress',
      helper: isAr ? 'مهام استشارية وفنية نشطة' : 'Active operational missions',
    },
    { 
      label: isAr ? 'تسجيلات متدربين معلقة' : 'Pending Trainee Applications', 
      value: metrics.pendingRegistrationsCount, 
      color: '#D97706', 
      bg: 'rgba(217, 119, 6, 0.08)',
      icon: UserCheck, 
      href: '/admin/training',
      badge: isAr ? 'اعتماد المتدربين' : 'Trainee Approvals',
      helper: isAr ? 'بانتظار التحقق من المتطلبات' : 'Awaiting prerequisites review',
    },
    { 
      label: isAr ? 'رسائل واستفسارات غير مقروءة' : 'Unread Inquiries', 
      value: metrics.unreadMessagesCount, 
      color: '#7C3AED', 
      bg: 'rgba(124, 58, 237, 0.08)',
      icon: Mail, 
      href: '/admin/messages?status=UNREAD',
      badge: isAr ? 'صندوق الوارد' : 'Inbox',
      helper: isAr ? 'رسائل تواصل واستفسارات عامة' : 'General public & enterprise inquiries',
    },
  ];

  const requestColumns: ColumnDef<SerializedRequest>[] = [
    {
      key: 'requestNumber',
      header: isAr ? 'الرقم المرجعي' : 'Ref Number',
      render: (r) => (
        <Link
          href={`/admin/requests?id=${r.id}`}
          style={{
            color: 'var(--brand-gold-600)',
            fontWeight: 800,
            textDecoration: 'none',
            fontFamily: 'var(--font-en)',
            direction: 'ltr',
            display: 'inline-block',
          }}
        >
          {r.requestNumber}
        </Link>
      ),
    },
    {
      key: 'organization',
      header: isAr ? 'الجهة الطالبة' : 'Organization',
      render: (r) => <strong style={{ color: 'var(--text-primary)' }}>{r.organization}</strong>,
    },
    {
      key: 'service',
      header: isAr ? 'الخدمة' : 'Service',
      render: (r) => <span style={{ color: 'var(--text-secondary)' }}>{r.serviceTitle}</span>,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (r) => <AdminStatusBadge status={r.status} />,
    },
    {
      key: 'createdAt',
      header: isAr ? 'التاريخ' : 'Date',
      render: (r) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Unified Page Header */}
      <AdminPageHeader
        title={isAr ? 'لوحة المؤشرات والعمليات الإدارية' : 'Operations & Management Dashboard'}
        description={
          isAr
            ? 'نظرة شاملة ولحظية على مؤشرات الأداء، ضبط الجودة، ومصفوفات اتخاذ القرار'
            : 'Comprehensive real-time overview of KPIs, QA control, and operational decisions'
        }
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <AdminButton
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => handlePeriodChange(selectedPeriod)}
              disabled={isLoadingKpis}
            >
              {isLoadingKpis ? (isAr ? 'جارٍ التحديث...' : 'Refreshing...') : (isAr ? 'تحديث المؤشرات' : 'Refresh KPIs')}
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="sm"
              icon={Layers}
              href="/admin/system"
            >
              {isAr ? 'مركز التشغيل' : 'Operations Hub'}
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              icon={Activity}
              href="/admin/requests"
            >
              {isAr ? 'معالجة الطلبات' : 'Handle Requests'}
            </AdminButton>
          </div>
        }
      />

      {/* C4 — Time Range Filter Bar */}
      <div
        className="admin-card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          background: 'var(--surface-bg)',
          border: '1px solid var(--admin-card-border)',
          borderRadius: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-gold-600)', fontWeight: 700, fontSize: '0.85rem' }}>
            <Calendar size={18} />
            <span>{isAr ? 'النطاق الزمني:' : 'Period Range:'}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.04)', padding: '0.25rem', borderRadius: '8px' }}>
            {[
              { id: 'today', labelAr: 'اليوم', labelEn: 'Today' },
              { id: '7d', labelAr: 'آخر 7 أيام', labelEn: 'Last 7 Days' },
              { id: '30d', labelAr: 'آخر 30 يوماً', labelEn: 'Last 30 Days' },
              { id: 'custom', labelAr: 'مخصص...', labelEn: 'Custom...' },
            ].map((p) => {
              const active = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.id === 'custom') {
                      setIsCustomPickerOpen(!isCustomPickerOpen);
                      setSelectedPeriod('custom');
                    } else {
                      setIsCustomPickerOpen(false);
                      handlePeriodChange(p.id as KpiPeriod);
                    }
                  }}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? 'var(--brand-gold-600)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {isAr ? p.labelAr : p.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Window Indicator */}
        {kpis && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} />
            <span>
              {isAr ? 'الفترة المحسوبة:' : 'Calculated Period:'}{' '}
              <strong style={{ color: 'var(--text-primary)', direction: 'ltr', display: 'inline-block' }}>
                {new Date(kpis.dateRange.startDate).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')} - {new Date(kpis.dateRange.endDate).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Custom Date Picker Dropdown (C4) */}
      {isCustomPickerOpen && (
        <div
          className="admin-card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            background: 'var(--surface-bg)',
            border: '1px solid var(--brand-gold-500)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {isAr ? 'من تاريخ:' : 'From:'}
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--admin-card-border)',
                background: 'var(--input-bg, #fff)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {isAr ? 'إلى تاريخ:' : 'To:'}
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--admin-card-border)',
                background: 'var(--input-bg, #fff)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => {
              if (customStart && customEnd) {
                handlePeriodChange('custom', customStart, customEnd);
              }
            }}
            disabled={!customStart || !customEnd || isLoadingKpis}
          >
            {isAr ? 'تطبيق النطاق المخصص' : 'Apply Custom Range'}
          </AdminButton>
        </div>
      )}

      {/* C3 & C5: Executive Operations & Incident KPI Cards */}
      {kpis && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'المؤشرات التشغيلية والالتزام باتفاقيات الخدمة (SLA)' : 'Operational Intelligence & SLA Performance'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isAr ? 'بيانات حقيقية مستخرجة من قاعدة البيانات' : 'Authentic database aggregations'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* SLA Compliance Rate (C3) */}
            <div
              className="admin-card"
              style={{
                padding: '1.1rem',
                background: 'var(--surface-bg)',
                border: '1px solid var(--admin-card-border)',
                borderTop: '4px solid #16A34A',
                borderRadius: '12px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isAr ? 'نسبة الامتثال للمهلة (SLA)' : 'SLA Compliance Rate'}
                </span>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', fontWeight: 700 }}>
                  Incident SLA
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {kpis.operations.slaComplianceRate.displayValue}
              </div>
              {kpis.operations.slaComplianceRate.comparisonPeriod && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', marginTop: '0.35rem', color: kpis.operations.slaComplianceRate.comparisonPeriod.percentageChange! >= 0 ? '#16A34A' : '#DC2626' }}>
                  {kpis.operations.slaComplianceRate.comparisonPeriod.percentageChange! >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{kpis.operations.slaComplianceRate.comparisonPeriod.percentageChange! > 0 ? '+' : ''}{kpis.operations.slaComplianceRate.comparisonPeriod.percentageChange}% {isAr ? 'مقارنة بالفترة السابقة' : 'vs prev period'}</span>
                </div>
              )}
              <Link
                href="/admin/incidents"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  color: 'var(--brand-gold-600)',
                  fontWeight: 600,
                  marginTop: '0.6rem',
                  textDecoration: 'none',
                }}
              >
                <span>{isAr ? 'عرض بلاغات SLA' : 'Drill-down'}</span>
                <ArrowIcon size={12} />
              </Link>
            </div>

            {/* SLA Breach Rate (C3) */}
            <div
              className="admin-card"
              style={{
                padding: '1.1rem',
                background: 'var(--surface-bg)',
                border: '1px solid var(--admin-card-border)',
                borderTop: '4px solid #DC2626',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isAr ? 'نسبة تجاوز المهلة (Breach)' : 'SLA Breach Rate'}
                </span>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontWeight: 700 }}>
                  Breach
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {kpis.operations.slaBreachRate.displayValue}
              </div>
              <Link
                href="/admin/incidents?filter=BREACHED"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#DC2626',
                  fontWeight: 600,
                  marginTop: '0.6rem',
                  textDecoration: 'none',
                }}
              >
                <span>{isAr ? 'تحليل البلاغات المتجاوزة' : 'Drill-down Breached'}</span>
                <ArrowIcon size={12} />
              </Link>
            </div>

            {/* Critical Incidents (C3, C5 Drill-down) */}
            <div
              className="admin-card"
              style={{
                padding: '1.1rem',
                background: 'var(--surface-bg)',
                border: '1px solid var(--admin-card-border)',
                borderTop: '4px solid #EA580C',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isAr ? 'بلاغات طارئة وحرجة' : 'Critical Incidents'}
                </span>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C', fontWeight: 700 }}>
                  Critical
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {kpis.operations.criticalIncidents.displayValue}
              </div>
              <Link
                href="/admin/incidents?filter=CRITICAL"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#EA580C',
                  fontWeight: 600,
                  marginTop: '0.6rem',
                  textDecoration: 'none',
                }}
              >
                <span>{isAr ? 'استعراض البلاغات الحرجة' : 'Drill-down Critical'}</span>
                <ArrowIcon size={12} />
              </Link>
            </div>

            {/* Open / Active Incidents (C3, C5 Drill-down) */}
            <div
              className="admin-card"
              style={{
                padding: '1.1rem',
                background: 'var(--surface-bg)',
                border: '1px solid var(--admin-card-border)',
                borderTop: '4px solid #0284C7',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isAr ? 'بلاغات مفتوحة قيد المتابعة' : 'Open Incidents'}
                </span>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', fontWeight: 700 }}>
                  Active
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {kpis.operations.openIncidents.displayValue}
              </div>
              <Link
                href="/admin/incidents?filter=OPEN"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#0284C7',
                  fontWeight: 600,
                  marginTop: '0.6rem',
                  textDecoration: 'none',
                }}
              >
                <span>{isAr ? 'عرض البلاغات المفتوحة' : 'Drill-down Open'}</span>
                <ArrowIcon size={12} />
              </Link>
            </div>

            {/* Average First Response Time (C3) */}
            <div
              className="admin-card"
              style={{
                padding: '1.1rem',
                background: 'var(--surface-bg)',
                border: '1px solid var(--admin-card-border)',
                borderTop: '4px solid #7C3AED',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isAr ? 'متوسط سرعة الاستجابة الأولى' : 'Avg First Response'}
                </span>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontWeight: 700 }}>
                  FRT
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {kpis.operations.averageFirstResponseTimeMinutes.displayValue}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {isAr ? 'من لحظة استلام البلاغ إلى أول استجابة' : 'From receipt to initial response'}
              </div>
            </div>

            {/* Escalated & Unassigned Incidents */}
            <div
              className="admin-card"
              style={{
                padding: '1.1rem',
                background: 'var(--surface-bg)',
                border: '1px solid var(--admin-card-border)',
                borderTop: '4px solid var(--brand-gold-500)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isAr ? 'بلاغات مصعّدة / غير مسندة' : 'Escalated / Unassigned'}
                </span>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--brand-gold-600)', fontWeight: 700 }}>
                  Queue
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{isAr ? 'مصعّدة' : 'Escalated'}</span>
                  <Link href="/admin/incidents?filter=ESCALATED" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#DC2626', textDecoration: 'none' }}>
                    {kpis.operations.escalatedIncidents.displayValue}
                  </Link>
                </div>
                <div style={{ borderLeft: '1px solid var(--admin-card-border)', paddingLeft: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{isAr ? 'غير مسندة' : 'Unassigned'}</span>
                  <Link href="/admin/incidents?filter=UNASSIGNED" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-gold-600)', textDecoration: 'none' }}>
                    {kpis.operations.unassignedIncidents.displayValue}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C13: Domain Intelligence Sections Tabs */}
      {kpis && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '2px solid var(--admin-card-border)',
              marginBottom: '1.25rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}
          >
            {[
              { id: 'operations', labelAr: 'مصفوفة البلاغات', labelEn: 'Incidents Matrix', icon: ShieldAlert },
              { id: 'risks', labelAr: 'ذكاء المخاطر', labelEn: 'Risk Intelligence', icon: AlertTriangle },
              { id: 'complaints', labelAr: 'الشكاوى والطلبات', labelEn: 'Complaints & Services', icon: Mail },
              { id: 'qa', labelAr: 'ضبط جودة التقارير (QA)', labelEn: 'Report QA', icon: FileCheck },
              { id: 'training', labelAr: 'مؤشرات التدريب والتحسن', labelEn: 'Training Gain', icon: GraduationCap },
              { id: 'satisfaction', labelAr: 'رضا العملاء', labelEn: 'Client Satisfaction', icon: Star },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.6rem 1rem',
                    background: active ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: active ? '3px solid var(--brand-gold-600)' : '3px solid transparent',
                    color: active ? 'var(--brand-gold-600)' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  <TabIcon size={16} />
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OPERATIONS MATRIX */}
          {activeTab === 'operations' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Category Breakdown */}
              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                  {isAr ? 'توزيع البلاغات حسب الفئة التشغيلية' : 'Incidents by Category'}
                </h4>
                {Object.keys(kpis.operations.incidentsByCategory).length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{isAr ? 'لا توجد بلاغات مسجلة في هذه الفترة' : 'No incidents recorded in period'}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(kpis.operations.incidentsByCategory).map(([cat, count]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px dashed var(--admin-card-border)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>{count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority Breakdown */}
              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                  {isAr ? 'توزيع البلاغات حسب مستوى الأولوية' : 'Incidents by Priority'}
                </h4>
                {Object.keys(kpis.operations.incidentsByPriority).length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{isAr ? 'لا توجد بلاغات مسجلة' : 'No records'}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(kpis.operations.incidentsByPriority).map(([prio, count]) => (
                      <div key={prio} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px dashed var(--admin-card-border)' }}>
                        <span style={{ color: prio === 'CRITICAL_EMERGENCY' ? '#DC2626' : 'var(--text-secondary)' }}>{prio}</span>
                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>{count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RISK INTELLIGENCE (C6) */}
          {activeTab === 'risks' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'إجمالي المخاطر النشطة' : 'Active Risks'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.risks.totalActiveRisks.displayValue}
                </div>
                <Link href="/admin/risks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: 'var(--brand-gold-600)', marginTop: '0.6rem', textDecoration: 'none' }}>
                  <span>{isAr ? 'الانتقال لسجل المخاطر' : 'View Risk Register'}</span>
                  <ArrowIcon size={12} />
                </Link>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'مخاطر عالية وحرجة' : 'Critical / High Risks'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.risks.criticalHighRisks.displayValue}
                </div>
                <Link href="/admin/risks?level=CRITICAL" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#DC2626', marginTop: '0.6rem', textDecoration: 'none' }}>
                  <span>{isAr ? 'فلترة المخاطر الحرجة' : 'Drill-down Critical'}</span>
                  <ArrowIcon size={12} />
                </Link>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'إجراءات معالجة متأخرة' : 'Overdue Mitigations'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.risks.overdueMitigations.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? 'تجاوزت تاريخ الاستحقاق المستهدف' : 'Exceeded target completion date'}
                </div>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'نسبة إنجاز خطط المعالجة' : 'Treatment Completion Rate'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.risks.treatmentCompletionRate.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? `المكتمل: ${kpis.risks.completedMitigations.displayValue} إجراء` : `${kpis.risks.completedMitigations.displayValue} actions completed`}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLAINTS & SERVICES (C7) */}
          {activeTab === 'complaints' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'شكاوى مفتوحة قيد المعالجة' : 'Open Complaints'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.complaintsAndServices.openComplaints.displayValue}
                </div>
                <Link href="/admin/messages?type=COMPLAINT&status=UNREAD" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#DC2626', marginTop: '0.6rem', textDecoration: 'none' }}>
                  <span>{isAr ? 'استعراض الشكاوى المفتوحة' : 'View Open Complaints'}</span>
                  <ArrowIcon size={12} />
                </Link>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'امتثال SLA للشكاوى' : 'Complaint SLA Compliance'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.complaintsAndServices.complaintSlaComplianceRate.displayValue}
                </div>
                <Link href="/admin/messages?type=COMPLAINT" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: 'var(--brand-gold-600)', marginTop: '0.6rem', textDecoration: 'none' }}>
                  <span>{isAr ? 'سجل الشكاوى العام' : 'All Complaints'}</span>
                  <ArrowIcon size={12} />
                </Link>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'متوسط وقت الحل' : 'Avg Resolution Time'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                  {kpis.complaintsAndServices.averageResolutionTimeHours.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? 'محسوب للشكاوى المنجزة' : 'Calculated for resolved complaints'}
                </div>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'طلبات الخدمات المكتملة' : 'Completed Requests'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0369A1', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.complaintsAndServices.completedServiceRequests.displayValue}
                </div>
                <Link href="/admin/requests?status=COMPLETED" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#0369A1', marginTop: '0.6rem', textDecoration: 'none' }}>
                  <span>{isAr ? 'عرض الطلبات المكتملة' : 'View Completed'}</span>
                  <ArrowIcon size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 4: REPORT QUALITY ASSURANCE (C8, C9) */}
          {activeTab === 'qa' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'تقارير بانتظار مراجعة الجودة' : 'Reports Awaiting QA'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.qualityAssurance.reportsAwaitingQa.displayValue}
                </div>
                <Link href="/admin/requests" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#D97706', marginTop: '0.6rem', textDecoration: 'none' }}>
                  <span>{isAr ? 'إجراء مراجعة التقارير' : 'Review Reports'}</span>
                  <ArrowIcon size={12} />
                </Link>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'نسبة اجتياز الجودة (QA Pass)' : 'QA Pass Rate'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.qualityAssurance.qaPassRate.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? `معتمد: ${kpis.qualityAssurance.reportsApproved.displayValue} | معاد: ${kpis.qualityAssurance.reportsRejected.displayValue}` : `Approved: ${kpis.qualityAssurance.reportsApproved.displayValue}`}
                </div>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'متوسط وقت المراجعة والاعتماد' : 'Avg QA Turnaround'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                  {kpis.qualityAssurance.averageQaTurnaroundHours.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? 'من الرفع حتى اعتماد الجودة' : 'From upload to QA approval'}
                </div>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'تقارير مسلّمة ومقبولة من العميل' : 'Delivered & Accepted'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.qualityAssurance.clientAcceptedReports.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? `إجمالي المسلّم: ${kpis.qualityAssurance.deliveredReports.displayValue}` : `Delivered total: ${kpis.qualityAssurance.deliveredReports.displayValue}`}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TRAINING & MATHEMATICAL IMPROVEMENT (C10) */}
          {activeTab === 'training' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'نسبة الحضور والالتزام' : 'Attendance Rate'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16A34A', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.training.attendanceRate.displayValue}
                </div>
                <Link href="/admin/training" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: 'var(--brand-gold-600)', marginTop: '0.6rem', textDecoration: 'none' }}>
                  <span>{isAr ? 'إدارة البرامج التدريبية' : 'Manage Training'}</span>
                  <ArrowIcon size={12} />
                </Link>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'المشاركة في التقييمات' : 'Evaluation Participation'}</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.training.evaluationParticipationRate.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? 'نسبة المتدربين المكملين للتقييمات' : 'Trainees completing evaluations'}
                </div>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isAr ? 'معدل التحسن المعرفي المكتسب (Pre/Post Test Gain)' : 'Average Knowledge Improvement Gain'}
                  </span>
                  <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--brand-gold-600)', fontWeight: 700 }}>
                    Formula: Normalized Post% - Pre%
                  </span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-gold-600)', marginTop: '0.3rem' }}>
                  {kpis.training.averageImprovementRate.displayValue}
                </div>
                {kpis.training.averageImprovementRate.notes && (
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                    {kpis.training.averageImprovementRate.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CLIENT SATISFACTION (C11, C12) */}
          {activeTab === 'satisfaction' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'معدل رضا العملاء الإجمالي' : 'Overall Customer Satisfaction'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <Star size={24} style={{ color: '#EAB308', fill: '#EAB308' }} />
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {kpis.clientSatisfaction.averageSatisfaction.displayValue}
                  </div>
                </div>
                {kpis.clientSatisfaction.isSmallSample && (
                  <div style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.08)', color: '#D97706', fontSize: '0.72rem', marginTop: '0.5rem', fontWeight: 600 }}>
                    {isAr ? 'تنبيه: حجم العينة صغير للتعميم الإحصائي' : 'Note: Small sample size for generalization'}
                  </div>
                )}
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'جودة الخدمة المقدمة' : 'Service Quality Average'}</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.clientSatisfaction.serviceQualityAverage.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? 'مقياس موحد من 1 إلى 5 نجوم' : 'Standard 1 to 5 scale'}
                </div>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'الالتزام بالمواعيد والتسليم' : 'Timeliness Average'}</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.clientSatisfaction.timelinessAverage.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? 'مقياس موحد من 1 إلى 5 نجوم' : 'Standard 1 to 5 scale'}
                </div>
              </div>

              <div className="admin-card" style={{ padding: '1.25rem', background: 'var(--surface-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{isAr ? 'التواصل والمتابعة الميدانية' : 'Communication Average'}</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem', fontFamily: 'var(--font-en)' }}>
                  {kpis.clientSatisfaction.communicationAverage.displayValue}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {isAr ? 'مقياس موحد من 1 إلى 5 نجوم' : 'Standard 1 to 5 scale'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4 Actionable Legacy Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {actionableMetrics.map((m, idx) => (
          <AdminStatCard
            key={idx}
            label={m.label}
            value={m.value}
            icon={m.icon}
            color={m.color}
            bg={m.bg}
            badge={m.badge}
            helper={m.helper}
            href={m.href}
          />
        ))}
      </div>

      {/* Secondary Platform Totals Strip */}
      <div
        className="admin-card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          background: 'var(--surface-bg)',
          border: '1px solid var(--admin-card-border)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--brand-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'إجمالي العملاء والمؤسسات' : 'Total Clients & Enterprises'}
              </span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {metrics.totalClientsCount}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(3, 105, 161, 0.1)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'المتدربون المسجلون' : 'Registered Trainees'}
              </span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {metrics.totalTraineesCount}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(21, 128, 61, 0.1)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'البرامج التدريبية النشطة' : 'Active Courses'}
              </span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {metrics.coursesCount}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(100, 116, 139, 0.1)', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {isAr ? 'الدراسات والأبحاث المنشورة' : 'Published Studies'}
              </span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                {metrics.publicationsCount}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Latest Requests & Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Latest Requests Table */}
        <AdminSection
          title={isAr ? 'أحدث طلبات الخدمات' : 'Latest Service Requests'}
          description={isAr ? 'الطلبات الميدانية والاستشارية الواردة مؤخراً' : 'Recently submitted field requests'}
          actions={
            <Link
              href="/admin/requests"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                color: 'var(--brand-gold-600)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>{isAr ? 'عرض كافة الطلبات' : 'View All'}</span>
              <ArrowIcon size={14} />
            </Link>
          }
        >
          <AdminDataTable
            columns={requestColumns}
            data={recentRequests}
            emptyMessage={isAr ? 'لا توجد طلبات واردة حالياً' : 'No service requests found'}
          />
        </AdminSection>

        {/* Recent Audit / Activity Logs */}
        <AdminSection
          title={isAr ? 'سجل العمليات والرقابة' : 'Audit & Operational Activity'}
          description={isAr ? 'أحدث العمليات الإدارية والميدانية الموثقة' : 'Latest administrative & field actions'}
          actions={
            <Link
              href="/admin/audit-logs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                color: 'var(--brand-gold-600)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>{isAr ? 'سجل التدقيق الكامل' : 'Full Audit Log'}</span>
              <ArrowIcon size={14} />
            </Link>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentLogs.map((l) => (
              <div
                key={l.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'var(--admin-table-row-hover)',
                  border: '1px solid var(--admin-card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>
                    {l.action}
                  </strong>
                  {l.details && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {l.details}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(l.createdAt).toLocaleTimeString(isAr ? 'ar-YE' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </AdminSection>
      </div>
    </div>
  );
}
