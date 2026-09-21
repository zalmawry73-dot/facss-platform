'use client';

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
} from 'lucide-react';

interface Props {
  incidentId: string;
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

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'مستلم جديد',
  TRIAGED: 'تم الفرز الأمني',
  REDACTED: 'تم التنقيح والاعتماد',
  ASSIGNED: 'مُسند للمتابعة',
  UNDER_VERIFICATION: 'قيد التحقق الميداني',
  VERIFIED: 'متحقق منه ومؤكد',
  UNCONFIRMED: 'غير مؤكد',
  CONTRADICTED: 'متناقض',
  DISPROVED: 'مفند ومستبعد',
  DUPLICATE: 'بلاغ مكرر',
  ALERT_DRAFTED: 'صيغت مسودة تنبيه',
  ALERT_APPROVED: 'اعتمد التنبيه',
  ALERT_DISPATCHED: 'تم نشر التنبيه',
  CLOSED: 'مغلق',
  ARCHIVED: 'مؤرشف',
};

const ADMIRALTY_RELIABILITY_MAP: Record<string, string> = {
  A: 'A - موثوق تماماً (لا شك في النزاهة والموثوقية)',
  B: 'B - موثوق عادة (مصدر مجرب وسوابقه موثوقة)',
  C: 'C - موثوق إلى حد ما (سوابق معقولة)',
  D: 'D - غير موثوق عادة (مشكوك في استقلاليته أو دوافعه)',
  E: 'E - غير موثوق إطلاقاً (معلومات مضللة سابقة)',
  F: 'F - لا يمكن الحكم على الموثوقية (مصدر جديد تماماً)',
};

const ADMIRALTY_CREDIBILITY_MAP: Record<string, string> = {
  '1': '1 - مؤكدة من مصادر مستقلة متعددة',
  '2': '2 - محتملة جداً ومتوافقة مع المعطيات',
  '3': '3 - ممكنة ومحتملة الوقوع',
  '4': '4 - مشكوك فيها وغير مرجحة',
  '5': '5 - غير محتملة ومستبعدة منطقياً',
  '6': '6 - لا يمكن الحكم على صحتها',
};

export default function IncidentDetailManager({
  incidentId,
  currentUserRole,
  currentUserId,
}: Props) {
  const router = useRouter();
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'ORIGINAL' | 'REDACTION' | 'ASSIGNMENT' | 'VERIFICATION'>('REDACTION');
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
    verificationMethod: 'استقصاء ميداني مباشر وتقاطع مع مصادر محلية',
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
      if (!res.ok) throw new Error(data.error || 'تعذر تحميل بيانات البلاغ');

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
        const curr = data.incident.approvedRedacted;
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
      }

      // Default active tab: If staff, default to REDACTION view; If superAdmin, can open original or redaction
      if (!isSuperAdmin) {
        setActiveTab('REDACTION');
      } else {
        setActiveTab('ORIGINAL');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Sensitive Original (Strictly SuperAdmin)
  const loadOriginal = async () => {
    if (!isSuperAdmin) return;
    setIsLoadingOriginal(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/original`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر فك تشفير الأصل الحساس');
      setOriginalData(data.original);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `فشل فك تشفير الأصل: ${err.message}` });
    } finally {
      setIsLoadingOriginal(false);
    }
  };

  // Fetch Available Staff Users for Assignment (SuperAdmin only)
  const loadAvailableStaff = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users) {
        // Filter active staff with verify_incident or analyze_incident or staff roles
        const valid = data.users.filter(
          (u: any) =>
            u.isActive &&
            u.role !== 'FIELD_FOCAL_POINT' &&
            u.role !== 'CLIENT' &&
            u.role !== 'TRAINEE'
        );
        setAvailableStaff(valid);
        if (valid.length > 0 && !assignmentForm.assignedToUserId) {
          setAssignmentForm((prev) => ({ ...prev, assignedToUserId: valid[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  useEffect(() => {
    loadIncident();
    if (isSuperAdmin) {
      loadOriginal();
      loadAvailableStaff();
    }
  }, [incidentId]);

  // Handle Redaction Form Submit
  const handleSaveRedaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRedaction(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/redacted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redactionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ النسخة المنقحة');

      setFeedback({ type: 'success', message: 'تم حفظ واعتماد النسخة المنقحة بنجاح وإتاحتها للمكلفين.' });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSavingRedaction(false);
    }
  };

  // Handle Task Assignment Submit
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAssignment(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إسناد المهمة');

      setFeedback({ type: 'success', message: data.message });
      setAssignmentForm((prev) => ({ ...prev, instructions: '' }));
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Handle Revoke Assignment
  const handleRevokeAssignment = async (assignmentId: string) => {
    if (!confirm('هل أنت متأكد من سحب التكليف؟ سيتم حجب وصول الموظف عن البلاغ فورياً وفق قاعدة الاستحقاق الثلاثي.')) return;
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/assignments?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل سحب التكليف');

      setFeedback({ type: 'success', message: data.message });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Verification Submit
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
      if (!res.ok) throw new Error(data.error || 'فشل توثيق التحقق');

      setFeedback({ type: 'success', message: data.message });
      setVerificationForm((prev) => ({
        ...prev,
        verificationSummary: '',
        contradictionNotes: '',
        contradictionsFound: false,
      }));
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSavingVerification(false);
    }
  };

  // Handle Redact Attachment (Strip EXIF)
  const handleRedactAttachment = async (attId: string) => {
    setRedactingAttId(attId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/attachments/${attId}/redact`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تنقيح المرفق');

      setFeedback({ type: 'success', message: data.message });
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
      if (!res.ok) throw new Error(data.error || 'تعذر تحديث الحالة');
      setFeedback({ type: 'success', message: `تم تحديث حالة البلاغ إلى [${STATUS_LABELS[newStatus] || newStatus}]` });
      loadIncident();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#FFF' }}>
        <ShieldAlert className="animate-spin" size={36} color="#c59b27" style={{ margin: '0 auto 1rem' }} />
        <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>جاري فحص الاستحقاق الأمني وقراءة بيانات البلاغ...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#FFF' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>تعذر فتح ملف البلاغ</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {feedback?.message || 'البلاغ غير موجود أو لا تملك إسناداً نشطاً للاطلاع عليه.'}
        </p>
        <Link href="/admin/incidents" className="btn btn-outline btn-sm">
          العودة لقائمة البلاغات
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1rem' }}>
        <Link href="/admin/incidents" style={{ color: '#c59b27', textDecoration: 'none' }}>
          البلاغات الميدانية
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: '#FFF', fontWeight: 600 }}>{incident.incidentNumber}</span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: '#FFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} color="#22c55e" /> : <AlertTriangle size={18} color="#ef4444" />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            ×
          </button>
        </div>
      )}

      {/* Incident Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c59b27', letterSpacing: '0.5px', margin: 0 }}>
                {incident.incidentNumber}
              </h2>
              <span className="badge badge-yellow" style={{ fontSize: '0.75rem' }}>
                {CATEGORY_LABELS[incident.category] || incident.category}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="#c59b27" />
                <span>{incident.governorate} {incident.district ? `(${incident.district})` : ''}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} color="#c59b27" />
                <span>توقيت الحدث: {new Date(incident.incidentDate).toLocaleString('ar-YE')}</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>حالة البلاغ:</span>
              {isSuperAdmin ? (
                <select
                  className="form-control"
                  value={incident.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '4px 8px', minWidth: '150px' }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              ) : (
                <span className="badge badge-green" style={{ fontSize: '0.8rem' }}>
                  {STATUS_LABELS[incident.status] || incident.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Triple-Gate Enforcement Notice */}
        {!isSuperAdmin && incident.myAssignment && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#93c5fd',
            }}
          >
            <div>
              <strong>تم التحقق بموجب الاستحقاق الثلاثي:</strong> أنت مكلف رسمياً بمهمة{' '}
              <span style={{ textDecoration: 'underline' }}>
                {incident.myAssignment.roleScope === 'VERIFIER' ? 'التحقق الميداني' : 'التحليل والتقييم'}
              </span>
              {incident.myAssignment.instructions && ` — تعليمات الإدارة: ${incident.myAssignment.instructions}`}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#60a5fa' }}>
              منذ {new Date(incident.myAssignment.assignedAt).toLocaleDateString('ar-YE')}
            </span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {isSuperAdmin && (
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'ORIGINAL' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setActiveTab('ORIGINAL')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Lock size={14} />
            <span>الأصل الحساس المشفر (إدارة عليا)</span>
          </button>
        )}

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'REDACTION' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => setActiveTab('REDACTION')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <FileText size={14} />
          <span>{isSuperAdmin ? 'إعداد واعتماد النسخة المنقحة' : 'النسخة المنقحة المعتمدة'}</span>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'ASSIGNMENT' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setActiveTab('ASSIGNMENT')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <UserCheck size={14} />
            <span>إسناد المهام والمكلفين</span>
          </button>
        )}

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'VERIFICATION' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => setActiveTab('VERIFICATION')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <ShieldCheck size={14} />
          <span>{isSuperAdmin ? 'سجل التحقق والحالة' : 'توثيق التحقق الميداني (Admiralty)'}</span>
        </button>
      </div>

      {/* TAB 1: SENSITIVE ORIGINAL (SUPER_ADMIN ONLY) */}
      {activeTab === 'ORIGINAL' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Lock size={22} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>
              <strong>أصل البلاغ الحساس محمي بنظام التشفير الحركي AES-256-GCM:</strong> تم فك تشفيره في الذاكرة اللحظية لحساب الإدارة العليا حصراً. يُحظر تدوين هذه البيانات في مسودات غير مشفرة أو مشاركتها مع الكوادر غير المخولة.
            </div>
          </div>

          {isLoadingOriginal ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <Lock className="animate-spin" size={28} color="#c59b27" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>جاري استرجاع وفك تشفير حقول الأصل الحساس...</span>
            </div>
          ) : originalData ? (
            <>
              {/* Source Details */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
                  بيانات المصدر والمبلغ الميداني
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>صفة المصدر:</span>
                    <strong style={{ fontSize: '0.9rem', color: '#FFF' }}>{originalData.sourceType || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>اسم المصدر:</span>
                    <strong style={{ fontSize: '0.9rem', color: '#c59b27' }}>{originalData.sourceName || 'غير مصرح'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>هاتف التواصل:</span>
                    <strong style={{ fontSize: '0.9rem', color: '#FFF' }} dir="ltr">{originalData.sourcePhone || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>الجهة / المؤسسة:</span>
                    <strong style={{ fontSize: '0.9rem', color: '#FFF' }}>{originalData.sourceOrganization || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Exact Location & Coords */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
                  الموقع الدقيق والإحداثيات الجغرافية
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>خط العرض (Latitude):</span>
                    <code style={{ fontSize: '0.9rem', color: '#22c55e' }}>{originalData.exactLatitude ?? 'غير متوفر'}</code>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>خط الطول (Longitude):</span>
                    <code style={{ fontSize: '0.9rem', color: '#22c55e' }}>{originalData.exactLongitude ?? 'غير متوفر'}</code>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>التوصيف المكاني التفصيلي:</span>
                  <p style={{ fontSize: '0.9rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', margin: 0 }}>
                    {originalData.exactLocationDesc || 'لا يوجد وصف مكاني إضافي'}
                  </p>
                </div>
              </div>

              {/* Raw Narrative */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '0.75rem' }}>
                  السرد الميداني الخام غير المنقح
                </h3>
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '1rem', fontSize: '0.92rem', lineHeight: 1.7, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                  {originalData.rawDescription}
                </div>

                {originalData.initialRiskNotes && (
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#eab308', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      ملاحظات المخاطر والتهديدات الأولية للمصدر:
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                      {originalData.initialRiskNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Original Sensitive Attachments */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
                  المرفقات والوثائق الأصلية الحساسة (SUPER_ADMIN ONLY)
                </h3>
                {incident.attachments && incident.attachments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {incident.attachments.map((att: any) => {
                      const isOriginal = att.sensitivity === 'ORIGINAL_SENSITIVE';
                      return (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: isOriginal ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)',
                            border: `1px solid ${isOriginal ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                            borderRadius: '8px',
                          }}
                        >
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.88rem', color: '#FFF' }}>
                              {att.fileName}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {(att.fileSize / 1024).toFixed(1)} KB — {isOriginal ? 'مرفق أصلي حساس (غير منقح)' : 'مرفق منقح آمن'}
                              {att.hasExifStripped && ' (EXIF/GPS مجرد)'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Download Button */}
                            <a
                              href={`/api/incidents/attachments/${att.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Download size={13} />
                              <span>تحميل</span>
                            </a>

                            {/* Redact Action Button (if image and original) */}
                            {isOriginal && (att.mimeType?.startsWith('image/') || att.fileName?.match(/\.(jpg|jpeg|png)$/i)) && (
                              <button
                                type="button"
                                disabled={redactingAttId === att.id}
                                onClick={() => handleRedactAttachment(att.id)}
                                className="btn btn-gold btn-sm"
                                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ShieldCheck size={13} />
                                <span>{redactingAttId === att.id ? 'جاري التجريد...' : 'تجريد EXIF واعتماد نسخة آمنة'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>لا توجد مرفقات مرفوعة مع هذا البلاغ.</span>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <AlertTriangle size={32} color="#eab308" style={{ margin: '0 auto 0.5rem' }} />
              <span>لم يتم فك تشفير الأصل الحساس</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REDACTION & APPROVED VIEW */}
      {activeTab === 'REDACTION' && (
        <div>
          {isSuperAdmin ? (
            /* SuperAdmin Redaction Editor */
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.35rem' }}>
                  إعداد واعتماد النسخة المنقحة (Redaction & Publishing)
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  تنقيح البيانات: يجب إزالة أسماء المصادر، أرقام الاتصال، الإحداثيات الدقيقة، وأي مؤشرات قد تكشف هوية المبلغ أو موقعه غير المحمي قبل النشر للموظفين المكلفين.
                </p>
              </div>

              <form onSubmit={handleSaveRedaction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">العنوان المنقح بالعربية *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="مثال: حادثة إطلاق نار وتوتر أمني بالقرب من المنصورة"
                    value={redactionForm.redactedTitleAr}
                    onChange={(e) => setRedactionForm({ ...redactionForm, redactedTitleAr: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">النطاق الجغرافي الآمن للتعميم *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="مثال: مديرية المنصورة، الطريق الدائري"
                    value={redactionForm.safeAreaScopeAr}
                    onChange={(e) => setRedactionForm({ ...redactionForm, safeAreaScopeAr: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">السرد الميداني المنقح بالعربية *</label>
                  <textarea
                    required
                    rows={6}
                    className="form-control"
                    placeholder="اكتب السرد بأسلوب موضوعي يصف الواقعة بدقة دون ذكر أسماء المصادر أو إحداثيات حساسة..."
                    value={redactionForm.redactedDescAr}
                    onChange={(e) => setRedactionForm({ ...redactionForm, redactedDescAr: e.target.value })}
                  />
                </div>

                <div className="facss-form-grid-2">
                  <div>
                    <label className="form-label">الأثر الميداني اللحظي</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="انقطاع الحركة، إغلاق محال تجارية، ازدحام..."
                      value={redactionForm.immediateImpact}
                      onChange={(e) => setRedactionForm({ ...redactionForm, immediateImpact: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">التعليمات والإرشادات الأمنية</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="تجنب المسار المؤدي إلى كالتكس، توخي الحذر..."
                      value={redactionForm.safetyAdvisory}
                      onChange={(e) => setRedactionForm({ ...redactionForm, safetyAdvisory: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', background: 'rgba(197, 155, 39, 0.1)', border: '1px solid rgba(197, 155, 39, 0.3)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={redactionForm.isApproved}
                      onChange={(e) => setRedactionForm({ ...redactionForm, isApproved: e.target.checked })}
                    />
                    <strong style={{ fontSize: '0.88rem', color: '#FFF' }}>
                      اعتماد النسخة المنقحة وإتاحتها للموظفين المكلفين بالتحقق والتحليل
                    </strong>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    disabled={isSavingRedaction}
                    className="btn btn-gold"
                    style={{ fontWeight: 800 }}
                  >
                    {isSavingRedaction ? 'جاري الحفظ والاعتماد...' : 'حفظ واعتماد النسخة المنقحة'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Staff View: Approved Redacted Version ONLY */
            <div className="card" style={{ padding: '1.5rem' }}>
              {incident.approvedRedacted ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle2 size={18} color="#22c55e" />
                    <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600 }}>
                      نسخة منقحة معتمدة رسمياً من الإدارة العليا
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.75rem' }}>
                    {incident.approvedRedacted.redactedTitleAr}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#93c5fd' }}>
                    <MapPin size={14} />
                    <span>النطاق الجغرافي: {incident.approvedRedacted.safeAreaScopeAr}</span>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '8px', padding: '1.25rem', fontSize: '0.92rem', lineHeight: 1.8, color: '#e2e8f0', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
                    {incident.approvedRedacted.redactedDescAr}
                  </div>

                  {(incident.approvedRedacted.immediateImpact || incident.approvedRedacted.safetyAdvisory) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      {incident.approvedRedacted.immediateImpact && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#c59b27', display: 'block', marginBottom: '0.4rem' }}>
                            الأثر الميداني اللحظي:
                          </strong>
                          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
                            {incident.approvedRedacted.immediateImpact}
                          </p>
                        </div>
                      )}

                      {incident.approvedRedacted.safetyAdvisory && (
                        <div style={{ background: 'rgba(234, 179, 8, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#eab308', display: 'block', marginBottom: '0.4rem' }}>
                            الإرشادات والتعليمات الأمنية:
                          </strong>
                          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
                            {incident.approvedRedacted.safetyAdvisory}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Redacted Safe Attachments for Staff */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', marginBottom: '0.75rem' }}>
                      المرفقات والوثائق المنقحة المعتمدة
                    </h4>
                    {incident.attachments && incident.attachments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {incident.attachments.map((att: any) => (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.65rem 1rem',
                              background: 'rgba(34, 197, 94, 0.08)',
                              border: '1px solid rgba(34, 197, 94, 0.25)',
                              borderRadius: '6px',
                            }}
                          >
                            <span style={{ fontSize: '0.85rem', color: '#FFF' }}>{att.fileName}</span>
                            <a
                              href={`/api/incidents/attachments/${att.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem' }}
                            >
                              عرض / تحميل المرفق
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>لا توجد مرفقات منقحة متاحة لهذا البلاغ.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <AlertTriangle size={36} color="#eab308" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>النسخة المنقحة قيد الإعداد والمراجعة من قبل الإدارة العليا.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TASK ASSIGNMENTS (SUPER_ADMIN ONLY) */}
      {activeTab === 'ASSIGNMENT' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Create Assignment Form */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="#c59b27" />
              <span>إسناد مهمة تحقق أو تحليل لموظف معتمد</span>
            </h3>

            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">الموظف المكلف *</label>
                  <select
                    required
                    className="form-control"
                    value={assignmentForm.assignedToUserId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, assignedToUserId: e.target.value })}
                  >
                    <option value="">اختر موظفاً معتمداً...</option>
                    {availableStaff.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role}) — {u.organization || 'المركز'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">طبيعة التكليف (Role Scope) *</label>
                  <select
                    className="form-control"
                    value={assignmentForm.roleScope}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, roleScope: e.target.value })}
                  >
                    <option value="VERIFIER">VERIFIER — التحقق الميداني والتقني</option>
                    <option value="ANALYST">ANALYST — تحليل وتقييم المخاطر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">تعليمات وتوجيهات الإدارة للموظف</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: يرجى استقصاء الوضع ومقابلة مصادر مستقلة والتأكد من فتح الطريق..."
                  value={assignmentForm.instructions}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSavingAssignment || !assignmentForm.assignedToUserId}
                  className="btn btn-gold btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  {isSavingAssignment ? 'جاري الإسناد...' : 'تأكيد إسناد البلاغ للموظف'}
                </button>
              </div>
            </form>
          </div>

          {/* Active & Past Assignments List */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
              سجل التكليفات والإسنادات للبلاغ
            </h3>

            {incident.assignments && incident.assignments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {incident.assignments.map((asgn: any) => {
                  const isActive = asgn.isActive && !asgn.revokedAt;
                  return (
                    <div
                      key={asgn.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: isActive ? 'rgba(197, 155, 39, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? 'rgba(197, 155, 39, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <strong style={{ fontSize: '0.92rem', color: '#FFF' }}>
                            {asgn.assignedTo?.fullName || 'موظف غير معروف'}
                          </strong>
                          <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.7rem' }}>
                            {isActive ? 'إسناد نشط (مخول بالقراءة)' : 'ملغي / مسحوب الوصول'}
                          </span>
                          <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                            {asgn.roleScope === 'VERIFIER' ? 'تحقق ميداني' : 'تحليل مخاطر'}
                          </span>
                        </div>
                        {asgn.instructions && (
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block' }}>
                            التعليمات: {asgn.instructions}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          تاريخ الإسناد: {new Date(asgn.assignedAt).toLocaleString('ar-YE')}
                          {asgn.revokedAt && ` — سُحب بتاريخ: ${new Date(asgn.revokedAt).toLocaleString('ar-YE')}`}
                        </span>
                      </div>

                      {isActive && (
                        <button
                          type="button"
                          onClick={() => handleRevokeAssignment(asgn.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <UserX size={13} />
                          <span>سحب التكليف (حجب فوري)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>لم يتم إسناد هذا البلاغ لأي موظف حتى الآن.</span>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ADMIRALTY VERIFICATION */}
      {activeTab === 'VERIFICATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Submit Verification Form (Staff & SuperAdmin) */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#c59b27" />
              <span>توثيق التحقق بمعيار أدميرالتي الاستخباري (Admiralty System)</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              تقييم مهني منفصل لموثوقية المصدر (A إلى F) ومصداقية المعلومة (1 إلى 6). لا يتم إنشاء مؤشر ثقة رقمي تلقائي، وتوثق النتائج والتناقضات وفق المعايير الدولية.
            </p>

            <form onSubmit={handleSaveVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">تقييم موثوقية المصدر (Source Reliability) *</label>
                  <select
                    className="form-control"
                    value={verificationForm.sourceReliability}
                    onChange={(e) => setVerificationForm({ ...verificationForm, sourceReliability: e.target.value })}
                  >
                    {Object.entries(ADMIRALTY_RELIABILITY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">تقييم مصداقية المعلومة (Information Credibility) *</label>
                  <select
                    className="form-control"
                    value={verificationForm.infoCredibility}
                    onChange={(e) => setVerificationForm({ ...verificationForm, infoCredibility: e.target.value })}
                  >
                    {Object.entries(ADMIRALTY_CREDIBILITY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Admiralty Code Preview Box */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  background: 'rgba(197, 155, 39, 0.08)',
                  border: '1px solid rgba(197, 155, 39, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>رمز أدميرالتي المعتمد (Admiralty Code):</span>
                  <strong style={{ fontSize: '1.2rem', color: '#c59b27', letterSpacing: '1px' }}>
                    {verificationForm.sourceReliability}{verificationForm.infoCredibility}
                  </strong>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#FFF' }}>
                  {verificationForm.sourceReliability === 'A' || verificationForm.sourceReliability === 'B' ? '✓ درجة ثقة مرتفعة' : 'درجة موثوقية متوسطة / منخفضة'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">منهجية وطريقة التحقق الميداني *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="مثال: زيارة ميدانية، اتصال بشخصيات محلية، مطابقة لقطات..."
                    value={verificationForm.verificationMethod}
                    onChange={(e) => setVerificationForm({ ...verificationForm, verificationMethod: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">عدد المصادر المعززة والمؤكدة</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control"
                    value={verificationForm.corroboratingCount}
                    onChange={(e) => setVerificationForm({ ...verificationForm, corroboratingCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">خلاصة ونتائج التحقق الميداني *</label>
                <textarea
                  required
                  rows={4}
                  className="form-control"
                  placeholder="وثق بدقة ما تم التحقق منه وما تم نفيه أو تأكيده على الأرض..."
                  value={verificationForm.verificationSummary}
                  onChange={(e) => setVerificationForm({ ...verificationForm, verificationSummary: e.target.value })}
                />
              </div>

              {/* Contradictions section */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={verificationForm.contradictionsFound}
                    onChange={(e) => setVerificationForm({ ...verificationForm, contradictionsFound: e.target.checked })}
                  />
                  <strong style={{ fontSize: '0.85rem', color: '#FFF' }}>تم رصد تناقضات أو معلومات غير متوافقة</strong>
                </label>

                {verificationForm.contradictionsFound && (
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="وضح نقاط التناقض المرصودة وتأثيرها على صحة البلاغ..."
                    value={verificationForm.contradictionNotes}
                    onChange={(e) => setVerificationForm({ ...verificationForm, contradictionNotes: e.target.value })}
                  />
                )}
              </div>

              <div>
                <label className="form-label">الحالة الموصى بها للبلاغ</label>
                <select
                  className="form-control"
                  value={verificationForm.recommendedStatus}
                  onChange={(e) => setVerificationForm({ ...verificationForm, recommendedStatus: e.target.value })}
                >
                  <option value="VERIFIED">VERIFIED — مؤكد ومتحقق منه رسمياً</option>
                  <option value="UNCONFIRMED">UNCONFIRMED — غير مؤكد قطعاً</option>
                  <option value="CONTRADICTED">CONTRADICTED — تناقض واضح</option>
                  <option value="DISPROVED">DISPROVED — مفند وغير صحيح</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSavingVerification}
                  className="btn btn-gold"
                  style={{ fontWeight: 800 }}
                >
                  {isSavingVerification ? 'جاري التوثيق...' : 'توثيق واعتماد نتيجة التحقق'}
                </button>
              </div>
            </form>
          </div>

          {/* Historical Verification Records */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem' }}>
              سجل التحقيقات الميدانية الموثقة للبلاغ
            </h3>

            {incident.verifications && incident.verifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {incident.verifications.map((v: any) => (
                  <div
                    key={v.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-gold" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                          كود أدميرالتي: {v.admiraltyCode}
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: '#FFF' }}>
                          بواسطة: {v.verifiedBy?.fullName || 'موظف معتمد'}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(v.verifiedAt).toLocaleString('ar-YE')}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                      {v.verificationSummary}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>المنهجية: <strong style={{ color: '#FFF' }}>{v.verificationMethod}</strong></span>
                      <span>المصادر المعززة: <strong style={{ color: '#FFF' }}>{v.corroboratingCount}</strong></span>
                      {v.contradictionsFound && (
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>
                          * توجد تناقضات مرصودة: {v.contradictionNotes || 'نعم'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>لم يتم تسجيل أي تحقق ميداني لهذا البلاغ بعد.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
