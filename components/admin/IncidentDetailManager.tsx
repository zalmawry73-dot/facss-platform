'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  Eye,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Send,
  Trash2,
  Upload,
  UserX,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Download,
  Key,
  BellRing,
  ArrowRight,
  RefreshCw,
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
  AdminCheckbox,
  AdminButton,
  AdminIconButton,
  AdminDataTable,
  AdminStatusBadge,
  AdminAlert,
  AdminLoadingState,
  AdminEmptyState,
} from '@/components/admin/ui';

interface Props {
  incidentId: string;
  currentUserRole: string;
  currentUserId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  // Operational Security & Safety (Package B)
  get THEFT() { return tx("سرقة وتعدي على ممتلكات"); },
  get INTRUSION() { return tx("اقتحام وتسلل غير مصرح به"); },
  get FIRE() { return tx("حريق واشتعال"); },
  get INJURY() { return tx("إصابة عمل وحالة طارئة"); },
  get SAFETY_INCIDENT() { return tx("حادث سلامة مهنية ووقائية"); },
  get VEHICLE_INCIDENT() { return tx("حادث مركبة وتلفيات نقل"); },
  get SECURITY_THREAT() { return tx("تهديد أمني واشتباه مباشر"); },
  // Historical Categories
  get ARMED_CONFLICT_TACTICAL() { return tx("نزاع مسلح وتكتيكي"); },
  get HUMANITARIAN_ACCESS_DENIAL() { return tx("إعاقة وصول إنساني"); },
  get PHYSICAL_ATTACK_THREAT() { return tx("اعتداء وتهديد مباشر"); },
  get UXO_LANDMINE_HAZARD() { return tx("مخاطر ألغام ومخلفات حرب"); },
  get CIVIL_UNREST_ROADBLOCK() { return tx("اضطرابات وقطع طرق"); },
  get DETENTION_HARASSMENT() { return tx("احتجاز ومضايقات"); },
  get NATURAL_DISASTER_ENVIRONMENTAL() { return tx("كوارث ومخاطر بيئية"); },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral' }> = {
  RECEIVED: { get label() { return tx("مستلم جديد"); }, variant: 'info' },
  TRIAGED: { get label() { return tx("تم الفرز الأمني"); }, variant: 'warning' },
  REDACTED: { get label() { return tx("تم التنقيح والاعتماد"); }, variant: 'warning' },
  ASSIGNED: { get label() { return tx("مُسند للمتابعة"); }, variant: 'info' },
  UNDER_VERIFICATION: { get label() { return tx("قيد التحقق الميداني"); }, variant: 'warning' },
  VERIFIED: { get label() { return tx("متحقق منه ومؤكد"); }, variant: 'success' },
  RESOLVED: { get label() { return tx("تمت المعالجة"); }, variant: 'success' },
  UNCONFIRMED: { get label() { return tx("غير مؤكد"); }, variant: 'neutral' },
  CONTRADICTED: { get label() { return tx("متناقض"); }, variant: 'danger' },
  DISPROVED: { get label() { return tx("مفند ومستبعد"); }, variant: 'danger' },
  DUPLICATE: { get label() { return tx("بلاغ مكرر"); }, variant: 'neutral' },
  ALERT_DRAFTED: { get label() { return tx("صيغت مسودة تنبيه"); }, variant: 'warning' },
  ALERT_APPROVED: { get label() { return tx("اعتمد التنبيه"); }, variant: 'success' },
  ALERT_DISPATCHED: { get label() { return tx("تم نشر التنبيه"); }, variant: 'success' },
  CLOSED: { get label() { return tx("مغلق"); }, variant: 'neutral' },
  ARCHIVED: { get label() { return tx("مؤرشف"); }, variant: 'neutral' },
};

const SLA_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral' }> = {
  ON_TIME: { get label() { return tx("ضمن المهلة"); }, variant: 'success' },
  APPROACHING_BREACH: { get label() { return tx("أوشك على التجاوز"); }, variant: 'warning' },
  BREACHED: { get label() { return tx("تجاوز المهلة (SLA)"); }, variant: 'danger' },
  CLOSED_ON_TIME: { get label() { return tx("أُغلق ضمن المهلة"); }, variant: 'success' },
  CLOSED_BREACHED: { get label() { return tx("أُغلق بعد التجاوز"); }, variant: 'danger' },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'success' | 'neutral' }> = {
  CRITICAL_EMERGENCY: { get label() { return tx("طارئة وقصوى"); }, variant: 'danger' },
  HIGH: { get label() { return tx("عالية"); }, variant: 'warning' },
  MEDIUM: { get label() { return tx("متوسطة"); }, variant: 'info' },
  LOW: { get label() { return tx("منخفضة"); }, variant: 'success' },
};

const ADMIRALTY_RELIABILITY_MAP: Record<string, string> = {
  get A() { return tx("A - موثوق تماماً (لا شك في النزاهة والموثوقية)"); },
  get B() { return tx("B - موثوق عادة (مصدر مجرب وسوابقه موثوقة)"); },
  get C() { return tx("C - موثوق إلى حد ما (سوابق معقولة)"); },
  get D() { return tx("D - غير موثوق عادة (مشكوك في استقلاليته أو دوافعه)"); },
  get E() { return tx("E - غير موثوق إطلاقاً (معلومات مضللة سابقة)"); },
  get F() { return tx("F - لا يمكن الحكم على الموثوقية (مصدر جديد تماماً)"); },
};

const ADMIRALTY_CREDIBILITY_MAP: Record<string, string> = {
  get '1'() { return tx("1 - مؤكدة من مصادر مستقلة متعددة"); },
  get '2'() { return tx("2 - محتملة جداً ومتوافقة مع المعطيات"); },
  get '3'() { return tx("3 - ممكنة ومحتملة الوقوع"); },
  get '4'() { return tx("4 - مشكوك فيها وغير مرجحة"); },
  get '5'() { return tx("5 - غير محتملة ومستبعدة منطقياً"); },
  get '6'() { return tx("6 - لا يمكن الحكم على صحتها"); },
};

export default function IncidentDetailManager({
  incidentId,
  currentUserRole,
  currentUserId,
}: Props) {
  const { tx, txLocale } = useAdminT();
  const router = useRouter();
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'REDACTION' | 'VERIFICATION' | 'ASSIGNMENT' | 'ORIGINAL'>('REDACTION');
  const [incident, setIncident] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sensitive Original State (SuperAdmin only)
  const [originalData, setOriginalData] = useState<any>(null);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);

  // Redaction Form State
  const [redactionForm, setRedactionForm] = useState({
    redactedTitleAr: '',
    redactedTitleEn: '',
    redactedDescAr: '',
    redactedDescEn: '',
    safeAreaScopeAr: '',
    safeAreaScopeEn: '',
    immediateImpact: '',
    safetyAdvisory: '',
    isApproved: true,
  });
  const [isSavingRedaction, setIsSavingRedaction] = useState(false);

  // Assignment Form State
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({
    assignedToUserId: '',
    roleScope: 'VERIFIER',
    instructions: '',
  });
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Verification Form State (Staff & SuperAdmin)
  const [verificationForm, setVerificationForm] = useState({
    sourceReliability: 'B',
    infoCredibility: '2',
    verificationMethod: tx("استقصاء ميداني مباشر وتقاطع مع مصادر محلية"),
    verificationSummary: '',
    corroboratingCount: 1,
    contradictionsFound: false,
    contradictionNotes: '',
    recommendedStatus: 'VERIFIED',
  });
  const [isSavingVerification, setIsSavingVerification] = useState(false);

  // Redacting Attachment State
  const [redactingAttId, setRedactingAttId] = useState<string | null>(null);

  // Fetch Incident Data
  const loadIncident = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("تعذر تحميل بيانات البلاغ"));

      setIncident(data.incident);

      // Pre-fill redaction form if existing current redacted exists
      if (data.incident.redactedVersions && data.incident.redactedVersions.length > 0) {
        const curr = data.incident.redactedVersions.find((r: any) => r.isCurrent) || data.incident.redactedVersions[0];
        setRedactionForm({
          redactedTitleAr: curr.redactedTitleAr || '',
          redactedTitleEn: curr.redactedTitleEn || '',
          redactedDescAr: curr.redactedDescAr || '',
          redactedDescEn: curr.redactedDescEn || '',
          safeAreaScopeAr: curr.safeAreaScopeAr || '',
          safeAreaScopeEn: curr.safeAreaScopeEn || '',
          immediateImpact: curr.immediateImpact || '',
          safetyAdvisory: curr.safetyAdvisory || '',
          isApproved: curr.isApproved ?? true,
        });
      } else if (data.incident.approvedRedacted) {
        setRedactionForm({
          redactedTitleAr: data.incident.approvedRedacted.redactedTitleAr || '',
          redactedTitleEn: '',
          redactedDescAr: data.incident.approvedRedacted.redactedDescAr || '',
          redactedDescEn: '',
          safeAreaScopeAr: data.incident.approvedRedacted.safeAreaScopeAr || '',
          safeAreaScopeEn: '',
          immediateImpact: data.incident.approvedRedacted.immediateImpact || '',
          safetyAdvisory: data.incident.approvedRedacted.safetyAdvisory || '',
          isApproved: true,
        });
      }

      // If SuperAdmin, fetch available staff
      if (isSuperAdmin) {
        const staffRes = await fetch('/api/admin/users?staffOnly=true');
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setAvailableStaff(staffData.users || []);
        }
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || tx("خطأ في جلب بيانات البلاغ") });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  // Fetch Original Decrypted Data on demand
  const fetchSensitiveOriginal = async () => {
    if (!isSuperAdmin) return;
    setIsLoadingOriginal(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/original`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("تعذر فك تشفير الأصل"));
      setOriginalData(data.original);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsLoadingOriginal(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ORIGINAL' && isSuperAdmin && !originalData) {
      fetchSensitiveOriginal();
    }
  }, [activeTab, isSuperAdmin]);

  // Submit Redaction
  const handleSaveRedaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSavingRedaction(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/redacted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redactionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل حفظ النسخة المنقحة"));

      setFeedback({ type: 'success', message: tx("تم حفظ واعتماد النسخة المنقحة بنجاح") });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSavingRedaction(false);
    }
  };

  // Submit Task Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSavingAssignment(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل إسناد المهمة للموظف"));

      setFeedback({ type: 'success', message: tx("تم إسناد البلاغ للموظف وتفعيل ترخيص الوصول") });
      setAssignmentForm({ assignedToUserId: '', roleScope: 'VERIFIER', instructions: '' });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Revoke Assignment
  const handleRevokeAssignment = async (assignmentId: string) => {
    if (!isSuperAdmin) return;
    if (!window.confirm(tx("هل أنت متأكد من سحب التكليف؟ سيتم إلغاء وصول الموظف إلى هذا البلاغ فوراً."))) return;

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/assignments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("تعذر سحب التكليف"));

      setFeedback({ type: 'success', message: tx("تم سحب التكليف وإلغاء ترخيص النفاذ بنجاح") });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Submit Admiralty Verification
  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVerification(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل توثيق التحقق الميداني"));

      setFeedback({
        type: 'success',
        message: tx("تم توثيق نتيجة التحقق بنجاح برمز أدميرالتي [{0}]", data.verification.admiraltyCode),
      });
      setVerificationForm({
        ...verificationForm,
        verificationSummary: '',
        contradictionsFound: false,
        contradictionNotes: '',
      });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSavingVerification(false);
    }
  };

  // Redact Attachment (Strip EXIF & Create Safe Version)
  const handleRedactAttachment = async (attachmentId: string) => {
    if (!isSuperAdmin) return;
    setRedactingAttId(attachmentId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/attachments/${attachmentId}/redact`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل تجريد المرفق"));

      setFeedback({ type: 'success', message: tx("تم تجريد بيانات EXIF وإنشاء نسخة آمنة معتمدة") });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRedactingAttId(null);
    }
  };

  // Update Status directly (SuperAdmin)
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("تعذر تحديث الحالة"));
      setFeedback({ type: 'success', message: tx("تم تحديث حالة البلاغ إلى [{0}]", STATUS_CONFIG[newStatus]?.label || newStatus) });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Trigger Operational Escalation (SuperAdmin)
  const handleEscalate = async () => {
    if (!isSuperAdmin) return;
    const reason = window.prompt(
      tx("يرجى إدخال سبب تصعيد البلاغ الميداني:"),
      tx("تجاوز الحد الزمني للاستجابة (SLA Breach) أو تصعيد تشغيلي طارئ")
    );
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل تصعيد البلاغ"));
      setFeedback({ type: 'success', message: data.message || tx("تم تصعيد البلاغ وإشعار الفريق المعني بنجاح") });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  if (isLoading) {
    return (
      <AdminSection>
        <AdminLoadingState message={tx("جاري فحص الاستحقاق الأمني واسترجاع بيانات البلاغ...")} />
      </AdminSection>
    );
  }

  if (!incident) {
    return (
      <AdminSection>
        <AdminEmptyState
          title={tx("تعذر فتح ملف البلاغ الميداني")}
          description={feedback?.message || tx("البلاغ غير موجود أو لا تملك إسناداً نشطاً للاطلاع عليه.")}
          action={
            <Link href="/admin/incidents" style={{ textDecoration: 'none' }}>
              <AdminButton variant="primary" size="sm" icon={<ArrowRight size={14} />}>
                {tx("العودة لقائمة البلاغات")}
              </AdminButton>
            </Link>
          }
        />
      </AdminSection>
    );
  }

  const statusMeta = STATUS_CONFIG[incident.status] || { label: incident.status, variant: 'neutral' as const };
  const priorityMeta = PRIORITY_CONFIG[incident.priority] || { label: incident.priority, variant: 'neutral' as const };
  const latestVerification = incident.verifications?.[0];

  const tabOptions = [
    ...(isSuperAdmin ? [{ id: 'ORIGINAL', label: tx("الأصل الحساس المشفر (إدارة عليا)"), icon: Lock }] : []),
    { id: 'REDACTION', label: isSuperAdmin ? tx("إعداد واعتماد النسخة المنقحة") : tx("النسخة المنقحة المعتمدة"), icon: FileText },
    ...(isSuperAdmin ? [{ id: 'ASSIGNMENT', label: tx("إسناد المهام والمكلفين ({0})", incident.assignments?.length || 0), icon: UserCheck }] : []),
    { id: 'VERIFICATION', label: tx("توثيق التحقق الميداني ({0})", incident.verifications?.length || 0), icon: ShieldCheck },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <AdminPageHeader
        title={incident.currentRedacted?.redactedTitleAr || incident.incidentNumber}
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
              {incident.incidentNumber}
            </span>
            <AdminStatusBadge status={CATEGORY_LABELS[incident.category] || incident.category} variant="info" dot />
            <AdminStatusBadge status={priorityMeta.label} variant={priorityMeta.variant} dot />
            <AdminStatusBadge status={statusMeta.label} variant={statusMeta.variant} dot />
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/admin/incidents" style={{ textDecoration: 'none' }}>
              <AdminButton variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                {tx("قائمة البلاغات")}
              </AdminButton>
            </Link>

            {/* Operational Derivation: Alerts */}
            {incident.status === 'VERIFIED' && (
              <Link href={`/admin/alerts`} style={{ textDecoration: 'none' }}>
                <AdminButton variant="primary" size="sm" icon={<BellRing size={13} />}>
                  {tx("صياغة مسودة تنبيه ميداني")}
                </AdminButton>
              </Link>
            )}

            {/* Operational Derivation: Risks */}
            {incident.status === 'VERIFIED' && (
              <Link href={`/admin/risks`} style={{ textDecoration: 'none' }}>
                <AdminButton variant="secondary" size="sm" icon={<Layers size={13} />}>
                  {tx("اشتقاق خطر تشغيلي")}
                </AdminButton>
              </Link>
            )}

            {isSuperAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{tx("الحالة:")}</span>
                <AdminSelect
                  value={incident.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  }))}
                />
              </div>
            )}
          </div>
        }
      />

      {/* Feedback Alerts */}
      {feedback && (
        <AdminAlert
          variant={feedback.type === 'success' ? 'success' : 'danger'}
          title={feedback.type === 'success' ? tx("تمت العملية") : tx("تنبيه خطأ")}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Triple-Gate Enforcement Notice for Assigned Staff */}
      {!isSuperAdmin && incident.myAssignment && (
        <AdminAlert
          variant="info"
          title={tx("تم التحقق والترخيص بموجب الاستحقاق الثلاثي")}
          message={
            <span>
              {tx("أنت مكلف رسمياً بمهمة")} <strong>{incident.myAssignment.roleScope === 'VERIFIER' ? tx("التحقق الميداني") : tx("التحليل والتقييم")}</strong>
              {incident.myAssignment.instructions && tx(" — التوجيهات: {0}", incident.myAssignment.instructions)}
            </span>
          }
        />
      )}

      {/* Operational Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <AdminStatCard
          title={tx("الموقع والنطاق الجغرافي")}
          value={incident.governorate}
          icon={MapPin}
          description={incident.district ? tx("مديرية: {0}", incident.district) : tx("المحافظة بالكامل")}
        />
        <AdminStatCard
          title={tx("توقيت الواقعة الميدانية")}
          value={new Date(incident.incidentDate).toLocaleDateString(txLocale("ar-YE"))}
          icon={Clock}
          description={new Date(incident.incidentDate).toLocaleTimeString(txLocale("ar-YE"), { hour: '2-digit', minute: '2-digit' })}
        />
        <AdminStatCard
          title={tx("كود أدميرالتي للتحقق")}
          value={latestVerification ? latestVerification.admiraltyCode : tx("قيد الفحص")}
          icon={ShieldCheck}
          variant={latestVerification ? 'success' : 'warning'}
          description={latestVerification ? tx("موثوقية {0} ومصداقية {1}", latestVerification.sourceReliability, latestVerification.infoCredibility) : tx("لم يوثق معيار أدميرالتي بعد")}
        />
        <AdminStatCard
          title={tx("الارتباطات التشغيلية المشتقة")}
          value={`${incident.alerts?.length || 0} تنبيه / ${incident.risks?.length || 0} خطر`}
          icon={Layers}
          variant="info"
          description={tx("تنبيهات ومخاطر مشتقة رسمياً")}
        />
      </div>

      {/* 24/7 Operations Room & SLA Monitoring Card */}
      <AdminSection
        title={tx("دورة الرصد والاستجابة 24/7 واتفاقية مستوى الخدمة (SLA)")}
        description={tx("تتبع زمني دقيق لمسار البلاغ: استلام → فرز/إسناد → استجابة أولى → مهلة SLA → تصعيد → إغلاق")}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: 'var(--admin-bg-surface-subtle)',
            padding: '1.25rem',
            borderRadius: 'var(--admin-radius-lg)',
            border: incident.isEscalated
              ? '1px solid var(--admin-danger)'
              : incident.slaStatus === 'BREACHED'
              ? '1px solid var(--admin-danger)'
              : incident.slaStatus === 'APPROACHING_BREACH'
              ? '1px solid var(--admin-warning)'
              : '1px solid var(--admin-border-subtle)',
          }}
        >
          {/* 1. Received At */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block' }}>
              {tx("1. تاريخ وتوقيت الاستلام:")}
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
              {new Date(incident.createdAt).toLocaleString(txLocale("ar-YE"), { dateStyle: 'short', timeStyle: 'short' })}
            </strong>
          </div>

          {/* 2. First Response At */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block' }}>
              {tx("2. بدء الاستجابة الأولى:")}
            </span>
            {incident.firstResponseAt ? (
              <strong style={{ fontSize: '0.9rem', color: 'var(--admin-success)' }}>
                ✓ {new Date(incident.firstResponseAt).toLocaleTimeString(txLocale("ar-YE"), { hour: '2-digit', minute: '2-digit' })}
              </strong>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--admin-warning)', fontWeight: 600 }}>
                ⏳ {tx("بانتظار إجراء استجابة أو إسناد")}
              </span>
            )}
          </div>

          {/* 3. SLA Target & Due Time */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block' }}>
              {tx("3. مهلة الاستجابة (SLA Target):")}
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
              {incident.slaTargetMinutes ? `${incident.slaTargetMinutes} ${tx("دقيقة")}` : tx("معيار الفئة")}
              {incident.dueAt && ` (${new Date(incident.dueAt).toLocaleTimeString(txLocale("ar-YE"), { hour: '2-digit', minute: '2-digit' })})`}
            </strong>
          </div>

          {/* 4. SLA Status Badge */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>
              {tx("4. مؤشر الالتزام بـ SLA:")}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {(() => {
                const slaKey = incident.slaStatus || 'ON_TIME';
                const slaMeta = SLA_CONFIG[slaKey] || { label: slaKey, variant: 'neutral' as const };
                return <AdminStatusBadge status={slaMeta.label} variant={slaMeta.variant} dot />;
              })()}
            </div>
          </div>

          {/* 5. Escalation Status & Action */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>
              {tx("5. حالة التصعيد الميداني:")}
            </span>
            {incident.isEscalated ? (
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'var(--admin-danger-subtle)',
                    color: 'var(--admin-danger)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    display: 'inline-block',
                  }}
                >
                  🚨 {tx("مُصعّد رسمياً")}
                </span>
                {incident.escalationReason && (
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                    {incident.escalationReason}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{tx("غير مصعد")}</span>
                {isSuperAdmin && (
                  <AdminButton variant="secondary" size="sm" onClick={handleEscalate}>
                    {tx("⚡ تصعيد طارئ")}
                  </AdminButton>
                )}
              </div>
            )}
          </div>

          {/* 6. Closure Timestamp */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block' }}>
              {tx("6. حالة الإغلاق والتوثيق:")}
            </span>
            {incident.closedAt ? (
              <strong style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
                {tx("أُغلق في:")} {new Date(incident.closedAt).toLocaleString(txLocale("ar-YE"), { dateStyle: 'short', timeStyle: 'short' })}
              </strong>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--admin-info)' }}>
                {tx("مفتوح وقيد المعالجة")}
              </span>
            )}
          </div>
        </div>
      </AdminSection>

      {/* Related Entities Bar (if any exists) */}
      {((incident.alerts && incident.alerts.length > 0) || (incident.risks && incident.risks.length > 0)) && (
        <AdminSection title={tx("الكيانات التشغيلية المرتبطة بهذا البلاغ")} description={tx("التنبيهات وسجلات المخاطر المشتقة من واقعة البلاغ الحالية")}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {incident.alerts?.map((alt: any) => (
              <Link
                key={alt.id}
                href={`/admin/alerts/${alt.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--admin-bg-surface-subtle)',
                  border: '1px solid var(--admin-border-subtle)',
                  padding: '6px 12px',
                  borderRadius: 'var(--admin-radius-md)',
                  fontSize: '0.82rem',
                }}
              >
                <BellRing size={14} style={{ color: 'var(--admin-primary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>{tx("تنبيه:")}</span>
                <span dir="ltr" style={{ fontFamily: 'monospace', color: 'var(--admin-primary)' }}>{alt.alertNumber}</span>
                <ExternalLink size={12} style={{ color: 'var(--admin-text-muted)' }} />
              </Link>
            ))}

            {incident.risks?.map((rsk: any) => (
              <Link
                key={rsk.id}
                href={`/admin/risks/${rsk.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--admin-bg-surface-subtle)',
                  border: '1px solid var(--admin-border-subtle)',
                  padding: '6px 12px',
                  borderRadius: 'var(--admin-radius-md)',
                  fontSize: '0.82rem',
                }}
              >
                <Layers size={14} style={{ color: 'var(--admin-warning)' }} />
                <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>{tx("خطر:")}</span>
                <span dir="ltr" style={{ fontFamily: 'monospace', color: 'var(--admin-primary)' }}>{rsk.riskNumber}</span>
                <ExternalLink size={12} style={{ color: 'var(--admin-text-muted)' }} />
              </Link>
            ))}
          </div>
        </AdminSection>
      )}

      {/* Tabs */}
      <AdminTabs
        tabs={tabOptions}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* TAB 1: SENSITIVE ORIGINAL (SUPER_ADMIN ONLY) */}
      {activeTab === 'ORIGINAL' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AdminAlert
            variant="danger"
            title={tx("أصل البلاغ الحساس محمي بنظام التشفير الحركي AES-256-GCM")}
            message={tx("تم فك تشفيره في الذاكرة اللحظية لحساب الإدارة العليا حصراً. يُحظر تدوين هذه البيانات في مسودات غير مشفرة أو مشاركتها مع الكوادر غير المخولة.")}
          />

          {isLoadingOriginal ? (
            <AdminSection>
              <AdminLoadingState message={tx("جاري استرجاع وفك تشفير حقول الأصل الحساس في الذاكرة...")} />
            </AdminSection>
          ) : originalData ? (
            <>
              {/* Source Details */}
              <AdminSection title={tx("بيانات المصدر والمبلغ الميداني")} description={tx("معلومات الاتصال والجهة المبلغة الأصلية")}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{tx("صفة المصدر:")}</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>{originalData.sourceType || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{tx("اسم المصدر:")}</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--admin-primary)' }}>{originalData.sourceName || tx("غير مصرح")}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{tx("هاتف التواصل:")}</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)' }} dir="ltr">{originalData.sourcePhone || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{tx("الجهة / المؤسسة:")}</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>{originalData.sourceOrganization || '—'}</strong>
                  </div>
                </div>
              </AdminSection>

              {/* Exact Location & Coords */}
              <AdminSection title={tx("الموقع الدقيق والإحداثيات الجغرافية")} description={tx("إحداثيات GPS المباشرة للواقعة")}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{tx("خط العرض (Latitude):")}</span>
                    <code dir="ltr" style={{ fontSize: '0.9rem', color: 'var(--admin-success)', background: 'var(--admin-bg-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                      {originalData.exactLatitude ?? tx("غير متوفر")}
                    </code>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{tx("خط الطول (Longitude):")}</span>
                    <code dir="ltr" style={{ fontSize: '0.9rem', color: 'var(--admin-success)', background: 'var(--admin-bg-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                      {originalData.exactLongitude ?? tx("غير متوفر")}
                    </code>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '4px' }}>{tx("التوصيف المكاني التفصيلي:")}</span>
                  <p style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)', background: 'var(--admin-bg-surface-subtle)', padding: '0.75rem', borderRadius: '6px', margin: 0 }}>
                    {originalData.exactLocationDesc || tx("لا يوجد وصف مكاني إضافي")}
                  </p>
                </div>
              </AdminSection>

              {/* Raw Narrative */}
              <AdminSection title={tx("السرد الميداني الخام غير المنقح")} description={tx("النص الحرفي الوارد من المصدر قبل أي معالجة")}>
                <div style={{ background: 'var(--admin-bg-surface-subtle)', border: '1px solid var(--admin-border-subtle)', borderRadius: '6px', padding: '1rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--admin-text-primary)', whiteSpace: 'pre-wrap' }}>
                  {originalData.rawDescription}
                </div>
                {originalData.initialRiskNotes && (
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-warning)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      {tx("ملاحظات المخاطر والتهديدات الأولية للمصدر:")}
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: 0, background: 'var(--admin-bg-surface-subtle)', padding: '0.75rem', borderRadius: '6px' }}>
                      {originalData.initialRiskNotes}
                    </p>
                  </div>
                )}
              </AdminSection>
            </>
          ) : (
            <AdminSection>
              <AdminEmptyState title={tx("لم يتم فك تشفير الأصل الحساس")} description={tx("اضغط لتأكيد فك التشفير واستعراض بيانات المصدر.")} />
            </AdminSection>
          )}
        </div>
      )}

      {/* TAB 2: REDACTION & APPROVED VIEW */}
      {activeTab === 'REDACTION' && (
        <div>
          {isSuperAdmin ? (
            /* SuperAdmin Redaction Editor */
            <AdminSection
              title={tx("إعداد واعتماد النسخة المنقحة (Redaction & Publishing)")}
              description={tx("تنقيح البيانات: يجب إزالة أسماء المصادر، أرقام الاتصال، الإحداثيات الدقيقة، وأي مؤشرات قد تكشف هوية المبلغ أو موقعه غير المحمي قبل النشر.")}
            >
              <form onSubmit={handleSaveRedaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("العنوان المنقح بالعربية *")}
                  </label>
                  <AdminInput
                    required
                    placeholder={tx("مثال: حادثة إطلاق نار وتوتر أمني بالقرب من المنصورة")}
                    value={redactionForm.redactedTitleAr}
                    onChange={(e) => setRedactionForm({ ...redactionForm, redactedTitleAr: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("النطاق الجغرافي الآمن للتعميم *")}
                  </label>
                  <AdminInput
                    required
                    placeholder={tx("مثال: مديرية المنصورة، الطريق الدائري")}
                    value={redactionForm.safeAreaScopeAr}
                    onChange={(e) => setRedactionForm({ ...redactionForm, safeAreaScopeAr: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("السرد الميداني المنقح بالعربية *")}
                  </label>
                  <AdminTextarea
                    required
                    rows={6}
                    placeholder={tx("اكتب السرد بأسلوب موضوعي يصف الواقعة بدقة دون ذكر أسماء المصادر أو إحداثيات حساسة...")}
                    value={redactionForm.redactedDescAr}
                    onChange={(e) => setRedactionForm({ ...redactionForm, redactedDescAr: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                      {tx("الأثر الميداني اللحظي")}
                    </label>
                    <AdminTextarea
                      rows={3}
                      placeholder={tx("انقطاع الحركة، إغلاق محال تجارية، ازدحام...")}
                      value={redactionForm.immediateImpact}
                      onChange={(e) => setRedactionForm({ ...redactionForm, immediateImpact: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                      {tx("التعليمات والإرشادات الأمنية")}
                    </label>
                    <AdminTextarea
                      rows={3}
                      placeholder={tx("تجنب المسار المؤدي إلى كالتكس، توخي الحذر...")}
                      value={redactionForm.safetyAdvisory}
                      onChange={(e) => setRedactionForm({ ...redactionForm, safetyAdvisory: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <AdminCheckbox
                    id="isApprovedRedaction"
                    checked={redactionForm.isApproved}
                    onChange={(val) => setRedactionForm({ ...redactionForm, isApproved: val })}
                    label={tx("اعتماد النسخة المنقحة وإتاحتها للموظفين المكلفين بالتحقق والتحليل")}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <AdminButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSavingRedaction}
                    icon={<RefreshCw size={14} className={isSavingRedaction ? 'spin' : ''} />}
                  >
                    {isSavingRedaction ? tx("جاري الحفظ والاعتماد...") : tx("حفظ واعتماد النسخة المنقحة")}
                  </AdminButton>
                </div>
              </form>
            </AdminSection>
          ) : (
            /* Staff View: Approved Redacted Version ONLY */
            <AdminSection title={tx("النسخة المنقحة المعتمدة رسمياً")} description={tx("البيانات الميدانية المصرح بنشرها للكوادر المكلفة")}>
              {incident.approvedRedacted ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--admin-success)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-success)', fontWeight: 600 }}>
                      {tx("نسخة منقحة معتمدة رسمياً من الإدارة العليا")}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
                    {incident.approvedRedacted.redactedTitleAr}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--admin-primary)' }}>
                    <MapPin size={14} />
                    <span>{tx("النطاق الجغرافي:")} {incident.approvedRedacted.safeAreaScopeAr}</span>
                  </div>

                  <div style={{ background: 'var(--admin-bg-surface-subtle)', borderRadius: '8px', padding: '1.25rem', fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--admin-text-primary)', whiteSpace: 'pre-wrap' }}>
                    {incident.approvedRedacted.redactedDescAr}
                  </div>

                  {(incident.approvedRedacted.immediateImpact || incident.approvedRedacted.safetyAdvisory) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {incident.approvedRedacted.immediateImpact && (
                        <div style={{ background: 'var(--admin-bg-surface-subtle)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
                          <strong style={{ fontSize: '0.82rem', color: 'var(--admin-primary)', display: 'block', marginBottom: '0.4rem' }}>
                            {tx("الأثر الميداني اللحظي:")}
                          </strong>
                          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: 0 }}>
                            {incident.approvedRedacted.immediateImpact}
                          </p>
                        </div>
                      )}

                      {incident.approvedRedacted.safetyAdvisory && (
                        <div style={{ background: 'var(--admin-warning-subtle)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-warning)' }}>
                          <strong style={{ fontSize: '0.82rem', color: 'var(--admin-warning)', display: 'block', marginBottom: '0.4rem' }}>
                            {tx("الإرشادات والتعليمات الأمنية:")}
                          </strong>
                          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-primary)', margin: 0 }}>
                            {incident.approvedRedacted.safetyAdvisory}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <AdminEmptyState
                  title={tx("النسخة المنقحة قيد الإعداد")}
                  description={tx("يقوم مسؤولو الإدارة العليا حالياً بفرز وتنقيح البلاغ الميداني قبل إتاحته للمتابعة.")}
                />
              )}
            </AdminSection>
          )}
        </div>
      )}

      {/* TAB 3: TASK ASSIGNMENTS (SUPER_ADMIN ONLY) */}
      {activeTab === 'ASSIGNMENT' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AdminSection title={tx("إسناد مهمة تحقق أو تحليل لموظف معتمد")} description={tx("تفعيل ترخيص النفاذ للبلاغ وفق قاعدة الاستحقاق الثلاثي")}>
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("الموظف المكلف *")}
                  </label>
                  <AdminSelect
                    required
                    value={assignmentForm.assignedToUserId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, assignedToUserId: e.target.value })}
                    options={[
                      { value: '', label: tx("اختر موظفاً معتمداً...") },
                      ...availableStaff.map((u) => ({
                        value: u.id,
                        label: `${u.fullName} (${u.role}) — ${u.organization || tx("المركز")}`,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("طبيعة التكليف (Role Scope) *")}
                  </label>
                  <AdminSelect
                    value={assignmentForm.roleScope}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, roleScope: e.target.value })}
                    options={[
                      { value: 'VERIFIER', label: tx("VERIFIER — التحقق الميداني والتقني") },
                      { value: 'ANALYST', label: tx("ANALYST — تحليل وتقييم المخاطر") },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("تعليمات وتوجيهات الإدارة للموظف")}
                </label>
                <AdminInput
                  placeholder={tx("مثال: يرجى استقصاء الوضع ومقابلة مصادر مستقلة والتأكد من فتح الطريق...")}
                  value={assignmentForm.instructions}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSavingAssignment || !assignmentForm.assignedToUserId}
                  icon={<UserCheck size={14} />}
                >
                  {isSavingAssignment ? tx("جاري الإسناد...") : tx("تأكيد إسناد البلاغ للموظف")}
                </AdminButton>
              </div>
            </form>
          </AdminSection>

          {/* Assignments List */}
          <AdminSection title={tx("سجل التكليفات والإسنادات للبلاغ")} description={tx("قائمة الموظفين المصرح لهم بالنفاذ والتحقق")}>
            {incident.assignments && incident.assignments.length > 0 ? (
              <AdminDataTable
                columns={[
                  {
                    key: 'assignee',
                    header: tx("الموظف المكلف"),
                    render: (asgn: any) => (
                      <div>
                        <strong style={{ display: 'block', color: 'var(--admin-text-primary)' }}>
                          {asgn.assignedTo?.fullName || tx("موظف غير معروف")}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                          {tx("تاريخ التكليف:")} {new Date(asgn.assignedAt).toLocaleDateString(txLocale("ar-YE"))}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'roleScope',
                    header: tx("طبيعة المهمة"),
                    render: (asgn: any) => (
                      <AdminStatusBadge
                        status={asgn.roleScope === 'VERIFIER' ? tx("تحقق ميداني") : tx("تحليل مخاطر")}
                        variant="info"
                        dot
                      />
                    ),
                  },
                  {
                    key: 'status',
                    header: tx("حالة الترخيص"),
                    render: (asgn: any) => {
                      const isActive = asgn.isActive && !asgn.revokedAt;
                      return (
                        <AdminStatusBadge
                          status={isActive ? tx("إسناد نشط") : tx("مسحوب الوصول")}
                          variant={isActive ? 'success' : 'danger'}
                          dot
                        />
                      );
                    },
                  },
                  {
                    key: 'instructions',
                    header: tx("التوجيهات والتعليمات"),
                    render: (asgn: any) => (
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                        {asgn.instructions || '—'}
                      </span>
                    ),
                  },
                  {
                    key: 'action',
                    header: tx("إجراء"),
                    render: (asgn: any) => {
                      const isActive = asgn.isActive && !asgn.revokedAt;
                      if (!isActive) return <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>{tx("تم السحب")}</span>;
                      return (
                        <AdminButton
                          variant="danger"
                          size="sm"
                          icon={<UserX size={12} />}
                          onClick={() => handleRevokeAssignment(asgn.id)}
                        >
                          {tx("سحب التكليف")}
                        </AdminButton>
                      );
                    },
                  },
                ]}
                data={incident.assignments}
                keyExtractor={(asgn) => asgn.id}
                mobileCardRender={(asgn: any) => {
                  const isActive = asgn.isActive && !asgn.revokedAt;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--admin-text-primary)' }}>
                            {asgn.assignedTo?.fullName || tx("موظف غير معروف")}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                            {tx("تاريخ التكليف:")} {new Date(asgn.assignedAt).toLocaleDateString(txLocale("ar-YE"))}
                          </span>
                        </div>
                        <AdminStatusBadge
                          status={isActive ? tx("إسناد نشط") : tx("مسحوب الوصول")}
                          variant={isActive ? 'success' : 'danger'}
                          dot
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <AdminStatusBadge
                          status={asgn.roleScope === 'VERIFIER' ? tx("تحقق ميداني") : tx("تحليل مخاطر")}
                          variant="info"
                          dot
                        />
                        {isActive && (
                          <AdminButton
                            variant="danger"
                            size="sm"
                            icon={<UserX size={12} />}
                            onClick={() => handleRevokeAssignment(asgn.id)}
                          >
                            {tx("سحب التكليف")}
                          </AdminButton>
                        )}
                      </div>
                      {asgn.instructions && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                          {asgn.instructions}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            ) : (
              <AdminEmptyState
                title={tx("لا توجد تكليفات نشطة")}
                description={tx("لم يتم إسناد هذا البلاغ لأي موظف ميداني بعد.")}
              />
            )}
          </AdminSection>
        </div>
      )}

      {/* TAB 4: ADMIRALTY VERIFICATION */}
      {activeTab === 'VERIFICATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Submit Verification Form */}
          <AdminSection
            title={tx("توثيق التحقق بمعيار أدميرالتي الاستخباري (Admiralty System)")}
            description={tx("تقييم مهني منفصل لموثوقية المصدر (A إلى F) ومصداقية المعلومة (1 إلى 6). توثق النتائج والتناقضات وفق المعايير الدولية.")}
          >
            <form onSubmit={handleSaveVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("تقييم موثوقية المصدر (Source Reliability) *")}
                  </label>
                  <AdminSelect
                    value={verificationForm.sourceReliability}
                    onChange={(e) => setVerificationForm({ ...verificationForm, sourceReliability: e.target.value })}
                    options={Object.entries(ADMIRALTY_RELIABILITY_MAP).map(([k, v]) => ({
                      value: k,
                      label: v,
                    }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("تقييم مصداقية المعلومة (Information Credibility) *")}
                  </label>
                  <AdminSelect
                    value={verificationForm.infoCredibility}
                    onChange={(e) => setVerificationForm({ ...verificationForm, infoCredibility: e.target.value })}
                    options={Object.entries(ADMIRALTY_CREDIBILITY_MAP).map(([k, v]) => ({
                      value: k,
                      label: v,
                    }))}
                  />
                </div>
              </div>

              {/* Code Preview Box */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  background: 'var(--admin-bg-surface-subtle)',
                  border: '1px solid var(--admin-border-subtle)',
                  borderRadius: 'var(--admin-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{tx("رمز أدميرالتي الناتج (Admiralty Code):")}</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--admin-primary)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {verificationForm.sourceReliability}{verificationForm.infoCredibility}
                  </strong>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: verificationForm.sourceReliability === 'A' || verificationForm.sourceReliability === 'B' ? 'var(--admin-success)' : 'var(--admin-text-secondary)' }}>
                  {verificationForm.sourceReliability === 'A' || verificationForm.sourceReliability === 'B' ? tx("✓ درجة ثقة مرتفعة وموصى بها") : tx("درجة موثوقية متوسطة / استرشادية")}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("منهجية وطريقة التحقق الميداني *")}
                  </label>
                  <AdminInput
                    required
                    placeholder={tx("مثال: زيارة ميدانية، اتصال بشخصيات محلية، مطابقة لقطات...")}
                    value={verificationForm.verificationMethod}
                    onChange={(e) => setVerificationForm({ ...verificationForm, verificationMethod: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                    {tx("عدد المصادر المعززة والمؤكدة")}
                  </label>
                  <AdminInput
                    type="number"
                    min={0}
                    value={verificationForm.corroboratingCount}
                    onChange={(e) => setVerificationForm({ ...verificationForm, corroboratingCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("خلاصة ونتائج التحقق الميداني *")}
                </label>
                <AdminTextarea
                  required
                  rows={4}
                  placeholder={tx("وثق بدقة ما تم التحقق منه وما تم نفيه أو تأكيده على الأرض...")}
                  value={verificationForm.verificationSummary}
                  onChange={(e) => setVerificationForm({ ...verificationForm, verificationSummary: e.target.value })}
                />
              </div>

              {/* Contradictions */}
              <div style={{ background: 'var(--admin-bg-surface-subtle)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
                <AdminCheckbox
                  id="contradictionsCheck"
                  checked={verificationForm.contradictionsFound}
                  onChange={(val) => setVerificationForm({ ...verificationForm, contradictionsFound: val })}
                  label={tx("تم رصد تناقضات أو معلومات غير متوافقة أثناء التحقيق الميداني")}
                />

                {verificationForm.contradictionsFound && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <AdminTextarea
                      rows={2}
                      placeholder={tx("وضح نقاط التناقض المرصودة وتأثيرها على صحة البلاغ...")}
                      value={verificationForm.contradictionNotes}
                      onChange={(e) => setVerificationForm({ ...verificationForm, contradictionNotes: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                  {tx("الحالة الموصى بها للبلاغ")}
                </label>
                <AdminSelect
                  value={verificationForm.recommendedStatus}
                  onChange={(e) => setVerificationForm({ ...verificationForm, recommendedStatus: e.target.value })}
                  options={[
                    { value: 'VERIFIED', label: tx("VERIFIED — مؤكد ومتحقق منه رسمياً") },
                    { value: 'UNCONFIRMED', label: tx("UNCONFIRMED — غير مؤكد قطعاً") },
                    { value: 'CONTRADICTED', label: tx("CONTRADICTED — تناقض واضح") },
                    { value: 'DISPROVED', label: tx("DISPROVED — مفند وغير صحيح") },
                  ]}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSavingVerification}
                  icon={<ShieldCheck size={16} />}
                >
                  {isSavingVerification ? tx("جاري التوثيق...") : tx("توثيق واعتماد نتيجة التحقق")}
                </AdminButton>
              </div>
            </form>
          </AdminSection>

          {/* Historical Verification Records */}
          <AdminSection title={tx("سجل التحقيقات الميدانية الموثقة للبلاغ")} description={tx("كافة نتائج التحقق الميداني والتقني المعتمدة")}>
            {incident.verifications && incident.verifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {incident.verifications.map((v: any) => (
                  <div
                    key={v.id}
                    style={{
                      background: 'var(--admin-bg-surface)',
                      border: '1px solid var(--admin-border-subtle)',
                      borderRadius: 'var(--admin-radius-md)',
                      padding: '1.25rem',
                      boxShadow: 'var(--admin-shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          dir="ltr"
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            background: 'var(--admin-primary-subtle)',
                            color: 'var(--admin-primary)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          Admiralty: {v.admiraltyCode}
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)' }}>
                          {tx("بواسطة:")} {v.verifiedBy?.fullName || tx("موظف معتمد")}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                        {new Date(v.verifiedAt).toLocaleString(txLocale("ar-YE"))}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
                      {v.verificationSummary}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', flexWrap: 'wrap' }}>
                      <span>{tx("المنهجية:")} <strong>{v.verificationMethod}</strong></span>
                      <span>{tx("المصادر المعززة:")} <strong>{v.corroboratingCount}</strong></span>
                      {v.contradictionsFound && (
                        <span style={{ color: 'var(--admin-danger)', fontWeight: 600 }}>
                          {tx("* توجد تناقضات مرصودة:")} {v.contradictionNotes || tx("نعم")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title={tx("لم يتم تسجيل أي تحقق ميداني بعد")}
                description={tx("استخدم النموذج أعلاه لتوثيق نتائج التحقق الميداني بمعيار أدميرالتي.")}
              />
            )}
          </AdminSection>
        </div>
      )}
    </div>
  );
}
