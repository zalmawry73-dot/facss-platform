'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MapPin,
  Clock,
  User,
  Phone,
  Building,
  Navigation,
  Check,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  FileCheck
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORIES = [
  // Operational Security & Safety Categories (Package B)
  {
    id: 'THEFT',
    labelAr: 'سرقة وتعدي على ممتلكات',
    labelEn: 'Theft & Property Theft',
    descriptionAr: 'سرقة معدات، سطو على مستودعات، اختفاء ممتلكات',
    descriptionEn: 'Equipment theft, warehouse burglary, missing assets'
  },
  {
    id: 'INTRUSION',
    labelAr: 'اقتحام وتسلل غير مصرح به',
    labelEn: 'Intrusion & Unauthorized Breach',
    descriptionAr: 'تجاوز أسوار، كسر أقفال، تسلل للمنشأة أو الموقع',
    descriptionEn: 'Perimeter breach, broken locks, trespassing on premises'
  },
  {
    id: 'FIRE',
    labelAr: 'حريق وحوادث اشتعال',
    labelEn: 'Fire & Combustion Incident',
    descriptionAr: 'اندلاع نيران، ماس كهربائي، دخان كثيف، اشتعال مواد',
    descriptionEn: 'Open flames, electrical short, heavy smoke, hazardous fire'
  },
  {
    id: 'INJURY',
    labelAr: 'إصابة عمل وحالات طارئة بشرية',
    labelEn: 'Physical Injury & Medical Emergency',
    descriptionAr: 'سقوط، حروق، إصابة حارس أو موظف أثناء الخدمة',
    descriptionEn: 'Falls, burns, guard/staff injury during service'
  },
  {
    id: 'SAFETY_INCIDENT',
    labelAr: 'حادث سلامة مهنية وخلل وقائي',
    labelEn: 'Occupational Safety & Hazardous Condition',
    descriptionAr: 'تسرب غاز، انهيار سقايل، خطر بيئي في موقع العمل',
    descriptionEn: 'Gas leak, scaffolding collapse, site hazard'
  },
  {
    id: 'VEHICLE_INCIDENT',
    labelAr: 'حادث مركبة أو تلفيات نقل',
    labelEn: 'Vehicle & Transport Incident',
    descriptionAr: 'اصطدام دورية، انقلاب، عطل طارئ لمركبة أثناء النقل',
    descriptionEn: 'Patrol collision, rollover, vehicle breakdown during transit'
  },
  {
    id: 'SECURITY_THREAT',
    labelAr: 'تهديد أمني واشتباه مباشر',
    labelEn: 'Security Threat & Suspicious Activity',
    descriptionAr: 'أجسام مشبوهة، رصد مراقبة معادية، تهديد لفظي أو مسلح',
    descriptionEn: 'Suspicious objects, hostile surveillance, verbal/armed threat'
  },
  // Field Studies & Comprehensive Monitoring Categories (Historical)
  {
    id: 'ARMED_CONFLICT_TACTICAL',
    labelAr: 'نزاع مسلح وتطورات تكتيكية',
    labelEn: 'Armed Conflict & Tactical Escalation',
    descriptionAr: 'اشتباكات، تحركات عسكرية، قصف، استهداف مباشر',
    descriptionEn: 'Clashes, troop movements, shelling, direct targeting'
  },
  {
    id: 'HUMANITARIAN_ACCESS_DENIAL',
    labelAr: 'إعاقة وصول إنساني وإغاثي',
    labelEn: 'Humanitarian Access Denial',
    descriptionAr: 'منع قوافل، رفض تصاريح، احتجاز إمدادات',
    descriptionEn: 'Convoy blockage, permit rejection, supply detention'
  },
  {
    id: 'PHYSICAL_ATTACK_THREAT',
    labelAr: 'اعتداء وتهديد أمني مباشر',
    labelEn: 'Physical Assault & Direct Threat',
    descriptionAr: 'تهديد طواقم، سطو مسلح، استهداف مقرات',
    descriptionEn: 'Staff intimidation, armed robbery, facility targeting'
  },
  {
    id: 'UXO_LANDMINE_HAZARD',
    labelAr: 'مخاطر ألغام ومخلفات حرب غير منفجرة',
    labelEn: 'UXO & Landmine Hazards',
    descriptionAr: 'حقول ألغام جديدة، ذخائر غير منفجرة، شراك',
    descriptionEn: 'New minefields, unexploded ordnance, booby traps'
  },
  {
    id: 'CIVIL_UNREST_ROADBLOCK',
    labelAr: 'اضطرابات مدنية وقطع طرقات',
    labelEn: 'Civil Unrest & Roadblocks',
    descriptionAr: 'قطع خطوط الإمداد، احتجاجات مسلحة، إغلاق معابر',
    descriptionEn: 'Supply line blockages, armed protests, checkpoint closure'
  },
  {
    id: 'DETENTION_HARASSMENT',
    labelAr: 'احتجاز ومضايقات وتوقيف',
    labelEn: 'Detention, Harassment & Stoppage',
    descriptionAr: 'توقيف عند نقاط تفتيش، استجواب، سحب وثائق',
    descriptionEn: 'Checkpoint detention, interrogation, document confiscation'
  },
  {
    id: 'NATURAL_DISASTER_ENVIRONMENTAL',
    labelAr: 'كوارث ومخاطر بيئية وطبيعية',
    labelEn: 'Natural & Environmental Hazards',
    descriptionAr: 'سيول، انهيارات جبلية، انقطاع مسارات الحركة',
    descriptionEn: 'Flash floods, landslides, transport route disruption'
  },
];

const PRIORITIES = [
  { id: 'LOW', labelAr: 'عادية / منخفضة', labelEn: 'Normal / Low', badgeClass: 'badge-gray', color: '#94a3b8' },
  { id: 'MEDIUM', labelAr: 'متوسطة الأهمية', labelEn: 'Medium Priority', badgeClass: 'badge-blue', color: '#38bdf8' },
  { id: 'HIGH', labelAr: 'عالية الأهمية', labelEn: 'High Priority', badgeClass: 'badge-yellow', color: '#f59e0b' },
  { id: 'CRITICAL_EMERGENCY', labelAr: 'طارئة وقصوى (حرج)', labelEn: 'Critical Emergency (Flash)', badgeClass: 'badge-red', color: '#ef4444' },
];

const YEMEN_GOVERNORATES = [
  { ar: 'عدن', en: 'Aden' },
  { ar: 'لحج', en: 'Lahj' },
  { ar: 'أبين', en: 'Abyan' },
  { ar: 'الضالع', en: "Al Dhale'e" },
  { ar: 'شبوة', en: 'Shabwah' },
  { ar: 'حضرموت (الساحل)', en: 'Hadramawt (Coast)' },
  { ar: 'حضرموت (الوادي)', en: 'Hadramawt (Valley)' },
  { ar: 'المهرة', en: 'Al Mahrah' },
  { ar: 'سقطرى', en: 'Socotra' },
  { ar: 'تعز', en: 'Taiz' },
  { ar: 'الحديدة', en: 'Al Hudaydah' },
  { ar: 'مأرب', en: 'Marib' },
  { ar: 'الجوف', en: 'Al Jawf' },
  { ar: 'أخرى', en: 'Other' },
];

const SOURCE_TYPES = [
  { id: 'FIELD_FOCAL_POINT', labelAr: 'نقطة اتصال ميدانية للمركز (Focal Point)', labelEn: 'Field Focal Point' },
  { id: 'FIELD_STAFF', labelAr: 'كادر أو باحث ميداني تابع للمركز', labelEn: 'Center Field Staff / Researcher' },
  { id: 'EYEWITNESS', labelAr: 'شاهد عيان مباشر من موقع الحدث', labelEn: 'Direct Eyewitness' },
  { id: 'COMMUNITY_LEADER', labelAr: 'مصدر محلي / شخصية اعتبارية موثوقة', labelEn: 'Local / Community Source' },
];

interface AttachmentItem {
  fileName: string;
  fileBase64: string;
  mimeType: string;
  fileSize: number;
}

export default function FieldIntakePage() {
  const router = useRouter();
  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';

  // Authentication & Authorization
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

  // Sensitive Encrypted Fields (AES-256-GCM)
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geolocation
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [geoFeedback, setGeoFeedback] = useState<string | null>(null);

  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Submission & Confirmation States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    incidentNumber: string;
    status: string;
    receivedAt: string;
  } | null>(null);

  // Refs for auto-focusing errors
  const narrativeRef = useRef<HTMLTextAreaElement>(null);
  const govRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);

  // 1. Check user session and capability
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

        const user = data.user;
        const hasSubmitRole =
          user.role === 'FIELD_FOCAL_POINT' ||
          user.role === 'SUPER_ADMIN' ||
          (user.capabilities && user.capabilities.includes('submit_incident'));

        if (!hasSubmitRole) {
          setAuthError(
            isAr
              ? 'غير مصرح: حسابك لا يملك الصلاحية المعتمدة لتقديم البلاغات الميدانية (submit_incident).'
              : 'Unauthorized: Your account does not have permission to submit field incidents (submit_incident).'
          );
          setIsCheckingAuth(false);
          return;
        }

        setSession(user);
      } catch (err: any) {
        setAuthError(
          err.message ||
            (isAr
              ? 'تعذر التحقق من جلسة المستخدم الأمنية'
              : 'Failed to verify secure user session')
        );
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkSession();
  }, [router, isAr]);

  // Handle Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('error');
      setGeoFeedback(
        isAr
          ? 'خدمة تحديد المواقع (GPS) غير مدعومة في هذا المتصفح.'
          : 'Geolocation (GPS) is not supported in this browser.'
      );
      return;
    }

    setGeoState('loading');
    setGeoFeedback(
      isAr
        ? 'جارٍ التقاط الإحداثيات الجغرافية عبر الأقمار الصناعية...'
        : 'Acquiring geographic coordinates via satellite...'
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);

        setExactLatitude(lat);
        setExactLongitude(lng);
        setGeoState('success');
        setGeoFeedback(
          isAr
            ? `تم التقاط الإحداثيات بنجاح (دقة الرصد: ±${accuracy} متر)`
            : `Coordinates acquired successfully (accuracy: ±${accuracy} meters)`
        );

        // Clear coordinate errors if any
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next.exactLatitude;
          delete next.exactLongitude;
          return next;
        });
      },
      (error) => {
        setGeoState('error');
        if (error.code === error.PERMISSION_DENIED) {
          setGeoFeedback(
            isAr
              ? 'تم رفض إذن الوصول للموقع. يرجى تفعيل الموقع في المتصفح أو إدخال الإحداثيات يدوياً.'
              : 'Location permission denied. Please allow location access or enter coordinates manually.'
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoFeedback(
            isAr
              ? 'إشارة GPS غير متاحة حالياً. يرجى إدخال الإحداثيات يدوياً.'
              : 'GPS signal is currently unavailable. Please enter coordinates manually.'
          );
        } else if (error.code === error.TIMEOUT) {
          setGeoFeedback(
            isAr
              ? 'انتهت مهلة التقاط إشارة GPS. يرجى المحاولة ثانية.'
              : 'GPS acquisition request timed out. Please try again.'
          );
        } else {
          setGeoFeedback(
            isAr
              ? 'تعذر الحصول على الموقع الجغرافي.'
              : 'Failed to acquire geographic location.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Handle file uploads
  const processFiles = (files: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const newErrors: string[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        newErrors.push(
          isAr
            ? `الملف [${file.name}] يتجاوز الحد الأقصى (10 ميجابايت).`
            : `File [${file.name}] exceeds the 10 MB limit.`
        );
        continue;
      }

      const isAllowed =
        allowedTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i);

      if (!isAllowed) {
        newErrors.push(
          isAr
            ? `الملف [${file.name}] ليس صيغة مدعومة (فقط JPG, PNG, WEBP, PDF).`
            : `File [${file.name}] format is not supported (JPG, PNG, WEBP, PDF only).`
        );
        continue;
      }

      if (attachments.some((a) => a.fileName === file.name && a.fileSize === file.size)) {
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

    if (newErrors.length > 0) {
      setFormErrors((prev) => ({
        ...prev,
        attachments: newErrors.join(' | '),
      }));
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.attachments;
        return next;
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Client-Side Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!rawDescription.trim() || rawDescription.trim().length < 10) {
      errors.rawDescription = isAr
        ? 'السرد التفصيلي للحدث مطلوب (10 أحرف كحد أدنى).'
        : 'Detailed incident narrative is required (minimum 10 characters).';
    }

    if (!governorate.trim()) {
      errors.governorate = isAr ? 'يرجى اختيار المحافظة.' : 'Please select a governorate.';
    }

    if (!incidentDate) {
      errors.incidentDate = isAr
        ? 'تاريخ وتوقيت وقوع الحدث مطلوب.'
        : 'Incident occurrence date and time is required.';
    }

    if (exactLatitude.trim()) {
      const lat = Number(exactLatitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.exactLatitude = isAr
          ? 'خط العرض غير صحيح (يجب أن يكون بين -90 و 90).'
          : 'Invalid latitude (must be between -90 and 90).';
      }
    }

    if (exactLongitude.trim()) {
      const lng = Number(exactLongitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.exactLongitude = isAr
          ? 'خط الطول غير صحيح (يجب أن يكون بين -180 و 180).'
          : 'Invalid longitude (must be between -180 and 180).';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.rawDescription && narrativeRef.current) {
        narrativeRef.current.focus();
      } else if (errors.governorate && govRef.current) {
        govRef.current.focus();
      } else if (errors.incidentDate && dateRef.current) {
        dateRef.current.focus();
      } else if (errors.exactLatitude && latRef.current) {
        latRef.current.focus();
      }
      return false;
    }

    return true;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setApiError(null);

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
        if (res.status === 409) {
          throw new Error(
            data.error ||
              (isAr
                ? 'تم استلام بلاغ مطابق مؤخراً. لمنع التكرار راجع رقم البلاغ السابق.'
                : 'A matching incident was recently recorded. Duplicate blocked.')
          );
        }
        throw new Error(
          data.error ||
            (isAr
              ? 'تعذر إرسال وتشفير البلاغ الميداني'
              : 'Failed to encrypt and transmit field incident')
        );
      }

      setSuccessReceipt({
        incidentNumber: data.incidentNumber,
        status: data.status,
        receivedAt: data.receivedAt,
      });

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
      setGeoState('idle');
      setGeoFeedback(null);
      setFormErrors({});

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setApiError(
        err.message ||
          (isAr
            ? 'حدث خطأ تقني أثناء التشفير والإرسال'
            : 'Technical error during encryption and submission')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth loading state
  if (isCheckingAuth) {
    return (
      <div style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <Shield
          className="animate-spin"
          size={40}
          color="var(--brand-gold-400, #f59e0b)"
          style={{ margin: '0 auto 1.25rem' }}
        />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
          {isAr
            ? 'جارٍ التحقق من الهوية والصلاحية الأمنية للبوابة الميدانية...'
            : 'Verifying identity and security clearance for field portal...'}
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          {isAr
            ? 'فحص بروتوكول المصادقة والرتبة الميدانية المصرحة'
            : 'Evaluating authentication protocol and field operational rank'}
        </p>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    return (
      <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <div className="field-section-card" style={{ borderColor: '#ef4444' }}>
          <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            {isAr ? 'دخول مقيد أمنياً' : 'Access Restricted'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {authError}
          </p>
          <button
            type="button"
            className="field-submit-btn"
            onClick={() => router.push('/login')}
            style={{ width: '100%', background: '#1e293b', borderColor: '#475569' }}
          >
            {isAr ? 'العودة لصفحة تسجيل الدخول' : 'Return to Login Page'}
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: SUCCESS RECEIPT STATE
  // ----------------------------------------------------
  if (successReceipt) {
    return (
      <div
        className="field-receipt-card"
        role="region"
        aria-label={isAr ? 'إيصال استلام البلاغ الميداني' : 'Field Incident Receipt'}
      >
        <div className="field-receipt-icon" aria-hidden="true">
          <CheckCircle2 size={44} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.5rem' }}>
          {isAr
            ? 'تم استلام وتشفير البلاغ الميداني بنجاح'
            : 'Field Incident Received & Encrypted Successfully'}
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#cbd5e1',
            lineHeight: 1.6,
            margin: '0 auto 1.5rem',
            maxWidth: '480px',
          }}
        >
          {isAr ? (
            <>
              تمت معالجة البيانات وتشفير الحقول الحساسة فورياً بمعيار <strong>AES-256-GCM</strong>، وتمرير البلاغ إلى دائرة العمليات والفرز الأمني المركزي.
            </>
          ) : (
            <>
              Data processed and sensitive fields encrypted in real-time with <strong>AES-256-GCM</strong>, routed to central operations and security triage.
            </>
          )}
        </p>

        {/* Tracking Details Box */}
        <div className="field-receipt-box">
          <div className="field-receipt-row">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {isAr ? 'رقم التتبع الأمني المعتمد:' : 'Official Security Tracking No:'}
            </span>
            <strong
              style={{
                fontSize: '1.1rem',
                color: 'var(--brand-gold-400, #f59e0b)',
                letterSpacing: '0.75px',
                direction: 'ltr',
              }}
            >
              {successReceipt.incidentNumber}
            </strong>
          </div>

          <div className="field-receipt-row">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {isAr ? 'حالة البلاغ في النظام:' : 'Incident Status in System:'}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(2,132,199,0.15)',
                border: '1px solid rgba(2,132,199,0.3)',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
              }}
            >
              {isAr ? 'قيد الفرز والتدقيق (RECEIVED)' : 'Under Triage (RECEIVED)'}
            </span>
          </div>

          <div className="field-receipt-row">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {isAr ? 'توقيت الاستلام الخادمي:' : 'Server Receipt Timestamp:'}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#f1f5f9', direction: 'ltr' }}>
              {new Date(successReceipt.receivedAt).toLocaleString(isAr ? 'ar-YE' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Privacy by Design notice */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1.75rem',
            textAlign: isAr ? 'right' : 'left',
          }}
        >
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            🛡️ <strong>{isAr ? 'بروتوكول السلامة الميدانية (Privacy by Design):' : 'Privacy by Design Protocol:'}</strong>{' '}
            {isAr
              ? 'حفاظاً على سرية وسلامة نقاط الاتصال في الميدان ومنع تسريب المعلومات عند فقدان أو تفتيش الأجهزة، لا يتم استعراض أو تخزين أرشيف البلاغات السابقة على هذا الجهاز.'
              : 'To safeguard field informants and prevent disclosure during inspection or device loss, historical incident records are never retained or queried on this terminal.'}
          </p>
        </div>

        <button
          type="button"
          className="field-submit-btn"
          onClick={() => setSuccessReceipt(null)}
          style={{ width: '100%' }}
        >
          <FileText size={18} />
          <span>{isAr ? 'تسجيل بلاغ ميداني جديد' : 'Submit Another Field Incident'}</span>
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: INTAKE FORM WORKSPACE
  // ----------------------------------------------------
  const selectedCategoryObj = CATEGORIES.find((c) => c.id === category);
  const selectedPriorityObj = PRIORITIES.find((p) => p.id === priority);

  return (
    <div>
      {/* 1. Portal Station Top Bar */}
      <div className="field-portal-bar">
        <div className="field-portal-title">
          <FileText size={24} color="var(--brand-gold-400, #f59e0b)" />
          <div>
            <h2>
              {isAr
                ? 'محطة تقديم البلاغات الميدانية الحساسة'
                : 'Sensitive Field Incident Intake Station'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: '0.15rem' }}>
              {isAr
                ? 'نموذج الرصد والتوثيق الميداني المباشر — الإصدار العملياتي المعتمد'
                : 'Live Field Incident Intake & Documentation Form — Official Operational Version'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sovereign Encryption Notice Banner */}
      <div className="field-security-banner" role="status">
        <Lock size={22} className="field-security-banner-icon" />
        <div className="field-security-banner-text">
          <strong>
            {isAr
              ? 'محطة اتصال ميداني مشفرة (Field Secure Enclave): '
              : 'Field Secure Enclave: '}
          </strong>
          {isAr ? (
            <>
              كافة المعطيات الحساسة وسرد الوقائع وهوية المصادر تُشفر فورياً بمعيار <code>AES-256-GCM</code> قبل الحفظ ولا يمكن فك تشفيرها إلا من قبل كبار مسؤولي العمليات.
            </>
          ) : (
            <>
              All sensitive facts, raw narratives, and source identities are instantly encrypted using <code>AES-256-GCM</code> before saving, decryptable solely by senior operations officers.
            </>
          )}
        </div>
      </div>

      {/* API / Submission Error Alert */}
      {apiError && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #ef4444',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fca5a5',
          }}
        >
          <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{apiError}</div>
        </div>
      )}

      {/* 3. The Intake Form */}
      <form onSubmit={handlePreSubmit} noValidate>
        {/* ==================================================================
            SECTION 1: Core Incident Classification
            ================================================================== */}
        <section className="field-section-card" aria-labelledby="section-1-title">
          <div className="field-section-header">
            <div className="field-section-header-content">
              <div className="field-section-icon" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 id="section-1-title" className="field-section-title">
                  {isAr ? 'معلومات وطبيعة الحدث الميداني' : 'Field Incident Classification & Timing'}
                </h3>
                <p className="field-section-desc">
                  {isAr
                    ? 'حدد التصنيف الأمني المعتمد ومستوى الخطورة وتوقيت وقوع الواقعة.'
                    : 'Specify the security category, severity rating, and occurrence timestamp.'}
                </p>
              </div>
            </div>
            <span className="field-step-pill">
              {isAr ? 'المرحلة 1 من 5' : 'Stage 1 of 5'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Category Select */}
            <div className="field-form-group">
              <label htmlFor="incident-category" className="field-label">
                <span>
                  {isAr ? 'تصنيف البلاغ الأمني الميداني' : 'Field Security Classification'}{' '}
                  <span className="required-mark">*</span>
                </span>
                <span className="field-label-hint">
                  {isAr ? 'اختر التصنيف الأكثر مطابقة' : 'Select best matching category'}
                </span>
              </label>
              <select
                id="incident-category"
                className={`field-select ${formErrors.category ? 'has-error' : ''}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAr ? c.labelAr : c.labelEn}
                  </option>
                ))}
              </select>
              {selectedCategoryObj && (
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  ℹ️ {isAr ? selectedCategoryObj.descriptionAr : selectedCategoryObj.descriptionEn}
                </span>
              )}
              {formErrors.category && (
                <span className="field-error-text" role="alert">
                  <AlertTriangle size={13} /> {formErrors.category}
                </span>
              )}
            </div>

            {/* Priority & Date/Time */}
            <div className="field-grid-2">
              <div className="field-form-group">
                <label htmlFor="incident-priority" className="field-label">
                  <span>
                    {isAr ? 'مستوى الأولوية والخطورة' : 'Priority & Severity Level'}{' '}
                    <span className="required-mark">*</span>
                  </span>
                  <span className="field-label-hint">
                    {isAr ? 'تقدير الأثر الميداني' : 'Field impact estimation'}
                  </span>
                </label>
                <select
                  id="incident-priority"
                  className={`field-select ${formErrors.priority ? 'has-error' : ''}`}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isAr ? p.labelAr : p.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-form-group">
                <label htmlFor="incident-datetime" className="field-label">
                  <span>
                    {isAr ? 'تاريخ وتوقيت وقوع الحدث' : 'Incident Date & Time'}{' '}
                    <span className="required-mark">*</span>
                  </span>
                  <span className="field-label-hint">
                    {isAr ? 'بالتوقيت المحلي' : 'Local time'}
                  </span>
                </label>
                <input
                  ref={dateRef}
                  id="incident-datetime"
                  type="datetime-local"
                  required
                  className={`field-input ${formErrors.incidentDate ? 'has-error' : ''}`}
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  dir="ltr"
                />
                {formErrors.incidentDate && (
                  <span className="field-error-text" role="alert">
                    <AlertTriangle size={13} /> {formErrors.incidentDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 2: Geographic Location
            ================================================================== */}
        <section className="field-section-card" aria-labelledby="section-2-title">
          <div className="field-section-header">
            <div className="field-section-header-content">
              <div className="field-section-icon" aria-hidden="true">
                <MapPin size={20} />
              </div>
              <div>
                <h3 id="section-2-title" className="field-section-title">
                  {isAr ? 'الموقع الجغرافي والإحداثيات' : 'Geographic Location & Coordinates'}
                </h3>
                <p className="field-section-desc">
                  {isAr
                    ? 'حدد النطاق الإداري ومعالم المكان مع إمكانية التقاط إحداثيات GPS تلقائياً.'
                    : 'Specify administrative boundaries and landmarks, with automatic GPS capture.'}
                </p>
              </div>
            </div>
            <span className="field-step-pill">
              {isAr ? 'المرحلة 2 من 5' : 'Stage 2 of 5'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Governorate & District Grid */}
            <div className="field-grid-2">
              <div className="field-form-group">
                <label htmlFor="incident-gov" className="field-label">
                  <span>
                    {isAr ? 'المحافظة' : 'Governorate'}{' '}
                    <span className="required-mark">*</span>
                  </span>
                </label>
                <select
                  ref={govRef}
                  id="incident-gov"
                  className={`field-select ${formErrors.governorate ? 'has-error' : ''}`}
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  required
                >
                  {YEMEN_GOVERNORATES.map((g) => (
                    <option key={g.ar} value={g.ar}>
                      {isAr ? g.ar : g.en}
                    </option>
                  ))}
                </select>
                {formErrors.governorate && (
                  <span className="field-error-text" role="alert">
                    <AlertTriangle size={13} /> {formErrors.governorate}
                  </span>
                )}
              </div>

              <div className="field-form-group">
                <label htmlFor="incident-district" className="field-label">
                  <span>{isAr ? 'المديرية / المنطقة' : 'District / Area'}</span>
                  <span className="field-label-hint">{isAr ? 'اختياري' : 'Optional'}</span>
                </label>
                <input
                  id="incident-district"
                  type="text"
                  className="field-input"
                  placeholder={
                    isAr
                      ? 'مثال: المنصورة، خور مكسر، دار سعد...'
                      : 'e.g., Al Mansoura, Khor Maksar, Dar Saad...'
                  }
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
            </div>

            {/* Exact Location Description */}
            <div className="field-form-group">
              <label htmlFor="incident-loc-desc" className="field-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={13} color="var(--brand-gold-400, #f59e0b)" />
                  <span>
                    {isAr
                      ? 'الوصف المكاني التفصيلي والمعالم (مشفر)'
                      : 'Detailed Location Landmarks & Description (Encrypted)'}
                  </span>
                </span>
                <span className="field-label-hint">
                  {isAr ? 'معالم بارزة، شوارع، نقاط تقاطع' : 'Prominent landmarks, streets, intersections'}
                </span>
              </label>
              <input
                id="incident-loc-desc"
                type="text"
                className="field-input"
                placeholder={
                  isAr
                    ? 'مثال: بالقرب من جولة كالتكس، بجوار محطة الكهرباء...'
                    : 'e.g., Near Caltex roundabout, adjacent to power station...'
                }
                value={exactLocationDesc}
                onChange={(e) => setExactLocationDesc(e.target.value)}
              />
            </div>

            {/* Coordinates & Geolocation Action */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Navigation size={14} color="#38bdf8" />
                  <span>{isAr ? 'الإحداثيات الجغرافية (WGS84 GPS)' : 'GPS Coordinates (WGS84)'}</span>
                </span>

                {/* HTML5 Geolocation Button */}
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={geoState === 'loading'}
                  className="field-gps-btn"
                  title={
                    isAr
                      ? 'التقاط إحداثيات موقعك الحالي عبر GPS'
                      : 'Capture your current GPS location'
                  }
                >
                  {geoState === 'loading' ? (
                    <>
                      <Navigation className="animate-spin" size={14} />
                      <span>{isAr ? 'جارٍ تحديد الموقع...' : 'Acquiring GPS...'}</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={14} />
                      <span>{isAr ? 'استخدام موقعي الحالي عبر GPS' : 'Capture Current GPS Coordinates'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Geolocation Feedback Message */}
              {geoFeedback && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    marginBottom: '0.75rem',
                    background: geoState === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${geoState === 'success' ? '#22c55e' : '#ef4444'}`,
                    color: geoState === 'success' ? '#86efac' : '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {geoState === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                  <span>{geoFeedback}</span>
                </div>
              )}

              {/* Latitude and Longitude Grid */}
              <div className="field-grid-2">
                <div className="field-form-group">
                  <label htmlFor="incident-lat" className="field-label">
                    <span>{isAr ? 'خط العرض (Latitude)' : 'Latitude (WGS84)'}</span>
                    <span className="field-label-hint">Decimal LTR</span>
                  </label>
                  <input
                    ref={latRef}
                    id="incident-lat"
                    type="number"
                    step="any"
                    className={`field-input ${formErrors.exactLatitude ? 'has-error' : ''}`}
                    placeholder="12.795400"
                    value={exactLatitude}
                    onChange={(e) => setExactLatitude(e.target.value)}
                    dir="ltr"
                  />
                  {formErrors.exactLatitude && (
                    <span className="field-error-text" role="alert">
                      <AlertTriangle size={13} /> {formErrors.exactLatitude}
                    </span>
                  )}
                </div>

                <div className="field-form-group">
                  <label htmlFor="incident-lng" className="field-label">
                    <span>{isAr ? 'خط الطول (Longitude)' : 'Longitude (WGS84)'}</span>
                    <span className="field-label-hint">Decimal LTR</span>
                  </label>
                  <input
                    id="incident-lng"
                    type="number"
                    step="any"
                    className={`field-input ${formErrors.exactLongitude ? 'has-error' : ''}`}
                    placeholder="45.021500"
                    value={exactLongitude}
                    onChange={(e) => setExactLongitude(e.target.value)}
                    dir="ltr"
                  />
                  {formErrors.exactLongitude && (
                    <span className="field-error-text" role="alert">
                      <AlertTriangle size={13} /> {formErrors.exactLongitude}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 3: Narrative & Threat Observations
            ================================================================== */}
        <section className="field-section-card" aria-labelledby="section-3-title">
          <div className="field-section-header">
            <div className="field-section-header-content">
              <div className="field-section-icon" aria-hidden="true">
                <FileText size={20} />
              </div>
              <div>
                <h3 id="section-3-title" className="field-section-title">
                  {isAr ? 'تفاصيل وسرد الوقائع الميدانية' : 'Field Incident Narrative'}
                </h3>
                <p className="field-section-desc">
                  {isAr
                    ? 'اكتب مجريات الحدث بدقة مع تقدير المخاطر والتهديدات الآنية.'
                    : 'Record verbatim facts and immediate threat observations.'}
                </p>
              </div>
            </div>
            <span className="field-step-pill">
              {isAr ? 'المرحلة 3 من 5' : 'Stage 3 of 5'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Raw Description (Primary Textarea) */}
            <div className="field-form-group">
              <label htmlFor="incident-narrative" className="field-label">
                <span>
                  {isAr ? 'السرد الميداني الكامل للحدث' : 'Full Raw Field Narrative'}{' '}
                  <span className="required-mark">*</span>
                </span>
                <span className="field-label-hint">
                  {isAr ? '10 أحرف كحد أدنى' : 'Min 10 characters'}
                </span>
              </label>
              <textarea
                ref={narrativeRef}
                id="incident-narrative"
                required
                rows={6}
                style={{ minHeight: '160px', resize: 'vertical' }}
                className={`field-textarea ${formErrors.rawDescription ? 'has-error' : ''}`}
                placeholder={
                  isAr
                    ? 'صف بالتفصيل مجريات الحدث الميداني، الأطراف المشاركة، السلاح المستخدم إن وجد، طبيعة التهديد، والتداعيات الفورية على الأرض...'
                    : 'Describe what occurred with precision: involved parties, weapons/means observed, chronological timeline, human or material casualties...'
                }
                value={rawDescription}
                onChange={(e) => setRawDescription(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {formErrors.rawDescription ? (
                  <span className="field-error-text" role="alert">
                    <AlertTriangle size={13} /> {formErrors.rawDescription}
                  </span>
                ) : (
                  <span />
                )}
                <span className={`field-char-counter ${rawDescription.trim().length >= 10 ? 'valid' : ''}`}>
                  {rawDescription.trim().length} {isAr ? 'حرفاً' : 'chars'}
                </span>
              </div>
            </div>

            {/* Initial Risk Notes */}
            <div className="field-form-group">
              <label htmlFor="incident-risk-notes" className="field-label">
                <span>
                  {isAr ? 'ملاحظات المخاطر والتهديدات الأولية' : "Source's Initial Threat & Risk Notes"}
                </span>
                <span className="field-label-hint">
                  {isAr ? 'اختياري — تقدير للمنسق' : 'Optional — field estimation'}
                </span>
              </label>
              <textarea
                id="incident-risk-notes"
                rows={3}
                style={{ minHeight: '90px', resize: 'vertical' }}
                className="field-textarea"
                placeholder={
                  isAr
                    ? 'تقدير استمرار التهديد على حركة العاملين في المجال الإنساني أو المنظمات، أو إمكانية تفاقم الوضع...'
                    : 'Anticipated risks to convoy routes, humanitarian personnel, or civilians in upcoming hours...'
                }
                value={initialRiskNotes}
                onChange={(e) => setInitialRiskNotes(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 4: Sensitive Source Enclave (AES-256-GCM)
            ================================================================== */}
        <section className="field-section-card" aria-labelledby="section-4-title">
          <div className="field-section-header">
            <div className="field-section-header-content">
              <div
                className="field-section-icon"
                style={{
                  background: 'rgba(217,119,6,0.18)',
                  borderColor: 'var(--brand-gold-500, #d97706)',
                }}
                aria-hidden="true"
              >
                <Lock size={20} />
              </div>
              <div>
                <h3 id="section-4-title" className="field-section-title">
                  {isAr ? 'بيانات المصدر الحساسة (نطاق التشفير السيادي)' : 'Field Source Details & Credibility (Encrypted)'}
                </h3>
                <p className="field-section-desc">
                  {isAr
                    ? 'حماية هوية المصادر والشهود بتشفير كامل غير قابل للنفاذ.'
                    : 'Source identity is fully masked and encrypted to protect field informants.'}
                </p>
              </div>
            </div>
            <span className="field-step-pill">
              {isAr ? 'المرحلة 4 من 5' : 'Stage 4 of 5'}
            </span>
          </div>

          <div className="field-secure-enclave">
            <div className="field-secure-header">
              <div className="field-secure-title">
                <Lock size={16} />
                <span>
                  {isAr
                    ? 'حماية بيانات المصدر الميداني (Whistleblower & Source Enclave)'
                    : 'Whistleblower & Source Enclave'}
                </span>
              </div>
              <span className="field-aes-badge">
                <Shield size={12} />
                <span>AES-256-GCM Protected</span>
              </span>
            </div>

            <div className="field-secure-notice">
              🔒 <strong>{isAr ? 'تنبيه أمني:' : 'Security Notice:'}</strong>{' '}
              {isAr
                ? 'تُعامل هذه البيانات كمعلومات حساسة وسرية، ولا يتم حفظها في قاعدة البيانات إلا بعد تشفيرها مباشرة باستخدام معيار التشفير المتقدم (AES-256-GCM). لا تظهر هذه البيانات لأي مستخدم باستثناء مسؤولي الفرز الأمني المصرحين بالإدارة العليا.'
                : 'This data is classified and encrypted with AES-256-GCM prior to database persistence. Visible exclusively to authorized Senior Operations triage officers.'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="field-grid-2">
                <div className="field-form-group">
                  <label htmlFor="source-type" className="field-label">
                    <span>{isAr ? 'صفة المصدر الميداني' : 'Source Capacity'}</span>
                  </label>
                  <select
                    id="source-type"
                    className="field-select"
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                  >
                    {SOURCE_TYPES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {isAr ? st.labelAr : st.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-form-group">
                  <label htmlFor="source-name" className="field-label">
                    <span>{isAr ? 'اسم المصدر / المبلغ' : 'Source Name or Call Sign'}</span>
                    <span className="field-label-hint">
                      {isAr ? 'الاسم الحقيقي أو الرمزي' : 'Real name or codename'}
                    </span>
                  </label>
                  <input
                    id="source-name"
                    type="text"
                    className="field-input"
                    placeholder={
                      isAr
                        ? 'مثال: م. ع. العولقي أو رمز المصدر'
                        : 'e.g., M. Al-Awlaqi or source codename'
                    }
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid-2">
                <div className="field-form-group">
                  <label htmlFor="source-phone" className="field-label">
                    <span>{isAr ? 'رقم هاتف الاتصال' : 'Source Contact Phone'}</span>
                    <span className="field-label-hint">
                      {isAr ? 'اختياري مشفر' : 'Optional & encrypted'}
                    </span>
                  </label>
                  <input
                    id="source-phone"
                    type="tel"
                    className="field-input"
                    placeholder="+967 77X XXX XXX"
                    value={sourcePhone}
                    onChange={(e) => setSourcePhone(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="field-form-group">
                  <label htmlFor="source-org" className="field-label">
                    <span>{isAr ? 'الجهة أو المؤسسة' : 'Source Organization / Affiliation'}</span>
                    <span className="field-label-hint">
                      {isAr ? 'منظمة / مرفق إغاثي' : 'Agency / humanitarian entity'}
                    </span>
                  </label>
                  <input
                    id="source-org"
                    type="text"
                    className="field-input"
                    placeholder={
                      isAr
                        ? 'مثال: هيئة الإغاثة، منظمة مجتمعية...'
                        : 'e.g., Relief agency, local community org...'
                    }
                    value={sourceOrg}
                    onChange={(e) => setSourceOrg(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 5: Attachments & Evidence
            ================================================================== */}
        <section className="field-section-card" aria-labelledby="section-5-title">
          <div className="field-section-header">
            <div className="field-section-header-content">
              <div className="field-section-icon" aria-hidden="true">
                <Upload size={20} />
              </div>
              <div>
                <h3 id="section-5-title" className="field-section-title">
                  {isAr ? 'المرفقات والأدلة الميدانية' : 'Operational Attachments & Evidence'}
                </h3>
                <p className="field-section-desc">
                  {isAr
                    ? 'إرفاق الصور والوثائق الميدانية مع فحص آمن للتوقيع الرقمي (Magic-bytes).'
                    : 'Upload field photos and files (EXIF stripped & encrypted with magic-byte validation).'}
                </p>
              </div>
            </div>
            <span className="field-step-pill">
              {isAr ? 'المرحلة 5 من 5' : 'Stage 5 of 5'}
            </span>
          </div>

          <div>
            {/* Drag & Drop Zone */}
            <div
              className={`field-upload-dropzone ${isDragging ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label={
                isAr
                  ? 'منطقة رفع المرفقات والأدلة الميدانية'
                  : 'Field attachments upload dropzone'
              }
            >
              <div className="field-upload-icon-circle">
                <Upload size={24} />
              </div>
              <div className="field-upload-title">
                {isAr
                  ? 'اسحب الملفات وأفلتها هنا، أو اضغط للاختيار من جهازك'
                  : 'Drag & drop files here, or click to browse'}
              </div>
              <div className="field-upload-hints">
                <span>{isAr ? 'الصيغ المقبولة: JPG, PNG, WEBP, PDF' : 'Accepted formats: JPG, PNG, WEBP, PDF'}</span>
                <span>•</span>
                <span>{isAr ? 'الحد الأقصى: 10 ميجابايت للملف' : 'Max 10 MB per file'}</span>
                <span>•</span>
                <span>{isAr ? 'تخزين أمني خاص ومعزول' : 'Encrypted & isolated storage'}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
            </div>

            {formErrors.attachments && (
              <span className="field-error-text" style={{ marginTop: '0.5rem' }} role="alert">
                <AlertTriangle size={13} /> {formErrors.attachments}
              </span>
            )}

            {/* Uploaded Files List */}
            {attachments.length > 0 && (
              <div
                className="field-attachments-grid"
                role="list"
                aria-label={isAr ? 'قائمة المرفقات المختارة' : 'Uploaded attachments list'}
              >
                {attachments.map((att, idx) => (
                  <div key={idx} className="field-attachment-item" role="listitem">
                    <div className="field-attachment-info">
                      <FileCheck size={18} color="var(--brand-gold-400, #f59e0b)" />
                      <div style={{ minWidth: 0 }}>
                        <div className="field-attachment-name" title={att.fileName}>
                          {att.fileName}
                        </div>
                        <div className="field-attachment-size">
                          {(att.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachment(idx);
                      }}
                      className="field-attachment-remove"
                      title={isAr ? `إزالة الملف [${att.fileName}]` : `Remove file [${att.fileName}]`}
                      aria-label={isAr ? `إزالة الملف [${att.fileName}]` : `Remove file [${att.fileName}]`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==================================================================
            SECTION 6: Pre-Submit Summary Review & Dispatch
            ================================================================== */}
        <div className="field-review-card">
          <div className="field-review-title">
            <Eye size={18} color="var(--brand-gold-400, #f59e0b)" />
            <span>{isAr ? 'ملخص البلاغ قبل الإرسال المشفر' : 'Pre-Submission Encrypted Summary Review'}</span>
          </div>

          <div className="field-review-grid">
            <div className="field-review-item">
              <span className="field-review-label">
                {isAr ? 'طبيعة وتصنيف الحدث:' : 'Incident Classification:'}
              </span>
              <span className="field-review-value">
                {isAr ? selectedCategoryObj?.labelAr : selectedCategoryObj?.labelEn}
              </span>
            </div>

            <div className="field-review-item">
              <span className="field-review-label">
                {isAr ? 'مستوى الأولوية:' : 'Priority Level:'}
              </span>
              <span className="field-review-value" style={{ color: selectedPriorityObj?.color }}>
                {isAr ? selectedPriorityObj?.labelAr : selectedPriorityObj?.labelEn}
              </span>
            </div>

            <div className="field-review-item">
              <span className="field-review-label">
                {isAr ? 'الموقع الإداري:' : 'Administrative Location:'}
              </span>
              <span className="field-review-value">
                {YEMEN_GOVERNORATES.find((g) => g.ar === governorate)?.[isAr ? 'ar' : 'en'] || governorate}{' '}
                {district ? `— ${district}` : ''}
              </span>
            </div>

            <div className="field-review-item">
              <span className="field-review-label">
                {isAr ? 'إحداثيات GPS:' : 'GPS Coordinates:'}
              </span>
              <span className="field-review-value" style={{ direction: 'ltr', display: 'inline-block' }}>
                {exactLatitude && exactLongitude
                  ? `${exactLatitude}, ${exactLongitude}`
                  : isAr
                  ? 'لم تُحدد'
                  : 'Not specified'}
              </span>
            </div>

            <div className="field-review-item">
              <span className="field-review-label">
                {isAr ? 'بيانات المصدر الحساسة:' : 'Sensitive Source Identity:'}
              </span>
              <span
                className="field-review-value"
                style={{ color: sourceName || sourcePhone ? '#4ade80' : '#94a3b8' }}
              >
                {sourceName || sourcePhone
                  ? isAr
                    ? '🔒 مشفرة (AES-256-GCM)'
                    : '🔒 Encrypted (AES-256-GCM)'
                  : isAr
                  ? 'لم تُحدد'
                  : 'Not specified'}
              </span>
            </div>

            <div className="field-review-item">
              <span className="field-review-label">
                {isAr ? 'المرفقات والأدلة:' : 'Evidence Attachments:'}
              </span>
              <span className="field-review-value">
                {attachments.length > 0
                  ? isAr
                    ? `${attachments.length} ملفات مرفقة`
                    : `${attachments.length} files attached`
                  : isAr
                  ? 'بدون مرفقات'
                  : 'None attached'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="field-action-bar">
          <button type="submit" disabled={isSubmitting} className="field-submit-btn">
            {isSubmitting ? (
              <>
                <Lock className="animate-spin" size={20} />
                <span>
                  {isAr
                    ? 'جارٍ التشفير والإرسال إلى العمليات المركزية...'
                    : 'Encrypting and transmitting to Central Operations...'}
                </span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>
                  {isAr
                    ? 'مراجعة وتشفير وإرسال البلاغ الميداني'
                    : 'Approve, Encrypt & Submit Incident Report'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ==================================================================
          CONFIRMATION MODAL
          ================================================================== */}
      {showConfirmModal && (
        <div
          className="field-modal-backdrop"
          onClick={() => setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            className="field-modal-card"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(217,119,6,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-gold-400, #f59e0b)',
                }}
              >
                <Lock size={22} />
              </div>
              <div>
                <h3
                  id="confirm-modal-title"
                  style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}
                >
                  {isAr ? 'تأكيد الإرسال المشفر للبلاغ' : 'Confirm Encrypted Incident Submission'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {isAr
                    ? 'المركز الدولي للسلامة — غرفة العمليات والفرز'
                    : 'International Safety Center — Operations & Triage Room'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {isAr ? (
                <>
                  أنت على وشك تشفير وإرسال بلاغ أمني مصنف كـ <strong>«{selectedCategoryObj?.labelAr}»</strong> في <strong>«{governorate}»</strong>. هل تأكدت من صحة البيانات الميدانية؟
                </>
              ) : (
                <>
                  You are about to encrypt and transmit a security incident classified as <strong>«{selectedCategoryObj?.labelEn}»</strong> in <strong>«{YEMEN_GOVERNORATES.find((g) => g.ar === governorate)?.en || governorate}»</strong>. Do you confirm the accuracy of the entered field facts?
                </>
              )}
            </p>

            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.78rem',
                color: '#94a3b8',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}
            >
              ℹ️{' '}
              {isAr ? (
                <>
                  فور النقر على التأكيد، سيتم تشفير السرد والموقع وهوية المصدر عبر معيار <code>AES-256-GCM</code>، ولن تكون البيانات قابلة للتعديل أو العرض على هذا الجهاز التزاماً بمبادئ الخصوصية والأمان الميداني.
                </>
              ) : (
                <>
                  Upon confirmation, the narrative, exact coordinates, and source identity will be encrypted with <code>AES-256-GCM</code> and cannot be modified or retrieved on this terminal in adherence to field privacy standards.
                </>
              )}
            </div>

            <div className="field-modal-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowConfirmModal(false)}
                style={{ padding: '0.6rem 1.25rem', borderColor: '#475569', color: '#cbd5e1' }}
              >
                {isAr ? 'تراجع وتعديل' : 'Cancel & Edit'}
              </button>
              <button
                type="button"
                className="field-submit-btn"
                onClick={handleConfirmedSubmit}
                style={{ minHeight: 'auto', padding: '0.65rem 1.5rem', flex: 'none' }}
              >
                <Send size={16} />
                <span>{isAr ? 'تأكيد الإرسال الآن' : 'Confirm Submission'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
