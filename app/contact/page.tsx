'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck 
} from 'lucide-react';

export default function ContactPage() {
  const { t, locale } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء إرسال الرسالة');
      } else {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          subject: '',
          message: '',
        });
      }
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.');
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
          <span className="section-tag">{t.navContact}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFF', marginBottom: '1rem' }}>
            {t.contactTitle}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            {t.contactSubtitle}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3.5rem' }}>
            {/* Form Column */}
            <div className="card">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '1.5rem' }}>
                {locale === 'ar' ? 'نموذج التواصل والاستفسار' : 'Inquiry & Consultation Form'}
              </h2>

              {success && (
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <CheckCircle2 size={20} />
                  <span>{t.messageSentSuccess}</span>
                </div>
              )}

              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {t.fullName} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t.email} <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t.phone}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t.organization}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t.subject} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t.message} <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? (
                    <span>جارٍ الإرسال...</span>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{t.sendMessage}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Column */}
            <div>
              <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginBottom: '1.5rem' }}>
                  {locale === 'ar' ? 'معلومات الاتصال المعتمدة' : 'Official Contact Details'}
                </h3>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(197,155,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-light)', flexShrink: 0 }}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gold-light)' }}>{t.locationLabel}</strong>
                      <span style={{ fontSize: '0.95rem', color: '#FFF' }}>
                        {locale === 'ar' ? 'عدن، الجمهورية اليمنية' : 'Aden, Republic of Yemen'}
                      </span>
                    </div>
                  </li>

                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(197,155,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-light)', flexShrink: 0 }}>
                      <Mail size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gold-light)' }}>{t.emailLabel}</strong>
                      <span style={{ fontSize: '0.95rem', color: '#FFF' }}>info@facss-aden.com</span>
                    </div>
                  </li>

                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(197,155,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-light)', flexShrink: 0 }}>
                      <Phone size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gold-light)' }}>{t.phoneLabel}</strong>
                      <span style={{ fontSize: '0.95rem', color: '#FFF' }}>[يُضاف لاحقاً - PHONE_PLACEHOLDER]</span>
                    </div>
                  </li>

                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(197,155,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-light)', flexShrink: 0 }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gold-light)' }}>
                        {locale === 'ar' ? 'ساعات العمل والمتابعة' : 'Operations Availability'}
                      </strong>
                      <span style={{ fontSize: '0.95rem', color: '#FFF' }}>
                        {locale === 'ar' ? 'غرفة العمليات الميدانية تعمل 24/7' : 'Command Operations Active 24/7'}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Security Confidentiality Notice */}
              <div className="card" style={{ background: 'rgba(11,37,24,0.4)', borderInlineStart: '4px solid var(--color-gold)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-gold-light)' }} />
                  <h4 style={{ color: '#FFF', fontWeight: 700, margin: 0 }}>
                    {locale === 'ar' ? 'مبدأ السرية التامة' : 'Strict Confidentiality Protocol'}
                  </h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                  {locale === 'ar'
                    ? 'نلتزم التزاماً صارماً بحماية بيانات عملائنا وخصوصية منشآتهم وفق أعلى المعايير الأمنية والأخلاقية.'
                    : 'We adhere strictly to safeguarding client information and physical premise specifics under uncompromising institutional non-disclosure standards.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
