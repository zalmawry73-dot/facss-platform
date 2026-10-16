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
    <div style={{ minHeight: '100vh', background: 'var(--surface-bg)' }}>
      {/* Header */}
      <section className="page-header-institutional" style={{ paddingBlock: '3.5rem' }}>
        <div className="container text-center">
          <div className="hero-badge-pill" style={{ marginInline: 'auto', marginBottom: '1.25rem' }}>
            <ShieldCheck size={14} color="var(--color-gold-400)" />
            <span>{t.verifyCertificate}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            {isAr ? 'نظام التحقق الإلكتروني من الوثائق والشهادات' : 'Digital Credential & Certificate Verification'}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1rem', maxWidth: '720px', marginInline: 'auto', lineHeight: 1.75 }}>
            {isAr
              ? 'التحقق الرسمي من صحة وسريان الشهادات والوثائق الصادرة عن مركز الحلول المتكاملة للأمن والسلامة.'
              : 'Official validation of training certificates and credentials issued by the Integrated Solutions Center for Safety and Security.'}
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
                  : `No certificate matched verification code [${params.code}]. Verify the cryptographic code or contact the Center Administration.`}
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
              className="card-institutional"
              style={{
                padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 3vw, 2.5rem)',
                borderTop: '4px solid var(--color-primary-900)',
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(11, 61, 46, 0.08)', border: '2px solid var(--color-primary-900)', color: 'var(--color-primary-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginInline: 'auto', marginBottom: '1.25rem' }}>
                <ShieldCheck size={40} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary-950)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                {t.verificationValidTitle}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                {t.verificationValidDesc}
              </p>

              {/* Certificate Details */}
              <div style={{ textAlign: isAr ? 'right' : 'left', padding: '1.75rem', background: '#F4F1EA', borderRadius: '12px', border: '1px solid rgba(181, 146, 84, 0.3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>{t.certificateNumber}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--color-primary-950)' }}>{certificate.certificateNumber}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>{t.traineeName}</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--color-primary-950)' }}>{certificate.studentName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>{t.trainingCourse}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--color-primary-900)' }}>{certificate.courseTitle}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>{t.grade}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--color-primary-950)' }}>
                      {certificate.grade || (isAr ? 'اجتياز بنجاح' : 'Successful Completion')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>{t.issueDate}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--color-primary-950)' }}>
                      {formatDate(certificate.issueDate, locale)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>{t.verificationCode}</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-900)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{certificate.verificationCode}</strong>
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
