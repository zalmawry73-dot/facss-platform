'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellRing,
  ShieldAlert,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface PortalAlertItem {
  id: string;
  alertNumber: string;
  severity: string;
  title: string;
  targetGovernorate: string;
  dispatchedAt: string;
  alertTier: string;
  isRead: boolean;
  readAt?: string | null;
  isPrecautionary: boolean;
}

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CRITICAL_FLASH: {
    label: 'خاطف عاجل جداً',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
  },
  WARNING_HIGH: {
    label: 'تحذير أمني عالي',
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
  },
  ADVISORY_WATCH: {
    label: 'إشعار توعوي ومراقبة',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  INFORMATIONAL: {
    label: 'إحاطة إعلامية',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
};

export default function PortalAlertsPage() {
  const [alerts, setAlerts] = useState<PortalAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/portal/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load portal alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAlerts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <BellRing className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  التنبيهات الميدانية المعتمدة
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  إحاطات وتنبيهات أمنية صادرة وموجهة لحسابك وفق مستويات الاطلاع المعتمدة
                </p>
              </div>
            </div>

            <button
              onClick={fetchMyAlerts}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              جميع التنبيهات منقحة ومراجعة ومحققة أمنياً وفق منهجيات مركز عدن الدولي. المحتوى المعروض مقيد بنطاق تصريح حسابك.
            </span>
          </div>
        </div>

        {/* Alerts List */}
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
                <span className="text-sm">جاري جلب التنبيهات الموجهة إليك...</span>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">لا توجد تنبيهات نشطة موجهة إليك</h3>
              <p className="mt-1 text-sm text-slate-500">الوضع الميداني مستقر حالياً ضمن نطاق اختصاص حسابك.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const sev = SEVERITY_CONFIG[alert.severity] || {
                label: alert.severity,
                bg: 'bg-slate-100',
                text: 'text-slate-700',
                border: 'border-slate-300',
              };

              const isExec = alert.alertTier === 'EXECUTIVE_FLASH_SUMMARY';

              return (
                <div
                  key={alert.id}
                  className={`overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                    alert.isRead
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-amber-400/60 bg-amber-50/10 dark:border-amber-600/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {alert.alertNumber}
                      </span>

                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${sev.bg} ${sev.text} ${sev.border}`}>
                        {sev.label}
                      </span>

                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {isExec ? 'ملخص تنسيقي موجز' : 'إحاطة تشغيلية منقحة'}
                      </span>

                      {alert.isPrecautionary && (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          احترازي
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(alert.dispatchedAt).toLocaleString('ar-YE')}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {alert.title}
                    </h3>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>النطاق المستهدف: <strong>{alert.targetGovernorate}</strong></span>
                    </div>

                    <Link
                      href={`/portal/alerts/${alert.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>عرض تفاصيل التنبيه الكاملة</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
