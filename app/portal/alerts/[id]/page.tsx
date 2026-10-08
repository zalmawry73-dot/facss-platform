'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellRing,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Clock,
  Compass,
  Lock,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface AlertDetailProps {
  params: { id: string };
}

export default function PortalAlertDetailPage({ params }: AlertDetailProps) {
  const [alert, setAlert] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAlert = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/portal/alerts/${params.id}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'غير مصرح لك بالاطلاع على هذا التنبيه');
      }
      const data = await res.json();
      setAlert(data.alert);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
          <span className="text-sm font-medium">جاري تحميل وثيقة التنبيه الميداني المعتمد...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !alert) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-900/50 dark:bg-red-950/20">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-3 text-lg font-bold text-red-900 dark:text-red-200">تعذر عرض التنبيه</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {errorMessage || 'التنبيه غير متاح أو لا تملك تصريحاً بالاطلاع عليه.'}
          </p>
          <Link
            href="/portal/alerts"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة لقائمة التنبيهات الموجهة إليك</span>
          </Link>
        </div>
      </div>
    );
  }

  const isExecutive = alert.assignedTier === 'EXECUTIVE_FLASH_SUMMARY';

  return (
    <div className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/portal/alerts"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600 dark:text-slate-400"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة لقائمة التنبيهات</span>
          </Link>

          <span className="font-mono text-xs font-bold text-slate-500">
            {alert.alertNumber}
          </span>
        </div>

        {/* Precautionary Banner if applicable */}
        {alert.isPrecautionary && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">تنبيه احترازي بشأن معلومات غير مؤكدة بالكامل:</strong>
                هذا التنبيه صادر بناءً على تقييمات ميدانية أولية لم تكتمل بشأنها كافة معايير التحقق القطعي المستقل. يرجى توخي الحذر والالتزام بإرشادات السلامة دون اتخاذ قرارات مصيرية ما لم يتم تأكيد الوضع.
              </div>
            </div>
          </div>
        )}

        {/* Main Alert Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Header Banner */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-xs font-bold text-white dark:bg-amber-600">
                  {alert.alertNumber}
                </span>

                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {isExecutive ? 'المستوى 2: ملخص تنسيقي موجز' : 'المستوى 1: إحاطة تشغيلية منقحة'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>تاريخ الإصدار: {new Date(alert.dispatchedAt).toLocaleString('ar-YE')}</span>
              </div>
            </div>

            <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
              {alert.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-600" />
                <span>المحافظة المستهدفة: <strong>{alert.targetGovernorate}</strong></span>
              </div>

              {alert.targetDistricts && (
                <div className="flex items-center gap-1.5">
                  <span>المديريات / النطاقات: <strong>{alert.targetDistricts}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isExecutive ? 'خلاصة التقييم التنسيقي' : 'تفاصيل وسياق الإحاطة التشغيلية الميدانية'}
              </h2>
              <div className="rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                <p className="whitespace-pre-wrap">{alert.body}</p>
              </div>
            </div>

            {/* Movement Advice if provided */}
            {alert.movementAdvice && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-300 font-bold text-sm">
                  <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3>إرشادات الحركة والتنقل المعتمدة</h3>
                </div>
                <p className="text-xs leading-relaxed text-indigo-950 dark:text-indigo-200 whitespace-pre-wrap">
                  {alert.movementAdvice}
                </p>
              </div>
            )}

            {/* Security Verification Seal */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>وثيقة منقحة رقمياً وخاضعة للتسليم الداخلي المشفر عبر منصة المركز المتكامل</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                Snapshot v{alert.snapshotVersion}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
