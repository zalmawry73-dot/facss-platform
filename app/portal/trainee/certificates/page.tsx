import React from 'react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Award, ShieldCheck, CheckCircle2, QrCode, Download, Printer } from 'lucide-react';

export const revalidate = 0;

export default async function TraineeCertificatesPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const registrations = await prisma.trainingRegistration.findMany({
    where: { userId: session.userId },
    include: {
      course: true,
      certificate: true,
    }
  });

  const certificates = registrations
    .map((r) => r.certificate)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
          <Award size={26} style={{ color: 'var(--color-gold)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
            الشهادات والاعتمادات الرسمية الصادرة
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          شهادات إتمام وتأهيل معتمدة رسمياً وموثقة بكود تحقق إلكتروني فريد.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Award size={48} style={{ color: 'var(--color-gold)', marginInline: 'auto', marginBottom: '1rem', opacity: 0.4 }} />
          <p>لا توجد شهادات صادرة بحسابك حالياً. تصدر الشهادات تلقائياً بعد استكمال متطلبات الدورة واجتياز التقييم العملي.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="card"
              style={{
                padding: '3rem 2.5rem',
                background: 'radial-gradient(ellipse at center, rgba(19,62,43,0.3) 0%, rgba(5,14,9,0.95) 100%)',
                border: '2px solid var(--color-gold)',
                borderRadius: '16px',
                position: 'relative',
              }}
            >
              {/* Header Certificate */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(197,155,39,0.3)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                <img
                  src="/images/logo.png"
                  alt="FACSS Seal"
                  style={{ width: '80px', height: '80px', marginInline: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
                />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-gold-light)', margin: '0 0 0.3rem 0' }}>
                  مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية
                </h2>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                  Aden First Center for Security Services and Strategic Studies (FACSS)
                </h3>
                <span className="badge badge-gold" style={{ marginTop: '1rem', fontSize: '0.9rem', padding: '0.35rem 1.2rem' }}>
                  شهادة تأهيل واجتياز دورة تدريبية معتمدة
                </span>
              </div>

              {/* Certificate Body */}
              <div style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                  يشهد مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية بأن المتدرب:
                </p>
                <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '1.2rem', textDecoration: 'underline', textDecorationColor: 'var(--color-gold)' }}>
                  {cert.studentName}
                </h3>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  قد أتم بنجاح كافة المتطلبات النظرية والتطبيقات الميدانية المقررة في:
                </p>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-light)', margin: '0.8rem 0' }}>
                  {cert.courseTitle}
                </h4>
                <p style={{ fontSize: '1rem', color: '#FFF' }}>
                  التقدير العام: <strong style={{ color: 'var(--color-gold-light)' }}>{cert.grade || 'اجتياز معتمد'}</strong>
                </p>
              </div>

              {/* Certificate Footer with Verification */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(197,155,39,0.3)', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block' }}>رقم الشهادة:</span>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--color-gold-light)' }}>{cert.certificateNumber}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block' }}>تاريخ الإصدار:</span>
                  <strong style={{ fontSize: '0.92rem', color: '#FFF' }}>
                    {new Date(cert.issueDate).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block' }}>رمز التحقق الرقمي:</span>
                  <strong style={{ fontSize: '0.92rem', color: '#34D399', letterSpacing: '0.05em' }}>{cert.verificationCode}</strong>
                </div>

                <div style={{ textAlign: 'end' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-gold btn-sm"
                  >
                    <Printer size={15} />
                    <span>طباعة الشهادة الرسمية</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
