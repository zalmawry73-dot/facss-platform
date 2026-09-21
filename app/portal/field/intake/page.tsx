'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldAlert,
  Lock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  FileText,
  LogOut,
  MapPin,
  Clock,
  User,
  Phone,
  Building,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ARMED_CONFLICT_TACTICAL', label: 'نزاع مسلح وتطورات تكتيكية' },
  { id: 'HUMANITARIAN_ACCESS_DENIAL', label: 'إعاقة وصول إنساني وإغاثي' },
  { id: 'PHYSICAL_ATTACK_THREAT', label: 'اعتداء وتهديد أمني مباشر' },
  { id: 'UXO_LANDMINE_HAZARD', label: 'مخاطر ألغام ومخلفات حرب غير منفجرة' },
  { id: 'CIVIL_UNREST_ROADBLOCK', label: 'اضطرابات مدنية وقطع طرقات' },
  { id: 'DETENTION_HARASSMENT', label: 'احتجاز ومضايقات وتوقيف' },
  { id: 'NATURAL_DISASTER_ENVIRONMENTAL', label: 'كوارث ومخاطر بيئية وطبيعية' },
];

const PRIORITIES = [
  { id: 'LOW', label: 'عادية / منخفضة' },
  { id: 'MEDIUM', label: 'متوسطة' },
  { id: 'HIGH', label: 'عالية الأهمية' },
  { id: 'CRITICAL_EMERGENCY', label: 'طارئة وقصوى' },
];

const YEMEN_GOVERNORATES = [
  'عدن',
  'لحج',
  'أبين',
  'الضالع',
  'شبوة',
  'حضرموت (الساحل)',
  'حضرموت (الوادي)',
  'المهرة',
  'سقطرى',
  'تعز',
  'الحديدة',
  'مأرب',
  'الجوف',
  'أخرى',
];

interface AttachmentItem {
  fileName: string;
  fileBase64: string;
  mimeType: string;
  fileSize: number;
}

export default function FieldIntakePage() {
  const router = useRouter();

  const [session, setSession] = useState<{ userId: string; role: string; fullName: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [priority, setPriority] = useState('MEDIUM');
  const [governorate, setGovernorate] = useState('عدن');
  const [district, setDistrict] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [sourceType, setSourceType] = useState('FIELD_FOCAL_POINT');

  // Sensitive Encrypted Fields
  const [sourceName, setSourceName] = useState('');
  const [sourcePhone, setSourcePhone] = useState('');
  const [sourceOrg, setSourceOrg] = useState('');
  const [exactLocationDesc, setExactLocationDesc] = useState('');
  const [exactLatitude, setExactLatitude] = useState('');
  const [exactLongitude, setExactLongitude] = useState('');
  const [rawDescription, setRawDescription] = useState('');
  const [initialRiskNotes, setInitialRiskNotes] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    incidentNumber: string;
    status: string;
    receivedAt: string;
  } | null>(null);

  // Check user session
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/portal/field/intake');
          return;
        }
        const data = await res.json();
        if (!data.user) {
          router.push('/login?redirect=/portal/field/intake');
          return;
        }

        // Must be FIELD_FOCAL_POINT, staff with submit_incident, or SUPER_ADMIN
        const user = data.user;
        const hasSubmitRole =
          user.role === 'FIELD_FOCAL_POINT' ||
          user.role === 'SUPER_ADMIN' ||
          (user.capabilities && user.capabilities.includes('submit_incident'));

        if (!hasSubmitRole) {
          setAuthError('غير مصرح: حسابك لا يملك صلاحية تقديم البلاغات الميدانية (submit_incident).');
          setIsCheckingAuth(false);
          return;
        }

        setSession(user);
      } catch (err: any) {
        setAuthError(err.message || 'تعذر التحقق من جلسة المستخدم');
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkSession();
  }, [router]);

  // Handle file uploads (convert to base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`حجم الملف [${file.name}] يتجاوز الحد الأقصى (10 ميجابايت)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileBase64: base64,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (rawDescription.trim().length < 10) {
      setErrorMessage('يرجى تقديم وصف تفصيلي للحدث الميداني (10 أحرف كحد أدنى).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        category,
        priority,
        governorate,
        district: district.trim() || null,
        incidentDate: new Date(incidentDate).toISOString(),
        sourceType,
        sourceName: sourceName.trim() || null,
        sourcePhone: sourcePhone.trim() || null,
        sourceOrg: sourceOrg.trim() || null,
        exactLocationDesc: exactLocationDesc.trim() || null,
        exactLatitude: exactLatitude.trim() ? parseFloat(exactLatitude) : null,
        exactLongitude: exactLongitude.trim() ? parseFloat(exactLongitude) : null,
        rawDescription: rawDescription.trim(),
        initialRiskNotes: initialRiskNotes.trim() || null,
        attachments: attachments.map((a) => ({
          fileName: a.fileName,
          fileBase64: a.fileBase64,
          mimeType: a.mimeType,
        })),
      };

      const res = await fetch('/api/incidents/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر إرسال البلاغ الميداني');
      }

      setSuccessReceipt({
        incidentNumber: data.incidentNumber,
        status: data.status,
        receivedAt: data.receivedAt,
      });

      // Reset form
      setRawDescription('');
      setSourceName('');
      setSourcePhone('');
      setSourceOrg('');
      setExactLocationDesc('');
      setExactLatitude('');
      setExactLongitude('');
      setInitialRiskNotes('');
      setDistrict('');
      setAttachments([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال البلاغ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050c08', color: '#FFF' }}>
        <div style={{ textAlign: 'center' }}>
          <Shield className="animate-spin" size={36} color="#c59b27" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>جاري التحقق من الصلاحيات الأمنية للبوابة الميدانية...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050c08', padding: '1.5rem', color: '#FFF' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #ef4444' }}>
          <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFF' }}>دخول مقيد</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>{authError}</p>
          <button type="button" className="btn btn-outline" onClick={() => router.push('/login')} style={{ width: '100%' }}>
            العودة لصفحة تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050c08', color: '#e2e8f0', fontFamily: 'var(--font-cairo), sans-serif' }}>
      {/* Mobile-First Header (NO Admin Links) */}
      <header
        style={{
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
          background: 'rgba(5, 14, 9, 0.95)',
          padding: '0.85rem 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1b3826 0%, #0d1e14 100%)',
                border: '1px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} color="#c59b27" />
            </div>
            <div>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.2 }}>
                مركز عدن الدولي للسلامة
              </h1>
              <span style={{ fontSize: '0.72rem', color: '#c59b27', display: 'block' }}>
                بوابة البلاغات الميدانية الحساسة
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'none' }} className="user-indicator">
              {session?.fullName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="تسجيل الخروج"
            >
              <LogOut size={13} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '1.25rem 1rem 3rem' }}>
        {/* Success Receipt State */}
        {successReceipt ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', border: '1px solid #22c55e' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={36} color="#22c55e" />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>
              تم استلام البلاغ الميداني بنجاح
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              تم تشفير كافة البيانات الحساسة فورياً وتمرير البلاغ إلى دائرة العمليات والفرز الأمني للمركز.
            </p>

            {/* Tracking Receipt Box */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(197, 155, 39, 0.4)',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                textAlign: 'right',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>رقم التتبع الأمني:</span>
                <strong style={{ fontSize: '0.95rem', color: '#c59b27', letterSpacing: '0.5px' }}>
                  {successReceipt.incidentNumber}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>حالة الاستلام:</span>
                <span className="badge badge-yellow" style={{ fontSize: '0.75rem' }}>
                  قيد الفرز الأمني (RECEIVED)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>توقيت الاستلام:</span>
                <span style={{ fontSize: '0.8rem', color: '#FFF' }}>
                  {new Date(successReceipt.receivedAt).toLocaleString('ar-YE')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.5rem' }}>
              * لا يتم عرض قائمة بلاغات سابقة حفاظاً على سرية وسلامة نقاط الاتصال الميدانية.
            </p>

            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setSuccessReceipt(null)}
              style={{ width: '100%', fontWeight: 700 }}
            >
              تقديم بلاغ ميداني جديد
            </button>
          </div>
        ) : (
          /* Intake Form */
          <div>
            {/* Top Notice */}
            <div
              style={{
                background: 'rgba(197, 155, 39, 0.08)',
                border: '1px solid rgba(197, 155, 39, 0.25)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Lock size={20} color="#c59b27" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong>بوابة اتصال مشفرة:</strong> تُشفر البيانات الحساسة مباشرةً باستخدام معيار <code>AES-256-GCM</code> وتُحفظ في نطاق آمن معزول مخصص للإدارة العليا.
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                }}
              >
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Card 1: Core Incident Classification */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#c59b27" />
                  <span>تصنيف وطبيعة الحدث الميداني</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label">تصنيف البلاغ الأمني *</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="facss-form-grid-2">
                    <div>
                      <label className="form-label">مستوى الأولوية والخطورة</label>
                      <select
                        className="form-control"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">تاريخ وتوقيت الحدث *</label>
                      <input
                        type="datetime-local"
                        required
                        className="form-control"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Geographic Location */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} color="#c59b27" />
                  <span>الموقع الجغرافي للحدث</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="facss-form-grid-2">
                    <div>
                      <label className="form-label">المحافظة *</label>
                      <select
                        className="form-control"
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        required
                      >
                        {YEMEN_GOVERNORATES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">المديرية / المنطقة</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="مثال: المنصورة، خور مكسر"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={12} color="#c59b27" />
                      <span>الوصف المكاني الدقيق (حساس ومشفر)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="معالم بارزة، أسماء شوارع، مواقع قريبة..."
                      value={exactLocationDesc}
                      onChange={(e) => setExactLocationDesc(e.target.value)}
                    />
                  </div>

                  <div className="facss-form-grid-2">
                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Lock size={12} color="#c59b27" />
                        <span>خط العرض (Latitude)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="12.7954"
                        value={exactLatitude}
                        onChange={(e) => setExactLatitude(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Lock size={12} color="#c59b27" />
                        <span>خط الطول (Longitude)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="45.0215"
                        value={exactLongitude}
                        onChange={(e) => setExactLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Narrative & Sensitive Source Details */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="#c59b27" />
                  <span>السرد الخام وتفاصيل المصدر (مشفرة)</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label">السرد الميداني الكامل للحدث *</label>
                    <textarea
                      required
                      rows={5}
                      className="form-control"
                      placeholder="اكتب بالتفصيل مجريات الحدث، الأطراف المعنية، الوقائع الميدانية، والتداعيات اللحظية..."
                      value={rawDescription}
                      onChange={(e) => setRawDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">ملاحظات المخاطر والتهديدات الأولية</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="تقدير التهديدات المستمرة على حركة الطواقم والمنظمات أو المدنيين..."
                      value={initialRiskNotes}
                      onChange={(e) => setInitialRiskNotes(e.target.value)}
                    />
                  </div>

                  {/* Sensitive Source Metadata */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px dashed rgba(197, 155, 39, 0.3)',
                      borderRadius: '8px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Lock size={14} color="#c59b27" />
                      <strong style={{ fontSize: '0.85rem', color: '#c59b27' }}>
                        بيانات المصدر الحساسة (تشفير كامل في قاعدة البيانات):
                      </strong>
                    </div>

                    <div className="facss-form-grid-2" style={{ marginBottom: '0.75rem' }}>
                      <div>
                        <label className="form-label">صفة المصدر</label>
                        <select
                          className="form-control"
                          value={sourceType}
                          onChange={(e) => setSourceType(e.target.value)}
                        >
                          <option value="FIELD_FOCAL_POINT">نقطة اتصال ميدانية للمركز</option>
                          <option value="FIELD_STAFF">كادر وباحث ميداني</option>
                          <option value="EYEWITNESS">شاهد عيان مباشر</option>
                          <option value="COMMUNITY_LEADER">مصدر محلي / شخصية اعتبارية</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">اسم المصدر / المبلغ</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="الاسم الحقيقي أو الرمزي"
                          value={sourceName}
                          onChange={(e) => setSourceName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="facss-form-grid-2">
                      <div>
                        <label className="form-label">رقم هاتف التواصل</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="+967 77X XXX XXX"
                          value={sourcePhone}
                          onChange={(e) => setSourcePhone(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="form-label">الجهة أو المؤسسة</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="منظمة إغاثية / جهة مجتمعية"
                          value={sourceOrg}
                          onChange={(e) => setSourceOrg(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Attachments */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={18} color="#c59b27" />
                  <span>المرفقات والتوثيق الميداني (صور، وثائق)</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>
                  الصيغ المقبولة: JPG, PNG, WEBP, PDF (بحد أقصى 10 ميجابايت للملف). تُحفظ في تخزين خاص معزول.
                </span>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    border: '2px dashed rgba(197, 155, 39, 0.4)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    marginBottom: '1rem',
                  }}
                >
                  <Upload size={24} color="#c59b27" style={{ marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 600 }}>انقر لاختيار الملفات أو الصور</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                    يتم التحقق من توقيع الملف الفعلي ومنع الملفات التنفيذية
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Uploaded attachments list */}
                {attachments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={16} color="#c59b27" />
                          <span style={{ fontSize: '0.82rem', color: '#FFF' }}>{att.fileName}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            ({(att.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-gold"
                style={{
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Lock className="animate-spin" size={18} />
                    <span>جاري التشفير والإرسال الآمن...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>تشفير وإرسال البلاغ الميداني</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
