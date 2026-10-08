'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  ShieldCheck,
  Building,
  FileText,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';

export default function ContactPage() {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    subject: '',
    message: '',
    messageType: 'GENERAL_INQUIRY',
    priority: 'NORMAL',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    setSubmittedRef(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isAr ? 'حدث خطأ أثناء إرسال الرسالة' : 'An error occurred while sending your message.'));
      } else {
        setSuccess(true);
        setSubmittedRef(data.referenceNumber || null);
        setSuccessMsg(data.message || null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          subject: '',
          message: '',
          messageType: 'GENERAL_INQUIRY',
          priority: 'NORMAL',
        });
      }
    } catch {
      setError(isAr ? 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.' : 'Unable to reach server. Please try again later.');
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
          color: '#FFFFFF',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.navContact}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1rem' }}>
            {t.contactTitle}
          </h1>
          <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '1.1rem', maxWidth: '780px', marginInline: 'auto', lineHeight: 1.75 }}>
            {t.contactSubtitle}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(1.5rem, 3.5vw, 3rem)' }}>
            {/* Form Column */}
            <div className="card">
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                {t.contactFormTitle}
              </h2>

              {success && (
                <div style={{ 
                  padding: '1.25rem', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid #10B981', 
                  borderRadius: '10px', 
                  color: '#065F46', 
                  marginBottom: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={22} color="#10B981" />
                    <span>{successMsg || t.messageSentSuccess}</span>
                  </div>
                  {submittedRef && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.875rem 1rem', 
                      background: '#FFFFFF', 
                      borderRadius: '8px', 
                      border: '1px dashed #059669', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
                          {isAr ? 'الرقم المرجعي الرسمي للشكوى (احفظ هذا الرقم للمتابعة):' : 'Official Complaint Reference Number (Save for tracking):'}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065F46', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          {submittedRef}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (submittedRef) {
                            navigator.clipboard.writeText(submittedRef);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2500);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.85rem',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          borderRadius: '6px',
                          color: '#065F46',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرقم' : 'Copy Ref')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 600 }}>
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Message Type Selection Tabs */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                    {isAr ? 'نوع الطلب أو المراسلة' : 'Request Type'} <span className="required">*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, messageType: 'GENERAL_INQUIRY' })}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: formData.messageType === 'GENERAL_INQUIRY' ? '2px solid var(--facss-gold-500, #C9A227)' : '1px solid #E5E7EB',
                        background: formData.messageType === 'GENERAL_INQUIRY' ? 'rgba(201, 162, 39, 0.1)' : '#F9FAFB',
                        color: formData.messageType === 'GENERAL_INQUIRY' ? 'var(--facss-green-950, #0C2318)' : '#6B7280',
                        fontWeight: formData.messageType === 'GENERAL_INQUIRY' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <FileText size={18} />
                      <span>{isAr ? 'استفسار وتواصل عام' : 'General Inquiry'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, messageType: 'COMPLAINT' })}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: formData.messageType === 'COMPLAINT' ? '2px solid #EF4444' : '1px solid #E5E7EB',
                        background: formData.messageType === 'COMPLAINT' ? 'rgba(239, 68, 68, 0.08)' : '#F9FAFB',
                        color: formData.messageType === 'COMPLAINT' ? '#991B1B' : '#6B7280',
                        fontWeight: formData.messageType === 'COMPLAINT' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <AlertTriangle size={18} />
                      <span>{isAr ? 'تقديم شكوى رسمية' : 'Official Complaint'}</span>
                    </button>
                  </div>

                  {formData.messageType === 'COMPLAINT' && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.75rem 1rem', 
                      background: 'rgba(239, 68, 68, 0.05)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: '#991B1B',
                      lineHeight: 1.6,
                    }}>
                      {isAr 
                        ? 'تنبيه: يتم تسجيل الشكاوى الرسمية في نظام غرفة الرصد والتحكم المركزية (24/7)، ويتم إصدار رقم مرجعي فريد لمتابعة معالجة الشكوى بموجب اتفاقيات مستوى الخدمة (SLA).'
                        : 'Notice: Official complaints are registered directly into the 24/7 Operations Monitoring Room and issued a unique reference number tracked under service level agreements (SLA).'}
                    </div>
                  )}
                </div>

                {/* Priority Selection for Complaint */}
                {formData.messageType === 'COMPLAINT' && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">
                      {isAr ? 'درجة أولوية الشكوى' : 'Complaint Priority'}
                    </label>
                    <select
                      className="form-input"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="NORMAL">{isAr ? 'عادي (معالجة قياسية خلال 48 ساعة)' : 'Normal (Standard resolution within 48h)'}</option>
                      <option value="URGENT">{isAr ? 'عاجل (معالجة عاجلة خلال 24 ساعة)' : 'Urgent (Priority resolution within 24h)'}</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {isAr ? 'الاسم والصفة' : 'Full Name & Title'} <span className="required">*</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'رقم الهاتف للتنسيق' : 'Coordination Phone'}</label>
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
                    <span>{isAr ? 'جارٍ الإرسال والتسجيل...' : 'Submitting...'}</span>
                  ) : (
                    <>
                      <Send size={17} />
                      <span>
                        {formData.messageType === 'COMPLAINT' 
                          ? (isAr ? 'قيد وإرسال الشكوى رسمياً' : 'Register & Submit Complaint')
                          : t.sendMessage}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Column */}
            <div>
              <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  {t.officialCoordinatesTitle}
                </h3>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.35rem', padding: 0, margin: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--facss-gold-700)', flexShrink: 0 }}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700 }}>
                        {t.locationLabel}
                      </strong>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {isAr ? 'العاصمة عدن، الجمهورية اليمنية' : 'Aden Capital, Republic of Yemen'}
                      </span>
                    </div>
                  </li>

                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--facss-gold-700)', flexShrink: 0 }}>
                      <Globe size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--facss-green-900)', fontWeight: 700 }}>
                        {t.hoursLabel}
                      </strong>
                      <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {isAr 
                          ? 'يُرجى توجيه الاستفسارات ومقترحات التنسيق والتقييم عبر النموذج المؤسسي المعتمد.' 
                          : 'Please submit operational inquiries and coordination requests via the official form.'}
                      </span>
                    </div>
                  </li>
                </ul>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--facss-gold-600)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isAr ? 'السرية والخصوصية' : 'Confidentiality & Privacy'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {isAr
                      ? 'يلتزم المركز بالحفاظ على سرية بيانات الجهات المتواصلة وتفاصيل الاستفسارات الميدانية وفق مبادئ حماية البيانات.'
                      : 'The Center is committed to strict confidentiality of partner inquiries in accordance with data protection principles.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
