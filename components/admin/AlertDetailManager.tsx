'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellRing,
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
  Trash2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminTabs,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminCheckbox,
  AdminButton,
  AdminIconButton,
  AdminDataTable,
  AdminStatusBadge,
  AdminModal,
  AdminAlert,
  AdminLoadingState,
  AdminEmptyState,
} from '@/components/admin/ui';

interface AlertDetailProps {
  alertId: string;
  currentUserRole: string;
  currentUserId: string;
}

const SEVERITY_OPTIONS = [
  { value: 'CRITICAL_FLASH', get label() { return tx("خاطف عاجل جداً (Critical Flash)"); } },
  { value: 'WARNING_HIGH', get label() { return tx("تحذير أمني عالي (Warning High)"); } },
  { value: 'ADVISORY_WATCH', get label() { return tx("إشعار مراقبة (Advisory Watch)"); } },
  { value: 'INFORMATIONAL', get label() { return tx("إحاطة إعلامية (Informational)"); } },
];

const SEVERITY_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'neutral' }> = {
  CRITICAL_FLASH: { get label() { return tx("خاطف عاجل جداً"); }, variant: 'danger' },
  WARNING_HIGH: { get label() { return tx("تحذير عالي"); }, variant: 'warning' },
  ADVISORY_WATCH: { get label() { return tx("إشعار مراقبة"); }, variant: 'info' },
  INFORMATIONAL: { get label() { return tx("إحاطة إعلامية"); }, variant: 'neutral' },
};

export default function AlertDetailManager({
  alertId,
  currentUserRole,
  currentUserId,
}: AlertDetailProps) {
  const { tx, txLocale } = useAdminT();
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const [alert, setAlert] = useState<any>(null);
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('CONTENT');

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

  // Confirmation Modals
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

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
      setErrorMessage(tx("تعذر تحميل بيانات التنبيه من الخادم"));
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
        throw new Error(data.error || tx("فشل حفظ تعديلات التنبيه"));
      }

      setSuccessMessage(data.notice || tx("تم حفظ مسودة التنبيه بنجاح"));
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
      setErrorMessage(tx("المستخدم محدد مسبقاً في القائمة"));
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
        throw new Error(data.error || tx("فشل حفظ قائمة المستلمين"));
      }

      setSuccessMessage(data.notice || tx("تم تحديث وحفظ قائمة المستلمين بنجاح"));
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
    setIsApproving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/approve`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("فشل اعتماد التنبيه وتجميد اللقطة"));
      }

      setSuccessMessage(tx("تم اعتماد التنبيه بنجاح (اللقطة المشفرة v{0})", data.snapshot.approvalVersion));
      setIsApproveModalOpen(false);
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
    setIsDispatching(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/dispatch`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("فشل توزيع التنبيه داخلياً"));
      }

      setSuccessMessage(data.message || tx("تم إصدار التنبيه وتوزيعه داخلياً بنجاح"));
      setIsDispatchModalOpen(false);
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
      <AdminSection>
        <AdminLoadingState message={tx("جاري قراءة وتحميل تفاصيل التنبيه الميداني...")} />
      </AdminSection>
    );
  }

  if (!alert) {
    return (
      <AdminSection>
        <AdminEmptyState
          title={tx("التنبيه الميداني غير موجود")}
          description={errorMessage || tx("قد يكون تم حذف التنبيه أو لا تملك صلاحية الوصول إليه.")}
          action={
            <Link href="/admin/alerts" style={{ textDecoration: 'none' }}>
              <AdminButton variant="primary" size="sm" icon={<ArrowRight size={14} />}>
                {tx("العودة لقائمة التنبيهات")}
              </AdminButton>
            </Link>
          }
        />
      </AdminSection>
    );
  }

  const isDispatched = Boolean(alert.dispatchedAt);
  const isApproved = alert.approvalStatus === 'APPROVED' && !isDispatched;
  const activeSnapshot = alert.snapshots?.find((s: any) => s.id === alert.activeSnapshotId) || alert.snapshots?.[0];
  const sevMeta = SEVERITY_CONFIG[alert.severity] || { label: alert.severity, variant: 'neutral' as const };

  const tabOptions = [
    { id: 'CONTENT', label: tx("نصوص التنبيه (المستويان)"), icon: FileCheck2 },
    { id: 'RECIPIENTS', label: tx("تحديد المستلمين ({0})", recipientsList.length), icon: Users },
    { id: 'APPROVAL', label: tx("المراجعة واللقطة المجمدة"), icon: ShieldCheck },
    { id: 'DELIVERY', label: tx("سجل التسليم والقراءة ({0})", alert.deliveryLogs?.length || 0), icon: Send },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <AdminPageHeader
        title={alert.titleAr}
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
              {alert.alertNumber}
            </span>
            <AdminStatusBadge status={sevMeta.label} variant={sevMeta.variant} dot />
            {isDispatched ? (
              <AdminStatusBadge status={tx("تم التوزيع داخلياً")} variant="info" dot />
            ) : isApproved ? (
              <AdminStatusBadge status={tx("معتمد (لقطة v{0})", activeSnapshot?.approvalVersion || 1)} variant="success" dot />
            ) : (
              <AdminStatusBadge status={tx("مسودة قيد المراجعة")} variant="warning" dot />
            )}
            {alert.isPrecautionary && (
              <span
                style={{
                  fontSize: '0.72rem',
                  background: 'var(--admin-warning-subtle)',
                  color: 'var(--admin-warning)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                {tx("تنبيه احترازي (معلومات غير مؤكدة)")}
              </span>
            )}
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/admin/alerts" style={{ textDecoration: 'none' }}>
              <AdminButton variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                {tx("قائمة التنبيهات")}
              </AdminButton>
            </Link>

            {alert.incident && (
              <Link href={`/admin/incidents/${alert.incident.id}`} style={{ textDecoration: 'none' }}>
                <AdminButton variant="outline" size="sm" icon={<FileCheck2 size={13} />}>
                  {tx("البلاغ:")} {alert.incident.incidentNumber}
                </AdminButton>
              </Link>
            )}

            {isSuperAdmin && !isDispatched && isApproved && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Send size={13} />}
                onClick={() => setIsDispatchModalOpen(true)}
              >
                {tx("إصدار وتوزيع التنبيه داخلياً")}
              </AdminButton>
            )}

            {isSuperAdmin && !isDispatched && !isApproved && (
              <AdminButton
                variant="success"
                size="sm"
                icon={<ShieldCheck size={13} />}
                onClick={() => setIsApproveModalOpen(true)}
              >
                {tx("اعتماد وتجميد اللقطة")}
              </AdminButton>
            )}
          </div>
        }
      />

      {/* Alerts / Feedback */}
      {errorMessage && (
        <AdminAlert
          variant="danger"
          title={tx("خطأ في العملية")}
          message={errorMessage}
          onClose={() => setErrorMessage('')}
        />
      )}
      {successMessage && (
        <AdminAlert
          variant="success"
          title={tx("تمت العملية بنجاح")}
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      {/* Tabs */}
      <AdminTabs
        tabs={tabOptions}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* TAB 1: CONTENT EDIT / VIEW */}
      {activeTab === 'CONTENT' && (
        <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metadata Section */}
          <AdminSection title={tx("بيانات وتصنيف التنبيه الميداني")} description={tx("تحديد مستوى التهديد والنطاق الجغرافي المستهدف")}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("مستوى الخطورة")}
                </label>
                <AdminSelect
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  disabled={isDispatched}
                  options={SEVERITY_OPTIONS}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("المحافظة المستهدفة")}
                </label>
                <AdminInput
                  value={targetGovernorate}
                  onChange={(e) => setTargetGovernorate(e.target.value)}
                  disabled={isDispatched}
                  placeholder={tx("المحافظة...")}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("المديريات والنطاقات المستهدفة (مفصولة بفواصل)")}
                </label>
                <AdminInput
                  value={targetDistricts}
                  onChange={(e) => setTargetDistricts(e.target.value)}
                  disabled={isDispatched}
                  placeholder={tx("مثال: المنصورة، الشيخ عثمان")}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <AdminCheckbox
                id="isPrecautionary"
                checked={isPrecautionary}
                onChange={(val) => setIsPrecautionary(val)}
                disabled={isDispatched}
                label={tx("تنبيه احترازي بناءً على معلومات غير مؤكدة بالكامل (مع وجوب بيان حدود التحقق في النص)")}
              />
            </div>
          </AdminSection>

          {/* Tier 1 Box */}
          <div
            style={{
              background: 'var(--admin-bg-surface)',
              border: '1px solid #c7d2fe',
              borderRadius: 'var(--admin-radius-lg)',
              padding: '1.25rem',
              boxShadow: 'var(--admin-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  background: '#e0e7ff',
                  color: '#3730a3',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {tx("المستوى الأول")}
              </span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                {tx("الإحاطة التشغيلية المنقحة (Redacted Operational Briefing)")}
              </h3>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
              {tx("مخصص للمستلمين المخولين بالاطلاع على التفاصيل التشغيلية وسياق التحركات الميدانية دون كشف المصدر أو الموقع الدقيق.")}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("عنوان الإحاطة التشغيلية (عربي)")}
                </label>
                <AdminInput
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  disabled={isDispatched}
                  placeholder={tx("عنوان الإحاطة التشغيلية...")}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("نص الإحاطة التشغيلية المنقحة (سياق الواقعة والتفاصيل المصرح بنشرها)")}
                </label>
                <AdminTextarea
                  rows={4}
                  value={bodyAr}
                  onChange={(e) => setBodyAr(e.target.value)}
                  disabled={isDispatched}
                  placeholder={tx("نص الإحاطة التفصيلي المنقح...")}
                />
              </div>
            </div>
          </div>

          {/* Tier 2 Box */}
          <div
            style={{
              background: 'var(--admin-bg-surface)',
              border: '1px solid #99f6e4',
              borderRadius: 'var(--admin-radius-lg)',
              padding: '1.25rem',
              boxShadow: 'var(--admin-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  background: '#ccfbf1',
                  color: '#115e59',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {tx("المستوى الثاني")}
              </span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                {tx("الملخص التنسيقي الموجز (Executive Flash Summary)")}
              </h3>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
              {tx("نص منقح مستقل وموجز يركز على الخلاصة والأثر التنفيذي للقيادات والمنظمات الشريكة المصرحة بهذا المستوى فقط.")}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("عنوان الملخص التنسيقي الموجز")}
                </label>
                <AdminInput
                  value={executiveTitleAr}
                  onChange={(e) => setExecutiveTitleAr(e.target.value)}
                  disabled={isDispatched}
                  placeholder={tx("عنوان تنفيذي موجز وواضح...")}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("نص الملخص التنسيقي الموجز")}
                </label>
                <AdminTextarea
                  rows={3}
                  value={executiveSummaryAr}
                  onChange={(e) => setExecutiveSummaryAr(e.target.value)}
                  disabled={isDispatched}
                  placeholder={tx("خلاصة تنفيذية واضحة ومقتضبة...")}
                />
              </div>
            </div>
          </div>

          {/* Movement Advice */}
          <AdminSection
            title={tx("إرشادات الحركة والتنقل المراجعة (Movement Advice)")}
            description={tx("يُحظر توليد توصيات طرق تلقائياً؛ لا يُدرج هنا إلا ما تمت مراجعته وتدقيقه وصُرح بنشره للميدان.")}
          >
            <AdminTextarea
              rows={3}
              value={movementAdviceAr}
              onChange={(e) => setMovementAdviceAr(e.target.value)}
              disabled={isDispatched}
              placeholder={tx("إرشادات الحركة، الطرق البديلة المعتمدة، أو تعليمات السلامة الميدانية المعتمدة...")}
            />
          </AdminSection>

          {!isDispatched && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                {tx("ملاحظة: حفظ أي تعديل سيعيد حالة التنبيه إلى «مسودة» ويبطل الاعتماد السابق تلقائياً لحماية سلامة النسخ.")}
              </span>
              <AdminButton
                type="submit"
                variant="primary"
                size="md"
                disabled={isSavingDraft}
                icon={<RefreshCw size={14} className={isSavingDraft ? 'spin' : ''} />}
              >
                {isSavingDraft ? tx("جاري الحفظ...") : tx("حفظ تعديلات المسودة")}
              </AdminButton>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: RECIPIENTS CONFIGURATION */}
      {activeTab === 'RECIPIENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AdminSection
            title={tx("تحديد المستلمين ومستويات الاطلاع المسموحة")}
            description={tx("لا توجد قائمة مستلمين عامة أو تلقائية. يتم تخصيص كل مستلم بمستوى المحتوى المصرح له حصراً، ويُعاد التحقق من حسابه عند التسليم والقراءة.")}
          >
            {!isDispatched && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '0.75rem',
                  borderBottom: '1px solid var(--admin-border-subtle)',
                  paddingBottom: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("اختيار مستخدم نشط من المنصة")}
                  </label>
                  <AdminSelect
                    value={selectedNewUser}
                    onChange={(e) => setSelectedNewUser(e.target.value)}
                    options={[
                      { value: '', label: tx("-- اختر مستخدماً مؤهلاً --") },
                      ...eligibleUsers
                        .filter((u) => !recipientsList.some((r) => r.recipientUserId === u.id))
                        .map((u) => ({
                          value: u.id,
                          label: `${u.fullName} (${u.email}) [${u.role}] ${u.organization ? `— ${u.organization}` : ''}`,
                        })),
                    ]}
                  />
                </div>

                <div style={{ width: '260px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("مستوى المحتوى المصرح به")}
                  </label>
                  <AdminSelect
                    value={selectedNewTier}
                    onChange={(e) => setSelectedNewTier(e.target.value)}
                    options={[
                      { value: 'REDACTED_OPERATIONAL_BRIEFING', label: tx("إحاطة تشغيلية منقحة (Tier 1)") },
                      { value: 'EXECUTIVE_FLASH_SUMMARY', label: tx("ملخص تنسيقي موجز (Tier 2)") },
                    ]}
                  />
                </div>

                <AdminButton
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!selectedNewUser}
                  icon={<Plus size={14} />}
                  onClick={handleAddRecipient}
                >
                  {tx("إضافة للقائمة")}
                </AdminButton>
              </div>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                  {tx("المستلمون المعتمدون للتنبيه (")}{recipientsList.length})
                </h4>
                {!isDispatched && recipientsList.length > 0 && (
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSavingRecipients}
                    icon={<RefreshCw size={13} className={isSavingRecipients ? 'spin' : ''} />}
                    onClick={handleSaveRecipients}
                  >
                    {isSavingRecipients ? tx("جاري الحفظ...") : tx("حفظ قائمة المستلمين")}
                  </AdminButton>
                )}
              </div>

              {recipientsList.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--admin-warning)', background: 'var(--admin-warning-subtle)', borderRadius: 'var(--admin-radius-md)' }}>
                  <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                    {tx("لم يتم تحديد أي مستلمين بعد. لا يمكن اعتماد أو توزيع التنبيه دون تحديد مستلم واحد على الأقل.")}
                  </p>
                </div>
              ) : (
                <AdminDataTable
                  columns={[
                    {
                      key: 'name',
                      header: tx("المستلم"),
                      render: (rec: any) => {
                        const userObj = eligibleUsers.find((u) => u.id === rec.recipientUserId);
                        return (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                              {userObj ? userObj.fullName : rec.recipientUserId}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                              {userObj ? `${userObj.email} [${userObj.role}]` : '-'}
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      key: 'tier',
                      header: tx("مستوى المحتوى المخصص"),
                      render: (rec: any) => (
                        rec.alertTier === 'EXECUTIVE_FLASH_SUMMARY' ? (
                          <span style={{ background: '#ccfbf1', color: '#115e59', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {tx("ملخص تنسيقي موجز (Tier 2)")}
                          </span>
                        ) : (
                          <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {tx("إحاطة تشغيلية منقحة (Tier 1)")}
                          </span>
                        )
                      ),
                    },
                    ...(!isDispatched ? [
                      {
                        key: 'action',
                        header: tx("إجراء"),
                        render: (rec: any) => (
                          <AdminIconButton
                            variant="danger"
                            icon={<Trash2 size={13} />}
                            onClick={() => handleRemoveRecipient(rec.recipientUserId)}
                            title={tx("إزالة من القائمة")}
                          />
                        ),
                      },
                    ] : []),
                  ]}
                  data={recipientsList}
                  keyExtractor={(rec) => rec.recipientUserId}
                  mobileCardRender={(rec: any) => {
                    const userObj = eligibleUsers.find((u: any) => u.id === rec.recipientUserId);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                              {userObj ? userObj.fullName : rec.recipientUserId}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                              {userObj ? `${userObj.email} [${userObj.role}]` : '-'}
                            </div>
                          </div>
                          {!isDispatched && (
                            <AdminIconButton
                              variant="danger"
                              icon={<Trash2 size={13} />}
                              onClick={() => handleRemoveRecipient(rec.recipientUserId)}
                              title={tx("إزالة من القائمة")}
                            />
                          )}
                        </div>
                        <div>
                          {rec.alertTier === 'EXECUTIVE_FLASH_SUMMARY' ? (
                            <span style={{ background: '#ccfbf1', color: '#115e59', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {tx("ملخص تنسيقي موجز (Tier 2)")}
                            </span>
                          ) : (
                            <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {tx("إحاطة تشغيلية منقحة (Tier 1)")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </AdminSection>
        </div>
      )}

      {/* TAB 3: APPROVAL & IMMUTABLE SNAPSHOT */}
      {activeTab === 'APPROVAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AdminSection
            title={tx("المراجعة والاعتماد وتجميد اللقطة (Snapshot Gate)")}
            description={tx("الاعتماد محصور بالإدارة العليا (SUPER_ADMIN)؛ يقوم بتوليد بصمة تشفير ثابتة وتجميد قائمة المستلمين ومحتوى المستويين لمنع التلاعب.")}
            actions={
              activeSnapshot ? (
                <span style={{ background: 'var(--admin-success-subtle)', color: 'var(--admin-success)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {tx("اللقطة المعتمدة الحالية: v")}{activeSnapshot.approvalVersion}
                </span>
              ) : undefined
            }
          >
            {activeSnapshot ? (
              <div
                style={{
                  background: 'var(--admin-bg-surface-subtle)',
                  border: '1px solid var(--admin-border-subtle)',
                  borderRadius: 'var(--admin-radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--admin-border-subtle)', paddingBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--admin-text-primary)' }}>
                    {tx("بصمة السلامة والتشفير (SHA-256):")}
                  </span>
                  <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', background: 'var(--admin-bg-surface)', padding: '2px 8px', borderRadius: '4px' }}>
                    {activeSnapshot.snapshotHash}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{tx("رقم إصدار اللقطة:")} </span>
                    <strong style={{ color: 'var(--admin-text-primary)' }}>{tx("الإصدار v")}{activeSnapshot.approvalVersion}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{tx("وقت الاعتماد والتجميد:")} </span>
                    <strong style={{ color: 'var(--admin-text-primary)' }}>
                      {new Date(activeSnapshot.approvedAt).toLocaleString(txLocale("ar-YE"))}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{tx("معتمد بواسطة:")} </span>
                    <strong style={{ color: 'var(--admin-text-primary)' }}>SUPER_ADMIN</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--admin-border-subtle)', paddingTop: '0.6rem' }}>
                  {tx("هذه اللقطة مجمدة وثابتة. التسليم الداخلي سيتم حصراً من هذه البيانات. أي تعديل على النص أو المستلمين سيبطل هذا الاعتماد ويعيد التنبيه إلى مسودة تلقائياً.")}
                </div>
              </div>
            ) : (
              <AdminAlert
                variant="warning"
                title={tx("بانتظار المراجعة والاعتماد")}
                message={tx("لم يتم اعتماد أي لقطة مجمدة لهذا التنبيه بعد. يرجى التأكد من نصوص المستويين وقائمة المستلمين ثم اعتماد اللقطة لتجهيزها للإصدار.")}
              />
            )}

            {isSuperAdmin && !isDispatched && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <AdminButton
                  variant="success"
                  size="md"
                  disabled={isApproving || recipientsList.length === 0}
                  icon={<ShieldCheck size={16} />}
                  onClick={() => setIsApproveModalOpen(true)}
                >
                  {tx("اعتماد التنبيه وتوليد اللقطة المجمدة (SUPER_ADMIN)")}
                </AdminButton>
              </div>
            )}
          </AdminSection>
        </div>
      )}

      {/* TAB 4: DELIVERY LOG */}
      {activeTab === 'DELIVERY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AdminSection
            title={tx("سجل التسليم والقراءة الداخلي (In-App Delivery Audit)")}
            description={tx("توثيق وصول التنبيه لكل مستلم وقراءته له مع ضمان عدم تكرار التسليم عبر مفتاح التحقق الفريد (Idempotency Key).")}
          >
            {!isDispatched ? (
              <AdminAlert
                variant="info"
                title={tx("التنبيه لم يُوزع بعد")}
                message={tx("لم يتم إصدار هذا التنبيه داخلياً حتى الآن. يبدأ توثيق حركة التسليم والقراءة فور قيام الإدارة العليا بإصدار التنبيه من اللقطة المجمدة.")}
              />
            ) : alert.deliveryLogs && alert.deliveryLogs.length > 0 ? (
              <AdminDataTable
                columns={[
                  {
                    key: 'recipient',
                    header: tx("المستلم"),
                    render: (log: any) => (
                      <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        {log.recipientUser?.fullName || log.recipientUserId}
                      </span>
                    ),
                  },
                  {
                    key: 'channel',
                    header: tx("القناة"),
                    render: (log: any) => (
                      <span style={{ fontSize: '0.75rem', background: 'var(--admin-bg-surface-subtle)', color: 'var(--admin-text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                        {log.channel}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: tx("حالة التسليم"),
                    render: (log: any) => (
                      <AdminStatusBadge status={log.status} variant="success" dot />
                    ),
                  },
                  {
                    key: 'deliveredAt',
                    header: tx("وقت التسليم"),
                    render: (log: any) => (
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                        {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString(txLocale("ar-YE")) : '-'}
                      </span>
                    ),
                  },
                  {
                    key: 'readAt',
                    header: tx("حالة القراءة"),
                    render: (log: any) => (
                      log.readAt ? (
                        <span style={{ color: 'var(--admin-info)', fontWeight: 600, fontSize: '0.8rem' }}>
                          {tx("تمت القراءة (")}{new Date(log.readAt).toLocaleTimeString(txLocale("ar-YE"))})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{tx("لم يقرأ بعد")}</span>
                      )
                    ),
                  },
                  {
                    key: 'key',
                    header: tx("مفتاح التحقق Idempotency"),
                    render: (log: any) => (
                      <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                        {log.idempotencyKey}
                      </span>
                    ),
                  },
                ]}
                data={alert.deliveryLogs}
                keyExtractor={(log) => log.id}
                mobileCardRender={(log: any) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <strong style={{ color: 'var(--admin-text-primary)' }}>
                        {log.recipientUser?.fullName || log.recipientUserId}
                      </strong>
                      <AdminStatusBadge status={log.status} variant="success" dot />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ background: 'var(--admin-bg-surface-subtle)', color: 'var(--admin-text-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {log.channel}
                      </span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>
                        {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString(txLocale("ar-YE")) : '-'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {log.readAt ? (
                        <span style={{ color: 'var(--admin-info)', fontWeight: 600, fontSize: '0.8rem' }}>
                          {tx("تمت القراءة (")}{new Date(log.readAt).toLocaleTimeString(txLocale("ar-YE"))})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{tx("لم يقرأ بعد")}</span>
                      )}
                      <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--admin-text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.idempotencyKey}
                      </span>
                    </div>
                  </div>
                )}
              />
            ) : (
              <AdminEmptyState
                title={tx("لا توجد سجلات تسليم بعد")}
                description={tx("تم إصدار التنبيه وبانتظار قيام النظام بمعالجة دفعة التسليم للمستفيدين.")}
              />
            )}
          </AdminSection>
        </div>
      )}

      {/* Confirmation Modal: Approve Snapshot */}
      <AdminModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={tx("تأكيد اعتماد التنبيه وتجميد اللقطة")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsApproveModalOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton
              variant="success"
              size="sm"
              icon={<ShieldCheck size={14} />}
              disabled={isApproving}
              onClick={handleApproveSnapshot}
            >
              {isApproving ? tx("جاري الاعتماد...") : tx("نعم، اعتماد وتجميد اللقطة")}
            </AdminButton>
          </div>
        }
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
          <p>
            {tx("هل تؤكد مراجعة نصوص المستويين (الإحاطة التشغيلية المنقحة والملخص التنسيقي) وخلوهما التام من أي معلومات تكشف هوية المصادر أو إحداثياتهم الدقيقة؟")}
          </p>
          <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
            {tx("سيتم توليد بصمة سلامة مشفرة (SHA-256) وتجميد قائمة المستلمين المحددة (")}{recipientsList.length} {tx("مستلم).")}
          </p>
        </div>
      </AdminModal>

      {/* Confirmation Modal: Internal Dispatch */}
      <AdminModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title={tx("تأكيد إصدار وتوزيع التنبيه داخلياً")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsDispatchModalOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              icon={<Send size={14} />}
              disabled={isDispatching}
              onClick={handleDispatch}
            >
              {isDispatching ? tx("جاري التوزيع...") : tx("نعم، إصدار وتوزيع الآن")}
            </AdminButton>
          </div>
        }
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
          <p>
            {tx("هل تؤكد إصدار وتوزيع التنبيه الميداني داخلياً (In-App Portal) إلى جميع المستلمين المعتمدين في اللقطة المجمدة v")}{activeSnapshot?.approvalVersion || 1}{tx("؟")}
          </p>
          <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
            {tx("هذا الإجراء نهائي وسيقوم بإنشاء سجلات تسليم مستقلة لكل مستلم مؤهل.")}
          </p>
        </div>
      </AdminModal>
    </div>
  );
}
