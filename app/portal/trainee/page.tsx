import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import StatusBadge from '@/components/StatusBadge';
import { getTranslation, type Locale } from '@/lib/i18n';
import { GraduationCap, Award, CheckCircle2, Clock, MapPin, BookOpen, ArrowLeft, ArrowRight, Calendar, UserCheck } from 'lucide-react';

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
          minAttendancePct: true,
          requiresPostEval: true,
          sessions: {
            select: { id: true },
          },
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
      attendanceRecords: {
        select: { status: true },
      },
      evaluations: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCertificates = registrations.filter(
    (r) => r.certificate && !r.certificate.isRevoked
  ).length;

  const completedCount = registrations.filter((r) => r.status === 'COMPLETED').length;

  // Compute overall average attendance
  let totalPctSum = 0;
  let coursesWithSessions = 0;
  registrations.forEach((reg) => {
    const totalSessions = reg.course.sessions.length;
    if (totalSessions > 0) {
      const presentCount = reg.attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      totalPctSum += Math.round((presentCount / totalSessions) * 100);
      coursesWithSessions++;
    }
  });
  const avgAttendancePct = coursesWithSessions > 0 ? Math.round(totalPctSum / coursesWithSessions) : 100;

  return (
    <div>
      {/* 4 Stat Metrics */}
      <div className="portal-stat-grid">
        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid var(--color-primary-800)' }}>
          <span className="portal-stat-label">
            {isAr ? 'البرامج التدريبية المسجل بها' : 'Enrolled Training Programs'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: 'var(--color-primary-900)' }}>{registrations.length}</span>
            <BookOpen size={20} style={{ color: 'var(--color-primary-800)', opacity: 0.6 }} />
          </div>
        </div>

        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid #15803D' }}>
          <span className="portal-stat-label">
            {isAr ? 'متوسط نسبة الحضور التراكمية' : 'Average Attendance Rate'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: '#15803D' }}>{avgAttendancePct}%</span>
            <UserCheck size={20} style={{ color: '#15803D', opacity: 0.6 }} />
          </div>
        </div>

        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid #0284C7' }}>
          <span className="portal-stat-label">
            {isAr ? 'الدورات المكتملة بنجاح' : 'Successfully Completed Courses'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: '#0284C7' }}>{completedCount}</span>
            <CheckCircle2 size={20} style={{ color: '#0284C7', opacity: 0.6 }} />
          </div>
        </div>

        <div className="portal-stat-card" style={{ borderInlineStart: '4px solid var(--color-gold-600)' }}>
          <span className="portal-stat-label">
            {isAr ? 'الشهادات المعتمدة الصادرة' : 'Issued Verified Certificates'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="portal-stat-value" style={{ color: 'var(--color-gold-600)' }}>{totalCertificates}</span>
            <Award size={20} style={{ color: 'var(--color-gold-600)', opacity: 0.6 }} />
          </div>
        </div>
      </div>

      {/* Enrolled Courses & Status */}
      <div className="portal-card">
        <div className="portal-card-header">
          <h2 className="portal-card-title">
            <GraduationCap size={22} style={{ color: 'var(--color-gold-600)' }} />
            <span>{isAr ? 'سجل الدورات والتأهيل الأمني الميداني' : 'Course & Field Training Record'}</span>
          </h2>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link 
              href="/portal/trainee/attendance" 
              className="admin-btn admin-btn-outline admin-btn-sm" 
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Calendar size={13} />
              <span>{isAr ? 'كشف الحضور الكامل' : 'Attendance Log'}</span>
              <ArrowIcon size={13} />
            </Link>
            <Link 
              href="/portal/trainee/courses" 
              className="btn btn-gold btn-sm" 
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <BookOpen size={13} />
              <span>{isAr ? 'تصفح الدورات المتاحة' : 'Browse Courses'}</span>
            </Link>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="portal-empty-state">
            <GraduationCap size={44} style={{ color: 'var(--color-gold-500)', marginInline: 'auto', marginBottom: '0.85rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {isAr ? 'لم يتم تسجيلك في أي دورة تدريبية حتى الآن' : 'No training courses enrolled yet'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', marginInline: 'auto', marginBottom: '1.25rem' }}>
              {isAr 
                ? 'يمكنكم استعراض دليل البرامج الميدانية المتاحة والتسجيل في الدورات التي تلبي احتياجاتكم.' 
                : 'Explore available practical training programs and register for upcoming courses.'}
            </p>
            <Link href="/portal/trainee/courses" className="btn btn-gold btn-sm">
              <BookOpen size={16} />
              <span>{isAr ? 'استعراض الدورات المتاحة' : 'Explore Courses'}</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {registrations.map((reg) => {
              const courseTitle = isAr ? reg.course.titleAr : (reg.course.titleEn || reg.course.titleAr);
              const altTitle = isAr ? reg.course.titleEn : reg.course.titleAr;
              const totalSessions = reg.course.sessions.length;
              const presentCount = reg.attendanceRecords.filter((a) => a.status === 'PRESENT').length;
              const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
              const minRequired = reg.course.minAttendancePct ?? 75;
              const isEligible = attendancePct >= minRequired;
              const postEval = reg.evaluations.find((e) => e.type === 'POST');

              return (
                <div 
                  key={reg.id} 
                  style={{ 
                    padding: '1.35rem', 
                    background: 'var(--surface-bg)', 
                    borderRadius: '10px', 
                    border: '1px solid var(--admin-card-border)' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <StatusBadge type="trainingRegistration" status={reg.status} locale={locale} />
                        <span
                          style={{
                            background: isEligible ? 'rgba(21, 128, 61, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                            color: isEligible ? '#15803D' : '#DC2626',
                            border: `1px solid ${isEligible ? 'rgba(21, 128, 61, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          {isAr ? `الحضور: ${attendancePct}% (${presentCount}/${totalSessions})` : `Attendance: ${attendancePct}%`}
                        </span>
                        {postEval && postEval.score !== null && (
                          <span 
                            style={{ 
                              background: 'rgba(181, 146, 84, 0.12)', 
                              color: 'var(--color-gold-700)', 
                              border: '1px solid rgba(181, 146, 84, 0.3)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px'
                            }}
                          >
                            {isAr ? `التقييم: ${postEval.score}/${postEval.maxScore}` : `Eval: ${postEval.score}/${postEval.maxScore}`}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                        {courseTitle}
                      </h3>
                      {altTitle && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-gold-700)', fontWeight: 600 }}>{altTitle}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href="/portal/trainee/attendance" className="admin-btn admin-btn-outline admin-btn-sm" style={{ fontSize: '0.78rem' }}>
                        <span>{isAr ? 'تفاصيل الجلسات' : 'Sessions'}</span>
                      </Link>
                      {reg.certificate && !reg.certificate.isRevoked && (
                        <Link href="/portal/trainee/certificates" className="btn btn-gold btn-sm" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Award size={14} />
                          <span>{isAr ? 'عرض الشهادة' : 'Certificate'}</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', padding: '0.85rem 1rem', background: 'var(--surface-card)', borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <Clock size={15} style={{ color: 'var(--color-gold-600)' }} />
                      <span>{isAr ? `المدة: ${reg.course.duration}` : `Duration: ${reg.course.duration}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={15} style={{ color: 'var(--color-gold-600)' }} />
                      <span>{isAr ? `الموقع: ${reg.course.location}` : `Location: ${reg.course.location}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={15} style={{ color: reg.status === 'COMPLETED' ? '#15803D' : 'var(--color-gold-600)' }} />
                      <span>
                        {reg.status === 'COMPLETED' ? (isAr ? 'تم الاجتياز بنجاح' : 'Passed') :
                         reg.status === 'ACCEPTED' ? (isAr ? 'قبول مؤكد — جارٍ التدريب' : 'Confirmed') :
                         reg.status === 'REJECTED' ? (isAr ? 'لم يتم القبول' : 'Declined') :
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
