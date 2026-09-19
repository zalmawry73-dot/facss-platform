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

  const [contactSettings, setContactSettings] = useState({
    phone: '+967 2 245 800',
    email: 'info@facss-aden.com',
    address: 'عدن، خور مكسر - حي السفارات',
    hours: 'غرفة العمليات الميدانية تعمل 24/7',
  });

  React.useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setContactSettings({
            phone: data.settings.OFFICIAL_PHONE || '+967 2 245 800',
            email: data.settings.OFFICIAL_EMAIL || 'info@facss-aden.com',
            address: data.settings.OFFICIAL_ADDRESS || 'عدن، خور مكسر - حي السفارات',
            hours: data.settings.WORKING_HOURS || 'غرفة العمليات الميدانية تعمل 24/7',
          });
        }
      })
      .catch(() => {});
  }, []);

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
        setError(data.error || (locale === 'ar' ? 'حدث خطأ أثناء إرسال الرسالة' : 'An error occurred while sending your message.'));
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
      setError(locale === 'ar' ? 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.' : 'Unable to reach server. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Banner */}
      <section
        style={{
          paddingBlock: '4rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.navContact}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {t.contactTitle}
          </h1>
          <p style={{ color: 'var(--facss-ivory-300)', fontSize: '1.1rem', maxWidth: '750px', marginInline: 'auto' }}>
            {t.contactSubtitle}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3rem' }}>
            {/* Form Column */}
            <div className="card">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                {locale === 'ar' ? 'نموذج التواصل والاستفسار' : 'Inquiry & Consultation Form'}
              </h2>

              {success && (
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', borderRadius: '8px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                  <CheckCircle2 size={20} />
                  <span>{t.messageSentSuccess}</span>
                </div>
              )}

              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 600 }}>
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
                    <span>{locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</span>
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  {locale === 'ar' ? 'معلومات الاتصال الرسمية' : 'Official Contact Details'}
                </h3>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--facss-gold-700)', flexShrink: 0 }}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700 }}>{t.locationLabel}</strong>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {contactSettings.address}
                      </span>
                    </div>
                  </li>

                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--facss-gold-700)', flexShrink: 0 }}>
                      <Mail size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700 }}>{t.emailLabel}</strong>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{contactSettings.email}</span>
                    </div>
                  </li>

                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--facss-gold-700)', flexShrink: 0 }}>
                      <Phone size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700 }}>{t.phoneLabel}</strong>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500, direction: 'ltr', display: 'inline-block' }}>{contactSettings.phone}</span>
                    </div>
                  </li>

                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--facss-gold-700)', flexShrink: 0 }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700 }}>
                        {locale === 'ar' ? 'ساعات العمل والمتابعة' : 'Operations Availability'}
                      </strong>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {contactSettings.hours}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Security Confidentiality Notice */}
              <div className="card" style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-color)', borderInlineStart: '4px solid var(--facss-gold-500)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--facss-green-800)' }} />
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                    {locale === 'ar' ? 'مبدأ السرية التامة' : 'Strict Confidentiality Protocol'}
                  </h4>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
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
