'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/i18n';
import { Award, ShieldCheck, ShieldAlert, Loader2, Printer, QrCode } from 'lucide-react';

interface CertificateData {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: string;
  grade: string | null;
  isRevoked: boolean;
}

interface RegistrationWithCert {
  id: string;
  fullName: string;
  status: string;
  course: {
    titleAr: string;
    titleEn: string;
    duration: string;
    location: string;
  };
  certificate: CertificateData | null;
}

export default function TraineeCertificatesPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [registrations, setRegistrations] = useState<RegistrationWithCert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      const res = await fetch('/api/training/my-registrations');
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations);
      }
    } catch (err) {
      console.error('Error loading certificates:', err);
    } finally {
      setLoading(false);
    }
  }

  const certificates = registrations
    .filter((r) => r.certificate !== null)
    .map((r) => ({ registration: r, cert: r.certificate! }));

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--color-gold-light)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          {isAr ? 'جارٍ تحميل الشهادات...' : 'Loading certificates...'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="portal-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(181, 146, 84, 0.12)', color: 'var(--color-gold-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'الشهادات الصادرة وسجل الدورات' : 'Issued Certificates & Training Records'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
              {isAr
                ? 'شهادات إتمام وتأهيل موثقة برمز تحقق إلكتروني فريد ورقم تتبع رسمي.'
                : 'Formally issued completion and qualification certificates validated by unique verification codes.'}
            </p>
          </div>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="portal-empty-state">
          <Award size={52} style={{ color: 'var(--color-gold-500)', marginInline: 'auto', marginBottom: '1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isAr ? 'لا توجد شهادات صادرة بحسابك حالياً' : 'No Certificates Issued Yet'}
          </h3>
          <p style={{ maxWidth: '520px', margin: '0 auto', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {isAr
              ? 'تصدر الشهادات تلقائياً بعد استكمال متطلبات الدورة، استيفاء نسبة الحضور المقررة، واجتياز التقييم العملي والأكاديمي.'
              : 'Certificates are issued automatically upon fulfilling course attendance, passing practical sessions, and completing evaluations.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {certificates.map(({ registration, cert }) => {
            const courseTitle = isAr ? registration.course.titleAr : (registration.course.titleEn || registration.course.titleAr);

            return (
              <div
                key={cert.id}
                className="portal-card printable-certificate"
                style={{
                  padding: 'clamp(1.5rem, 4vw, 3rem)',
                  background: cert.isRevoked ? 'rgba(220, 38, 38, 0.02)' : 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
                  border: cert.isRevoked ? '2px solid #DC2626' : '2px solid var(--color-gold-500)',
                  outline: cert.isRevoked ? 'none' : '1px solid rgba(11, 61, 46, 0.15)',
                  outlineOffset: '-8px',
                  borderRadius: '16px',
                  position: 'relative',
                  boxShadow: '0 4px 20px rgba(11, 61, 46, 0.06)',
                }}
              >
                {/* Revoked Banner */}
                {cert.isRevoked && (
                  <div style={{ textAlign: 'center', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(220, 38, 38, 0.08)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
                    <ShieldAlert size={32} style={{ color: '#DC2626', marginInline: 'auto', marginBottom: '0.5rem' }} />
                    <p style={{ color: '#DC2626', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                      {isAr ? 'هذه الشهادة ملغاة رسمياً ولم تعد سارية المفعول' : 'This certificate is officially revoked and no longer active'}
                    </p>
                  </div>
                )}

                {/* Header Certificate */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.75rem', marginBottom: '2rem' }}>
                  <img
                    src="/images/brand/logo-symbol.png"
                    alt={isAr ? "مركز الحلول المتكاملة للأمن والسلامة" : "Integrated Solutions Center for Safety and Security"}
                    style={{ width: '70px', height: 'auto', marginInline: 'auto', marginBottom: '0.85rem', objectFit: 'contain' }}
                  />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-deep-green)', margin: '0 0 0.25rem 0' }}>
                    {isAr ? 'مركز الحلول المتكاملة للأمن والسلامة' : 'Integrated Solutions Center for Safety and Security'}
                  </h2>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                    Integrated Solutions Center for Safety and Security
                  </h3>
                  <div style={{ marginTop: '0.85rem' }}>
                    <span style={{ display: 'inline-flex', padding: '0.35rem 1.25rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800, background: 'rgba(181, 146, 84, 0.15)', color: 'var(--color-gold-700)', border: '1px solid var(--color-gold-500)' }}>
                      {isAr ? 'شهادة إتمام واجتياز دورة تدريبية تخصصية' : 'Training Course Completion Certificate'}
                    </span>
                  </div>
                </div>

                {/* Certificate Body */}
                <div style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                    {isAr
                      ? 'يشهد مركز الحلول المتكاملة للأمن والسلامة بأن المتدرب:'
                      : 'Integrated Solutions Center for Safety and Security certifies that:'}
                  </p>
                  <h3 style={{
                    fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)',
                    fontWeight: 900,
                    color: cert.isRevoked ? '#DC2626' : 'var(--brand-deep-green)',
                    marginBottom: '1rem',
                    textDecoration: cert.isRevoked ? 'line-through' : 'none',
                  }}>
                    {registration.fullName}
                  </h3>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: '0 0 0.8rem 0' }}>
                    {isAr
                      ? 'قد أتم بنجاح كافة المتطلبات النظرية والتطبيقات الميدانية المقررة في البرنامج التدريبي:'
                      : 'Has successfully fulfilled all theoretical criteria and practical field exercises in:'}
                  </p>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-gold-700)', margin: '0.6rem 0 1rem 0' }}>
                    {courseTitle}
                  </h4>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', background: 'rgba(11, 61, 46, 0.04)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {isAr ? 'التقدير العام: ' : 'Overall Grade: '}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--brand-deep-green)' }}>
                      {cert.grade || (isAr ? 'اجتياز بنجاح' : 'Successful Completion')}
                    </strong>
                  </div>
                </div>

                {/* Certificate Footer with Verification */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      {isAr ? 'رقم الشهادة المعتمد:' : 'Certificate #:'}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-gold-700)', fontFamily: 'monospace' }}>{cert.certificateNumber}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      {isAr ? 'تاريخ الإصدار:' : 'Issue Date:'}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {formatDate(cert.issueDate, locale)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      {isAr ? 'رمز التحقق الرقمي:' : 'Verification Code:'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <QrCode size={14} style={{ color: 'var(--color-gold-600)' }} />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--brand-deep-green)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{cert.verificationCode}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: isAr ? 'end' : 'start', display: 'flex', gap: '0.5rem', justifyContent: isAr ? 'flex-end' : 'flex-start', flexWrap: 'wrap' }} className="no-print">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      title={isAr ? 'طباعة الوثيقة الرسمية أو حفظ كـ PDF' : 'Print Certificate or Save as PDF'}
                    >
                      <Printer size={15} />
                      <span>{isAr ? 'طباعة / PDF' : 'Print / PDF'}</span>
                    </button>

                    <Link
                      href={`/verify/${cert.verificationCode}`}
                      className="btn btn-gold btn-sm"
                      target="_blank"
                    >
                      <ShieldCheck size={15} />
                      <span>{isAr ? 'التحقق العام' : 'Public Verify'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
