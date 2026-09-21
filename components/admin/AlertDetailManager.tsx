'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellRing,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Users,
  Lock,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  FileCheck2,
  Eye,
  Hash,
  XCircle,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';

interface AlertDetailProps {
  alertId: string;
  currentUserRole: string;
  currentUserId: string;
}

export default function AlertDetailManager({
  alertId,
  currentUserRole,
  currentUserId,
}: AlertDetailProps) {
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const [alert, setAlert] = useState<any>(null);
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'RECIPIENTS' | 'APPROVAL' | 'DELIVERY'>('CONTENT');

  // Draft edit form state
  const [severity, setSeverity] = useState('WARNING_HIGH');
  const [titleAr, setTitleAr] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [executiveTitleAr, setExecutiveTitleAr] = useState('');
  const [executiveSummaryAr, setExecutiveSummaryAr] = useState('');
  const [movementAdviceAr, setMovementAdviceAr] = useState('');
  const [targetGovernorate, setTargetGovernorate] = useState('');
  const [targetDistricts, setTargetDistricts] = useState('');
  const [isPrecautionary, setIsPrecautionary] = useState(false);

  // Recipients state
  const [recipientsList, setRecipientsList] = useState<Array<{ recipientUserId: string; alertTier: string }>>([]);
  const [selectedNewUser, setSelectedNewUser] = useState('');
  const [selectedNewTier, setSelectedNewTier] = useState('REDACTED_OPERATIONAL_BRIEFING');

  // Action states
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingRecipients, setIsSavingRecipients] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchAlertDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/alerts/${alertId}`);
      if (res.ok) {
        const data = await res.json();
        const a = data.alert;
        setAlert(a);

        // Populate edit form
        setSeverity(a.severity);
        setTitleAr(a.titleAr || '');
        setBodyAr(a.bodyAr || '');
        setExecutiveTitleAr(a.executiveTitleAr || '');
        setExecutiveSummaryAr(a.executiveSummaryAr || '');
        setMovementAdviceAr(a.movementAdviceAr || '');
        setTargetGovernorate(a.targetGovernorate || '');
        
        let dist = '';
        try {
          const parsed = JSON.parse(a.targetDistricts);
          dist = Array.isArray(parsed) ? parsed.join(', ') : a.targetDistricts;
        } catch {
          dist = a.targetDistricts || '';
        }
        setTargetDistricts(dist);
        setIsPrecautionary(Boolean(a.isPrecautionary));

        // Populate recipients
        if (a.recipients) {
          setRecipientsList(
            a.recipients.map((r: any) => ({
              recipientUserId: r.recipientUserId,
              alertTier: r.alertTier,
            }))
          );
        }
      }

      // Fetch eligible users
      const recRes = await fetch(`/api/admin/alerts/${alertId}/recipients`);
      if (recRes.ok) {
        const recData = await recRes.json();
        setEligibleUsers(recData.eligibleUsers || []);
      }
    } catch (err) {
      console.error('Failed to load alert details', err);
      setErrorMessage('تعذر تحميل بيانات التنبيه من الخادم');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertDetails();
  }, [alertId]);

  // Handle Draft Save
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDraft(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const districtsArr = targetDistricts
        .split(/[,،]/)
        .map((d) => d.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity,
          titleAr,
          bodyAr,
          executiveTitleAr,
          executiveSummaryAr,
          movementAdviceAr,
          targetGovernorate,
          targetDistricts: districtsArr,
          isPrecautionary,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ تعديلات التنبيه');
      }

      setSuccessMessage(data.notice || 'تم حفظ مسودة التنبيه بنجاح');
      fetchAlertDetails();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Add Recipient
  const handleAddRecipient = () => {
    if (!selectedNewUser) return;
    if (recipientsList.some((r) => r.recipientUserId === selectedNewUser)) {
      setErrorMessage('المستخدم محدد مسبقاً في القائمة');
      return;
    }
    setRecipientsList([
      ...recipientsList,
      { recipientUserId: selectedNewUser, alertTier: selectedNewTier },
    ]);
    setSelectedNewUser('');
  };

  // Handle Remove Recipient
  const handleRemoveRecipient = (userId: string) => {
    setRecipientsList(recipientsList.filter((r) => r.recipientUserId !== userId));
  };

  // Handle Save Recipients
  const handleSaveRecipients = async () => {
    setIsSavingRecipients(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: recipientsList }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ قائمة المستلمين');
      }

      setSuccessMessage(data.notice || 'تم تحديث وحفظ قائمة المستلمين بنجاح');
      fetchAlertDetails();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSavingRecipients(false);
    }
  };

  // Handle SUPER_ADMIN Approval & Snapshot Creation
  const handleApproveSnapshot = async () => {
    if (!isSuperAdmin) return;
    if (!window.confirm('هل تؤكد مراجعة نصوص المستويين وخلوها من أي تسريب، واعتماد التنبيه وتجميد لقطة المستلمين؟')) {
      return;
    }

    setIsApproving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/approve`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل اعتماد التنبيه وتجميد اللقطة');
      }

      setSuccessMessage(`تم اعتماد التنبيه بنجاح (اللقطة المشفرة v${data.snapshot.approvalVersion})`);
      fetchAlertDetails();
      setActiveTab('APPROVAL');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Internal Dispatch
  const handleDispatch = async () => {
    if (!isSuperAdmin) return;
    if (!window.confirm('هل تؤكد إصدار وتوزيع التنبيه داخلياً (In-App Portal) إلى المستلمين المحددين في اللقطة المجمدة؟')) {
      return;
    }

    setIsDispatching(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/dispatch`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل توزيع التنبيه داخلياً');
      }

      setSuccessMessage(data.message || 'تم إصدار التنبيه وتوزيعه داخلياً بنجاح');
      fetchAlertDetails();
      setActiveTab('DELIVERY');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
          <span className="text-sm font-medium">جاري تحميل تفاصيل التنبيه الميداني...</span>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">التنبيه غير موجود</h3>
        <p className="mt-1 text-sm text-slate-500">قد يكون تم حذف التنبيه أو لا تملك صلاحية الوصول إليه.</p>
        <Link
          href="/admin/alerts"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة لقائمة التنبيهات</span>
        </Link>
      </div>
    );
  }

  const isDispatched = Boolean(alert.dispatchedAt);
  const isApproved = alert.approvalStatus === 'APPROVED' && !isDispatched;
  const activeSnapshot = alert.snapshots?.find((s: any) => s.id === alert.activeSnapshotId) || alert.snapshots?.[0];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/admin/alerts" className="hover:text-amber-600">
              التنبيهات الميدانية
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{alert.alertNumber}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{alert.titleAr}</h1>
            {alert.isPrecautionary && (
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                تنبيه احترازي (معلومات غير مؤكدة)
              </span>
            )}
            {isDispatched ? (
              <span className="rounded-full border border-blue-300 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                تم التوزيع داخلياً
              </span>
            ) : isApproved ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                معتمد (لقطة مجمدة v{activeSnapshot?.approvalVersion})
              </span>
            ) : (
              <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                مسودة قيد المراجعة
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {alert.incident && (
            <Link
              href={`/admin/incidents/${alert.incident.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>البلاغ الأصلي: {alert.incident.incidentNumber}</span>
            </Link>
          )}

          {isSuperAdmin && !isDispatched && isApproved && (
            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isDispatching ? 'جاري التوزيع...' : 'إصدار وتوزيع التنبيه داخلياً'}</span>
            </button>
          )}

          {isSuperAdmin && !isDispatched && !isApproved && (
            <button
              onClick={handleApproveSnapshot}
              disabled={isApproving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isApproving ? 'جاري الاعتماد...' : 'اعتماد وتجميد اللقطة (SUPER_ADMIN)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('CONTENT')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'CONTENT'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>نصوص التنبيه (المستويان المنقحان)</span>
        </button>

        <button
          onClick={() => setActiveTab('RECIPIENTS')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'RECIPIENTS'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>تحديد المستلمين والتصاريح ({recipientsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('APPROVAL')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'APPROVAL'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>المراجعة واللقطة المجمدة</span>
        </button>

        <button
          onClick={() => setActiveTab('DELIVERY')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'DELIVERY'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>سجل التسليم والقراءة ({alert.deliveryLogs?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: CONTENT EDIT / VIEW */}
      {activeTab === 'CONTENT' && (
        <form onSubmit={handleSaveDraft} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              بيانات وتصنيف التنبيه الميداني
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مستوى الخطورة
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  disabled={isDispatched}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="CRITICAL_FLASH">خاطف عاجل جداً (Critical Flash)</option>
                  <option value="WARNING_HIGH">تحذير أمني عالي (Warning High)</option>
                  <option value="ADVISORY_WATCH">إشعار توعوي / مراقبة (Advisory Watch)</option>
                  <option value="INFORMATIONAL">إحاطة إعلامية (Informational)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  المحافظة المستهدفة
                </label>
                <input
                  type="text"
                  value={targetGovernorate}
                  onChange={(e) => setTargetGovernorate(e.target.value)}
                  disabled={isDispatched}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  المديريات والنطاقات المستهدفة (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={targetDistricts}
                  onChange={(e) => setTargetDistricts(e.target.value)}
                  disabled={isDispatched}
                  placeholder="مثال: المنصورة، الشيخ عثمان"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="isPrecautionary"
                checked={isPrecautionary}
                onChange={(e) => setIsPrecautionary(e.target.checked)}
                disabled={isDispatched}
                className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="isPrecautionary" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                تنبيه احترازي بناءً على معلومات غير مؤكدة بالكامل (مع وجوب بيان حدود التحقق في النص)
              </label>
            </div>
          </div>

          {/* Tier 1: Redacted Operational Briefing */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/20 p-6 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                المستوى الأول
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                الإحاطة التشغيلية المنقحة (Redacted Operational Briefing)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              مخصص للمستلمين المخولين بالاطلاع على التفاصيل التشغيلية وسياق التحركات الميدانية دون كشف المصدر أو الموقع الدقيق.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الإحاطة التشغيلية (عربي)
                </label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  disabled={isDispatched}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نص الإحاطة التشغيلية المنقحة (سياق الواقعة والتفاصيل المصرح بنشرها)
                </label>
                <textarea
                  rows={4}
                  value={bodyAr}
                  onChange={(e) => setBodyAr(e.target.value)}
                  disabled={isDispatched}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Tier 2: Executive Flash Summary */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/20 p-6 shadow-sm dark:border-teal-900/40 dark:bg-teal-950/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                المستوى الثاني
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                الملخص التنسيقي الموجز (Executive Flash Summary)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              نص منقح مستقل وموجز يركز على الخلاصة والأثر التنفيذي للقيادات والمنظمات الشريكة المصرحة بهذا المستوى فقط.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الملخص التنسيقي الموجز
                </label>
                <input
                  type="text"
                  value={executiveTitleAr}
                  onChange={(e) => setExecutiveTitleAr(e.target.value)}
                  disabled={isDispatched}
                  placeholder="عنوان تنفيذي موجز وواضح..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نص الملخص التنسيقي الموجز
                </label>
                <textarea
                  rows={3}
                  value={executiveSummaryAr}
                  onChange={(e) => setExecutiveSummaryAr(e.target.value)}
                  disabled={isDispatched}
                  placeholder="خلاصة تنفيذية واضحة ومقتضبة..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Movement Advice & Reviewed Protocols */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              إرشادات الحركة والتنقل المراجعة (Movement Advice)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              يُحظر توليد توصيات طرق تلقائياً من بلاغ واحد؛ لا يُدرج هنا إلا ما تمت مراجعته وتدقيقه وصُرح بنشره للميدان.
            </p>

            <textarea
              rows={3}
              value={movementAdviceAr}
              onChange={(e) => setMovementAdviceAr(e.target.value)}
              disabled={isDispatched}
              placeholder="إرشادات الحركة، الطرق البديلة المعتمدة، أو تعليمات السلامة الميدانية المعتمدة..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {!isDispatched && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                ملاحظة: حفظ أي تعديل سيعيد حالة التنبيه إلى «مسودة» ويلغي الاعتماد السابق تلقائياً لحماية سلامة النسخ.
              </span>
              <button
                type="submit"
                disabled={isSavingDraft}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSavingDraft ? 'animate-spin' : ''}`} />
                <span>{isSavingDraft ? 'جاري الحفظ...' : 'حفظ تعديلات المسودة'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: RECIPIENTS CONFIGURATION */}
      {activeTab === 'RECIPIENTS' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              تحديد المستلمين ومستويات الاطلاع المسموحة
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              لا توجد قائمة مستلمين عامة أو تلقائية. يتم تخصيص كل مستلم بمستوى المحتوى المصرح له حصراً، ويُعاد التحقق من نشاط حسابه عند التسليم والقراءة.
            </p>

            {!isDispatched && (
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 dark:border-slate-800 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اختيار مستخدم نشط من المنصة
                  </label>
                  <select
                    value={selectedNewUser}
                    onChange={(e) => setSelectedNewUser(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- اختر مستخدماً مؤهلاً --</option>
                    {eligibleUsers
                      .filter((u) => !recipientsList.some((r) => r.recipientUserId === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.email}) — [{u.role}] {u.organization ? `— ${u.organization}` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="w-full md:w-72">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مستوى المحتوى المصرح به
                  </label>
                  <select
                    value={selectedNewTier}
                    onChange={(e) => setSelectedNewTier(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="REDACTED_OPERATIONAL_BRIEFING">إحاطة تشغيلية منقحة (Tier 1)</option>
                    <option value="EXECUTIVE_FLASH_SUMMARY">ملخص تنسيقي موجز (Tier 2)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddRecipient}
                  disabled={!selectedNewUser}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة للقائمة</span>
                </button>
              </div>
            )}

            {/* Current Recipients Table */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                المستلمون المعتمدون للتنبيه ({recipientsList.length})
              </h4>

              {recipientsList.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  لم يتم تحديد أي مستلمين بعد. لا يمكن اعتماد أو توزيع التنبيه دون تحديد مستلم واحد على الأقل.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        <th className="p-3">المستلم</th>
                        <th className="p-3">البريد الإلكتروني والدور</th>
                        <th className="p-3">مستوى المحتوى المخصص</th>
                        {!isDispatched && <th className="p-3 text-center">إجراء</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recipientsList.map((rec, idx) => {
                        const userObj = eligibleUsers.find((u) => u.id === rec.recipientUserId);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {userObj ? userObj.fullName : rec.recipientUserId}
                            </td>
                            <td className="p-3 text-slate-500">
                              {userObj ? `${userObj.email} [${userObj.role}]` : '-'}
                            </td>
                            <td className="p-3">
                              {rec.alertTier === 'EXECUTIVE_FLASH_SUMMARY' ? (
                                <span className="inline-flex rounded-full bg-teal-100 px-2 py-0.5 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                                  ملخص تنسيقي موجز (Tier 2)
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                  إحاطة تشغيلية منقحة (Tier 1)
                                </span>
                              )}
                            </td>
                            {!isDispatched && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRecipient(rec.recipientUserId)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!isDispatched && recipientsList.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveRecipients}
                  disabled={isSavingRecipients}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  <RefreshCw className={`h-4 w-4 ${isSavingRecipients ? 'animate-spin' : ''}`} />
                  <span>{isSavingRecipients ? 'جاري الحفظ...' : 'حفظ قائمة المستلمين المحددة'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: APPROVAL & IMMUTABLE SNAPSHOT */}
      {activeTab === 'APPROVAL' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    المراجعة والاعتماد وتجميد اللقطة (Snapshot Gate)
                  </h3>
                  <p className="text-xs text-slate-500">
                    الاعتماد محصور بالمدير الأعلى (SUPER_ADMIN)؛ يقوم بتوليد بصمة مشفرة وتجميد قائمة المستلمين ومحتوى المستويين.
                  </p>
                </div>
              </div>

              {activeSnapshot && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  اللقطة المعتمدة الحالية: v{activeSnapshot.approvalVersion}
                </div>
              )}
            </div>

            {/* Snapshot Details if approved */}
            {activeSnapshot ? (
              <div className="mt-6 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3 text-xs dark:border-emerald-800/60">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">
                    بصمة السلامة المشفرة (SHA-256):
                  </span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                    {activeSnapshot.snapshotHash}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                  <div>
                    <span className="text-slate-500">رقم إصدار اللقطة: </span>
                    <strong className="text-slate-900 dark:text-white">الإصدار {activeSnapshot.approvalVersion}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">وقت الاعتماد: </span>
                    <strong className="text-slate-900 dark:text-white">
                      {new Date(activeSnapshot.approvedAt).toLocaleString('ar-YE')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">معتمد بواسطة: </span>
                    <strong className="text-slate-900 dark:text-white">SUPER_ADMIN</strong>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 dark:text-slate-400">
                  <p className="leading-relaxed">
                    هذه اللقطة مجمدة وثابتة. التسليم الداخلي سيتم حصراً من هذه البيانات. أي تعديل على النص أو المستلمين سيبطل هذا الاعتماد ويعيد التنبيه إلى مسودة.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                لم يتم اعتماد أي لقطة مجمدة لهذا التنبيه بعد. يرجى مراجعة نصوص المستويين وقائمة المستلمين ثم اعتماد اللقطة لتجهيزها للإصدار.
              </div>
            )}

            {/* SUPER_ADMIN Action Button */}
            {isSuperAdmin && !isDispatched && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleApproveSnapshot}
                  disabled={isApproving || recipientsList.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {isApproving ? 'جاري التحقق والاعتماد...' : 'اعتماد التنبيه وتوليد اللقطة المجمدة (SUPER_ADMIN)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY LOG */}
      {activeTab === 'DELIVERY' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              سجل التسليم والقراءة الداخلي (In-App Delivery Audit)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              يوثق وصول التنبيه لكل مستلم وقراءته له مع ضمان عدم تكرار التسليم عبر مفتاح التحقق الفريد (Idempotency Key).
            </p>

            {!isDispatched && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800">
                لم يتم إصدار هذا التنبيه داخلياً بعد. يتم تسجيل حركة التسليم والقراءة بمجرد إصدار التنبيه من اللقطة المعتمدة.
              </div>
            )}

            {isDispatched && alert.deliveryLogs && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="p-3">المستلم</th>
                      <th className="p-3">القناة</th>
                      <th className="p-3">حالة التسليم</th>
                      <th className="p-3">وقت التسليم</th>
                      <th className="p-3">حالة القراءة</th>
                      <th className="p-3 font-mono">Idempotency Key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {alert.deliveryLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {log.recipientUser?.fullName || log.recipientUserId}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {log.channel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString('ar-YE') : '-'}
                        </td>
                        <td className="p-3">
                          {log.readAt ? (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              تمت القراءة ({new Date(log.readAt).toLocaleTimeString('ar-YE')})
                            </span>
                          ) : (
                            <span className="text-slate-400">لم يقرأ بعد</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[10px]">
                          {log.idempotencyKey}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
