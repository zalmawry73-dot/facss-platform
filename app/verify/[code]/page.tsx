import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslation, formatDate, type Locale } from '@/lib/i18n';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: { code: string };
}

export default async function CertificateVerificationPage({ params }: PageProps) {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const t = getTranslation(locale);
  const isAr = locale === 'ar';

  const code = params.code?.trim().toUpperCase();

  let certificate = null;
  if (code && code.length >= 4) {
    certificate = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      select: {
        id: true,
        certificateNumber: true,
        studentName: true,
        courseTitle: true,
        issueDate: true,
        grade: true,
        verificationCode: true,
        isRevoked: true,
        revokedAt: true,
      },
    });
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <section
        style={{
          paddingBlock: '3rem',
          background: 'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <span className="section-tag">{t.verifyCertificate}</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            {isAr ? 'نظام التحقق الإلكتروني — FACSS Certificate Verification' : 'FACSS Electronic Credential Verification'}
          </h1>
          <p style={{ color: 'var(--facss-ivory-300)', fontSize: '1rem', maxWidth: '700px', marginInline: 'auto' }}>
            {isAr
              ? 'تحقق من صحة الشهادات الصادرة من مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية'
              : 'Cryptographic validation of official security training certificates issued by Aden First Center (FACSS).'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '720px' }}>
          {/* Not Found Screen */}
          {!certificate && (
            <div
              className="card"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                border: '2px solid rgba(239,68,68,0.4)',
                background: 'var(--surface-sunken)',
              }}
            >
              <AlertTriangle size={56} style={{ color: '#DC2626', marginInline: 'auto', marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginBottom: '0.8rem' }}>
                {t.verificationInvalidTitle}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', marginInline: 'auto', marginBottom: '1.5rem' }}>
                {isAr
                  ? `لم يتم العثور على أي شهادة مرتبطة برمز التحقق [${params.code}]. يُرجى التأكد من كتابة الرمز بشكل صحيح أو مراجعة إدارة المركز.`
                  : `No certificate matched verification code [${params.code}]. Verify the cryptographic code or contact FACSS Administration.`}
              </p>
              <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
                {t.home}
              </Link>
            </div>
          )}

          {/* Revoked Screen (Privacy Preserved: no administrative reason shown) */}
          {certificate && certificate.isRevoked && (
            <div
              className="card"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                border: '2px solid #DC2626',
              }}
            >
              <ShieldAlert size={56} style={{ color: '#DC2626', marginInline: 'auto', marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginBottom: '0.8rem' }}>
                {t.verificationRevokedTitle}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
                {t.verificationRevokedDesc}
              </p>

              <div style={{ textAlign: isAr ? 'right' : 'left', padding: '1.5rem', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', marginTop: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>{t.certificateNumber}:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{certificate.certificateNumber}</strong>
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>{t.traineeName}:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{certificate.studentName}</strong>
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>{t.trainingCourse}:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{certificate.courseTitle}</strong>
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>{t.issueDate}:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {formatDate(certificate.issueDate, locale)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                    {isAr ? 'تاريخ الإلغاء:' : 'Revocation Date:'}
                  </span>
                  <strong style={{ color: '#DC2626' }}>
                    {certificate.revokedAt ? formatDate(certificate.revokedAt, locale) : '—'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Valid Screen */}
          {certificate && !certificate.isRevoked && (
            <div
              className="card"
              style={{
                padding: '3rem 2.5rem',
                borderTop: '4px solid var(--facss-green-700)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <ShieldCheck size={56} style={{ color: 'var(--facss-green-700)', marginInline: 'auto', marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--facss-green-900)', marginBottom: '0.5rem' }}>
                {t.verificationValidTitle}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                {t.verificationValidDesc}
              </p>

              {/* Certificate Details */}
              <div style={{ textAlign: isAr ? 'right' : 'left', padding: '1.5rem', background: 'var(--surface-sunken)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.certificateNumber}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--facss-gold-700)' }}>{certificate.certificateNumber}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.traineeName}</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{certificate.studentName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.trainingCourse}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--facss-green-900)' }}>{certificate.courseTitle}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.grade}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {certificate.grade || (isAr ? 'اجتياز بنجاح' : 'Successful Completion')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.issueDate}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {formatDate(certificate.issueDate, locale)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.verificationCode}</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--facss-green-800)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{certificate.verificationCode}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back link */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/" className="btn btn-outline btn-sm">
              {t.home}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
