import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import StatusBadge from '@/components/StatusBadge';
import { getTranslation, type Locale } from '@/lib/i18n';
import { GraduationCap, Award, CheckCircle2, Clock, MapPin, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';

export const revalidate = 0;

export default async function TraineeDashboardPage() {
  const session = await requireRole([ROLES.TRAINEE], '/portal/trainee');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const registrations = await prisma.trainingRegistration.findMany({
    where: { userId: session.userId },
    include: {
      course: {
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          duration: true,
          location: true,
          status: true,
          hasCertificate: true,
        },
      },
      certificate: {
        select: {
          id: true,
          certificateNumber: true,
          verificationCode: true,
          isRevoked: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCertificates = registrations.filter(
    (r) => r.certificate && !r.certificate.isRevoked
  ).length;

  const acceptedCount = registrations.filter((r) => r.status === 'ACCEPTED').length;
  const completedCount = registrations.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div>
      {/* 3 Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ borderInlineStart: '4px solid var(--facss-green-800)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            {isAr ? 'البرامج التدريبية المسجل بها' : 'Enrolled Training Programs'}
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--facss-green-800)' }}>{registrations.length}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid var(--facss-gold-600)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            {isAr ? 'الشهادات الصادرة' : 'Issued Certificates'}
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--facss-gold-700)' }}>{totalCertificates}</span>
        </div>

        <div className="card" style={{ borderInlineStart: '4px solid #059669' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            {isAr ? 'الدورات المكتملة بنجاح' : 'Successfully Completed Courses'}
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669' }}>{completedCount}</span>
        </div>
      </div>

      {/* Enrolled Courses & Status */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {isAr ? 'سجل الدورات والتأهيل الأمني' : 'Course & Security Training Record'}
          </h2>
          <Link href="/portal/trainee/courses" className="btn btn-outline btn-sm" style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>{isAr ? 'تصفح الدورات المتاحة' : 'Browse Available Courses'}</span>
            <ArrowIcon size={14} />
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>{isAr ? 'لم يتم تسجيلك في أي دورة تدريبية حتى الآن.' : 'You have not registered for any courses yet.'}</p>
            <Link href="/portal/trainee/courses" className="btn btn-gold btn-sm" style={{ marginTop: '1rem' }}>
              {isAr ? 'استعراض الدورات المتاحة' : 'Explore Available Courses'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {registrations.map((reg) => {
              const courseTitle = isAr ? reg.course.titleAr : (reg.course.titleEn || reg.course.titleAr);
              const altTitle = isAr ? reg.course.titleEn : reg.course.titleAr;

              return (
                <div key={reg.id} style={{ padding: '1.5rem', background: 'var(--surface-sunken)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <StatusBadge type="trainingRegistration" status={reg.status} locale={locale} />
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                        {courseTitle}
                      </h3>
                      {altTitle && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--facss-gold-700)', fontWeight: 600 }}>{altTitle}</span>
                      )}
                    </div>

                    {reg.certificate && !reg.certificate.isRevoked && (
                      <Link href="/portal/trainee/certificates" className="btn btn-gold btn-sm">
                        <Award size={15} />
                        <span>{isAr ? 'عرض الشهادة' : 'View Certificate'}</span>
                      </Link>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '0.85rem', background: 'var(--surface-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Clock size={16} style={{ color: 'var(--facss-gold-600)' }} />
                      <span>{isAr ? `المدة: ${reg.course.duration}` : `Duration: ${reg.course.duration}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={16} style={{ color: 'var(--facss-gold-600)' }} />
                      <span>{isAr ? `الموقع: ${reg.course.location}` : `Location: ${reg.course.location}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={16} style={{ color: reg.status === 'COMPLETED' ? '#059669' : 'var(--facss-gold-600)' }} />
                      <span>
                        {reg.status === 'COMPLETED' ? (isAr ? 'تم الاجتياز بنجاح' : 'Successfully Passed') :
                         reg.status === 'ACCEPTED' ? (isAr ? 'قبول مؤكد — جارٍ التدريب' : 'Confirmed — In Training') :
                         reg.status === 'REJECTED' ? (isAr ? 'لم يتم القبول' : 'Application Declined') :
                         (isAr ? 'قيد المعالجة' : 'Processing')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
