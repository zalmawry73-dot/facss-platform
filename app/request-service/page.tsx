'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  FileCheck, 
  Lock, 
  Building,
  LogIn,
  UserPlus
} from 'lucide-react';

interface ServiceItem {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
}

function RequestServiceForm() {
  const { t, locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams.get('service');
  const returnUrl = preselectedSlug ? `/request-service?service=${encodeURIComponent(preselectedSlug)}` : '/request-service';
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [formData, setFormData] = useState({
    serviceId: '',
    organization: user?.organization || '',
    contactName: user?.fullName || '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    priority: 'NORMAL',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedNumber, setGeneratedNumber] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
          if (preselectedSlug && data.services) {
            const found = data.services.find((s: any) => s.slug === preselectedSlug);
            if (found) {
              setFormData((prev) => ({ ...prev, serviceId: found.id }));
            }
          } else if (data.services && data.services.length > 0) {
            setFormData((prev) => ({ ...prev, serviceId: data.services[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, [preselectedSlug]);

  // Autofill if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        contactName: prev.contactName || user.fullName || '',
        contactEmail: prev.contactEmail || user.email || '',
        organization: prev.organization || user.organization || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isAr ? 'حدث خطأ أثناء إرسال الطلب' : 'An error occurred while submitting your request.'));
      } else {
        setGeneratedNumber(data.requestNumber);
      }
    } catch {
      setError(isAr ? 'تعذر الاتصال بالخادم، يرجى إعادة المحاولة.' : 'Unable to contact server. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-bg)' }}>
      {/* Institutional Page Header */}
      <section className="page-header-institutional">
        <div className="container text-center">
          <div className="hero-badge-pill" style={{ marginInline: 'auto', marginBottom: '1.25rem' }}>
            <Shield size={14} color="var(--color-gold-400)" />
            <span>{t.requestService}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            {t.requestServiceTitle}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto', lineHeight: 1.8 }}>
            {t.requestServiceSubtitle}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingBlock: '3.5rem' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          {/* Success Screen */}
          {generatedNumber ? (
            <div className="card-institutional" style={{ padding: '3.5rem 2rem', textAlign: 'center', borderTop: '4px solid var(--color-gold-500)' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '2px solid #10B981',
                  color: '#065F46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginInline: 'auto',
                  marginBottom: '1.5rem',
                }}
              >
                <CheckCircle2 size={42} />
              </div>

              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--color-primary-950)', marginBottom: '0.8rem', letterSpacing: '-0.01em' }}>
                {t.requestSuccessTitle}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.8rem' }}>
                {t.requestSuccessDesc}
              </p>

              {/* Reference Code Box */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '1rem 2.5rem',
                  background: '#F4F1EA',
                  border: '2px dashed var(--color-gold-500)',
                  borderRadius: '12px',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: 'var(--color-primary-950)',
                  letterSpacing: '0.08em',
                  marginBottom: '2rem',
                }}
              >
                {generatedNumber}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '580px', marginInline: 'auto', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                {t.trackInPortal}
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/portal/client/requests" className="btn btn-gold btn-lg">
                  <span>{isAr ? 'متابعة الطلب في بوابة العميل' : 'Track Request in Client Portal'}</span>
                  <ArrowIcon size={18} />
                </Link>
                <Link href="/" className="btn btn-outline btn-lg">
                  {t.home}
                </Link>
              </div>
            </div>
          ) : authLoading ? (
            <div className="card-institutional" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{isAr ? 'جارٍ التحقق من بيانات الجلسة المؤسسية...' : 'Verifying institutional session...'}</p>
            </div>
          ) : !user ? (
            /* Institutional Authentication Required Gate */
            <div className="card-institutional" style={{ padding: 'clamp(2.5rem, 5vw, 3.5rem) 2rem', textAlign: 'center', borderTop: '4px solid var(--color-gold-500)', boxShadow: '0 20px 40px -15px rgba(11, 61, 46, 0.08)' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'rgba(181, 146, 84, 0.12)',
                  border: '2px solid var(--color-gold-500)',
                  color: 'var(--color-gold-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginInline: 'auto',
                  marginBottom: '1.75rem',
                }}
              >
                <Lock size={38} />
              </div>

              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', fontWeight: 900, color: 'var(--color-primary-950)', marginBottom: '0.8rem', letterSpacing: '-0.01em' }}>
                {isAr ? 'تسجيل الدخول المؤسسي مطلوب لطلب الخدمة' : 'Institutional Sign-In Required'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', maxWidth: '640px', marginInline: 'auto', lineHeight: 1.8, marginBottom: '2.25rem' }}>
                {isAr 
                  ? 'خدمات واستشارات مركز ميثاق (FACSS) هي عمليات ميدانية أمنية معتمدة تتطلب التحقق من هوية المنشأة لضمان أمان ومتابعة التكليفات وإصدار عروض الأسعار والتقارير الميدانية داخل بوابتكم الخاصة.'
                  : 'FACSS services and field advisory are accredited institutional operations requiring verified corporate access to manage requisitions, quotations, and official final reports.'}
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <Link 
                  href={`/login?redirect=${encodeURIComponent(returnUrl)}&reason=request_service`} 
                  className="btn btn-gold btn-lg"
                  style={{ minWidth: '220px' }}
                >
                  <LogIn size={18} />
                  <span>{isAr ? 'تسجيل الدخول إلى حساب المنشأة' : 'Sign In to Your Account'}</span>
                  <ArrowIcon size={18} />
                </Link>
                <Link 
                  href={`/register?role=CLIENT&redirect=${encodeURIComponent(returnUrl)}`} 
                  className="btn btn-outline btn-lg"
                  style={{ minWidth: '220px' }}
                >
                  <UserPlus size={18} />
                  <span>{isAr ? 'إنشاء حساب عميل مؤسسي جديد' : 'Register New Client Account'}</span>
                </Link>
              </div>

              <div style={{ background: '#F4F1EA', borderRadius: '12px', padding: '1.35rem 1.75rem', border: '1px solid rgba(181, 146, 84, 0.25)', maxWidth: '640px', marginInline: 'auto', textAlign: isAr ? 'right' : 'left' }}>
                <div style={{ fontWeight: 800, color: 'var(--color-primary-950)', marginBottom: '0.6rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={16} color="var(--color-gold-600)" />
                  <span>{isAr ? 'مزايا امتلاك حساب عميل مؤسسي معتمد:' : 'Benefits of an Authenticated Client Account:'}</span>
                </div>
                <ul style={{ margin: 0, paddingInlineStart: '1.35rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.85 }}>
                  <li>{isAr ? 'متابعة حية ولحظية لحالة الطلب وتعيين المنسقين والمشرفين الميدانيين.' : 'Live tracking of request status and assigned field supervisors.'}</li>
                  <li>{isAr ? 'استعراض واعتماد عروض الأسعار والدراسات الاستشارية رسمياً.' : 'Official review and approval of commercial quotations and studies.'}</li>
                  <li>{isAr ? 'الوصول المباشر للتقارير الميدانية النهائية وشهادات التدقيق المعتمدة وتنزيلها.' : 'Direct access to verified final field reports and downloadable audit certificates.'}</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Request Form */
            <div className="card-institutional" style={{ padding: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid rgba(181, 146, 84, 0.2)', paddingBottom: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-950)', margin: 0, letterSpacing: '-0.01em' }}>
                    {isAr ? 'بيانات طلب الخدمة والمنشأة' : 'Institutional Service Request Details'}
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                    {isAr ? 'إجراءات التقييم الميداني والاعتماد المباشر' : 'Field assessment and direct operational assignment protocol'}
                  </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: 'rgba(181, 146, 84, 0.1)', borderRadius: '20px', border: '1px solid rgba(181, 146, 84, 0.25)', color: 'var(--color-gold-700)', fontSize: '0.78rem', fontWeight: 700 }}>
                  <Lock size={12} />
                  <span>{isAr ? 'طلب رسمي مشفر' : 'Encrypted Official Requisition'}</span>
                </div>
              </div>

              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    {t.selectService} <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    required
                    disabled={loadingServices}
                  >
                    {loadingServices ? (
                      <option>{isAr ? 'جارٍ تحميل الخدمات...' : 'Loading services...'}</option>
                    ) : (
                      services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {isAr ? s.titleAr : (s.titleEn || s.titleAr)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {t.organization} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={isAr ? 'اسم المنظمة أو الهيئة أو الشريك الميداني' : 'Organization / Agency / Field Partner Name'}
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t.fullName} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={isAr ? 'اسم المفوض بالتواصل' : 'Authorized Representative Name'}
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {t.email} <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="example@organization.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t.phone} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+967-..."
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.priority}</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="NORMAL">{t.priorityNormal}</option>
                    <option value="HIGH">{t.priorityHigh}</option>
                    <option value="URGENT">{t.priorityUrgent}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t.serviceDetails} <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={5}
                    placeholder={isAr
                      ? 'وضح نطاق الاحتياج الميداني، الموقع الجغرافي أو المسار، المتطلبات التخصصية، وأي تواريخ مستهدفة...'
                      : 'Specify field requirements, geographic scope or movement corridor, specialized needs, and target timeline...'}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-gold btn-lg"
                  style={{ width: '100%' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span>{isAr ? 'جارٍ معالجة وتوليد الطلب...' : 'Processing & generating reference...'}</span>
                  ) : (
                    <>
                      <Shield size={18} />
                      <span>{t.submitRequest}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function RequestServicePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--facss-gold-600)' }}>...</div>}>
      <RequestServiceForm />
    </Suspense>
  );
}
