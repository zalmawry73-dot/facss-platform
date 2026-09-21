'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellRing,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Eye,
  Users,
  Send,
  RefreshCw,
  FileCheck2,
  Lock,
} from 'lucide-react';

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
  };
  snapshots?: Array<{ id: string; approvalVersion: number; snapshotHash: string }>;
  recipients?: Array<{ id: string; alertTier: string; recipientUser: { fullName: string; role: string } }>;
}

interface AlertsManagerProps {
  currentUserRole: string;
  currentUserId: string;
}

const SEVERITY_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL_FLASH: {
    label: 'خاطف عاجل جداً (Critical Flash)',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
  },
  WARNING_HIGH: {
    label: 'تحذير أمني عالي (Warning High)',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
  },
  ADVISORY_WATCH: {
    label: 'إشعار توعوي / مراقبة (Advisory Watch)',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
  },
  INFORMATIONAL: {
    label: 'إحاطة إعلامية (Informational)',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  DRAFT: {
    label: 'مسودة قيد المراجعة',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
  },
  APPROVED: {
    label: 'معتمد (لقطة مجمدة)',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
  },
  ALERT_DISPATCHED: {
    label: 'تم التوزيع داخلياً',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
  },
};

export default function AlertsManager({ currentUserRole, currentUserId }: AlertsManagerProps) {
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

  const filteredAlerts = alerts.filter((alert) => {
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <BellRing className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  منظومة التنبيهات الميدانية المستهدفة
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  إعداد ومراجعة واعتماد التنبيهات الميدانية وتوزيعها الداخلي الآمن عبر المنصة
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/incidents"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>البلاغات الميدانية المنقحة</span>
            </Link>

            <button
              onClick={fetchAlerts}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Security Boundary Notice */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
          <Lock className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">ضابط الأمان والتوزيع الداخلي:</span> التوزيع محصور داخل المنصة (In-App Portal) لحسابات نشطة ومصرحة وفق اللقطات المجمدة المشفرة. لا يحتوي أي تنبيه على هوية المصادر أو وسائل اتصالهم أو إحداثياتهم الدقيقة. الاعتماد والإصدار محصوران بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً.
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم التنبيه، العنوان، أو المحافظة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pe-4 ps-10 text-sm outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-400"
            />
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">جميع مستويات الخطورة</option>
              <option value="CRITICAL_FLASH">خاطف عاجل جداً (Critical Flash)</option>
              <option value="WARNING_HIGH">تحذير أمني عالي (Warning High)</option>
              <option value="ADVISORY_WATCH">إشعار توعوي / مراقبة (Advisory Watch)</option>
              <option value="INFORMATIONAL">إحاطة إعلامية (Informational)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">جميع حالات التنبيه</option>
              <option value="DRAFT">مسودات قيد المراجعة</option>
              <option value="APPROVED">معتمد (لقطة مجمدة)</option>
              <option value="DISPATCHED">تم التوزيع الداخلي</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
            <span className="text-sm font-medium">جاري تحميل سجلات التنبيهات الميدانية...</span>
          </div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <BellRing className="h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">لا توجد تنبيهات مطابقة</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'جرّب تغيير خيارات البحث أو تصفية الحالة.'
              : 'لم يتم إعداد أي مسودات تنبيهات ميدانية بعد.'}
          </p>
          <Link
            href="/admin/incidents"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            <span>استعراض البلاغات المنقحة لصياغة تنبيه</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAlerts.map((alert) => {
            const sev = SEVERITY_MAP[alert.severity] || {
              label: alert.severity,
              color: 'text-slate-700',
              bg: 'bg-slate-100',
              border: 'border-slate-300',
            };

            const isDispatched = Boolean(alert.dispatchedAt);
            const isApproved = alert.approvalStatus === 'APPROVED' && !isDispatched;
            const statusConfig = isDispatched
              ? STATUS_MAP.ALERT_DISPATCHED
              : isApproved
              ? STATUS_MAP.APPROVED
              : STATUS_MAP.DRAFT;

            const recipientCount = alert.recipients ? alert.recipients.length : 0;

            return (
              <div
                key={alert.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {alert.alertNumber}
                      </span>

                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sev.bg} ${sev.color} ${sev.border}`}>
                        {sev.label}
                      </span>

                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>

                      {alert.isPrecautionary && (
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          معلومات غير مؤكدة / احترازي
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(alert.createdAt).toLocaleDateString('ar-YE')}</span>
                    </div>
                  </div>

                  {/* Titles Preview */}
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Tier 1 */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                      <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                        المستوى 1: الإحاطة التشغيلية المنقحة
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {alert.titleAr}
                      </h4>
                    </div>

                    {/* Tier 2 */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        المستوى 2: الملخص التنسيقي الموجز
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {alert.executiveTitleAr || 'غير محدد بعد'}
                      </h4>
                    </div>
                  </div>

                  {/* Target Geo & Metadata */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>نطاق التأثير: <strong>{alert.targetGovernorate}</strong></span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>المستلمون المحددون: <strong>{recipientCount} حساب</strong></span>
                      </span>

                      {alert.incident && (
                        <span className="flex items-center gap-1.5">
                          <FileCheck2 className="h-4 w-4 text-slate-400" />
                          <span>مرتبط بالبلاغ: <strong>{alert.incident.incidentNumber}</strong></span>
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/admin/alerts/${alert.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>فتح تفاصيل ومراجعة التنبيه</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
