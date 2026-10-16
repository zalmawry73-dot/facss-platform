import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import { type Locale } from '@/lib/i18n';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  FileCheck,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const revalidate = 0;

export default async function TraineeAttendancePage() {
  const session = await requireRole([ROLES.TRAINEE], '/portal/trainee/attendance');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  const registrations = await prisma.trainingRegistration.findMany({
    where: {
      OR: [
        { userId: session.userId },
        { email: session.email },
      ],
    },
    include: {
      course: {
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          duration: true,
          location: true,
          minAttendancePct: true,
          requiresPreEval: true,
          requiresPostEval: true,
          sessions: {
            orderBy: { sessionNumber: 'asc' },
            select: {
              id: true,
              sessionNumber: true,
              title: true,
              sessionDate: true,
              startTime: true,
              endTime: true,
              notes: true,
            },
          },
        },
      },
      attendanceRecords: {
        include: {
          session: {
            select: {
              id: true,
              sessionNumber: true,
              title: true,
            },
          },
        },
        orderBy: { sessionDate: 'asc' },
      },
      evaluations: true,
      certificate: {
        select: {
          id: true,
          certificateNumber: true,
          isRevoked: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="portal-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(11, 61, 46, 0.08)', color: 'var(--brand-deep-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isAr ? 'سجل الحضور والجلسات والتقييمات الأكاديمية' : 'Attendance, Sessions & Academic Evaluations'}
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
              {isAr
                ? 'متابعة سجل حضورك لكل جلسة تدريبية، نسبة الحضور المحققة، ونتائج التقييمات القبلية والبعدية'
                : 'Track your session attendance, attendance percentage, and pre/post evaluation scores'}
            </p>
          </div>
          <Link href="/portal/trainee" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            <span>{isAr ? 'العودة للوحة المتدرب' : 'Back to Dashboard'}</span>
            <ChevronIcon size={14} />
          </Link>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="portal-empty-state">
          <AlertCircle size={44} style={{ color: 'var(--color-gold-500)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isAr ? 'لا توجد سجلات حضور مسجلة' : 'No Attendance Records Found'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {isAr ? 'لم يتم تسجيلك في أي دورات تدريبية بعد.' : 'You have not enrolled in any training courses yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {registrations.map((reg) => {
            const course = reg.course;
            const courseTitle = isAr ? course.titleAr : course.titleEn || course.titleAr;
            const totalSessions = course.sessions.length;
            const presentCount = reg.attendanceRecords.filter((a) => a.status === 'PRESENT').length;
            const excusedCount = reg.attendanceRecords.filter((a) => a.status === 'EXCUSED').length;
            const absentCount = reg.attendanceRecords.filter((a) => a.status === 'ABSENT').length;
            const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
            const minRequired = course.minAttendancePct ?? 75;
            const isEligible = attendancePct >= minRequired;

            const preEval = reg.evaluations.find((e) => e.type === 'PRE') || null;
            const postEval = reg.evaluations.find((e) => e.type === 'POST') || null;

            return (
              <div key={reg.id} className="portal-card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                {/* Course Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-deep-green)', margin: '0 0 0.4rem 0' }}>
                      {courseTitle}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>{isAr ? `المدة: ${course.duration}` : `Duration: ${course.duration}`}</span>
                      <span>•</span>
                      <span>{isAr ? `المقر: ${course.location}` : `Location: ${course.location}`}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        background: isEligible ? 'rgba(21, 128, 61, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: isEligible ? '#15803D' : '#DC2626',
                        border: `1px solid ${isEligible ? '#15803D40' : '#DC262640'}`,
                        fontWeight: 700,
                      }}
                    >
                      {isEligible
                        ? (isAr ? `مستوفٍ لنسبة الحضور (${attendancePct}%)` : `Attendance Met (${attendancePct}%)`)
                        : (isAr ? `أقل من الحد الأدنى (${attendancePct}% / المطلوب ${minRequired}%)` : `Below Threshold (${attendancePct}%)`)}
                    </span>

                    {reg.certificate && !reg.certificate.isRevoked && (
                      <Link href="/portal/trainee/certificates" className="btn btn-gold btn-sm">
                        <Award size={14} />
                        <span>{isAr ? 'عرض الشهادة المعتمدة' : 'View Certificate'}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                      {isAr ? 'نسبة الحضور الفعلية' : 'Attendance Rate'}
                    </span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: isEligible ? '#15803D' : '#DC2626' }}>
                      {attendancePct}%
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      {isAr ? `الحد الأدنى المطلوب: ${minRequired}%` : `Minimum: ${minRequired}%`}
                    </span>
                  </div>

                  <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                      {isAr ? 'جلسات الحضور' : 'Attended Sessions'}
                    </span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803D' }}>
                      {presentCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalSessions}</span>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      {isAr ? 'جلسة تدريبية فعلية' : 'training sessions'}
                    </span>
                  </div>

                  <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                      {isAr ? 'الغياب والأعذار' : 'Absences & Excuses'}
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>
                      <span style={{ color: absentCount > 0 ? '#DC2626' : 'var(--text-secondary)' }}>
                        {absentCount} {isAr ? 'غائب' : 'absent'}
                      </span>
                      {excusedCount > 0 && (
                        <span style={{ color: '#B45309', fontSize: '0.9rem', marginInlineStart: '0.5rem', fontWeight: 700 }}>
                          • {excusedCount} {isAr ? 'معذور' : 'excused'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      {isAr ? 'مسجلة رسمياً بالسجل' : 'officially recorded'}
                    </span>
                  </div>

                  {/* Evaluations Metric */}
                  <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                      {isAr ? 'التقييم الأكاديمي (بعدي)' : 'Post Evaluation'}
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: postEval?.score !== null && postEval?.score !== undefined ? '#15803D' : 'var(--text-muted)' }}>
                      {postEval?.score !== null && postEval?.score !== undefined ? `${postEval.score} / ${postEval.maxScore}` : (isAr ? 'لم يُؤدَّ بعد' : 'Pending')}
                    </div>
                    {preEval?.score !== null && preEval?.score !== undefined && postEval?.score !== null && postEval?.score !== undefined && (
                      <span style={{ fontSize: '0.75rem', color: postEval.score >= preEval.score ? '#15803D' : '#DC2626', fontWeight: 700, display: 'block', marginTop: '0.2rem' }}>
                        {postEval.score >= preEval.score ? `+${postEval.score - preEval.score}` : postEval.score - preEval.score} {isAr ? 'معدل التطور' : 'score gain'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sessions Table */}
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                  {isAr ? 'جدول الجلسات التدريبية وحالة الحضور' : 'Training Sessions & Attendance'}
                </h4>

                {course.sessions.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isAr ? 'لم يحدد المركز جدول الجلسات بعد.' : 'No sessions scheduled yet.'}
                  </p>
                ) : (
                  <div className="portal-table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.85rem 1rem', background: 'rgba(11, 61, 46, 0.05)', color: 'var(--brand-deep-green)', fontWeight: 800, fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>{isAr ? 'الجلسة' : 'Session'}</th>
                          <th style={{ padding: '0.85rem 1rem', background: 'rgba(11, 61, 46, 0.05)', color: 'var(--brand-deep-green)', fontWeight: 800, fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>{isAr ? 'عنوان وموضوع الجلسة' : 'Topic'}</th>
                          <th style={{ padding: '0.85rem 1rem', background: 'rgba(11, 61, 46, 0.05)', color: 'var(--brand-deep-green)', fontWeight: 800, fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                          <th style={{ padding: '0.85rem 1rem', background: 'rgba(11, 61, 46, 0.05)', color: 'var(--brand-deep-green)', fontWeight: 800, fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>{isAr ? 'حالة الحضور' : 'Attendance Status'}</th>
                          <th style={{ padding: '0.85rem 1rem', background: 'rgba(11, 61, 46, 0.05)', color: 'var(--brand-deep-green)', fontWeight: 800, fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)' }}>{isAr ? 'ملاحظات' : 'Notes'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {course.sessions.map((sess) => {
                          const record = reg.attendanceRecords.find((a) => a.sessionId === sess.id);
                          const status = record?.status || null;

                          return (
                            <tr key={sess.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--color-gold-600)' }}>
                                {isAr ? `الجلسة ${sess.sessionNumber}` : `Session ${sess.sessionNumber}`}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sess.title}</td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                  {new Date(sess.sessionDate).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
                                </div>
                                {(sess.startTime || sess.endTime) && (
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {sess.startTime || ''} {sess.endTime ? `— ${sess.endTime}` : ''}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                {status === 'PRESENT' ? (
                                  <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(21, 128, 61, 0.1)', color: '#15803D', border: '1px solid rgba(21, 128, 61, 0.3)' }}>
                                    {isAr ? 'حاضر' : 'Present'}
                                  </span>
                                ) : status === 'EXCUSED' ? (
                                  <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(180, 83, 9, 0.1)', color: '#B45309', border: '1px solid rgba(180, 83, 9, 0.3)' }}>
                                    {isAr ? 'معذور رسمي' : 'Excused'}
                                  </span>
                                ) : status === 'ABSENT' ? (
                                  <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
                                    {isAr ? 'غائب' : 'Absent'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {isAr ? 'لم ترصد بعد' : 'Not recorded'}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {record?.notes || sess.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
