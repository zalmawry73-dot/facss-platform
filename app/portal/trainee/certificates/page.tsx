'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/i18n';
import { Award, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

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
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
          <Award size={26} style={{ color: 'var(--facss-gold-600)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {isAr ? 'الشهادات الصادرة وسجل الدورات' : 'Issued Certificates & Training Records'}
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {isAr
            ? 'شهادات إتمام وتأهيل موثقة برمز تحقق إلكتروني فريد.'
            : 'Formally issued completion and qualification certificates validated by unique codes.'}
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Award size={48} style={{ color: 'var(--facss-gold-600)', marginInline: 'auto', marginBottom: '1rem', opacity: 0.4 }} />
          <p>
            {isAr
              ? 'لا توجد شهادات صادرة بحسابك حالياً. تصدر الشهادات تلقائياً بعد استكمال متطلبات الدورة واجتياز التقييم العملي.'
              : 'No certificates issued for your account yet. Certificates are issued upon completing course requirements and passing evaluations.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {certificates.map(({ registration, cert }) => {
            const courseTitle = isAr ? registration.course.titleAr : (registration.course.titleEn || registration.course.titleAr);

            return (
              <div
                key={cert.id}
                className="card"
                style={{
                  padding: '3.5rem 2.5rem',
                  background: cert.isRevoked
                    ? 'rgba(239,68,68,0.04)'
                    : '#FCFBF7',
                  border: cert.isRevoked ? '2px solid #DC2626' : '2px solid var(--facss-gold-500)',
                  outline: cert.isRevoked ? 'none' : '1px solid rgba(18, 59, 44, 0.2)',
                  outlineOffset: '-8px',
                  borderRadius: '16px',
                  position: 'relative',
                }}
              >
                {/* Revoked Banner */}
                {cert.isRevoked && (
                  <div style={{ textAlign: 'center', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <ShieldAlert size={32} style={{ color: '#DC2626', marginInline: 'auto', marginBottom: '0.5rem' }} />
                    <p style={{ color: '#DC2626', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                      {isAr ? 'هذه الشهادة ملغاة ولم تعد سارية المفعول' : 'This certificate is officially revoked and no longer active'}
                    </p>
                  </div>
                )}

                {/* Header Certificate */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                  <img
                    src="/images/logo.png"
                    alt="FACSS Seal"
                    style={{ width: '80px', height: '80px', marginInline: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
                  />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--facss-green-950)', margin: '0 0 0.3rem 0' }}>
                    {isAr ? 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية' : 'Aden First Center for Security Services and Strategic Studies'}
                  </h2>
                  <h3 style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                    Aden First Center for Security Services and Strategic Studies (FACSS)
                  </h3>
                  <span className="badge badge-gold" style={{ marginTop: '1rem', fontSize: '0.85rem', padding: '0.35rem 1.2rem' }}>
                    {isAr ? 'شهادة إتمام واجتياز دورة تدريبية' : 'Training Course Completion Certificate'}
                  </span>
                </div>

                {/* Certificate Body */}
                <div style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                    {isAr
                      ? 'يشهد مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية بأن المتدرب:'
                      : 'Aden First Center for Security Services and Strategic Studies certifies that:'}
                  </p>
                  <h3 style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    color: cert.isRevoked ? '#DC2626' : 'var(--text-primary)',
                    marginBottom: '1.2rem',
                    textDecoration: cert.isRevoked ? 'line-through' : 'none',
                  }}>
                    {registration.fullName}
                  </h3>
                  <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {isAr
                      ? 'قد أتم بنجاح كافة المتطلبات النظرية والتطبيقات الميدانية المقررة في:'
                      : 'Has successfully fulfilled all theoretical criteria and practical field exercises in:'}
                  </p>
                  <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--facss-gold-700)', margin: '0.8rem 0' }}>
                    {courseTitle}
                  </h4>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {isAr ? 'التقدير العام: ' : 'Grade: '}
                    <strong style={{ color: 'var(--facss-green-900)' }}>
                      {cert.grade || (isAr ? 'اجتياز بنجاح' : 'Successful Completion')}
                    </strong>
                  </p>
                </div>

                {/* Certificate Footer with Verification */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isAr ? 'رقم الشهادة:' : 'Certificate #:'}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--facss-gold-700)' }}>{cert.certificateNumber}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isAr ? 'تاريخ الإصدار:' : 'Issue Date:'}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {formatDate(cert.issueDate, locale)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isAr ? 'رمز التحقق الرقمي:' : 'Verification Code:'}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--facss-green-800)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{cert.verificationCode}</strong>
                  </div>

                  <div style={{ textAlign: isAr ? 'end' : 'start' }}>
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
