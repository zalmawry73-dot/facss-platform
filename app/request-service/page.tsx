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
  Building 
} from 'lucide-react';

interface ServiceItem {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
}

function RequestServiceForm() {
  const { t, locale, dir } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams.get('service');

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
        setError(data.error || 'حدث خطأ أثناء إرسال الطلب');
      } else {
        setGeneratedNumber(data.requestNumber);
      }
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى إعادة المحاولة.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4.5rem',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(19, 62, 43, 0.6) 0%, rgba(5, 14, 9, 0.95) 80%)',
          borderBottom: '1px solid rgba(197, 155, 39, 0.2)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">طلب خدمة أمنية</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            {t.requestServiceTitle}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            {t.requestServiceSubtitle}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '820px' }}>
          {/* Success Screen */}
          {generatedNumber ? (
            <div className="card glow-animation" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981',
                  color: '#34D399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginInline: 'auto',
                  marginBottom: '1.5rem',
                }}
              >
                <CheckCircle2 size={42} />
              </div>

              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.8rem' }}>
                {t.requestSuccessTitle}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.8rem' }}>
                {t.requestSuccessDesc}
              </p>

              {/* Reference Code Box */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '1rem 2.5rem',
                  background: 'rgba(11, 37, 24, 0.8)',
                  border: '2px dashed var(--color-gold)',
                  borderRadius: '12px',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: 'var(--color-gold-light)',
                  letterSpacing: '0.08em',
                  marginBottom: '2rem',
                }}
              >
                {generatedNumber}
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '580px', marginInline: 'auto', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                {t.trackInPortal}
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/portal/client/requests" className="btn btn-gold btn-lg">
                  <span>متابعة الطلب في بوابة العميل</span>
                  <ArrowLeft size={18} />
                </Link>
                <Link href="/" className="btn btn-outline btn-lg">
                  العودة للرئيسية
                </Link>
              </div>
            </div>
          ) : (
            /* Request Form */
            <div className="card">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '1.5rem' }}>
                بيانات طلب الخدمة والمنشأة
              </h2>

              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
                      <option>جارٍ تحميل الخدمات...</option>
                    ) : (
                      services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {locale === 'ar' ? s.titleAr : s.titleEn}
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
                      placeholder="اسم الشركة أو المؤسسة أو المنشأة"
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
                      placeholder="اسم المفوض بالتواصل"
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
                    placeholder="وضح نطاق المنشأة، موقعها، المتطلبات الخاصة، وأي تواريخ مستهدفة لبدء الخدمة..."
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
                    <span>جارٍ معالجة وتوليد الطلب...</span>
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
    <Suspense fallback={<div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--color-gold-light)' }}>جارٍ تحميل نموذج الطلب...</div>}>
      <RequestServiceForm />
    </Suspense>
  );
}
