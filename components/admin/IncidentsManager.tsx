'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Eye,
  UserCheck,
  FileText,
  Lock,
  RefreshCw,
} from 'lucide-react';

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
  ARMED_CONFLICT_TACTICAL: 'نزاع مسلح وتكتيكي',
  HUMANITARIAN_ACCESS_DENIAL: 'إعاقة وصول إنساني',
  PHYSICAL_ATTACK_THREAT: 'اعتداء وتهديد مباشر',
  UXO_LANDMINE_HAZARD: 'مخاطر ألغام ومخلفات حرب',
  CIVIL_UNREST_ROADBLOCK: 'اضطرابات وقطع طرق',
  DETENTION_HARASSMENT: 'احتجاز ومضايقات',
  NATURAL_DISASTER_ENVIRONMENTAL: 'كوارث ومخاطر بيئية',
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  RECEIVED: { label: 'مستلم جديد', className: 'badge-blue' },
  TRIAGED: { label: 'تم الفرز', className: 'badge-yellow' },
  REDACTED: { label: 'تم التنقيح', className: 'badge-gold' },
  ASSIGNED: { label: 'مُسند للمتابعة', className: 'badge-purple' },
  UNDER_VERIFICATION: { label: 'قيد التحقق الميداني', className: 'badge-yellow' },
  VERIFIED: { label: 'متحقق منه ومؤكد', className: 'badge-green' },
  UNCONFIRMED: { label: 'غير مؤكد', className: 'badge-gray' },
  CONTRADICTED: { label: 'متناقض', className: 'badge-red' },
  DISPROVED: { label: 'مفند ومستبعد', className: 'badge-red' },
  DUPLICATE: { label: 'بلاغ مكرر', className: 'badge-gray' },
  ALERT_DRAFTED: { label: 'صيغت مسودة تنبيه', className: 'badge-yellow' },
  ALERT_APPROVED: { label: 'اعتمد التنبيه', className: 'badge-green' },
  ALERT_DISPATCHED: { label: 'تم نشر التنبيه', className: 'badge-green' },
  CLOSED: { label: 'مغلق', className: 'badge-gray' },
  ARCHIVED: { label: 'مؤرشف', className: 'badge-gray' },
};

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  LOW: { label: 'منخفضة', className: 'badge-green' },
  MEDIUM: { label: 'متوسطة', className: 'badge-blue' },
  HIGH: { label: 'عالية', className: 'badge-yellow' },
  CRITICAL_EMERGENCY: { label: 'طارئة وقصوى', className: 'badge-red' },
};

export default function IncidentsManager({
  initialIncidents = [],
  currentUserRole,
  currentUserId,
}: IncidentsManagerProps) {
  const [incidents, setIncidents] = useState<IncidentItem[]>(initialIncidents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

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

  const filtered = incidents.filter((inc) => {
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

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div>
      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={24} color="#c59b27" />
              <span>منظومة البلاغات الميدانية والتحقق الأمني</span>
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isSuperAdmin
                ? 'استعراض وفرز البلاغات الميدانية الحساسة، إدارة التنقيح، إسناد مهام التحقق، واعتماد التحديثات (إدارة عليا)'
                : 'قائمة البلاغات المسندة إليك رسمياً — استعراض النسخ المنقحة المعتمدة وتوثيق التحقق الميداني بمعيار أدميرالتي'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={fetchIncidents}
              disabled={isLoading}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>تحديث</span>
            </button>
            <Link
              href="/portal/field/intake"
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 700 }}
            >
              تقديم بلاغ ميداني جديد
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="بحث برقم البلاغ، العنوان المنقح، أو المحافظة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
          </div>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="ALL">جميع الحالات</option>
            {Object.entries(STATUS_BADGES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ minWidth: '130px' }}
          >
            <option value="ALL">جميع الأولويات</option>
            {Object.entries(PRIORITY_BADGES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ minWidth: '170px' }}
          >
            <option value="ALL">جميع التصنيفات</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Incidents Table / Cards */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <ShieldAlert size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#FFF' }}>
              {isSuperAdmin ? 'لم يتم العثور على بلاغات ميدانية مطابقة للبحث' : 'لا توجد بلاغات ميدانية مسندة إليك حالياً'}
            </p>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.4rem', display: 'block' }}>
              {isSuperAdmin
                ? 'يمكنك استقبال البلاغات عبر البوابة الميدانية أو تعديل معايير التصفية أعلاه.'
                : 'يتم إظهار البلاغات حصراً فور قيام الإدارة العليا بتنقيحها واعتمادها وإسنادها إلى حسابك وفق قاعدة الاستحقاق الثلاثي.'}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم البلاغ والتاريخ</th>
                  <th>التصنيف والأولوية</th>
                  <th>الموقع الجغرافي</th>
                  <th>العنوان المنقح / التفاصيل</th>
                  <th>الحالة والإسناد</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => {
                  const statusInfo = STATUS_BADGES[inc.status] || { label: inc.status, className: 'badge-gray' };
                  const priorityInfo = PRIORITY_BADGES[inc.priority] || { label: inc.priority, className: 'badge-blue' };

                  return (
                    <tr key={inc.id}>
                      <td>
                        <strong style={{ display: 'block', color: '#c59b27', letterSpacing: '0.5px', fontSize: '0.9rem' }}>
                          {inc.incidentNumber}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(inc.incidentDate).toLocaleString('ar-YE', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </td>

                      <td>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#FFF', marginBottom: '0.2rem' }}>
                          {CATEGORY_LABELS[inc.category] || inc.category}
                        </span>
                        <span className={`badge ${priorityInfo.className}`} style={{ fontSize: '0.72rem' }}>
                          {priorityInfo.label}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#FFF' }}>
                          <MapPin size={14} color="#c59b27" />
                          <span>{inc.governorate}</span>
                          {inc.district && <span style={{ color: 'var(--text-muted)' }}>- {inc.district}</span>}
                        </div>
                      </td>

                      <td>
                        {inc.currentRedacted ? (
                          <div>
                            <strong style={{ display: 'block', color: '#FFF', fontSize: '0.88rem', marginBottom: '0.2rem' }}>
                              {inc.currentRedacted.redactedTitleAr}
                            </strong>
                            <span style={{ fontSize: '0.74rem', color: inc.currentRedacted.isApproved ? '#22c55e' : '#eab308' }}>
                              {inc.currentRedacted.isApproved ? '✓ نسخة منقحة معتمدة' : 'مسودة تنقيح غير معتمدة'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            بانتظار الفرز والتنقيح من الإدارة العليا
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                          <span className={`badge ${statusInfo.className}`} style={{ fontSize: '0.75rem' }}>
                            {statusInfo.label}
                          </span>

                          {isSuperAdmin && inc.activeAssignments && inc.activeAssignments.length > 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <UserCheck size={11} />
                              <span>مكلف: {inc.activeAssignments.map(a => a.assignedTo.fullName).join(', ')}</span>
                            </span>
                          )}

                          {!isSuperAdmin && inc.myAssignment && (
                            <span style={{ fontSize: '0.72rem', color: '#93c5fd' }}>
                              مهمتك: {inc.myAssignment.roleScope === 'VERIFIER' ? 'التحقق الميداني' : 'التحليل والتقييم'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <Link
                          href={`/admin/incidents/${inc.id}`}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} />
                          <span>فتح الملف</span>
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
    </div>
  );
}
